// src/services/api/firebase/attendance.ts

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  // doc,
  // updateDoc,
  // addDoc,
  // deleteDoc,
} from 'firebase/firestore'

import { db } from '@/firebase'

import type { AttendanceAPI } from '@/types/api'
import type { StaffAttendanceLog } from '@/types'
// import type { StaffAttendanceLog, AttendanceCorrectionLog } from '@/types'

/**
 * Firestore collection references
 */
const attendanceRef = collection(db, 'staffAttendanceLogs')
// const correctionRef = collection(db, 'attendanceCorrectionLog')

/**
 * Firebase-backed implementation of AttendanceAPI
 */
export const attendance: AttendanceAPI = {
  async getAttendanceLogs(userId, from, to): Promise<StaffAttendanceLog[]> {
    // Firebase API usage:
    const start = Timestamp.fromDate(new Date(new Date(from).setHours(0, 0, 0, 0)))
    const end = Timestamp.fromDate(new Date(new Date(to).setHours(23, 59, 59, 999)))
    const q = query(
      attendanceRef,
      where('staffId', '==', userId),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
    )
    const snapshot = await getDocs(q)
    const logs: StaffAttendanceLog[] = []
    snapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
      } as StaffAttendanceLog)
    })
    return logs
  },
  /*
  async createAttendanceCorrection(data) {
    // TODO: Add correction document to 'attendanceCorrectionLog'
    // Firebase API usage:
    // await addDoc(correctionRef, { ...data, status: 'pending', submittedAt: Timestamp.now() })
  },

  async getAttendanceCorrections(userId, start, end) {
    // TODO: Query corrections by staffId and date range
    // Firebase API usage:
    // const q = query(correctionRef, where('staffId', '==', userId), where('date', '>=', start), where('date', '<=', end))
    // const snapshot = await getDocs(q)
    // const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return []
  },

  async approveCorrection(id) {
    // TODO: Update correction status to 'approved'
    // Firebase API usage:
    // const ref = doc(correctionRef, id)
    // await updateDoc(ref, { status: 'approved', reviewedAt: Timestamp.now() })
  },

  async rejectCorrection(id) {
    // TODO: Update correction status to 'rejected'
    // Firebase API usage:
    // const ref = doc(correctionRef, id)
    // await updateDoc(ref, { status: 'rejected', reviewedAt: Timestamp.now() })
  },

  async updateCorrection(id, update) {
    // TODO: Update correction fields
    // Firebase API usage:
    // const ref = doc(correctionRef, id)
    // await updateDoc(ref, update)
  },

  async deleteCorrection(id) {
    // TODO: Delete correction document by ID
    // Firebase API usage:
    // const ref = doc(correctionRef, id)
    // await deleteDoc(ref)
  },

  // */
}
