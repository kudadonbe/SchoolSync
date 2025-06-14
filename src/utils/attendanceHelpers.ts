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
  RemovedPunchLog,
  BreakPunch,
} from '@/types'

import type { Timestamp } from 'firebase/firestore'
import { formatTimeHHMMSS, formatTimeUTC, formatDateLocal } from '@/utils'

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

export function toSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number)
  return h * 3600 + m * 60 + (s ?? 0)
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
  grace = 4,
  earlyWindow = 10,
  lateWindow = 10,
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
    const dateStr = formatDateLocal(dateObj)
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
    4: 'OVERTIME IN',
    5: 'OVERTIME OUT',
  }

  return logs.map((log) => {
    const dateObj = toDateSafe(log.timestamp)
    // console.log('DEBUG:', dateObj, '→', dateObj.toISOString(), '→', formatTimeLocal(dateObj))
    return {
      id: log.id!,
      user_id: log.staffId,
      date: formatDateLocal(dateObj),
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

export function deduplicatePunches(
  punches: DisplayAttendanceRecord[],
  thresholdSeconds = 10,
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
    const currentSecs = toSeconds(current.time)

    const matchIndex = deduplicated.findIndex(
      (r) =>
        r.status === current.status &&
        r.date === current.date &&
        Math.abs(toSeconds(r.time) - currentSecs) <= thresholdSeconds,
    )

    if (matchIndex === -1) {
      deduplicated.push(current)
    } else {
      const existing = deduplicated[matchIndex]
      const existingSecs = toSeconds(existing.time)

      if (isEntry) {
        if (currentSecs < existingSecs) {
          removed.push(existing)
          deduplicated[matchIndex] = current // keep earlier
        } else {
          removed.push(current) // discard later
        }
      } else if (isExit) {
        if (currentSecs > existingSecs) {
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

export function removeCancelledPairs(punches: DisplayAttendanceRecord[]): {
  removed: DisplayAttendanceRecord[]
} {
  const removed: DisplayAttendanceRecord[] = []
  const used = new Set<number>()

  const sorted = [...punches].sort((a, b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time)
    return a.date.localeCompare(b.date)
  })

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue
    const a = sorted[i]

    for (let j = i + 1; j < sorted.length; j++) {
      if (used.has(j)) continue
      const b = sorted[j]

      if (
        a.user_id === b.user_id &&
        a.date === b.date &&
        a.time === b.time &&
        isOppositeStatus(a.status, b.status)
      ) {
        removed.push(a, b)
        used.add(i)
        used.add(j)
        break
      }
    }
  }

  return { removed }
}

function isOppositeStatus(a: string, b: string): boolean {
  const pairs: Record<string, string> = {
    'CHECK IN': 'CHECK OUT',
    'CHECK OUT': 'CHECK IN',
    'BREAK IN': 'BREAK OUT',
    'BREAK OUT': 'BREAK IN',
  }
  return pairs[a] === b
}

export function convertCorrectionsToDisplayRecords(
  corrections: AttendanceCorrectionLog[],
): DisplayAttendanceRecord[] {
  const map: Record<AttendanceCorrectionLog['correctionType'], DisplayAttendanceStatus> = {
    checkIn: 'CHECK IN',
    checkOut: 'CHECK OUT',
    breakIn: 'BREAK IN',
    breakOut: 'BREAK OUT',
    otIn: 'OVERTIME IN',
    otOut: 'OVERTIME OUT',
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

export function filterNoisyBreakPunches(
  punches: DisplayAttendanceRecord[],
  enable = true,
): DisplayAttendanceRecord[] {
  if (!enable) {
    return [...punches].sort((a, b) => {
      if (a.date === b.date) return a.time.localeCompare(b.time)
      return a.date.localeCompare(b.date)
    })
  }

  // ✅ Separate break punches and others
  const breakPunches = punches.filter((p) => p.status === 'BREAK IN' || p.status === 'BREAK OUT')
  const otherPunches = punches.filter((p) => p.status !== 'BREAK IN' && p.status !== 'BREAK OUT')

  // 🔃 Sort break punches by date and time
  const sorted = [...breakPunches].sort((a, b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time)
    return a.date.localeCompare(b.date)
  })

  // 🧠 Group break punches by date
  const groupedByDate = new Map<string, DisplayAttendanceRecord[]>()
  for (const p of sorted) {
    if (!groupedByDate.has(p.date)) groupedByDate.set(p.date, [])
    groupedByDate.get(p.date)!.push(p)
  }

  const finalBreaks: DisplayAttendanceRecord[] = []

  for (const daily of groupedByDate.values()) {
    const used = new Set<number>()
    const valid: DisplayAttendanceRecord[] = []
    let expect: 'BREAK OUT' | 'BREAK IN' = 'BREAK OUT' // Always expect OUT first

    for (let i = 0; i < daily.length; i++) {
      const p = daily[i]
      if (used.has(i)) continue

      // ✅ Accept punch if it matches the expectation
      if (p.status === expect) {
        valid.push(p)
        used.add(i)
        expect = expect === 'BREAK OUT' ? 'BREAK IN' : 'BREAK OUT'
      }
      // ✅ Allow unexpected lone punch (e.g., single BREAK IN or BREAK OUT)
      else if (
        (p.status === 'BREAK OUT' && expect === 'BREAK IN') ||
        (p.status === 'BREAK IN' && expect === 'BREAK OUT')
      ) {
        valid.push(p)
        used.add(i)
        // keep same expectation
      }
      // ❌ Skip misordered or repeated punch (e.g., BREAK IN after BREAK IN)
    }

    finalBreaks.push(...valid)
  }

  // ✅ Merge cleaned breaks with other punches
  return [...otherPunches, ...finalBreaks].sort((a, b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time)
    return a.date.localeCompare(b.date)
  })
}

export function cleanDisplayAttendanceLogs(
  iClockDisplay: DisplayAttendanceRecord[],
  corrections: AttendanceCorrectionLog[],
  thresholdSeconds = 10,
  skipCancellation = false,
  skipNoiseFilter = false,
): {
  iClockLog: DisplayAttendanceRecord[]
  correctionLog: DisplayAttendanceRecord[]
  removed: RemovedPunchLog[]
} {
  const correctionDisplay = convertCorrectionsToDisplayRecords(corrections)
  const all = [...iClockDisplay, ...correctionDisplay]

  // Step 1: Cancel exact opposite pairs at same second
  const { removed: cancelledPairs } = skipCancellation ? { removed: [] } : removeCancelledPairs(all)

  const afterCancellation = all.filter(
    (p) =>
      !cancelledPairs.some(
        (c) =>
          c.user_id === p.user_id &&
          c.date === p.date &&
          c.time === p.time &&
          c.status === p.status,
      ),
  )

  // Step 2: Deduplicate using second-level threshold
  const { deduplicated, removed: duplicates } = deduplicatePunches(
    afterCancellation,
    thresholdSeconds,
  )

  // Step 3: Optionally remove noisy break patterns
  const cleaned = filterNoisyBreakPunches(deduplicated, !skipNoiseFilter)

  const key = (r: DisplayAttendanceRecord) => `${r.user_id}_${r.date}_${r.time}_${r.status}`
  const cleanedKeys = new Set(cleaned.map(key))
  const duplicateKeys = new Set(duplicates.map(key))
  const cancellationKeys = new Set(cancelledPairs.map(key))
  const noisyKeys = new Set(deduplicated.filter((p) => !cleaned.includes(p)).map((p) => key(p)))

  // Split logs by source
  const iClockLog = iClockDisplay.filter((r) => cleanedKeys.has(key(r)))
  const correctionLog = correctionDisplay.filter((r) => cleanedKeys.has(key(r)))

  // Build removal report
  const sourceMap = new Map<
    string,
    { source: 'iclock' | 'correction'; record: DisplayAttendanceRecord }
  >()
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

  for (const k of noisyKeys) {
    const ref = sourceMap.get(k)
    if (ref && !seen.has(k)) {
      removed.push({ source: ref.source, reason: 'noise', record: ref.record })
      seen.add(k)
    }
  }

  return {
    iClockLog,
    correctionLog,
    removed,
  }
}

export function formatBreakPairs(breaks: BreakPunch[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  let tempOut: string | null = null

  for (const b of breaks) {
    if (b.type === '(OUT)') {
      if (tempOut !== null) {
        // Previous OUT had no matching IN
        pairs.push([tempOut, '--'])
      }
      tempOut = b.time
    } else if (b.type === '(IN)') {
      if (tempOut !== null) {
        pairs.push([tempOut, b.time])
        tempOut = null
      } else {
        pairs.push(['--', b.time])
      }
    }
  }

  // Any final OUT left unmatched
  if (tempOut !== null) {
    pairs.push([tempOut, '--'])
  }

  return pairs
}

export function mergeAttendanceLogs(
  existing: DisplayAttendanceRecord[],
  incoming: DisplayAttendanceRecord[],
): DisplayAttendanceRecord[] {
  const seenKeys = new Set(existing.map((log) => `${log.user_id}-${log.date}-${log.time}`))

  const merged = [...existing]
  for (const log of incoming) {
    const key = `${log.user_id}-${log.date}-${log.time}`
    if (!seenKeys.has(key)) {
      merged.push(log)
    }
  }

  return merged.sort((a, b) => {
    const aKey = `${a.date}-${a.time}`
    const bKey = `${b.date}-${b.time}`
    return aKey.localeCompare(bKey)
  })
}

export function mergeAttendanceCorrections(
  existing: AttendanceCorrectionLog[],
  incoming: AttendanceCorrectionLog[],
  startDate: string,
  endDate: string,
): AttendanceCorrectionLog[] {
  // Keep only records outside the date range (those we didn't refresh)
  const keepOld = existing.filter((item) => item.date < startDate || item.date > endDate)

  // Build new map from incoming (fresh within range)
  const incomingMap = new Map<string, AttendanceCorrectionLog>()
  for (const item of incoming) {
    if (item.id) incomingMap.set(item.id, item)
  }

  // Merge and return
  return [...keepOld, ...incomingMap.values()]
}
