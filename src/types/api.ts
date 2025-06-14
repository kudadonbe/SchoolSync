// src/types/api.ts

import type { AttendanceCorrectionLog, StaffAttendanceLog } from './firebaseTypes'

import type { User } from './user'
import type { Staff } from './staff'

// === Staff API ===
export interface StaffAPI {
  getStaffList(): Promise<Staff[]> // If `Staff` is distinct from `User`, import accordingly
}

// === Auth API ===
export interface AuthAPI {
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
}

// === Attendance API ===
export interface AttendanceAPI {
  getAttendanceLogs(userId: string, start: Date, end: Date): Promise<StaffAttendanceLog[]>
  getAttendanceCorrections(
    userId: string,
    start: string,
    end: string,
  ): Promise<AttendanceCorrectionLog[]>
  createAttendanceCorrection(data: AttendanceCorrectionLog): Promise<AttendanceCorrectionLog>
  updateCorrection(
    id: string,
    update: Partial<AttendanceCorrectionLog>,
  ): Promise<AttendanceCorrectionLog>
  deleteCorrection(id: string): Promise<{ success: boolean; deleted?: AttendanceCorrectionLog }>
}

export interface BackendAPI {
  attendance: AttendanceAPI
  staff?: StaffAPI
  auth?: AuthAPI
  // Add more domains as needed (dutyRoster, users, etc.)
}
