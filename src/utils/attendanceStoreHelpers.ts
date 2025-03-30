/**
 * ✅ File: src/utils/attendanceStoreHelpers.ts
 * 🧠 Description: Utility helpers for working with logsMap from attendanceStore
 */

import type { UploadedAttendanceRecord } from '@/services/db/types'

/**
 * 🔄 Flatten logsMap into one big list of logs
 */
export function flattenLogsMap(
  logsMap: Map<string, UploadedAttendanceRecord[]>,
): UploadedAttendanceRecord[] {
  return Array.from(logsMap.values()).flat()
}

/**
 * 👤 Get logs for a specific staff member across all periods
 */
export function filterLogsByStaff(
  logsMap: Map<string, UploadedAttendanceRecord[]>,
  staffId: string,
): UploadedAttendanceRecord[] {
  return flattenLogsMap(logsMap).filter((log) => log.staffId === staffId)
}

/**
 * 📦 Get logs in period range (e.g., Jan–Mar 2025)
 */
export function filterLogsByPeriodRange(
  logsMap: Map<string, UploadedAttendanceRecord[]>,
  from: string, // e.g., "2025-01"
  to: string, // e.g., "2025-03"
): UploadedAttendanceRecord[] {
  const keysInRange = Array.from(logsMap.keys()).filter((key) => key >= from && key <= to)
  return keysInRange.flatMap((key) => logsMap.get(key) || [])
}
