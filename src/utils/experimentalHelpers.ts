// src/utils/experimentalHelpers.ts
import type { DisplayAttendanceRecord } from '@/types'
import { toSeconds } from '@/utils'

type PunchRole = 'CHECK IN' | 'BREAK OUT' | 'BREAK IN' | 'CHECK OUT'

export function resolvePunchSequenceForDate(
  punches: DisplayAttendanceRecord[],
  scheduledIn: string,
  scheduledOut: string,
  thresholdSeconds = 300, // 5 minutes
): {
  checkIn: string | null
  checkOut: string | null
  breaks: { time: string; type: '(IN)' | '(OUT)'; missing: boolean }[]
} {
  const sorted = [...punches].sort((a, b) => a.time.localeCompare(b.time))
  const groups: DisplayAttendanceRecord[][] = []

  // Group punches by threshold
  for (const p of sorted) {
    const currentSecs = toSeconds(p.time)
    const lastGroup = groups[groups.length - 1]

    if (
      !lastGroup ||
      Math.abs(toSeconds(lastGroup[lastGroup.length - 1].time) - currentSecs) > thresholdSeconds
    ) {
      groups.push([p])
    } else {
      lastGroup.push(p)
    }
  }

  const getPunch = (
    group: DisplayAttendanceRecord[] | undefined,
    role: PunchRole,
    mode: 'first' | 'last',
  ): string | null => {
    if (!group) return null
    const filtered = group.filter((p) => p.status === role)
    if (filtered.length === 0) return null
    return mode === 'first' ? filtered[0].time : filtered[filtered.length - 1].time
  }

  const checkIn =
    getPunch(groups[0], 'CHECK IN', 'first') ??
    (groups[0] && isNearTime(groups[0][0].time, scheduledIn, 10 * 60) ? groups[0][0].time : null)

  const checkOut = getPunch(groups[3] ?? groups[groups.length - 1], 'CHECK OUT', 'last')

  const breaks: { time: string; type: '(IN)' | '(OUT)'; missing: boolean }[] = []

  const hasBreakPunch = punches.some((p) => p.status === 'BREAK OUT' || p.status === 'BREAK IN')

  if (hasBreakPunch) {
    const breakOut = getPunch(groups[1], 'BREAK OUT', 'last')
    const breakIn = getPunch(groups[2], 'BREAK IN', 'first')

    if (breakOut) {
      breaks.push({ time: breakOut, type: '(OUT)', missing: false })

      if (breakIn) {
        breaks.push({ time: breakIn, type: '(IN)', missing: false })
      } else if (
        groups.length > 2 &&
        groups[2].some((p) => p.status !== 'CHECK OUT' && p.status !== 'BREAK OUT')
      ) {
        // Only mark missing break-in if the next group exists and isn't clearly the check-out group
        breaks.push({ time: groups[2][0].time, type: '(IN)', missing: true })
      }
    } else if (groups.length > 1) {
      breaks.push({ time: groups[1][0].time, type: '(OUT)', missing: true })
    }
  }

  return {
    checkIn,
    checkOut,
    breaks,
  }
}

function isNearTime(punchTime: string, refTime: string, threshold: number): boolean {
  return Math.abs(toSeconds(punchTime) - toSeconds(refTime)) <= threshold
}

// experimental functions for attendance range generation
import type { ProcessedAttendance } from '@/types'
import { formatDateLocal, newAttendanceRecord } from '@/utils'

/**
 * Generate a continuous list of ProcessedAttendance records for a date range.
 * If partial data is provided, it will fill missing days with default attendance records.
 *
 * @param startDate - Start of the range (string or Date)
 * @param endDate - End of the range (string or Date)
 * @param data - Optional list of ProcessedAttendance (can be partial)
 * @returns Complete list of ProcessedAttendance for the range
 */
export function generateAttendanceRange(
  startDate: string | Date,
  endDate: string | Date,
  data?: ProcessedAttendance[],
): ProcessedAttendance[] {
  const map = new Map<string, ProcessedAttendance>()

  if (data) {
    for (const item of data) {
      map.set(item.date, item)
    }
  }

  const range: ProcessedAttendance[] = []

  const from = new Date(startDate)
  const to = new Date(endDate)

  while (from <= to) {
    const dateStr = formatDateLocal(from)
    const day = from.toLocaleString('en-us', { weekday: 'long', timeZone: 'Indian/Maldives' })
    const record = map.get(dateStr) || newAttendanceRecord(dateStr)

    range.push({
      ...record,
      date: dateStr,
      day,
      isWeekend: day === 'Friday' || day === 'Saturday',
    })

    from.setDate(from.getDate() + 1)
  }

  return range
}
