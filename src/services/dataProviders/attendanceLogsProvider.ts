// file: src/services/dataProviders/attendanceLogsProvider.ts
import { getDB, STORE_KEYS } from '@/services/indexeddb/indexedDBInit'
import { fetchAttendanceForUser as fetchFromFirestore } from '@/services/firebaseServices'
import type { StaffAttendanceLog } from '@/types'

/**
 * Loads attendance logs for a given user and date range from IndexedDB,
 * or fetches from Firestore and caches in IndexedDB if not available.
 */
export async function getAttendanceLogs(
  staffId: string,
  startDate: Date,
  endDate: Date,
  forceRefresh = false,
): Promise<StaffAttendanceLog[]> {
  const db = await getDB()

  // IndexedDB always stores by doc.id, not date ranges
  if (!forceRefresh) {
    const index = db.transaction(STORE_KEYS.attendanceLogs).store.index('staffId')
    const cached = await index.getAll(staffId)

    if (cached.length > 0) {
      // Filter by date range manually
      const start = startDate.getTime()
      const end = endDate.getTime()
      const filtered = cached.filter((log) => {
        const time = typeof log.timestamp === 'number' ? log.timestamp : log.timestamp.toMillis()
        return time >= start && time <= end
      })
      if (filtered.length > 0) return filtered
    }
  }

  // Otherwise fetch from Firestore and cache in IndexedDB
  const freshLogs = await fetchFromFirestore(staffId, startDate, endDate)

  const tx = db.transaction(STORE_KEYS.attendanceLogs, 'readwrite')
  const store = tx.objectStore(STORE_KEYS.attendanceLogs)
  for (const log of freshLogs) {
    if (!log.id) {
      console.warn('Missing ID in attendance log, skipping:', log)
      continue
    }
    await store.put(log)
  }
  await tx.done

  return freshLogs
}

/**
 * Retrieves a single attendance log by its ID.
 */
export async function getAttendanceLogById(id: string): Promise<StaffAttendanceLog | undefined> {
  const db = await getDB()
  return await db.get(STORE_KEYS.attendanceLogs, id)
}
