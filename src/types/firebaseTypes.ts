import type { Timestamp } from 'firebase/firestore'

/**
 * 📄 Firestore Record: staffAttendanceLogs
 * Represents a single log entry downloaded from Firestore.
 */
export interface StaffAttendanceLog {
  id?: string // Firestore document ID (MD5 hash of staffId + timestamp)
  staffId: string // Unique staff identifier
  status: number // 0 = IN, 1 = OUT, 2 = BREAK OUT, 3 = BREAK IN
  workCode: number // Work code from iClock

  timestamp: Timestamp | FirestoreLikeTimestamp // Punch time
  uploadedAt: Timestamp | FirestoreLikeTimestamp // Upload time
}

export interface FirestoreLikeTimestamp {
  seconds: number
  nanoseconds: number
}
