import type {
  DutyRoster,
  Staff,
  Holidays,
  SpecialDuty,
  DailyOverride,
  DisplayAttendanceRecord,
  DisplayAttendanceStatus,
  ProcessedAttendance,
  StaffAttendanceLog,
  UnixTimestamp,
} from '@/types'

import type { Timestamp } from 'firebase/firestore'

/**
 * Get scheduled in time for a user on a specific date.
 * Falls back to type-based schedule or early punch detection.
 */
export function getScheduledInTime(
  userId: string,
  date: string,
  firstPunchIn: string,
  dutyRoster: DutyRoster,
  staffList: Staff[],
): string {
  const specialDuty = getSpecialDutyForDate(date, dutyRoster.specialDutys)
  const dailyOverride = getDailyOverrideForDate(date, dutyRoster.dailyOverrides)
  const staff = staffList.find((s) => s.user_id === userId)
  const type = staff?.staff_type

  // Apply Special Duty if found
  if (specialDuty) {
    return specialDuty.time
  }

  // If listed in EarlyDuty overrides
  if (dailyOverride?.EarlyDuty?.includes(userId)) {
    return dutyRoster.dutyTimes.find((duty) => duty.type === 'EarlyDuty')?.time || ''
  }

  // Fallback: If early punch detected (±30min around 06:45)
  if ((type === 'Admin' || type === 'Labor') && isNearEarlyDutyTime(firstPunchIn)) {
    return dutyRoster.dutyTimes.find((duty) => duty.type === 'EarlyDuty')?.time || ''
  }

  // Academic schedule
  if (type === 'Academic') {
    return dutyRoster.dutyTimes.find((duty) => duty.type === 'AcademicDuty')?.time || ''
  }

  // Default for all others
  return dutyRoster.dutyTimes.find((duty) => duty.type === 'DefaultSchedule')?.time || ''
}

/**
 * Calculates scheduled out time by adding 6 hours to scheduled in time.
 * @param scheduledInTime - string in "HH:mm" format
 * @returns string in "HH:mm" format
 */
