/**
 * ✅ File: src/utils/attendanceStoreHelpers.ts
 * 🧠 Description: Utility helpers for working with logsMap from attendanceStore
 */

import type { FirestoreLikeTimestamp, StaffAttendanceLog } from '@/services/db/types'
import type { AttendanceQuery } from '@/services/db/types'
import type { AttendanceStore } from '@/stores/attendanceStore'

import firestoreService from '@/services/db/firestoreService'
import { Timestamp } from 'firebase/firestore'

import type { ProcessedAttendance } from '@/types'

/**
 * 🔄 Flatten logsMap into one big list of logs
 */
export function flattenLogsMap(logsMap: Map<string, StaffAttendanceLog[]>): StaffAttendanceLog[] {
  return Array.from(logsMap.values()).flat()
}

/**
 * 👤 Get logs for a specific staff member across all periods
 */
export function filterLogsByStaff(
  logsMap: Map<string, StaffAttendanceLog[]>,
  staffId: string,
): StaffAttendanceLog[] {
  return flattenLogsMap(logsMap).filter((log) => log.staffId === staffId)
}

/**
 * 📦 Get logs in period range (e.g., Jan–Mar 2025)
 */
export function filterLogsByPeriodRange(
  logsMap: Map<string, StaffAttendanceLog[]>,
  from: string, // e.g., "2025-01"
  to: string, // e.g., "2025-03"
): StaffAttendanceLog[] {
  const keysInRange = Array.from(logsMap.keys()).filter((key) => key >= from && key <= to)
  return keysInRange.flatMap((key) => logsMap.get(key) || [])
}

/**
 * ⏳ Converts Firestore Timestamp or Firestore-like object into display-friendly values.
 * Ensures compatibility across Firestore snapshot and raw JSON.
 */
export function parseTimestampToDateTime(timestamp: Timestamp | FirestoreLikeTimestamp): {
  date: string
  time: string
  day: string
} {
  let ts: Timestamp

  // ✅ Case 1: Real Firestore Timestamp
  if (timestamp instanceof Timestamp) {
    ts = timestamp
  }
  // ✅ Case 2: Raw object with _seconds (from Firestore JSON)
  else if (typeof timestamp === 'object' && typeof timestamp.seconds === 'number') {
    ts = Timestamp.fromMillis(timestamp.seconds * 1000)
  } else {
    throw new Error('⛔ Invalid timestamp input: must be Firestore Timestamp or compatible object')
  }

  // 🎯 Convert to standard date object
  const dateObj = ts.toDate()

  if (isNaN(dateObj.getTime())) {
    throw new Error('⛔ Invalid Date conversion from timestamp')
  }

  const iso = dateObj.toISOString()
  const [date, timeFull] = iso.split('T')
  const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' })

  return {
    date,
    day,
    time: timeFull.slice(0, 5),
  }
}

/**
 * 🧠 Checks if logs for a given period and staff ID exist within the Pinia store.
 * @param logsMap - Map of periodKey → StaffAttendanceLog[]
 * @param periodKey - "YYYY-MM" string (e.g., "2025-03")
 * @param staffId - Staff ID to check
 * @returns Object with flags for period existence and staff log existence
 */
export function checkPeriodAndStaffLogs(
  logsMap: Map<string, StaffAttendanceLog[]>,
  periodKey: string,
  staffId: string,
): { periodExists: boolean; staffExists: boolean } {
  const periodLogs = logsMap.get(periodKey)

  const periodExists = !!periodLogs
  const staffExists = periodExists ? periodLogs!.some((log) => log.staffId === staffId) : false

  return { periodExists, staffExists }
}

/**
 * 🧠 Conditionally fetch and store attendance logs.
 * - If the period doesn't exist → fetch and create new period.
 * - If the period exists but staff logs are missing → fetch and append.
 * - If logs already exist → do nothing.
 *
 * @param store - The Pinia attendance store
 * @param periodKey - The period key (e.g., "2025-03")
 * @param staffId - The staff ID to check
 * @param query - Firestore query to fetch logs
 */
export async function ensureStaffLogsInPeriod(
  store: AttendanceStore,
  periodKey: string,
  staffId: string,
  query: AttendanceQuery,
): Promise<void> {
  const { periodExists, staffExists } = checkPeriodAndStaffLogs(store.logsMap, periodKey, staffId)
  if (!periodExists) {
    const logs = await firestoreService.getAttendanceByQuery(query)
    store.addFetchedPeriod(periodKey, logs)
    console.log(`Got ${logs.length} new records from firestore added to ${periodKey}`)
  } else if (!staffExists) {
    const logs = await firestoreService.getAttendanceByQuery(query)
    store.addLogsToPeriod(periodKey, logs)
    console.log(`Got ${logs.length} new records from firestore added to ${periodKey}`)
  }
}

export function transformLogToBasicProcessed(log: StaffAttendanceLog): ProcessedAttendance {
  const { date, time, day } = parseTimestampToDateTime(log.timestamp)

  return {
    date,
    day,
    firstCheckIn: log.workCode === 0 ? time : '--',
    lastCheckOut: log.workCode === 1 ? time : '--',
    lateMinutes: 0,
    isHoliday: false,
    isWeekend: false,
    missingCheckIn: false,
    missingCheckOut: false,
    breaks: [],
    lastBreakTimes: {
      'BREAK IN': null,
      'BREAK OUT': null,
    },
  }
}

export function filterLogsForStaff(
  logs: StaffAttendanceLog[],
  staffId: string,
): StaffAttendanceLog[] {
  return logs.filter((log) => log.staffId === staffId)
}

export function hasLogsForDateRange(
  logsMap: Map<string, StaffAttendanceLog[]>,
  staffId: string,
  from: string,
  to: string,
): boolean {
  const start = new Date(from)
  const end = new Date(to)

  for (const [periodKey, logs] of logsMap.entries()) {
    console.log('Checking period:', periodKey) // 🧪 to satisfy ESLint
    for (const log of logs) {
      if (!log.timestamp || typeof log.timestamp.seconds !== 'number') continue // ✅ skip invalid
      const logDate = new Date(log.timestamp.seconds * 1000) // From Firestore
      if (log.staffId === staffId && logDate >= start && logDate <= end) {
        return true
      }
    }
  }

  return false
}
