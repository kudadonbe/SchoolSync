// src/stores/data/attendance.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'

import { attendanceCache } from '@/services/indexeddb/attendance'
import type { DisplayAttendanceRecord } from '@/types'

// import { convertToDisplayRecords } from '@/utils'
import { mergeAttendanceLogs, formatDateLocal } from '@/utils'
/**
 * Pinia store for managing attendance logs state
 */
export const useAttendanceStore = defineStore(
  'attendance',
  () => {
    // ===========================
    // State
    // ===========================
    const logs = ref<DisplayAttendanceRecord[]>([])
    const loading = ref(false)
    const lastFetched = ref<Record<string, string>>({})

    // ===========================
    // Actions
    // ===========================

    /**
     * Load attendance logs with IndexedDB → Firebase fallback
     */
    async function loadAttendanceLogs(userId: string, start: Date, end: Date, force = false) {
      loading.value = true

      const today = new Date()
      // Step 1: Cap future endDate to today
      const cappedEnd = end > today ? today : end
      const lastFetchedStr = lastFetched.value[userId] || ''
      const lastFetchedDate = lastFetchedStr ? new Date(lastFetchedStr) : null
      const shouldFetch = force || !lastFetchedDate || cappedEnd > lastFetchedDate

      // IndexedDB API usage:
      // TODO: Try loading from IndexedDB cache first
      const local = await attendanceCache.getAttendanceLogs(userId, start, cappedEnd)
      console.log('Loaded from IndexedDB:', local.length, 'records') // (DEBUG)

      if (shouldFetch) {
        let fetchStartDate = lastFetchedDate
          ? new Date(lastFetchedDate.getTime() - 86400000)
          : start
        if (force) fetchStartDate = start
        const forcedFetchedLogs = await attendanceCache.getAttendanceLogs(
          userId,
          fetchStartDate,
          cappedEnd,
          shouldFetch,
        )
        console.log('Force fetched from IndexedDB:', forcedFetchedLogs.length, 'records') // (DEBUG)
        logs.value = mergeAttendanceLogs(local, forcedFetchedLogs)
        lastFetched.value[userId] = formatDateLocal(cappedEnd)
        console.log('Last fetched date updated:', lastFetched.value[userId]) // (DEBUG)
        loading.value = false
        return
      }
      logs.value = local
      loading.value = false
    }

    return {
      // State
      logs,
      loading,
      lastFetched,
      // Actions
      loadAttendanceLogs,
    }
  },
  {
    persist: {
      storage: localStorage,
      pick: ['logs', 'lastFetched'],
    },
  },
)
