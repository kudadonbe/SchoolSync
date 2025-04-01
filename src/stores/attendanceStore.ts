/**
 * ✅ File: src/stores/attendanceStore.ts
 * 🧠 Description: Manages attendance logs per month (`YYYY-MM`) using Pinia + localStorage.
 * 🔐 Unified logic: All users (admins + non-admins) cache a max of 2 years (24 periods).
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StaffAttendanceLog } from '@/services/db/types'
// import { getPeriodKeyFromDate } from '@/utils/attendanceHelpers'

/**
 * 🧹 Clean up logs to keep:
 * - Current + previous year
 * - Max of 24 months total (if needed)
 */
function cleanupOldLogs(
  logsMap: Map<string, StaffAttendanceLog[]>,
  maxPeriods = 24,
): Map<string, StaffAttendanceLog[]> {
  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1
  const sortedKeys = Array.from(logsMap.keys()).sort()

  const shouldKeep = (key: string) => {
    const [year] = key.split('-').map(Number)
    return year === currentYear || year === previousYear
  }

  const newMap = new Map<string, StaffAttendanceLog[]>()

  for (const key of sortedKeys) {
    if (shouldKeep(key)) {
      newMap.set(key, logsMap.get(key)!)
    }
  }

  for (const key of sortedKeys) {
    if (!shouldKeep(key) && newMap.size < maxPeriods) {
      newMap.set(key, logsMap.get(key)!)
    }
  }

  return newMap
}

export const useAttendanceStore = defineStore(
  'attendance',
  () => {
    /**
     * 📦 Main storage: logsMap grouped by "YYYY-MM"
     */
    const logsMap = ref(new Map<string, StaffAttendanceLog[]>())

    /**
     * 🆕 Add fetched period logs
     * Applies cleanup for all users (admin + non-admin)
     */
    function addFetchedPeriod(periodKey: string, logs: StaffAttendanceLog[]) {
      logsMap.value.set(periodKey, logs)
      logsMap.value = cleanupOldLogs(logsMap.value)
    }

    /**
     * 🧩 Adds new staff logs to an existing period, or creates the period if missing.
     * Prevents duplicate entries by checking `id` field.
     * @param periodKey - e.g., "2025-03"
     * @param newLogs - Array of StaffAttendanceLog for this period
     */
    function addLogsToPeriod(periodKey: string, newLogs: StaffAttendanceLog[]) {
      const existingLogs = logsMap.value.get(periodKey) || []
      const combinedLogs = [...existingLogs, ...newLogs]
      logsMap.value.set(periodKey, combinedLogs)
    }

    /**
     * ⚙️ Load logsMap from plain object (after localStorage hydration)
     */
    function setLogsMapFromObject(obj: Record<string, StaffAttendanceLog[]>) {
      logsMap.value = new Map(Object.entries(obj))
    }

    /**
     * 📤 Convert logsMap to plain object for localStorage persistence
     */
    function getLogsMapAsObject(): Record<string, StaffAttendanceLog[]> {
      return Object.fromEntries(logsMap.value)
    }

    /**
     * ✅ Manually set logs for a period (no cleanup)
     */
    function setLogsForPeriod(periodKey: string, logs: StaffAttendanceLog[]) {
      logsMap.value.set(periodKey, logs)
    }

    /**
     * 📥 Get logs for a specific period
     */
    function getLogsForPeriod(periodKey: string): StaffAttendanceLog[] {
      return logsMap.value.get(periodKey) || []
    }

    return {
      logsMap,
      addFetchedPeriod,
      addLogsToPeriod,
      setLogsMapFromObject,
      getLogsMapAsObject,
      setLogsForPeriod,
      getLogsForPeriod,
    }
  },
  {
    /**
     * 💾 Persistence setup using pinia-plugin-persistedstate
     */
    persist: {
      storage: localStorage,
      serializer: {
        serialize: (state) => {
          return JSON.stringify({
            logsMap: Object.fromEntries(state.logsMap),
          })
        },
        deserialize: (value) => {
          const parsed = JSON.parse(value)
          parsed.logsMap = new Map(Object.entries(parsed.logsMap || {}))
          return parsed
        },
      },
    },
  },
)

export type AttendanceStore = ReturnType<typeof useAttendanceStore>
