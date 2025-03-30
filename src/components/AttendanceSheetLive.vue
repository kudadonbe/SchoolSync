<template>
  <div class="bg-white p-4 md:p-6 shadow-md rounded-lg mt-6">
    <!-- Attendance Sheet Heading -->
    <div class="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-4">
      <h2 class="text-[10px] md:text-lg font-semibold text-green-700">ATTENDANCE</h2>

      <!-- Date Range Selection -->
      <div class="flex gap-2 md:gap-4 mt-2 md:mt-0">
        <div>
          <label class="text-[10px] md:text-lg font-semibold text-green-700">FROM: </label>
          <input type="date" v-model="startDate" class="p-1 md:p-2 text-[10px] md:text-lg font-semibold text-green-500">
        </div>
        <div>
          <label class="text-[10px] md:text-lg font-semibold text-green-700">TO: </label>
          <input type="date" v-model="endDate" class="p-1 md:p-2 text-[10px] md:text-lg font-semibold text-green-500">
        </div>
      </div>
    </div>

    <!-- Responsive Table Wrapper -->
    <div class="overflow-x-auto">
      <table class="w-full table-auto border border-gray-200 text-[10px] md:text-sm">
        <thead class="bg-green-600 text-white text-[10px] md:text-sm">
          <tr>
            <th class="p-2 md:p-3 text-center w-1/6 md:w-1/8">DATE</th>
            <th class="p-2 md:p-3 text-center w-1/6 md:w-1/8 hidden md:table-cell">DAY</th>
            <th class="p-2 md:p-3 text-center w-1/12 md:w-1/8">IN</th>
            <th class="p-2 md:p-3 text-center w-1/6 md:w-1/8">LATE</th>
            <th class="p-2 md:p-3 text-left w-1/4 md:w-auto">BREAKS</th>
            <th class="p-2 md:p-3 text-center w-1/12 md:w-1/8">OUT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in processedRecords" :key="index" class="border-b border-gray-200">
            <td class="p-1 md:p-3 text-center"
              :class="{ 'bg-gray-100 text-red-600': record.isWeekend || record.isHoliday }">{{ record.date }}</td>
            <td class="p-1 md:p-3 text-left hidden md:table-cell"
              :class="{ 'bg-gray-100 text-red-600': record.isWeekend || record.isHoliday }">{{ record.day }}</td>
            <td class="p-1 md:p-3 text-center"
              :class="{ 'bg-red-200 text-red-700': record.missingCheckIn, 'bg-gray-100': record.isWeekend || record.isHoliday }">
              {{ record.firstCheckIn || '--' }}</td>
            <td class="p-1 md:p-3 text-center text-red-700"
              :class="{ 'bg-gray-100': record.isWeekend || record.isHoliday }">
              {{ record.lateMinutes > 0 ? `${record.lateMinutes} min` : '' }}
            </td>
            <td class="p-1 md:p-3 text-left whitespace-normal"
              :class="{ 'bg-gray-100': record.isWeekend || record.isHoliday }">
              <span v-for="(b, i) in record.breaks" :key="i" class="inline-block px-1"
                :class="{ 'bg-red-100 text-red-700': b.missing }">
                {{ b.time }} {{ b.type }}
              </span>
            </td>
            <td class="p-1 md:p-3 text-center"
              :class="{ 'bg-red-200 text-red-700': record.missingCheckOut, 'bg-gray-100': record.isWeekend || record.isHoliday }">
              {{ record.lastCheckOut || '--' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ✅ Component: AttendanceSheetLive.vue
 * 🧠 Description: Live attendance sheet display based on real Firestore data.
 * Props: selectedUserId (string)
 * Fetches attendance logs from Firestore using Pinia store and real-time updates.
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAttendanceStore } from '@/stores/attendanceStore'
import firestoreService from '@/services/db/firestoreService'
import { getPeriodKeyFromDate } from '@/utils/attendanceHelpers'
import type { UploadedAttendanceRecord, ProcessedAttendance } from '@/types'

const props = defineProps<{ selectedUserId: string }>()

// 🔘 Date Range (default current month)
const startDate = ref(new Date().toISOString().slice(0, 10))
const endDate = ref(new Date().toISOString().slice(0, 10))

const attendanceStore = useAttendanceStore()
let unsubscribe: (() => void) | null = null

// 🧠 Period key (for monthly sync)
const periodKey = getPeriodKeyFromDate(new Date())

// 🔁 Live sync Firestore logs to Pinia store
onMounted(() => {
  unsubscribe = firestoreService.watchAttendanceByPeriod?.(
    periodKey,
    (logs) => attendanceStore.setLogsForPeriod(periodKey, logs),
    { staffId: props.selectedUserId }
  )
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
})

// 🧠 Transform logs to UI-friendly format (simplified version)
const processedRecords = computed<ProcessedAttendance[]>(() => {
  const rawLogs: UploadedAttendanceRecord[] = attendanceStore.getLogsForPeriod(periodKey).filter(
    (log) => log.staffId === props.selectedUserId
  )

  // ⏳ TODO: Replace with a real transformation helper (currently pass-through)
  return rawLogs.map((log) => ({
    date: log.timestamp.split('T')[0],
    day: new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
    firstCheckIn: log.status === 0 ? log.timestamp.split('T')[1].slice(0, 5) : '',
    lastCheckOut: log.status === 1 ? log.timestamp.split('T')[1].slice(0, 5) : '',
    breaks: [],
    lateMinutes: 0,
    isWeekend: false,
    isHoliday: false,
    missingCheckIn: false,
    missingCheckOut: false,
    lastBreakTimes: {
      'BREAK IN': null,
      'BREAK OUT': null,
    },
  }))
})
</script>
