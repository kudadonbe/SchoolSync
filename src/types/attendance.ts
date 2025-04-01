// ========== Punch Types ==========
export type PunchStatus = 0 | 1 | 2 | 3
// 0 = IN, 1 = OUT, 2 = Break OUT, 3 = Break IN

// ========== Raw Device Record ==========
export interface AttendanceRecord {
  user_id: string
  date: string // "YYYY-MM-DD"
  time: string // "HH:mm:ss"
  punch_status: PunchStatus
  log_status: number // optional use: duplicate, corrected, flagged
}

// ========== Optional UI-Friendly Display Record ==========
export type DisplayAttendanceStatus =
  | 'CHECK IN'
  | 'CHECK OUT'
  | 'BREAK IN'
  | 'BREAK OUT'
  | 'UNKNOWN'

export interface DisplayAttendanceRecord {
  user_id: string
  date: string
  time: string
  status: DisplayAttendanceStatus
}

// ========== Summary Status (after processing logic) ==========
export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'SL_FORM'
  | 'SL_MC'
  | 'FRL'
  | 'ANNUAL_LEAVE'
  | 'HAJJU'
  | 'UMRA'
  | 'NOPAY_LEAVE'
  | 'SPECIAL_LEAVE'

// Used to track a user's daily status
export interface AttendanceSummaryRecord {
  user_id: string
  date: string
  status: AttendanceStatus
}

// ========== Summary View Structure ==========
export type AttendanceSummary = {
  daysAttended: number
  slForm: number
  slMc: number
  frl: number
  annualLeave: number
  hajjuLeave: number
  umraLeave: number
  nopayLeave: number
  specialLeave: number
  absents: number
}

// ✅ Define Processed Attendance Interface
export interface ProcessedAttendance {
  date: string
  day: string
  firstCheckIn: string
  lastCheckOut: string
  breaks: { time: string; type: string; missing: boolean }[]
  missingCheckIn: boolean
  missingCheckOut: boolean
  isWeekend: boolean
  lateMinutes: number
  isHoliday: boolean
  lastBreakTimes: {
    'BREAK IN': string | null
    'BREAK OUT': string | null
  }
}
