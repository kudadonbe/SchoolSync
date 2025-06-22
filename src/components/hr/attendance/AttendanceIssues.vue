<script setup lang="ts">
// src/components/AttendanceIssues.vue
import { computed, onMounted, watch, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAttendanceStore } from '@/stores/data/attendance';
import { useAttendanceCorrectionsStore } from '@/stores/data/attendanceCorrections';

import type { DisplayAttendanceRecord } from '@/types'
import { formatDateDDMMYYYY, cleanDisplayAttendanceLogs, sortPunchRecords } from '@/utils'
import CorrectionForm from '@/components/shared/CorrectionForm.vue'


const { selectedUserId, startDate, endDate } = defineProps<{
  selectedUserId: string | null
  startDate: string
  endDate: string
}>()

interface DaySummary {
  date: string
  weekday: string
  records: string[]
  issues: string[]
}

const showForm = ref(false)
const formDate = ref('')

const attendanceDataStore = useAttendanceStore()
const attendanceCorrectionDataStore = useAttendanceCorrectionsStore()

const { logs: attendanceLogs } = storeToRefs(attendanceDataStore)
const { corrections: attendanceCorrections } = storeToRefs(attendanceCorrectionDataStore)


const allCorrections = computed(() =>
  Object.values(attendanceCorrections.value).flat()
)

async function load() {
  if (!selectedUserId) return
  // await dataStore.loadAttendance(selectedUserId, startDate, endDate)
  // await dataStore.loadAttendanceCorrections(selectedUserId, startDate, endDate)
  await attendanceDataStore.loadAttendanceLogs(selectedUserId as string, startDate, endDate)
  // console.log('[Debug] Loaded Logs:', attendanceDataStore.logs)
  await attendanceCorrectionDataStore.loadCorrections(selectedUserId as string, startDate, endDate)
}

onMounted(load)

watch(
  [() => selectedUserId, () => startDate, () => endDate],
  load
)

function hasCorrection(date: string, type: string) {
  return allCorrections.value.some(c =>
    c.staffId === selectedUserId &&
    c.date === date &&
    c.correctionType === type
  )
}

function openCorrectionForm(date: string) {
  formDate.value = date
  showForm.value = true
}


const allAttendanceRecords = computed(() =>
  Object.values(attendanceLogs.value).flat()
)

const groupedByDate = computed<DaySummary[]>(() => {
  if (!selectedUserId) return []

  // Filter raw records and corrections
  const raw = allAttendanceRecords.value.filter(r =>
    r.user_id === selectedUserId &&
    r.date >= startDate &&
    r.date <= endDate
  )
  const corrections = allCorrections.value.filter(c =>
    c.staffId === selectedUserId &&
    c.date >= startDate &&
    c.date <= endDate
  )

  // Clean and sort records with threshold of 2 minutes
  const { iClockLog, correctionLog } = cleanDisplayAttendanceLogs(raw, corrections, 10, false, false)
  const records = sortPunchRecords([...iClockLog, ...correctionLog])

  // Group records by date
  const mapByDate = new Map<string, DisplayAttendanceRecord[]>()
  records.forEach(r => {
    if (!mapByDate.has(r.date)) mapByDate.set(r.date, [])
    mapByDate.get(r.date)!.push(r)
  })

  const summaries: DaySummary[] = []
  mapByDate.forEach((recs, date) => {
    const recSummary = [...new Set(recs.map(r => `${r.time} - ${r.status}`))]
    const issues: string[] = []

    const hasIn = recs.some(r => r.status === 'CHECK IN')
    if (!hasIn && !hasCorrection(date, 'checkIn')) {
      issues.push('Missing Check-In')
    }

    const hasOut = recs.some(r => r.status === 'CHECK OUT')
    if (!hasOut && !hasCorrection(date, 'checkOut')) {
      issues.push('Missing Check-Out')
    }

    const inCount = recs.filter(r => r.status === 'BREAK IN').length
    const outCount = recs.filter(r => r.status === 'BREAK OUT').length

    const hasBreakInCorrection = hasCorrection(date, 'breakIn')
    const hasBreakOutCorrection = hasCorrection(date, 'breakOut')

    if (inCount > outCount && !hasBreakOutCorrection) {
      issues.push('Missing Break-Out')
    } else if (outCount > inCount && !hasBreakInCorrection) {
      issues.push('Missing Break-In')
    }


    if (issues.length) {
      summaries.push({
        date,
        weekday: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        records: recSummary,
        issues,
      })
    }
  })

  return summaries.sort((b, a) => new Date(b.date).getTime() - new Date(a.date).getTime())
})
</script>

<template>
  <div class="bg-white p-4 md:p-6 shadow-md rounded-lg mt-6">
    <div class="flex flex-col md:flex-row justify-between items-center mb-4">
      <h2 class="text-xs md:text-lg font-semibold text-green-700">ATTENDANCE ISSUES</h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full table-auto border border-gray-300 text-[10px] md:text-sm">
        <thead class="bg-green-600 text-white">
          <tr>
            <th class="p-2 text-center w-20 md:w-24">DATE</th>
            <th class="p-2 text-center hidden md:table-cell w-24">DAY</th>
            <th class="p-2 text-center w-32 md:w-auto">RECORDS</th>
            <th class="p-2 text-center w-32 md:w-auto">ISSUES</th>
            <th class="p-2 text-center w-20">ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in groupedByDate" :key="item.date" class="border-b border-gray-200">
            <td class="p-1 text-center font-semibold">
              {{ formatDateDDMMYYYY(item.date) }}
            </td>
            <td class="p-1 text-center hidden md:table-cell">
              {{ item.weekday }}
            </td>
            <td class="p-1 text-left">
              <ul>
                <li v-for="r in item.records" :key="r">{{ r }}</li>
              </ul>
            </td>
            <td class="p-1 text-left text-red-600">
              <ul class="list-disc ml-4">
                <li v-for="i in item.issues" :key="i">{{ i }}</li>
              </ul>
            </td>
            <td class="p-1 text-center">
              <button @click="openCorrectionForm(item.date)" class="mb-2 px-3 py-1 bg-blue-600 text-white rounded">
                Apply
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <CorrectionForm v-model:show="showForm" :staffId="selectedUserId" :startDate="startDate" :endDate="endDate"
      :date="formDate" />
  </div>
</template>
