// file: src/stores/data/attendanceCorrections.ts

import { attendanceCache } from '@/services/indexeddb/attendance'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AttendanceCorrectionLog } from '@/types'

import { formatDateLocal, mergeAttendanceCorrections } from '@/utils'

export const useAttendanceCorrectionsStore = defineStore(
  'attendanceCorrections',
  () => {
    // States
    const corrections = ref<AttendanceCorrectionLog[]>([])
    const loading = ref(false)
    const lastFetched = ref<Record<string, string>>({})

    // Actions

    const loadCorrections = async (staffId: string, start: string, end: string, force = false) => {
      loading.value = true

      const today = new Date()
      const from = new Date(start)
      const to = new Date(end)
      // Step 1: Cap future endDate to today
      const cappedEnd = to > today ? today : to
      const lastFetchedStr = lastFetched.value[staffId] || ''
      const lastFetchedDate = lastFetchedStr ? new Date(lastFetchedStr) : null
      const shouldFetch = force || !lastFetchedDate || cappedEnd > lastFetchedDate

      const local = await attendanceCache.getAttendanceCorrections(staffId, start, end)
      console.log('Loaded from IndexedDB:', local.length, 'corrections') // (DEBUG)

      if (shouldFetch) {
        let fetchStartDate = lastFetchedDate ? new Date(lastFetchedDate.getTime() - 86400000) : from
        if (force) fetchStartDate = from

        const freshData = await attendanceCache.getAttendanceCorrections(
          staffId,
          formatDateLocal(fetchStartDate),
          formatDateLocal(cappedEnd),
          shouldFetch, // this flag allows fallback to API
        )

        if (start === end) {
          // Special case: force-refresh for a single day
          const targetDate = start
          const other = corrections.value.filter((r) => r.date !== targetDate)
          corrections.value = [...other, ...freshData]
          console.log(`Patched corrections for ${targetDate}`)
        } else {
          const filteredLocal = local.filter(
            (c) => c.date < formatDateLocal(fetchStartDate) || c.date > formatDateLocal(cappedEnd),
          )
          const mergedData = mergeAttendanceCorrections(filteredLocal, freshData, start, end)
          corrections.value = mergedData
          console.log('Merged corrections:', mergedData.length)
        }

        lastFetched.value[staffId] = formatDateLocal(cappedEnd)
      } else {
        corrections.value = local.filter(
          (c) => c.date >= formatDateLocal(from) && c.date <= formatDateLocal(cappedEnd),
        )
      }

      loading.value = false
      return
    }

    const createCorrection = async (
      correction: AttendanceCorrectionLog,
    ): Promise<AttendanceCorrectionLog> => {
      const savedCorrection = await attendanceCache.createAttendanceCorrection(correction)
      corrections.value.push(savedCorrection)
      return savedCorrection
    }

    const updateCorrection = async (
      updated: AttendanceCorrectionLog,
    ): Promise<AttendanceCorrectionLog> => {
      const updatedCorrection = await attendanceCache.updateAttendanceCorrection(updated)
      const index = corrections.value.findIndex(
        (correction) => correction.id === updatedCorrection.id,
      )
      if (index !== -1) corrections.value[index] = updatedCorrection
      return updatedCorrection
    }

    const deleteCorrection = async (
      id: string,
    ): Promise<{ success: boolean; deleted?: AttendanceCorrectionLog }> => {
      // delete from api & indexedDB
      const result = await attendanceCache.deleteAttendanceCorrection(id)
      // if sucseed delete from state

      if (result.success && result.deleted?.id) {
        // Remove from state
        corrections.value = corrections.value.filter((c) => c.id !== result.deleted!.id)
        console.log(`[Pinia] Correction ${result.deleted.id} removed from state`)
      } else {
        console.warn('[Pinia] Deletion unsuccessful or no deleted object returned')
      }
      return result
    }

    return {
      corrections,
      loading,
      loadCorrections,
      createCorrection,
      updateCorrection,
      deleteCorrection,
      lastFetched,
    }
  },
  {
    persist: {
      storage: localStorage,
      pick: ['lastFetched', 'corrections'],
    },
  },
)
