// src\types\firebaseTypes.ts

import type { Timestamp } from 'firebase/firestore'

/**
 * 🔢 Firestore-Compatible Timestamp
 * Fallback structure for systems not using Firestore-native Timestamp.
 */
export interface UnixTimestamp {
  seconds: number
  nanoseconds: number
}

/**
 * 📄 Firestore Record: staffAttendanceLogs
 * Represents a single attendance punch.
 */
export interface StaffAttendanceLog {
  id?: string                      // Firestore doc ID (MD5 hash of staffId + timestamp)
  staffId: string                  // Unique staff identifier
  status: number                  // Status code from iClock (e.g., 0, 1, 2, 3)
  timestamp: Timestamp | UnixTimestamp  // Time of the punch
  uploadedAt: Timestamp | UnixTimestamp // When this log was added to Firestore
  workCode: number                // 0 = IN, 1 = OUT, 2 = BREAK OUT, 3 = BREAK IN
}

/**
 * 🛠️ Firestore Record: attendanceCorrectionLogs
 * Represents a request to correct a missing or wrong punch.
 */
export interface AttendanceCorrectionLog {
  id?: string                     // Firestore document ID
  staffId: string                 // ID of the user submitting the correction
  date: string                   // Affected date, format: YYYY-MM-DD
  correctionType:                // Type of correction being requested
    | 'checkIn'
    | 'checkOut'
    | 'breakIn'
    | 'breakOut'
    | 'otIn'
    | 'otOut'
    | 'wrongWorkcode'
  requestedTime: string          // Requested time (HH:mm format)
  requestedWorkCode?: number     // Optional: 0 = IN, 1 = OUT, 2 = BREAK OUT, 3 = BREAK IN
  reason: string                 // User-provided reason for the correction
  originalPunchId?: string       // Optional: reference to the original log if exists
  status?: 'pending' | 'approved' | 'rejected' // Admin review status
  reviewedBy?: string            // UID of the admin who reviewed
  reviewedAt?: Timestamp | UnixTimestamp // When the review was made
  createdAt?: Timestamp | UnixTimestamp  // When the request was submitted
}

/**
 * 🧾 UI or Logging Metadata
 * Optional activity context info.
 */
export interface UserActivityMetadata {
  method?: string                // HTTP method or UI action
  page?: string                  // Source page
  description?: string           // Additional explanation
  [key: string]: string | undefined // Allow custom tags
}



