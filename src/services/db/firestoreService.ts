import { db } from '@/firebase'
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore'

import type { AttendanceService, UploadedAttendanceRecord, AttendanceQuery } from './types'

// Firestore collection for attendance logs uploaded from iClock
const COLLECTION_NAME = 'staffAttendanceLogs'

const firestoreService: AttendanceService = {
  /**
   * Fetch all records — avoid using this in production (expensive).
   */
  async getAllAttendance(): Promise<UploadedAttendanceRecord[]> {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME))
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UploadedAttendanceRecord[]
  },

  /**
   * Fetch records from Firestore with optional filters.
   * Only use minimal filters (e.g., by staffId, from/to date).
   * All other logic should happen in Pinia/local cache.
   */
  async getAttendanceByQuery(queryParams: AttendanceQuery): Promise<UploadedAttendanceRecord[]> {
    const conditions = []

    if (queryParams.staffId) {
      conditions.push(where('staffId', '==', queryParams.staffId))
    }

    if (queryParams.from) {
      conditions.push(where('timestamp', '>=', queryParams.from))
    }

    if (queryParams.to) {
      conditions.push(where('timestamp', '<=', queryParams.to))
    }

    const q = query(collection(db, COLLECTION_NAME), ...conditions)
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UploadedAttendanceRecord[]
  },

  /**
   * Admin-only/manual use — add a single attendance log.
   */
  async addAttendance(record: UploadedAttendanceRecord): Promise<void> {
    const data = { ...record }
    delete data.id

    await setDoc(
      doc(db, COLLECTION_NAME, record.id || crypto.randomUUID()),
      {
        ...data,
        uploadedAt: Timestamp.now(),
      },
      { merge: true },
    )
  },

  /**
   * Admin-only/manual use — add multiple attendance logs.
   */
  async addMultipleAttendance(records: UploadedAttendanceRecord[]): Promise<void> {
    const tasks = records.map((record) => {
      const data = { ...record }
      delete data.id

      return setDoc(
        doc(db, COLLECTION_NAME, record.id || crypto.randomUUID()),
        {
          ...data,
          uploadedAt: Timestamp.now(),
        },
        { merge: true },
      )
    })

    await Promise.all(tasks)
  },

  /**
   * Update an existing attendance log (corrections/amendments).
   */
  async updateAttendance(record: UploadedAttendanceRecord): Promise<void> {
    if (!record.id) {
      throw new Error('Missing document ID for update.')
    }

    const data = { ...record }
    delete data.id

    await setDoc(
      doc(db, COLLECTION_NAME, record.id),
      {
        ...data,
        uploadedAt: Timestamp.now(),
      },
      { merge: true },
    )
  },

  /**
   * Fetch a single attendance log by its doc ID (used for corrections).
   */
  async getAttendanceById(docId: string): Promise<UploadedAttendanceRecord | null> {
    const ref = doc(db, COLLECTION_NAME, docId)
    const snapshot = await getDoc(ref)

    if (!snapshot.exists()) return null

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as UploadedAttendanceRecord
  },
}

export default firestoreService
