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
  AttendanceRecord,
  PunchStatus,
  AttendanceCorrectionLog,
  RemovedPunchLog
} from '@/types'

import type { Timestamp } from 'firebase/firestore'
import { formatTimeHHMMSS, formatDateUTC, formatTimeUTC } from "@/utils"

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
  const matchingDuties = specialDuties.filter((duty) => {
    const start = new Date(duty.from)
    const end = new Date(duty.to)
    return date >= start && date <= end
  })
  return matchingDuties.length > 0 ? matchingDuties[0] : null
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

export function normalizePunchStatus(
  punchTime: string,
  scheduledIn: string,
  scheduledOut: string,
  originalStatus: DisplayAttendanceStatus,
  grace = 10,
  earlyWindow = 20,
  lateWindow = 20,
): DisplayAttendanceStatus {
  // ✅ Preserve raw break statuses
  if (originalStatus === 'BREAK IN' || originalStatus === 'BREAK OUT') {
    return originalStatus
  }

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

  // ✅ Leave unknown or unmapped statuses untouched
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

export function convertToAttendanceRecords(logs: StaffAttendanceLog[]): AttendanceRecord[] {
  return logs.map((log) => {
    const dateObj = toDateSafe(log.timestamp)
    const dateStr = formatDateUTC(dateObj)
    const timeStr = formatTimeUTC(dateObj)

    return {
      user_id: log.staffId,
      date: dateStr,
      time: timeStr,
      punch_status: log.workCode as PunchStatus,
      log_status: log.status ?? 0,
    }
  })
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
 * Deduplicates punches and returns both the cleaned list and the removed ones.
 */
export function deduplicatePunches(
  punches: DisplayAttendanceRecord[],
  thresholdMinutes = 1,
): {
  deduplicated: DisplayAttendanceRecord[]
  removed: DisplayAttendanceRecord[]
} {
  const deduplicated: DisplayAttendanceRecord[] = []
  const removed: DisplayAttendanceRecord[] = []

  const sortedPunches = [...punches].sort((a, b) => {
    if (a.date === b.date) {
      return a.time.localeCompare(b.time)
    }
    return a.date.localeCompare(b.date)
  })

  for (const current of sortedPunches) {
    const isEntry = current.status === 'CHECK IN' || current.status === 'BREAK IN'
    const isExit = current.status === 'CHECK OUT' || current.status === 'BREAK OUT'
    const currentMins = toMinutes(current.time)

    const matchIndex = deduplicated.findIndex(
      (r) =>
        r.status === current.status &&
        r.date === current.date &&
        Math.abs(toMinutes(r.time) - currentMins) <= thresholdMinutes,
    )

    if (matchIndex === -1) {
      deduplicated.push(current)
    } else {
      const existing = deduplicated[matchIndex]
      const existingMins = toMinutes(existing.time)

      if (isEntry) {
        if (currentMins < existingMins) {
          removed.push(existing)
          deduplicated[matchIndex] = current // keep earlier
        } else {
          removed.push(current) // discard later
        }
      } else if (isExit) {
        if (currentMins > existingMins) {
          removed.push(existing)
          deduplicated[matchIndex] = current // keep later
        } else {
          removed.push(current) // discard earlier
        }
      }
    }
  }

  return {
    deduplicated,
    removed,
  }
}

/**
 * Removes cancel-like punch pairs (e.g., BREAK IN ↔ BREAK OUT or CHECK OUT ↔ CHECK IN) within a short time window.
 */
export function removeCancelledPairs(
  punches: DisplayAttendanceRecord[],
  thresholdMinutes = 1,
): {
  finePairs: [DisplayAttendanceRecord, DisplayAttendanceRecord][]
  removed: DisplayAttendanceRecord[]
} {
  const sorted = [...punches].sort((a, b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time)
    return a.date.localeCompare(b.date)
  })

  const finePairs: [DisplayAttendanceRecord, DisplayAttendanceRecord][] = []
  const removed: DisplayAttendanceRecord[] = []
  const used = new Set<number>()

  const isMatchingType = (a: string, b: string): boolean =>
    (a.startsWith('BREAK') && b.startsWith('BREAK')) ||
    (a.startsWith('CHECK') && b.startsWith('CHECK'))

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue
    const a = sorted[i]
    const aMins = toMinutes(a.time)

    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(j)) continue
      const b = sorted[j]
      if (a.date !== b.date) continue
      if (!isMatchingType(a.status, b.status)) continue

      const bMins = toMinutes(b.time)
      const diff = Math.abs(aMins - bMins)

      if (diff <= thresholdMinutes) {
        finePairs.push([a, b])
        removed.push(a, b)
        used.add(i)
        used.add(j)
        break // move on to next base
      }
    }
  }

  return {
    finePairs,
    removed,
  }
}

