// src/services/firebaseServices.ts
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase' // Adjust the path if needed

import type { StaffAttendanceLog } from '@/types' // Adjust path if needed

export async function fetchAttendanceForUser(
  staffId: string,
  startDate: Date,
  endDate: Date,
): Promise<StaffAttendanceLog[]> {
  const start = Timestamp.fromDate(new Date(new Date(startDate).setHours(0, 0, 0, 0)))
  const end = Timestamp.fromDate(new Date(new Date(endDate).setHours(23, 59, 59, 999)))

  const attendanceRef = collection(db, 'staffAttendanceLogs')

  const q = query(
    attendanceRef,
    where('staffId', '==', staffId),
    where('timestamp', '>=', start),
    where('timestamp', '<=', end),
  )

  const querySnapshot = await getDocs(q)

  const records: StaffAttendanceLog[] = []

  querySnapshot.forEach((doc) => {
    records.push({
      id: doc.id,
      ...doc.data(),
    } as StaffAttendanceLog)
  })
  console.log('fetching attendance for user:', staffId, 'from', startDate, 'to', endDate)

  return records
}
