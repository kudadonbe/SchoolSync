import type { Timestamp } from 'firebase/firestore'

/**
 * Optional query filters when retrieving attendance logs.
 */
export interface AttendanceQuery {
  staffId: string // Filter by staff ID
  from: string // Start date (inclusive, ISO format)
  to: string // End date (inclusive, ISO format)
}

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

/**
 * Represents a single attendance log Uploaded to Firestore by iclock-sync.
 * Uploaded via Python iClock script or updated manually.
 */
export interface UploadedAttendanceRecord {
  id?: string // Firestore document ID (doc_id from MD5 hash)
  staffId: string // Unique staff ID
  timestamp: string // ISO 8601 datetime string
  status: number // 0 = IN, 1 = OUT, etc.
  workCode: number | null // Optional work code from iClock
  uploadedAt: string | null // Firestore server timestamp
}

/**
 * Interface to abstract attendance database logic.
 * Implemented by Firestore or other backends (MySQL, etc.).
 */
export interface AttendanceService {
  /**
   * Get all attendance records from the DB.
   */
  getAllAttendance(): Promise<StaffAttendanceLog[]>

  /**
   * Filter records by staffId or date range.
   */
  getAttendanceByQuery(query: AttendanceQuery): Promise<StaffAttendanceLog[]>

  /**
   * Add a new attendance record (used in admin/manual cases).
   */
  addAttendance(record: StaffAttendanceLog): Promise<void>

  /**
   * Add multiple attendance records (bulk insert).
   */
  addMultipleAttendance(records: StaffAttendanceLog[]): Promise<void>

  /**
   * Update an existing record by ID (used for corrections).
   */
  updateAttendance(record: StaffAttendanceLog): Promise<void>

  /**
   * Get a single attendance record by document ID.
   */
  getAttendanceById(docId: string): Promise<StaffAttendanceLog | null>

  watchAttendanceByPeriod?: (
    periodKey: string,
    onUpdate: (logs: StaffAttendanceLog[]) => void,
    options?: { staffId?: string },
  ) => () => void
}

export interface FirestoreLikeTimestamp {
  seconds: number
  nanoseconds: number
}

/**
 * 📄 Firestore Record: staffAttendanceLogs
 * Represents a single log entry uploaded from iClock to Firestore.
 */
export interface StaffAttendanceLog {
  id?: string // Firestore document ID (MD5 hash of staffId + timestamp)
  staffId: string // Unique staff identifier
  status: number // 0 = IN, 1 = OUT, 2 = BREAK OUT, 3 = BREAK IN
  workCode: number // Work code from iClock

  timestamp: Timestamp | FirestoreLikeTimestamp // Punch time
  uploadedAt: Timestamp | FirestoreLikeTimestamp // Upload time
}
