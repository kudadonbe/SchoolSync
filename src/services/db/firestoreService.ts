/**
 * ✅ File: src/services/db/firestoreService.ts
 * 🧠 Description: Abstracted Firestore service layer for managing attendance logs.
 * Supports uploading logs (from iClock), manual updates, period-based queries,
 * and real-time syncing via Firestore `onSnapshot()`.
 */

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
  onSnapshot,
  QuerySnapshot,
} from 'firebase/firestore'

import type { AttendanceService, UploadedAttendanceRecord, AttendanceQuery } from './types'

const COLLECTION_NAME = 'staffAttendanceLogs'

/**
 * 👁 Real-time sync for a specific period (YYYY-MM).
 * Filters by optional staffId. Calls `onUpdate(logs)` when data changes.
 * Returns `unsubscribe()` function to stop listening.
 */
function watchAttendanceByPeriod(
  periodKey: string,
  onUpdate: (logs: UploadedAttendanceRecord[]) => void,
  options?: { staffId?: string },
): () => void {
  const from = new Date(`${periodKey}-01`)
  const to = new Date(from)
  to.setMonth(to.getMonth() + 1)

  const conditions = [where('timestamp', '>=', from), where('timestamp', '<', to)]

  if (options?.staffId) {
    conditions.push(where('staffId', '==', options.staffId))
  }

  const q = query(collection(db, COLLECTION_NAME), ...conditions)

  const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
    const updatedLogs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UploadedAttendanceRecord[]

    onUpdate(updatedLogs)
  })

  return unsubscribe
}

const firestoreService: AttendanceService = {
  /**
   * ⚠️ Expensive. Fetch all logs. Avoid using in production.
   */
  async getAllAttendance(): Promise<UploadedAttendanceRecord[]> {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME))
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as UploadedAttendanceRecord[]
  },

  /**
   * 🔍 Filter logs by optional staffId and/or date range.
   * Result should be cached in Pinia/localStorage to reduce Firestore reads.
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

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as UploadedAttendanceRecord[]
  },

  /**
   * ➕ Add a new attendance log (admin/manual usage).
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
   * 📥 Bulk insert multiple attendance logs.
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
   * ✏️ Update a single attendance log by ID (admin correction use case).
   */
  async updateAttendance(record: UploadedAttendanceRecord): Promise<void> {
    if (!record.id) throw new Error('Missing document ID for update.')

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
   * 📄 Fetch a single attendance log by Firestore document ID.
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

  /**
   * 🔁 Real-time attendance sync for admins/staff log viewers.
   */
  watchAttendanceByPeriod,
}

export default firestoreService
