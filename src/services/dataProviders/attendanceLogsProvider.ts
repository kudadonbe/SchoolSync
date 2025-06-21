// file: src/services/dataProviders/attendanceLogsProvider.ts
import { getDB, STORE_KEYS } from '@/services/indexeddb/indexedDBInit'
import { fetchAttendanceForUser as fetchFromFirestore } from '@/services/firebaseServices'
import { convertToDisplayRecords, formatDateUTC } from '@/utils'
import type { DisplayAttendanceRecord } from '@/types'

export async function getAttendanceLogs(
  staffId: string,
  startDate: Date,
  endDate: Date,
  forceRefresh = false,
): Promise<DisplayAttendanceRecord[]> {
  const db = await getDB()

  if (!forceRefresh) {
    const index = db.transaction(STORE_KEYS.attendanceLogs).store.index('user_id')
    const cached = await index.getAll(staffId)

    if (cached.length > 0) {
      const startStr = formatDateUTC(startDate)
      const endStr = formatDateUTC(endDate)
      const filtered = cached.filter((log) => log.date >= startStr && log.date <= endStr)
      // console.log(`[IndexedDB] Logs for ${staffId} → ${filtered.length} entries`)
      return filtered // Already in display format
    }
  }

  // Otherwise fetch from Firestore and cache converted logs
  const freshLogs = await fetchFromFirestore(staffId, startDate, endDate)
  const convertedLogs = convertToDisplayRecords(freshLogs)

  const tx = db.transaction(STORE_KEYS.attendanceLogs, 'readwrite')
  const store = tx.objectStore(STORE_KEYS.attendanceLogs)
  for (const log of convertedLogs) {
    if (!log.user_id) continue
    if (!log.id) continue
    const id = log.id
    await store.put({
      id,
      user_id: log.user_id,
      date: log.date,
      time: log.time,
      status: log.status,
    })
  }
  await tx.done
  // console.log(`[Firestore] Logs fetched & stored for ${staffId} → ${freshLogs.length} entries`)
  return convertedLogs
}
