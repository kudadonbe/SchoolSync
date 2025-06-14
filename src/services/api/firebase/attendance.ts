// src/services/api/firebase/attendance.ts

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore'

import { db } from '@/firebase'

import type { AttendanceAPI } from '@/types/api'
import type { StaffAttendanceLog, AttendanceCorrectionLog } from '@/types'

/**
 * Firestore collection references
 */
const attendanceRef = collection(db, 'staffAttendanceLogs')
const correctionRef = collection(db, 'attendanceCorrectionLog')

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
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as StaffAttendanceLog[]
    return logs
  },

  async createAttendanceCorrection(data: {
    staffId: string
    date: string
    correctionType: string
    requestedTime: string
    reason: string
  }): Promise<AttendanceCorrectionLog> {
    const docRef = await addDoc(correctionRef, {
      staffId: data.staffId,
      date: data.date,
      correctionType: data.correctionType,
      requestedTime: data.requestedTime,
      reason: data.reason,
      status: 'pending',
    })
    console.log(`Created attendance correction for user: ${data.staffId} on ${data.date}`)
    return {
      id: docRef.id,
      staffId: data.staffId,
      date: data.date,
      correctionType: data.correctionType,
      requestedTime: data.requestedTime,
      reason: data.reason,
      status: 'pending',
    }
  },

  async getAttendanceCorrections(
    staffId: string,
    start: string,
    end: string,
  ): Promise<AttendanceCorrectionLog[]> {
    // TODO: Query corrections by staffId and date range
    // Firebase API usage:
    const q = query(
      correctionRef,
      where('staffId', '==', staffId),
      where('date', '>=', start),
      where('date', '<=', end),
    )
    const snapshot = await getDocs(q)
    const corrections: AttendanceCorrectionLog[] = []
    snapshot.forEach((doc) => {
      corrections.push({
        id: doc.id,
        ...doc.data(),
      } as AttendanceCorrectionLog)
    })
    console.log(`Fetched ${corrections.length} attendance corrections for user: ${staffId}`)
    return corrections
  },

  async updateCorrection(
    id: string,
    update: Partial<AttendanceCorrectionLog>,
  ): Promise<AttendanceCorrectionLog> {
    // TODO: Update correction fields
    // Firebase API usage:
    const ref = doc(correctionRef, id)
    await updateDoc(ref, update)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      throw new Error(`Correction not found after update: ${id}`)
    }

    return {
      id: snap.id,
      ...snap.data(),
    } as AttendanceCorrectionLog
  },

  async deleteCorrection(id: string) {
    // TODO: Delete correction document by ID
    // Firebase API usage:
    const ref = doc(correctionRef, id)
    await deleteDoc(ref)
  },
}
