// src/services/firebaseServices.ts
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '@/firebase' // Adjust the path if needed

import type { StaffAttendanceLog, User, Staff, AttendanceCorrectionLog } from '@/types' // Adjust path if needed

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
  console.log('fetching attendance for user:', staffId, 'to', endDate.toLocaleDateString())

  return records
}

export const fetchAttendanceCorrectionsForUser = async (
  staffId: string,
  startDate: string,
  endDate: string,
): Promise<AttendanceCorrectionLog[]> => {
  try {
    const correctionsRef = collection(db, 'attendanceCorrectionLog')

    const q = query(
      correctionsRef,
      where('staffId', '==', staffId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
    )

    // console.log('fetching attendance corrections for user:', q)

    const querySnapshot = await getDocs(q)

    // if (querySnapshot.empty) {
    //   console.warn(`⚠️ No correction logs found for`, { staffId, startDate, endDate })
    // } else {
    //   console.log(`✅ Found ${querySnapshot.size} correction logs`)
    // }

    const records: AttendanceCorrectionLog[] = []

    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data(),
      } as AttendanceCorrectionLog)
    })

    console.log(
      `✅ Fetched ${records.length} attendance corrections for user:`,
      staffId,
      'from',
      startDate,
      'to',
      endDate,
    )

    return records
  } catch (error) {
    console.error('❌ Failed to fetch attendance corrections:', {
      staffId,
      startDate,
      endDate,
      error,
    })
    throw error // let the caller (store or component) decide how to handle it
  }
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

  console.log(`Fetched ${users.length} users from Firestore`)
  return users
}

export async function updateUserInFirestore(user: User) {
  try {
    const userRef = doc(db, 'user', user.uid)
    await updateDoc(userRef, {
      staffId: user.staffId ?? null,
      role: user.role,
    })
    console.log('User updated in Firestore:', user.email)
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
      const data = doc.data()
      if (!data.user_id) data.user_id = doc.id // Ensure user_id is set
      console.log(`Fetched staff member: ${doc.id}`, data)
      staffList.push(data as Staff)
    })

    console.log(`Fetched ${staffList.length} staff members from Firestore`)
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
      console.log(`Fetched staff member by user_id: ${docSnap.data().name}`)
      return docSnap.data() as Staff
    } else {
      console.warn('No staff found with user_id:', staffId)
      return null
    }
  } catch (error) {
    console.error('Error fetching staff by user_id:', error)
    throw error
  }
}

export async function submitAttendanceCorrection(data: {
  staffId: string
  date: string
  correctionType: string
  requestedTime: string
  reason: string
}) {
  const correctionRef = collection(db, 'attendanceCorrectionLog')
  await addDoc(correctionRef, {
    staffId: data.staffId,
    date: data.date,
    correctionType: data.correctionType,
    requestedTime: data.requestedTime,
    reason: data.reason,
    status: 'pending',
  })
}

// Approve or reject an existing attendance correction
export async function updateAttendanceCorrectionStatus(
  docId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
) {
  const docRef = doc(db, 'attendanceCorrectionLog', docId)
  await updateDoc(docRef, {
    status,
    reviewedBy,
    reviewedAt: new Date(),
  })
}

/**
 * Update an existing attendance‐correction’s fields.
 */
export async function updateAttendanceCorrection(params: {
  id: string
  data: {
    correctionType?: string
    requestedTime?: string
    reason?: string
    status?: string
  }
}) {
  const { id, data } = params
  const docRef = doc(db, 'attendanceCorrectionLog', id)
  await updateDoc(docRef, {
    ...data,
    // optionally: reviewedAt: new Date() if you want timestamps
  })
}

/**
 * Delete an attendance‐correction by its document ID.
 */
export async function deleteAttendanceCorrection(id: string) {
  const docRef = doc(db, 'attendanceCorrectionLog', id)
  await deleteDoc(docRef)
}
