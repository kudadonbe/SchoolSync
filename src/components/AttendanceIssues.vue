<script setup lang="ts">
// src/components/AttendanceIssues.vue
import { computed, onMounted, watch, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '@/stores/dataStore'
import type { DisplayAttendanceRecord } from '@/types'

const props = defineProps<{ selectedUserId: string | null }>()

interface DaySummary {
  date: string
  weekday: string
  records: string[]
  issues: string[]
}

const dataStore = useDataStore()
const { attendanceCache, attendanceCorrectionCache } = storeToRefs(dataStore)

const startDate = ref('2024-01-01')
const endDate = ref(new Date().toISOString().slice(0, 10))

const allCorrections = computed(() => Object.values(attendanceCorrectionCache.value).flat().filter(Boolean))

const load = async () => {
  if (props.selectedUserId) {
    await dataStore.loadAttendance(props.selectedUserId, startDate.value, endDate.value)
    await dataStore.loadAttendanceCorrections(props.selectedUserId, startDate.value, endDate.value)
  }
}

onMounted(() => {
  load()
})

watch([() => props.selectedUserId, startDate, endDate], load)

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
    c.staffId === userId && c.date === date && c.status !== 'approved')
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

const allAttendanceRecords = computed(() => {
  return Object.values(attendanceCache.value).flat()
})

const groupedByDate = computed(() => {
  if (!props.selectedUserId) return []

  const filtered = allAttendanceRecords.value.filter(r => r.user_id === props.selectedUserId)
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
      const expected = first.status === 'BREAK IN' ? 'breakOut' : 'breakIn'
      const isCorrected = hasCorrection(props.selectedUserId, date, expected)

      if (!second && !isCorrected) {
        issues.push(`${first.status} at ${first.time}, ${expected === 'breakIn' ? 'BREAK IN' : 'BREAK OUT'} Missing`)
      } else if (first.status === second.status && !isCorrected) {
        issues.push(`${first.status} at ${first.time}, ${expected === 'breakIn' ? 'BREAK IN' : 'BREAK OUT'} Missing`)
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
        </tr>
      </tbody>
    </table>
  </div>
</template>
