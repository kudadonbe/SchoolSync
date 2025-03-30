/**
 * ✅ File: src/stores/attendanceStore.ts
 * 🧠 Description: Manages attendance logs per month (`YYYY-MM`) using Pinia + localStorage.
 * 🔐 Unified logic: All users (admins + non-admins) cache a max of 2 years (24 periods).
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UploadedAttendanceRecord } from '@/services/db/types'
// import { getPeriodKeyFromDate } from '@/utils/attendanceHelpers'

/**
 * 🧹 Clean up logs to keep:
 * - Current + previous year
 * - Max of 24 months total (if needed)
 */
function cleanupOldLogs(
  logsMap: Map<string, UploadedAttendanceRecord[]>,
  maxPeriods = 24,
): Map<string, UploadedAttendanceRecord[]> {
  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1
  const sortedKeys = Array.from(logsMap.keys()).sort()

  const shouldKeep = (key: string) => {
    const [year] = key.split('-').map(Number)
    return year === currentYear || year === previousYear
  }

  const newMap = new Map<string, UploadedAttendanceRecord[]>()

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
    const logsMap = ref(new Map<string, UploadedAttendanceRecord[]>())

    /**
     * 🆕 Add fetched period logs
     * Applies cleanup for all users (admin + non-admin)
     */
    function addFetchedPeriod(periodKey: string, logs: UploadedAttendanceRecord[]) {
      logsMap.value.set(periodKey, logs)
      logsMap.value = cleanupOldLogs(logsMap.value)
    }

    /**
     * ⚙️ Load logsMap from plain object (after localStorage hydration)
     */
    function setLogsMapFromObject(obj: Record<string, UploadedAttendanceRecord[]>) {
      logsMap.value = new Map(Object.entries(obj))
    }

    /**
     * 📤 Convert logsMap to plain object for localStorage persistence
     */
    function getLogsMapAsObject(): Record<string, UploadedAttendanceRecord[]> {
      return Object.fromEntries(logsMap.value)
    }

    /**
     * ✅ Manually set logs for a period (no cleanup)
     */
    function setLogsForPeriod(periodKey: string, logs: UploadedAttendanceRecord[]) {
      logsMap.value.set(periodKey, logs)
    }

    /**
     * 📥 Get logs for a specific period
     */
    function getLogsForPeriod(periodKey: string): UploadedAttendanceRecord[] {
      return logsMap.value.get(periodKey) || []
    }

    return {
      logsMap,
      addFetchedPeriod,
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
