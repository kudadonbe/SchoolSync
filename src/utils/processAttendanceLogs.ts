/**
 * ✅ File: src/utils/processAttendanceLogs.ts
 * 🧠 Description: Converts raw UploadedAttendanceRecord[] into ProcessedAttendance[] for UI display.
 */

import type {
  ProcessedAttendance,
  AttendancePolicyGrouped,
  Staff,
  DutyRoster,
  DisplayAttendanceRecord,
  DisplayAttendanceStatus,
} from '@/types'

import type { UploadedAttendanceRecord } from '@/services/db/types.ts'

import {
  getScheduledInTime,
  getScheduledOutTime,
  normalizePunchStatus,
  calculateLateMinutes,
  isHoliday,
  toMinutes,
  sortPunchRecords,
} from './attendanceHelpers'

/**
 * 🔄 Converts UploadedAttendanceRecord[] into DisplayAttendanceRecord[] for utilities that require display format.
 */
export function convertToDisplayRecords(
  logs: UploadedAttendanceRecord[],
): DisplayAttendanceRecord[] {
  return logs.map((log) => ({
    user_id: log.staffId,
    date: log.timestamp.split('T')[0],
    time: log.timestamp.split('T')[1].slice(0, 5),
    status: mapPunchStatusToStatus(log.status),
  }))
}

/**
 * 🔁 Maps numeric PunchStatus to readable DisplayAttendanceStatus.
 */
export function mapPunchStatusToStatus(status: number): DisplayAttendanceStatus {
  switch (status) {
    case 0:
      return 'CHECK IN'
    case 1:
      return 'CHECK OUT'
    case 2:
      return 'BREAK OUT'
    case 3:
      return 'BREAK IN'
    default:
      return 'UNKNOWN'
  }
}

/**
 * 🧠 Processes attendance logs into summarized daily ProcessedAttendance records.
 */
export function processAttendanceLogs(
  logs: UploadedAttendanceRecord[],
  staffId: string,
  startDate: string,
  endDate: string,
  staffList: Staff[],
  dutyRoster: DutyRoster,
  policies: AttendancePolicyGrouped,
): ProcessedAttendance[] {
  const recordsMap = new Map<string, ProcessedAttendance>()
  const threshold = policies.punch.duplicate_threshold_minutes

  // Preprocess and sort logs
  const displayRecords = sortPunchRecords(
    convertToDisplayRecords(
      logs.filter(
        (log) =>
          log.staffId === staffId &&
          log.timestamp >= `${startDate}T00:00:00` &&
          log.timestamp <= `${endDate}T23:59:59`,
      ),
    ),
  )

  for (const record of displayRecords) {
    if (!recordsMap.has(record.date)) {
      recordsMap.set(record.date, {
        date: record.date,
        day: new Date(record.date).toLocaleString('en-us', { weekday: 'long' }),
        firstCheckIn: '',
        lastCheckOut: '',
        breaks: [],
        missingCheckIn: false,
        missingCheckOut: false,
        isWeekend: false,
        isHoliday: false,
        lateMinutes: 0,
        lastBreakTimes: {
          'BREAK IN': null,
          'BREAK OUT': null,
        },
      })
    }

    const dayRecord = recordsMap.get(record.date)!
    const scheduledInTime = getScheduledInTime(
      staffId,
      record.date,
      dayRecord.firstCheckIn,
      dutyRoster,
      staffList,
    )
    const scheduledOutTime = getScheduledOutTime(scheduledInTime)

    record.status = normalizePunchStatus(
      record.time,
      scheduledInTime,
      scheduledOutTime,
      record.status,
    )

    if (record.status === 'CHECK IN' && !dayRecord.firstCheckIn) {
      dayRecord.firstCheckIn = record.time
      dayRecord.lateMinutes = calculateLateMinutes(
        scheduledInTime,
        record.time,
        policies.late.grace_period_minutes,
      )
    }

    if (record.status === 'CHECK OUT') {
      dayRecord.lastCheckOut = record.time
    }

    if (record.status === 'BREAK IN' || record.status === 'BREAK OUT') {
      const lastTime = dayRecord.lastBreakTimes[record.status]
      const currentMin = toMinutes(record.time)
      const lastMin = lastTime ? toMinutes(lastTime) : -Infinity

      if (currentMin - lastMin >= threshold) {
        dayRecord.lastBreakTimes[record.status] = record.time
        dayRecord.breaks.push({
          time: record.time,
          type: record.status === 'BREAK IN' ? '(IN)' : '(OUT)',
          missing: false,
        })
      }
    }
  }

  // Final formatting across the date range
  const result: ProcessedAttendance[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const dayName = current.toLocaleString('en-us', { weekday: 'long' })
    const isWeekend = ['Friday', 'Saturday'].includes(dayName)
    const isHolidayDate = isHoliday(dateStr, dutyRoster.publicHolidays, dutyRoster.specialHolidays)

    const r = recordsMap.get(dateStr) || {
      date: dateStr,
      day: dayName,
      firstCheckIn: '',
      lastCheckOut: '',
      breaks: [],
      missingCheckIn: !isWeekend,
      missingCheckOut: !isWeekend,
      isWeekend,
      isHoliday: isHolidayDate,
      lateMinutes: 0,
      lastBreakTimes: {
        'BREAK IN': null,
        'BREAK OUT': null,
      },
    }

    // Update flags
    r.isWeekend = isWeekend
    r.isHoliday = isHolidayDate
    r.missingCheckIn = !r.firstCheckIn && !isWeekend
    r.missingCheckOut = !r.lastCheckOut && !isWeekend

    // Handle unpaired breaks
    const outCount = r.breaks.filter((b) => b.type === '(OUT)').length
    const inCount = r.breaks.filter((b) => b.type === '(IN)').length
    if (outCount !== inCount && r.breaks.length > 0) {
      r.breaks[r.breaks.length - 1].missing = true
    }

    result.push(r)
    current.setDate(current.getDate() + 1)
  }

  return result
}
