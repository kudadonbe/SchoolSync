// src/services/dataProviders/attendanceCorrectionsProvider.ts
import type { AttendanceCorrectionLog } from '@/types'
import { fetchAttendanceCorrectionsForUser } from '@/services/firebaseServices'
import { getDB, STORE_KEYS } from '@/services/indexeddb/indexedDBInit'
import { formatDateLocal } from '@/utils'

export const getAttendanceCorrections = async (
  staffId: string,
  startDate: Date,
  endDate: Date,
  forceRefresh = false,
): Promise<AttendanceCorrectionLog[]> => {
  const db = await getDB()

  const startStr = formatDateLocal(startDate)
  const endStr = formatDateLocal(endDate)

  if (!forceRefresh) {
    const index = db.transaction(STORE_KEYS.attendanceCorrections).store.index('staffId')
    const cached = await index.getAll(staffId)

    const filtered = cached.filter((log) => {
      return log.date >= startStr && log.date <= endStr
    })

    // console.log(`[IndexedDB] Corrections for ${staffId} → ${filtered.length} entries`)
    return filtered
  }

  const freshLogs = await fetchAttendanceCorrectionsForUser(staffId, startStr, endStr)

  const tx = db.transaction(STORE_KEYS.attendanceCorrections, 'readwrite')
  const store = tx.objectStore(STORE_KEYS.attendanceCorrections)
  for (const log of freshLogs) {
    const id = log.id || `${log.staffId}_${log.date}_${log.requestedTime}_${log.status}`
    await store.put({ ...log, id })
  }
  await tx.done

  // console.log(`[Firestore] Corrections fetched & stored for ${staffId} → ${freshLogs.length} entries`)
  return freshLogs
}
