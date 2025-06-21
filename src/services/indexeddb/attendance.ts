// src/services/indexeddb/attendance.ts

import { getDB, STORE_KEYS } from './indexedDBInit'
import type { DisplayAttendanceRecord, AttendanceCorrectionLog } from '@/types'
import { formatDateLocal, convertToDisplayRecords, normalizeCorrectionDates } from '@/utils'
import { api } from '@/services/api'
/**
 * IndexedDB-backed attendance caching helpers
 */

async function saveCorrectionToIDB(correction: AttendanceCorrectionLog) {
  const db = await getDB()
  const tx = db.transaction(STORE_KEYS.attendanceCorrections, 'readwrite')
  const store = tx.store
  await store.put(normalizeCorrectionDates(correction))
  await tx.done
}

export const attendanceCache = {
  async getAttendanceLogs(
    staffId: string,
    from: Date,
    to: Date,
    force = false,
  ): Promise<DisplayAttendanceRecord[]> {
    // TODO: Fetch logs by staffId and timestamp range from IndexedDB
    // IndexedDB API usage:
    const db = await getDB()
    const start = formatDateLocal(from)
    const end = formatDateLocal(to)

    if (!force) {
      const index = db.transaction(STORE_KEYS.attendanceLogs).store.index('user_id')
      const cached = await index.getAll(staffId)

      if (cached.length > 0) {
        const filtered = cached.filter((log) => log.date >= start && log.date <= end)
        console.log(`[IndexedDB] Logs for ${staffId} → ${filtered.length} entries`)
        return filtered
      }
    }

    // const logsFromApi = await firebaseApi.attendance.getAttendanceLogs(staffId, from, to)
    const logsFromApi = await api.attendance.getAttendanceLogs(staffId, from, to)
    const convertedLogs = convertToDisplayRecords(logsFromApi)

    const tx = db.transaction(STORE_KEYS.attendanceLogs, 'readwrite')
    const store = tx.objectStore(STORE_KEYS.attendanceLogs)

    for (const log of convertedLogs) {
      if (!log.id || !log.user_id) {
        console.warn('[IndexedDB] Skipping invalid log:', log)
        continue
      }
      const newlogData = {
        id: log.id,
        user_id: log.user_id,
        date: log.date,
        time: log.time,
        status: log.status,
      }
      await store.put(newlogData)
    }
    await tx.done
    return convertedLogs
  },

  async getAttendanceCorrections(
    staffId: string,
    start: string,
    end: string,
    force = false,
  ): Promise<AttendanceCorrectionLog[]> {
    // TODO: Fetch corrections by staffId and date range from IndexedDB
    // IndexedDB API usage:
    const db = await getDB()
    // Step 1: Try IndexedDB
    if (!force) {
      try {
        const index = db.transaction(STORE_KEYS.attendanceCorrections).store.index('staffId')
        const cached = await index.getAll(staffId)
        console.log('[IndexedDB] getAttendanceCorrections debug →', {
          staffId,
          start,
          end,
          cachedDates: cached.map((c) => c.date),
        })

        if (cached.length > 0) {
          const filtered = cached.filter((log) => log.date >= start && log.date <= end)
          console.log(`[IndexedDB] Corrections for ${staffId} → ${filtered.length}`)
          return filtered
        }
      } catch (error) {
        console.warn('[IndexedDB] Failed to fetch corrections:', error)
      }
    }

    // Step 2: Fallback to API

    let correctionsFromApi: AttendanceCorrectionLog[] = []
    try {
      correctionsFromApi = await api.attendance.getAttendanceCorrections(staffId, start, end)
    } catch (error) {
      console.error('[API] Failed to fetch corrections:', error)
    }

    // Step 3: Save to IndexedDB
    try {
      const tx = db.transaction(STORE_KEYS.attendanceCorrections, 'readwrite')
      const store = tx.objectStore(STORE_KEYS.attendanceCorrections)
      for (const correction of correctionsFromApi) {
        if (!correction.id || !correction.staffId) {
          console.warn('[IndexedDB] Skipped invalid correction:', correction)
          continue
        }
        await store.put(normalizeCorrectionDates(correction))
      }

      await tx.done
      console.log(`[IndexedDB] Cached ${correctionsFromApi.length} corrections`)
    } catch (error) {
      console.warn('[IndexedDB] Failed to cache corrections:', error)
    }

    return correctionsFromApi.map(normalizeCorrectionDates)
  },

  async createAttendanceCorrection(
    correction: AttendanceCorrectionLog,
  ): Promise<AttendanceCorrectionLog> {
    // 1. Create on API (let the API assign ID or accept provided one)
    let savedCorrection: AttendanceCorrectionLog
    try {
      // 1. Normalize first
      const cleanCorrection = normalizeCorrectionDates(correction)
      // 2. Save to Firestore
      savedCorrection = await api.attendance.createAttendanceCorrection(cleanCorrection)
    } catch (error) {
      console.error('[API] Failed to create correction:', error)
      throw error
    }

    // 2. Store in IndexedDB
    try {
      await saveCorrectionToIDB(savedCorrection)
      console.log(`[IndexedDB] Correction ${savedCorrection.id} created`)
    } catch (error) {
      console.error('[IndexedDB] Failed to save correction:', error)
      throw error
    }

    // 3. Return to update Pinia state
    return normalizeCorrectionDates(savedCorrection)
  },

  async updateAttendanceCorrection(
    updatedCorrection: AttendanceCorrectionLog,
  ): Promise<AttendanceCorrectionLog> {
    if (!updatedCorrection.id) {
      throw new Error('Cannot update correction without ID')
    }

    // 1. Update via API
    let savedCorrection: AttendanceCorrectionLog

    try {
      // 1. Normalize first
      const cleanCorrection = normalizeCorrectionDates(updatedCorrection)
      // 2. Save to Firestore
      savedCorrection = await api.attendance.updateCorrection(updatedCorrection.id, cleanCorrection)
    } catch (error) {
      console.error('[API] Failed to update correction:', error)
      throw error // You may want to propagate it to the UI
    }

    // 2. Update in IndexedDB
    try {
      await saveCorrectionToIDB(savedCorrection)
      console.log(`[IndexedDB] Correction ${savedCorrection.id} updated`)
    } catch (error) {
      console.error('[IndexedDB] Failed to update correction:', error)
      throw error
    }

    // 3. Return for Pinia update
    return normalizeCorrectionDates(savedCorrection)
  },

  async deleteAttendanceCorrection(
    id: string,
  ): Promise<{ success: boolean; deleted?: AttendanceCorrectionLog }> {
    if (!id) {
      console.warn('[Delete] No ID provided for deletion')
      return { success: false }
    }

    //Step 1. Delete from Firestore
    let result: { success: boolean; deleted?: AttendanceCorrectionLog } = { success: false }

    try {
      result = await api.attendance.deleteCorrection(id)
      if (!result.success) {
        console.warn(`[API] Deletion returned unsuccessful for ID: ${id}`)
      }
    } catch (error) {
      console.error('[API] Failed to delete correction:', error)
      throw error
    }

    //Step 2. Delete from IndexedDB only if API delete succeeded
    try {
      const db = await getDB()
      const tx = db.transaction(STORE_KEYS.attendanceCorrections, 'readwrite')
      await tx.store.delete(id)
      await tx.done
      console.log(`[IndexedDB] Correction ${id} deleted from local DB`)
    } catch (error) {
      console.error('[IndexedDB] Failed to delete correction:', error)
      throw error
    }
    return result
  },
}
