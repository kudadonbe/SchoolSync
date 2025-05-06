// src/services/firebaseServices.ts
import { collection, query, where, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase' // Adjust the path if needed

import type { StaffAttendanceLog, User } from '@/types' // Adjust path if needed

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
  // console.log('fetching attendance for user:', staffId, 'to', endDate.toLocaleDateString())

  return records
}


export async function fetchUsers(): Promise<User[]> {
  const usersRef = collection(db, 'user')
  const q = query(usersRef)

  const querySnapshot = await getDocs(q)

  const users: User[] = []

  querySnapshot.forEach((doc) => {
    users.push({
      uid: doc.id,
      ...doc.data(),
    } as User)
  })

  return users
}

export async function updateUserInFirestore(user: User) {
  try {
    const userRef = doc(db, 'user', user.uid)
     await updateDoc(userRef, {
      staffId: user.staffId ?? null,
      role: user.role,
    })
    // console.log('User updated in Firestore:', user.uid)
  } catch (error) {
    console.error('❌ Failed to update user:', error)
    throw error
  }
}

