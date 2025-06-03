// src/services/dataProviders/attendanceCorrectionsProvider.ts
import type { AttendanceCorrectionLog } from '@/types'
import { fetchAttendanceCorrectionsForUser } from '@/services/firebaseServices'
import { getDB, STORE_KEYS } from '@/services/indexeddb/indexedDBInit'
import { formatDateUTC } from '@/utils'

export const getAttendanceCorrections = async (
  staffId: string,
  startDate: Date,
  endDate: Date,
  forceRefresh = false,
): Promise<AttendanceCorrectionLog[]> => {
  const db = await getDB()

  if (!forceRefresh) {
    const index = db.transaction(STORE_KEYS.attendanceCorrections).store.index('staffId')
    const cached = await index.getAll(staffId)

    if (cached.length > 0) {
      const startStr = formatDateUTC(startDate)
      const endStr = formatDateUTC(endDate)

      const filtered = cached.filter((log) => {
        return log.date >= startStr && log.date <= endStr
      })

      if (filtered.length > 0) return filtered
    }
  }

  const freshLogs = await fetchAttendanceCorrectionsForUser(
    staffId,
    formatDateUTC(startDate),
    formatDateUTC(endDate),
  )

  const tx = db.transaction(STORE_KEYS.attendanceCorrections, 'readwrite')
  const store = tx.objectStore(STORE_KEYS.attendanceCorrections)
  for (const log of freshLogs) {
    if (!log.id) {
      console.warn('Skipping log with no ID:', log)
      continue
    }
    await store.put(log)
  }
  await tx.done

  return freshLogs
}
