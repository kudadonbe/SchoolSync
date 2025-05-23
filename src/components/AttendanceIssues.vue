<script setup lang="ts">
// src/components/AttendanceIssues.vue
import { computed, onMounted, watch, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '@/stores/dataStore'
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


const dataStore = useDataStore()
const { attendanceCache, attendanceCorrectionCache } = storeToRefs(dataStore)

const allCorrections = computed(() =>
  Object.values(attendanceCorrectionCache.value).flat()
)

async function load() {
  if (!selectedUserId) return
  await dataStore.loadAttendance(selectedUserId, startDate, endDate)
  await dataStore.loadAttendanceCorrections(selectedUserId, startDate, endDate)
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
  Object.values(attendanceCache.value).flat()
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
  const { iClockLog, correctionLog } = cleanDisplayAttendanceLogs(raw, corrections, 2)
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

    // Break pairing check: ensure equal counts or skip if a correction covers it
    const inCount = recs.filter(r => r.status === 'BREAK IN').length
    const outCount = recs.filter(r => r.status === 'BREAK OUT').length
    if (inCount !== outCount && !hasCorrection(date, 'breakIn') && !hasCorrection(date, 'breakOut')) {
      issues.push('Unpaired Break Punch')
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
  <div>
    <h2 class="text-xl font-bold mb-4">📅 Attendance Issues</h2>
    <table class="table-auto w-full text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-2 py-1">Date</th>
          <th class="border px-2 py-1">Day</th>
          <th class="border px-2 py-1">Records</th>
          <th class="border px-2 py-1">Issues</th>
          <th class="border px-2 py-1">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in groupedByDate" :key="item.date">
          <td class="border px-2 py-1 align-top">{{ formatDateDDMMYYYY(item.date) }}</td>
          <td class="border px-2 py-1 align-top">{{ item.weekday }}</td>
          <td class="border px-2 py-1 align-top">
            <ul>
              <li v-for="r in item.records" :key="r">{{ r }}</li>
            </ul>
          </td>
          <td class="border px-2 py-1 align-top text-red-600">
            <ul>
              <li v-for="i in item.issues" :key="i">{{ i }}</li>
            </ul>
          </td>
          <td class="border px-2 py-1 align-top">
            <ul>
              <li v-for="i in item.issues" :key="i">
                <button @click="openCorrectionForm(item.date)" class="text-blue-600 underline hover:text-blue-800">
                  Apply
                </button>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </table>
    <CorrectionForm v-model:show="showForm" :staffId="selectedUserId" :startDate="startDate" :endDate="endDate"
      :date="formDate" />
  </div>
</template>
