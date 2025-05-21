<script setup lang="ts">
// src/components/AttendanceIssues.vue
import { computed, onMounted, watch, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '@/stores/dataStore'
import type { DisplayAttendanceRecord } from '@/types'
import { submitAttendanceCorrection } from '@/services/firebaseServices'
import { formatDateDDMMYYYY, cleanDisplayAttendanceLogs, sortPunchRecords } from '@/utils'

const props = defineProps<{
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
const selectedDate = ref('')
const correctionType = ref('')
const correctionTime = ref('')
const correctionReason = ref('')

const dataStore = useDataStore()
const { attendanceCache, attendanceCorrectionCache } = storeToRefs(dataStore)

const allCorrections = computed(() =>
  Object.values(attendanceCorrectionCache.value).flat()
)

async function load() {
  if (!props.selectedUserId) return
  await dataStore.loadAttendance(props.selectedUserId, props.startDate, props.endDate)
  await dataStore.loadAttendanceCorrections(props.selectedUserId, props.startDate, props.endDate)
}

onMounted(load)

watch(
  [() => props.selectedUserId, () => props.startDate, () => props.endDate],
  load
)

function hasCorrection(date: string, type: string) {
  return allCorrections.value.some(c =>
    c.staffId === props.selectedUserId &&
    c.date === date &&
    c.correctionType === type
  )
}

function openCorrectionForm(date: string) {
  selectedDate.value = date
  showForm.value = true
  correctionType.value = ''
  correctionTime.value = ''
  correctionReason.value = ''
}

async function submitCorrection() {
  if (!props.selectedUserId || !correctionType.value || !correctionTime.value || !correctionReason.value) {
    alert('Please fill all fields before submitting.')
    return
  }
  try {
    await submitAttendanceCorrection({
      staffId: props.selectedUserId,
      date: selectedDate.value,
      correctionType: correctionType.value,
      requestedTime: correctionTime.value,
      reason: correctionReason.value,
    })
    showForm.value = false
    await dataStore.loadAttendanceCorrections(props.selectedUserId, props.startDate, props.endDate)
  } catch (err) {
    console.error('❌ Failed to submit correction:', err)
    alert('Failed to submit correction. Please try again.')
  }
}

const allAttendanceRecords = computed(() =>
  Object.values(attendanceCache.value).flat()
)

const groupedByDate = computed<DaySummary[]>(() => {
  if (!props.selectedUserId) return []

  // Filter raw records and corrections
  const raw = allAttendanceRecords.value.filter(r =>
    r.user_id === props.selectedUserId &&
    r.date >= props.startDate &&
    r.date <= props.endDate
  )
  const corrections = allCorrections.value.filter(c =>
    c.staffId === props.selectedUserId &&
    c.date >= props.startDate &&
    c.date <= props.endDate
  )

  // Clean and sort records with threshold of 60 minutes
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
                <button @click="openCorrectionForm(item.date)"
                  class="text-blue-600 underline hover:text-blue-800">
                  Apply
                </button>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showForm" class="fixed inset-0 bg-green-500/40 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">Apply for Correction</h3>
        <div class="mb-2">
          <label class="block text-sm font-medium">Date</label>
          <input type="text" v-model="selectedDate" disabled class="border rounded px-2 py-1 w-full bg-gray-100" />
        </div>
        <div class="mb-2">
          <label class="block text-sm font-medium">Correction Type</label>
          <select v-model="correctionType" class="border rounded px-2 py-1 w-full">
            <option disabled value="">-- Select --</option>
            <option value="checkIn">Check-In</option>
            <option value="checkOut">Check-Out</option>
            <option value="breakIn">Break-In</option>
            <option value="breakOut">Break-Out</option>
          </select>
        </div>
        <div class="mb-2">
          <label class="block text-sm font-medium">Correct Time</label>
          <input type="time" v-model="correctionTime" class="border rounded px-2 py-1 w-full" />
        </div>
        <div class="mb-2">
          <label class="block text-sm font-medium">Reason</label>
          <textarea v-model="correctionReason" rows="2" class="border rounded px-2 py-1 w-full"></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="showForm = false" class="px-4 py-1 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
          <button @click="submitCorrection"
            class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>
        </div>
      </div>
    </div>
  </div>
</template>
