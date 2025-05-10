// src/services/firebaseServices.ts
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '@/firebase' // Adjust the path if needed

import type { StaffAttendanceLog, User, Staff } from '@/types' // Adjust path if needed

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

export const fetchStaffList = async (): Promise<Staff[]> => {
  try {
    const staffRef = collection(db, 'staffList')
    const q = query(staffRef)

    const querySnapshot = await getDocs(q)

    const staffList: Staff[] = []

    querySnapshot.forEach((doc) => {
      staffList.push({
        user_id: doc.id,
        ...doc.data(),
      } as Staff)
    })

    console.log('Staff list fetched from Firestore');

    return staffList
  } catch (error) {
    console.error('Error fetching staff list:', error)
    throw error
  }
}

export const fetchStaff = async (staffId: string): Promise<Staff | null> => {
  try {
    const staffRef = collection(db, 'staffList')
    const q = query(staffRef, where('user_id', '==', staffId))

    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      return docSnap.data() as Staff
    } else {
      console.warn('No staff found with user_id:', staffId)
      return null
    }
    console.log('Staff fetched from Firestore:', staffId);

  } catch (error) {
    console.error('Error fetching staff by user_id:', error)
    throw error
  }
}
