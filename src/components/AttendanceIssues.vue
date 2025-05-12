<script setup lang="ts">
// src/components/AttendanceIssues.vue
import { computed, onMounted, watch, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '@/stores/dataStore'
import type { DisplayAttendanceRecord } from '@/types'
import { submitAttendanceCorrection } from '@/services/firebaseServices'


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
const selectedIssue = ref('')
const correctionType = ref('')
const correctionTime = ref('')
const correctionReason = ref('')

const dataStore = useDataStore()
const { attendanceCache, attendanceCorrectionCache } = storeToRefs(dataStore)

const allCorrections = computed(() => Object.values(attendanceCorrectionCache.value).flat())

const load = async () => {
  if (props.selectedUserId) {
    await dataStore.loadAttendance(props.selectedUserId, props.startDate, props.endDate)
    await dataStore.loadAttendanceCorrections(props.selectedUserId, props.startDate, props.endDate)
  }
}

onMounted(load)

watch(
  [() => props.selectedUserId, () => props.startDate, () => props.endDate],
  load
)

function hasCorrection(userId: string, date: string, type: string) {
  return allCorrections.value.some(c =>
    c &&
    c.staffId === userId &&
    c.date === date &&
    c.status === 'approved' &&
    c.correctionType === type
  )
}

function getCorrections(userId: string, date: string): string[] {
  return allCorrections.value
    .filter(c =>
      c &&
      c.staffId === userId &&
      c.date === date &&
      c.status !== 'approved'
    )
    .map(c => `CORRECTION - ${c.status} - (${c.correctionType} @ ${c.requestedTime})  - ${c.reason}`)
}

function getWeekday(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
}

function deduplicatePunches(punches: DisplayAttendanceRecord[], thresholdMinutes = 5) {
  const result: DisplayAttendanceRecord[] = []
  for (let i = 0; i < punches.length; i++) {
    const current = punches[i]
    const previous = result[result.length - 1]
    if (
      !previous ||
      previous.status !== current.status ||
      new Date(`1970-01-01T${current.time}Z`).getTime() - new Date(`1970-01-01T${previous.time}Z`).getTime() > thresholdMinutes * 60000
    ) {
      result.push(current)
    }
  }
  return result
}

function openCorrectionForm(date: string, issue: string) {
  selectedDate.value = date
  selectedIssue.value = issue
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

    alert('✅ Correction submitted successfully.')
    showForm.value = false
    await dataStore.loadAttendanceCorrections(props.selectedUserId, props.startDate, props.endDate)
  } catch (err) {
    console.error('❌ Failed to submit correction:', err)
    alert('Failed to submit correction. Please try again.')
  }
}


const allAttendanceRecords = computed(() => Object.values(attendanceCache.value).flat())

const groupedByDate = computed(() => {
  if (!props.selectedUserId) return []

  const filtered = allAttendanceRecords.value.filter(r =>
    r.user_id === props.selectedUserId &&
    r.date >= props.startDate &&
    r.date <= props.endDate
  )

  const byDate: Record<string, DisplayAttendanceRecord[]> = {}

  for (const rec of filtered) {
    if (!byDate[rec.date]) byDate[rec.date] = []
    byDate[rec.date].push(rec)
  }

  const summaries: DaySummary[] = []

  for (const [date, records] of Object.entries(byDate)) {
    const sorted = records.sort((a, b) => a.time.localeCompare(b.time))
    const recordSummary = [...new Set(sorted.map(r => `${r.status} @ ${r.time}`))]
    const issues: string[] = []

    const checkIn = sorted.some(r => r.status === 'CHECK IN')
    const checkOut = sorted.some(r => r.status === 'CHECK OUT')

    if (!checkIn && !hasCorrection(props.selectedUserId, date, 'checkIn')) {
      issues.push('Missing Check-In')
    }
    if (!checkOut && !hasCorrection(props.selectedUserId, date, 'checkOut')) {
      issues.push('Missing Check-Out')
    }

    const allBreaks = sorted.filter(r => r.status === 'BREAK IN' || r.status === 'BREAK OUT')
    const deduped = deduplicatePunches(allBreaks)

    for (let i = 0; i < deduped.length; i += 2) {
      const first = deduped[i]
      const second = deduped[i + 1]

      const expectedMissing = first.status === 'BREAK IN' ? 'BREAK OUT' : 'BREAK IN'
      const correctionType = expectedMissing === 'BREAK IN' ? 'breakIn' : 'breakOut'

      if (!second || first.status === second.status) {
        if (!hasCorrection(props.selectedUserId, date, correctionType)) {
          issues.push(`${first.status} at ${first.time}, ${expectedMissing} Missing`)
        }
      }
    }


    const correctionNotes = [...new Set(getCorrections(props.selectedUserId, date))]
    issues.push(...correctionNotes)

    if (issues.length > 0) {
      summaries.push({
        date,
        weekday: getWeekday(date),
        records: recordSummary,
        issues,
      })
    }
  }

  return summaries.sort((b, a) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

</script>
<template>
  <div>
    <h2 class="text-xl font-bold mb-4">📅 Attendance Issue Summary</h2>
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
          <td class="border px-2 py-1 align-top">{{ item.date }}</td>
          <td class="border px-2 py-1 align-top">{{ item.weekday }}</td>
          <td class="border px-2 py-1 align-top">
            <ul>
              <li v-for="r in item.records" :key="r">{{ r }}</li>
            </ul>
          </td>
          <td class="border px-2 py-1 align-top text-red-600">
            <ul>
              <li v-for="i in item.issues" :key="i" :class="{
  'text-yellow-600': i.includes('pending'),
  'text-red-700': i.includes('rejected'),
  'text-red-600': !i.includes('CORRECTION') && !i.includes('pending') && !i.includes('rejected')
}">{{ i }}</li>
            </ul>
          </td>
          <td class="border px-2 py-1 align-top">
            <ul>
              <li v-for="i in item.issues" :key="i">
                <button
                  v-if="!i.includes('CORRECTION')"
                  @click="openCorrectionForm(item.date, i)"
                  class="text-blue-600 underline hover:text-blue-800"
                >
                  Apply
                </button>
              </li>
            </ul>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

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
      <button @click="submitCorrection" class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>
    </div>
  </div>
</div>

</template>