export function getScheduledOutTime(scheduledInTime: string): string {
  const [h, m] = scheduledInTime.split(':').map(Number)
  const inMinutes = h * 60 + m
  const outMinutes = inMinutes + 6 * 60 // add 6 hours

  const outH = Math.floor(outMinutes / 60) % 24
  const outM = outMinutes % 60

  return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`
}

/**
 * Calculate late minutes after scheduled in + grace period.
 */
export function calculateLateMinutes(scheduled: string, actual: string, grace: number): number {
  const [sh, sm] = scheduled.split(':').map(Number)
  const [ah, am] = actual.split(':').map(Number)
  const scheduledMinutes = sh * 60 + sm + grace
  const actualMinutes = ah * 60 + am

  return Math.max(0, actualMinutes - scheduledMinutes)
}

/**
 * Checks if punch time is within ±30 min of EarlyDuty (06:45)
 */
function isNearEarlyDutyTime(time: string): boolean {
  const total = toMinutes(time)
  return total >= 375 && total <= 435 // Between 06:15 and 07:15
}

export function isWithinSpecialDuty(
  dateStr: string,
  specialDuty: { from: string; to: string },
): boolean {
  const start = new Date(specialDuty.from)
  const end = new Date(specialDuty.to)
  const current = new Date(dateStr)
  return current >= start && current <= end
}

export function getSpecialDutyForDate(
  dateStr: string,
  specialDuties: SpecialDuty[],
): SpecialDuty | null {
  const date = new Date(dateStr)
  const specialDuty = specialDuties.find((duty) => {
    const start = new Date(duty.from)
    const end = new Date(duty.to)
    return date >= start && date <= end
  })
  return specialDuty || null
}

export function isHoliday(
  date: string,
  publicHolidays: Holidays[],
  specialHolidays: Holidays[],
): boolean {
  const isPublicHoliday = publicHolidays.some((holiday) => holiday.date === date)
  const isSpecialHoliday = specialHolidays.some((holiday) => holiday.date === date)
  return isPublicHoliday || isSpecialHoliday
}

export function getDailyOverrideForDate(
  dateStr: string,
  dailyOverrides: DailyOverride[],
): DailyOverride | null {
  const override = dailyOverrides.find((override) => override.date === dateStr)
  return override || null
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Sorts punch records by date and time (ascending).
 */
export function sortPunchRecords(records: DisplayAttendanceRecord[]): DisplayAttendanceRecord[] {
  return [...records].sort((a, b) => {
    if (a.date === b.date) {
      return a.time.localeCompare(b.time)
    }
    return a.date.localeCompare(b.date)
  })
}

/**
 * Normalize punch status based on punch time compared to scheduled in/out.
 * Used to correct biometric mislogs like BREAK IN instead of CHECK OUT.
 */
export function normalizePunchStatus(
  punchTime: string,
  scheduledIn: string,
  scheduledOut: string,
  originalStatus: DisplayAttendanceStatus,
  grace = 15, // Minutes after IN and before OUT
  earlyWindow = 60, // Minutes before scheduled IN
  lateWindow = 60, // Minutes after scheduled OUT
): DisplayAttendanceStatus {
  const time = toMinutes(punchTime)
  const inMin = toMinutes(scheduledIn)
  const outMin = toMinutes(scheduledOut)

  // ✅ CHECK IN: between earlyWindow before and grace after scheduledIn
  if (time >= inMin - earlyWindow && time <= inMin + grace) {
    return 'CHECK IN'
  }

  // ✅ CHECK OUT: between grace before and lateWindow after scheduledOut
  if (time >= outMin - grace && time <= outMin + lateWindow) {
    return 'CHECK OUT'
  }

  // ✅ Everything else → Assume break
  // return (time - inMin) % 2 === 0 ? 'BREAK OUT' : 'BREAK IN'
  return originalStatus
}

export function newAttendanceRecord(dateStr: string): ProcessedAttendance {
  const newRecord: ProcessedAttendance = {
    date: dateStr,
    day: new Date(dateStr).toLocaleString('en-us', { weekday: 'long' }),
    firstCheckIn: '',
    lastCheckOut: '',
    breaks: [],
    missingCheckIn: false,
    missingCheckOut: false,
    isWeekend: false,
    lateMinutes: 0,
    isHoliday: false,
    lastBreakTimes: {
      'BREAK IN': null,
      'BREAK OUT': null,
    },
  }
  return newRecord
}

/**
 * Converts raw Firestore attendance logs to display-friendly format.
 *
 * @param logs - Raw logs from Firestore
 * @returns Formatted logs for UI
 */
export function convertToDisplayRecords(logs: StaffAttendanceLog[]): DisplayAttendanceRecord[] {
  const statusMap: Record<number, DisplayAttendanceStatus> = {
    0: 'CHECK IN',
    1: 'CHECK OUT',
    2: 'BREAK OUT',
    3: 'BREAK IN',
  }

  return logs.map((log) => {
    const dateObj = toDateSafe(log.timestamp)
    // console.log('DEBUG:', dateObj, '→', dateObj.toISOString(), '→', formatTimeLocal(dateObj))
    return {
      user_id: log.staffId,
      date: formatDateUTC(dateObj),
      time: formatTimeUTC(dateObj),
      status: statusMap[log.workCode] ?? 'UNKNOWN',
    }
  })
}

/**
 * Safely converts a Firestore Timestamp or plain Unix timestamp object to JavaScript Date.
 *
 * @param input - Timestamp (with .toDate()) or raw object { seconds }
 * @returns JavaScript Date object
 */
export function toDateSafe(input: UnixTimestamp | Timestamp): Date {
  if (typeof input === 'object' && 'toDate' in input && typeof input.toDate === 'function') {
    return input.toDate()
  }

  if (typeof input === 'object' && 'seconds' in input && typeof input.seconds === 'number') {
    return new Date(input.seconds * 1000)
  }
  throw new Error('Invalid timestamp format')
}

/**
 * Format a Date object into "HH:mm:ss" in **UTC**
 */
export function formatTimeUTC(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
