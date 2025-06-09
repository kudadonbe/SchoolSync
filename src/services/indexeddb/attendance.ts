// src/services/indexeddb/attendance.ts

import { getDB, STORE_KEYS } from './indexedDBInit'
import type { DisplayAttendanceRecord } from '@/types'
// import type { StaffAttendanceLog, AttendanceCorrectionLog } from '@/types'
import { formatDateUTC, convertToDisplayRecords } from '@/utils'
import { api } from '@/services/api'
/**
 * IndexedDB-backed attendance caching helpers
 */
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
      if (!log.user_id) continue
      const id = `${log.user_id}_${log.date}_${log.time}_${log.status}`
      await store.put({
        id,
        user_id: log.user_id,
        date: log.date,
        time: log.time,
        status: log.status,
      })
    }
    await tx.done
    return convertedLogs
  },

  /**

  async saveAttendanceLogs(logs: StaffAttendanceLog[]): Promise<void> {
    // TODO: Save multiple attendance logs to IndexedDB
    // IndexedDB API usage:
    // const db = await getDB()
    // const tx = db.transaction(STORE_KEYS.attendanceLogs, 'readwrite')
    // for (const log of logs) {
    //   await tx.store.put(log)
    // }
    // await tx.done
  },

  async deleteAttendanceLog(id: string): Promise<void> {
    // TODO: Delete a single attendance log by ID
    // IndexedDB API usage:
    // const db = await getDB()
    // await db.delete(STORE_KEYS.attendanceLogs, id)
  },

  async getAttendanceCorrections(
    staffId: string,
    start: string,
    end: string,
  ): Promise<AttendanceCorrectionLog[]> {
    // TODO: Fetch corrections by staffId and date range from IndexedDB
    // IndexedDB API usage:
    // const db = await getDB()
    // const tx = db.transaction(STORE_KEYS.attendanceCorrections)
    // const index = tx.store.index('staffId')
    // const all = await index.getAll(staffId)
    // const filtered = all.filter(log => log.date >= start && log.date <= end)
    return []
  },

  async saveAttendanceCorrection(data: AttendanceCorrectionLog): Promise<void> {
    // TODO: Save or update a correction record in IndexedDB
    // IndexedDB API usage:
    // const db = await getDB()
    // await db.put(STORE_KEYS.attendanceCorrections, data)
  },

  async deleteAttendanceCorrection(id: string): Promise<void> {
    // TODO: Delete a correction record from IndexedDB by ID
    // IndexedDB API usage:
    // const db = await getDB()
    // await db.delete(STORE_KEYS.attendanceCorrections, id)
  },

   */
}
