import type { Timestamp } from 'firebase/firestore'

/**
 * 📄 Firestore Record: staffAttendanceLogs
 * Represents a single log entry downloaded from Firestore.
 */
export interface StaffAttendanceLog {
  id?: string // Firestore document ID (MD5 hash of staffId + timestamp)
  staffId: string // Unique staff identifier
  status: number // Work code from iClock
  timestamp: Timestamp | UnixTimestamp // Punch time
  uploadedAt: Timestamp | UnixTimestamp // Upload time
  workCode: number // 0 = IN, 1 = OUT, 2 = BREAK OUT, 3 = BREAK IN.
}

export interface UnixTimestamp {
  seconds: number
  nanoseconds: number
}

export interface UserActivityMetadata {
  method?: string
  page?: string
  description?: string
  [key: string]: string | undefined // Optional: allow simple text values only
}

/**
 * 🛠️ Firestore Record: attendanceCorrectionLogs
 * Represents a correction request for a missed or incorrect attendance entry.
 */
export interface AttendanceCorrectionLog {
  id?: string // Firestore doc ID (auto or manual)
  staffId: string // Who submitted the correction
  date: string // Attendance date, e.g., "2025-05-06"
  correctionType:
    | 'checkIn'
    | 'checkOut'
    | 'breakIn'
    | 'breakOut'
    | 'otIn'
    | 'otOut'
    | 'wrongWorkcode' // general fallback if needed
  requestedTime: string // HH:mm, e.g., "07:55"
  requestedWorkCode?: number // Optional: 0 = IN, 1 = OUT, etc.
  reason: string
  originalPunchId?: string // Optional link to staffAttendanceLog
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string // Admin UID
  reviewedAt?: Timestamp | UnixTimestamp
  createdAt: Timestamp | UnixTimestamp
}


