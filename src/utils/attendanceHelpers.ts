import type { DutyRoster, Staff, Holidays, SpecialDuty, DailyOverride } from '@/types'

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
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m
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