export function convertCorrectionsToDisplayRecords(
  corrections: AttendanceCorrectionLog[],
): DisplayAttendanceRecord[] {
  const map: Record<AttendanceCorrectionLog['correctionType'], DisplayAttendanceStatus> = {
    checkIn: 'CHECK IN',
    checkOut: 'CHECK OUT',
    breakIn: 'BREAK IN',
    breakOut: 'BREAK OUT',
    otIn: 'CHECK IN',
    otOut: 'CHECK OUT',
    wrongWorkcode: 'CHECK IN', // optionally skip
  }

  return corrections
    .filter((c) => c.status !== 'rejected')
    .map((c) => ({
      user_id: c.staffId,
      date: c.date,
      time: formatTimeHHMMSS(c.requestedTime),
      status: map[c.correctionType],
    }))
}

export function cleanDisplayAttendanceLogs(
  iClockDisplay: DisplayAttendanceRecord[],
  corrections: AttendanceCorrectionLog[],
  thresholdMinutes = 1,
  skipCancellation = false, // ← new param
): {
  iClockLog: DisplayAttendanceRecord[]
  correctionLog: DisplayAttendanceRecord[]
  removed: RemovedPunchLog[]
} {
  const correctionDisplay = convertCorrectionsToDisplayRecords(corrections)
  const all = [...iClockDisplay, ...correctionDisplay]

  const { deduplicated, removed: duplicates } = deduplicatePunches(all, thresholdMinutes)

  // Remove cancellation-like pairs if not skipped
  const cancellations = skipCancellation
    ? []
    : removeCancelledPairs(deduplicated, thresholdMinutes).removed

  const cleaned = deduplicated.filter((p) => !cancellations.includes(p))

  const key = (r: DisplayAttendanceRecord) => `${r.user_id}_${r.date}_${r.time}_${r.status}`
  const cleanedKeys = new Set(cleaned.map(key))
  const duplicateKeys = new Set(duplicates.map(key))
  const cancellationKeys = new Set(cancellations.map(key))

  // Separate cleaned records into their sources
  const iClockLog = iClockDisplay.filter((r) => cleanedKeys.has(key(r)))
  const correctionLog = correctionDisplay.filter((r) => cleanedKeys.has(key(r)))

  // For removed tracking
  const sourceMap = new Map<string, { source: 'iclock' | 'correction'; record: DisplayAttendanceRecord }>()
  iClockDisplay.forEach((r) => sourceMap.set(key(r), { source: 'iclock', record: r }))
  correctionDisplay.forEach((r) => sourceMap.set(key(r), { source: 'correction', record: r }))

  const removed: RemovedPunchLog[] = []

  const seen = new Set<string>()
  for (const k of duplicateKeys) {
    const ref = sourceMap.get(k)
    if (ref && !seen.has(k)) {
      removed.push({ source: ref.source, reason: 'duplicate', record: ref.record })
      seen.add(k)
    }
  }

  for (const k of cancellationKeys) {
    const ref = sourceMap.get(k)
    if (ref && !seen.has(k)) {
      removed.push({ source: ref.source, reason: 'cancellation', record: ref.record })
      seen.add(k)
    }
  }

  return { iClockLog, correctionLog, removed }
}

