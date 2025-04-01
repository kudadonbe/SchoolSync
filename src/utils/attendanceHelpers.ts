/**
 * ✅ File: src/utils/attendanceHelpers.ts
 * 🧠 Description: General time, scheduling, and attendance formatting utilities used across SchoolSync.
 */

import type {
  DutyRoster,
  Staff,
  Holidays,
  SpecialDuty,
  DailyOverride,
  DisplayAttendanceRecord,
  DisplayAttendanceStatus,
} from '@/types'

import type { StaffAttendanceLog } from '@/services/db/types'
import { formatDateLocal } from '@/utils/stringHelpers'

/**
 * ⏱ Get the scheduled in-time for a user on a specific date.
 * Uses special duties, overrides, early punch detection, or type-based default schedules.
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

  if (specialDuty) {
    return specialDuty.time
  }

  if (dailyOverride?.EarlyDuty?.includes(userId)) {
    return dutyRoster.dutyTimes.find((duty) => duty.type === 'EarlyDuty')?.time || ''
  }

  if ((type === 'Admin' || type === 'Labor') && isNearEarlyDutyTime(firstPunchIn)) {
    return dutyRoster.dutyTimes.find((duty) => duty.type === 'EarlyDuty')?.time || ''
  }

  if (type === 'Academic') {
    return dutyRoster.dutyTimes.find((duty) => duty.type === 'AcademicDuty')?.time || ''
  }

  return dutyRoster.dutyTimes.find((duty) => duty.type === 'DefaultSchedule')?.time || ''
}

/**
 * ⌛ Calculates scheduled out-time by adding 6 hours to scheduled in-time.
 * @param scheduledInTime - Expected format: "HH:mm"
 * @returns Out-time string in "HH:mm"
 */
export function getScheduledOutTime(scheduledInTime: string): string {
  const [h, m] = scheduledInTime.split(':').map(Number)
  const inMinutes = h * 60 + m
  const outMinutes = inMinutes + 6 * 60

  const outH = Math.floor(outMinutes / 60) % 24
  const outM = outMinutes % 60

  return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`
}

/**
 * 🕒 Calculate the number of late minutes after scheduled time + grace period.
 */
export function calculateLateMinutes(scheduled: string, actual: string, grace: number): number {
  const [sh, sm] = scheduled.split(':').map(Number)
  const [ah, am] = actual.split(':').map(Number)
  const scheduledMinutes = sh * 60 + sm + grace
  const actualMinutes = ah * 60 + am

  return Math.max(0, actualMinutes - scheduledMinutes)
}

/**
 * 📌 Check if a punch time is within ±30 minutes of EarlyDuty time (06:45).
 */
function isNearEarlyDutyTime(time: string): boolean {
  const total = toMinutes(time)
  return total >= 375 && total <= 435 // Between 06:15 and 07:15
}

/**
 * 📆 Check if a given date is within the range of a special duty period.
 */
export function isWithinSpecialDuty(
  dateStr: string,
  specialDuty: { from: string; to: string },
): boolean {
  const start = new Date(specialDuty.from)
  const end = new Date(specialDuty.to)
  const current = new Date(dateStr)
  return current >= start && current <= end
}

/**
 * 📅 Get a special duty object if the date matches any of the defined ranges.
 */
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

/**
 * 🎌 Check if a date is a public or special holiday.
 */
export function isHoliday(
  date: string,
  publicHolidays: Holidays[],
  specialHolidays: Holidays[],
): boolean {
  const isPublicHoliday = publicHolidays.some((holiday) => holiday.date === date)
  const isSpecialHoliday = specialHolidays.some((holiday) => holiday.date === date)
  return isPublicHoliday || isSpecialHoliday
}

/**
 * ⚙️ Get the daily override for a specific date (if any).
 */
export function getDailyOverrideForDate(
  dateStr: string,
  dailyOverrides: DailyOverride[],
): DailyOverride | null {
  return dailyOverrides.find((override) => override.date === dateStr) || null
}

/**
 * 🔢 Convert time string ("HH:mm") into total minutes.
 */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * 🔽 Sorts punch records by date and time in ascending order.
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
 * 🔁 Normalize punch status based on punch time and schedule.
 * Used to fix biometric mislogs like BREAK IN instead of CHECK OUT.
 */
export function normalizePunchStatus(
  punchTime: string,
  scheduledIn: string,
  scheduledOut: string,
  originalStatus: DisplayAttendanceStatus,
  grace = 15,
  earlyWindow = 60,
  lateWindow = 60,
): DisplayAttendanceStatus {
  const time = toMinutes(punchTime)
  const inMin = toMinutes(scheduledIn)
  const outMin = toMinutes(scheduledOut)

  if (time >= inMin - earlyWindow && time <= inMin + grace) {
    return 'CHECK IN'
  }

  if (time >= outMin - grace && time <= outMin + lateWindow) {
    return 'CHECK OUT'
  }

  return originalStatus
}

/**
 * 🗂 Format a date string or Date object to "YYYY-MM" format.
 * Used to key records by period.
 */
export function getPeriodKeyFromDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return formatDateLocal(date).slice(0, 7) // Returns "YYYY-MM"
}

/**
 * 📊 Groups attendance records into a Map of period → record list.
 */
export function groupAttendanceByPeriod(
  records: StaffAttendanceLog[],
): Map<string, StaffAttendanceLog[]> {
  const grouped = new Map<string, StaffAttendanceLog[]>()

  for (const record of records) {
    const key = getPeriodKeyFromDate(new Date(record.timestamp.seconds))
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(record)
  }

  return grouped
}

export function getCurrentAttendancePeriod(): { from: string; to: string } {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() // JS months are 0-based

  const from = new Date(`${year}-${month.toString().padStart(2, '0')}-16`)
  const to = new Date(from)
  to.setMonth(to.getMonth() + 1)
  to.setDate(15)

  return {
    from: formatDateLocal(from),
    to: formatDateLocal(to),
  }
}

export function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date()

  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    from: formatDateLocal(start),
    to: formatDateLocal(end),
  }
}

export function getPeriodKeysInRange(start: string, end: string): string[] {
  const result: string[] = []
  const current = new Date(start)
  const endDate = new Date(end)

  current.setDate(1)
  endDate.setDate(1)

  while (current <= endDate) {
    result.push(getPeriodKeyFromDate(current))
    current.setMonth(current.getMonth() + 1)
  }

  return result
}
