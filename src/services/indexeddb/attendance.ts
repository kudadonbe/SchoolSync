// src/services/indexeddb/attendance.ts

import { getDB, STORE_KEYS } from './indexedDBInit'
import type { DisplayAttendanceRecord, AttendanceCorrectionLog } from '@/types'
import { formatDateUTC, convertToDisplayRecords } from '@/utils'
import { api } from '@/services/api'
/**
 * IndexedDB-backed attendance caching helpers
 */

async function saveCorrectionToIDB(correction: AttendanceCorrectionLog) {
  const db = await getDB()
  const tx = db.transaction(STORE_KEYS.attendanceCorrections, 'readwrite')
  await tx.store.put(correction)
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
    const start = formatDateUTC(from)
    const end = formatDateUTC(to)

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
      // const id = `${log.user_id}_${log.date}_${log.time}_${log.status}`
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

    if (!force) {
      const index = db.transaction(STORE_KEYS.attendanceCorrections).store.index('user_id')
      const cached = await index.getAll(staffId)

      if (cached.length > 0) {
        const filtered = cached.filter((log) => log.date >= start && log.date <= end)
        console.log(`[IndexedDB] Corrections for ${staffId} → ${filtered.length}`)
        return filtered
      }
    }

    const correctionsFromApi = await api.attendance.getAttendanceCorrections(staffId, start, end)

    const tx = db.transaction(STORE_KEYS.attendanceCorrections, 'readwrite')
    const store = tx.objectStore(STORE_KEYS.attendanceCorrections)

    for (const correction of correctionsFromApi) {
      if (!correction.staffId) continue
      await store.put({
        id: correction.id,
        correctionType: correction.correctionType,
        date: correction.date,
        reason: correction.reason,
        requestedTime: correction.requestedTime,
        reviewedAt: correction.reviewedAt,
        reviewedBy: correction.reviewedBy,
        staffId: correction.staffId,
        status: correction.status,
      })
    }
    await tx.done
    return correctionsFromApi
  },

  async createAttendanceCorrection(
    correction: AttendanceCorrectionLog,
  ): Promise<AttendanceCorrectionLog> {
    // 1. Create on API (let the API assign ID or accept provided one)
    let savedCorrection: AttendanceCorrectionLog
    try {
      savedCorrection = await api.attendance.createAttendanceCorrection(correction)
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
    return savedCorrection
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
      savedCorrection = await api.attendance.updateCorrection(
        updatedCorrection.id,
        updatedCorrection,
      )
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
    return savedCorrection
  },

  async deleteAttendanceCorrection(id: string): Promise<boolean> {
    if (!id) {
      console.warn('[Delete] No ID provided for deletion')
      return false
    }

    // 1. Delete from Firestore
    try {
      await api.attendance.deleteCorrection(id)
    } catch (error) {
      console.error('[API] Failed to delete correction:', error)
      throw error
    }

    // 2. Delete from IndexedDB
    try {
      const db = await getDB()
      const tx = db.transaction(STORE_KEYS.attendanceCorrections, 'readwrite')
      await tx.store.delete(id)
      await tx.done
      console.log(`[IndexedDB] Correction ${id} deleted`)
    } catch (error) {
      console.error('[IndexedDB] Failed to delete correction:', error)
      throw error
    }
    return true
  },
}
