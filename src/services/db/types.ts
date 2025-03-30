/**
 * Represents a single attendance log stored in Firestore.
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
 * Optional query filters when retrieving attendance logs.
 */
export interface AttendanceQuery {
  staffId?: string // Filter by staff ID
  from?: string // Start date (inclusive, ISO format)
  to?: string // End date (inclusive, ISO format)
}

/**
 * Interface to abstract attendance database logic.
 * Implemented by Firestore or other backends (MySQL, etc.).
 */
export interface AttendanceService {
  /**
   * Get all attendance records from the DB.
   */
  getAllAttendance(): Promise<UploadedAttendanceRecord[]>

  /**
   * Filter records by staffId or date range.
   */
  getAttendanceByQuery(query: AttendanceQuery): Promise<UploadedAttendanceRecord[]>

  /**
   * Add a new attendance record (used in admin/manual cases).
   */
  addAttendance(record: UploadedAttendanceRecord): Promise<void>

  /**
   * Add multiple attendance records (bulk insert).
   */
  addMultipleAttendance(records: UploadedAttendanceRecord[]): Promise<void>

  /**
   * Update an existing record by ID (used for corrections).
   */
  updateAttendance(record: UploadedAttendanceRecord): Promise<void>

  /**
   * Get a single attendance record by document ID.
   */
  getAttendanceById(docId: string): Promise<UploadedAttendanceRecord | null>

  watchAttendanceByPeriod?: (
    periodKey: string,
    onUpdate: (logs: UploadedAttendanceRecord[]) => void,
    options?: { staffId?: string },
  ) => () => void
}
