<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue'
import { useAttendanceStore } from '@/stores/data/attendance';
import { useAttendanceCorrectionsStore } from '@/stores/data/attendanceCorrections';
import { storeToRefs } from 'pinia'
import CorrectionForm from '@/components/shared/CorrectionForm.vue';

const attendanceDataStore = useAttendanceStore()
const attendanceCorrectionDataStore = useAttendanceCorrectionsStore()


const { logs: attendanceLogs } = storeToRefs(attendanceDataStore)
const { corrections: attendanceCorrections } = storeToRefs(attendanceCorrectionDataStore)

const props = defineProps<{
  selectedUserId: string | null
}>()

const selectedDate = ref<string>(new Date().toISOString().slice(0, 10))

const showForm = ref(false)



const attendanceForDate = computed(() =>
  // dataStore.getAttendance(props.selectedUserId!, selectedDate.value, selectedDate.value)
  attendanceLogs.value.filter(log => log.user_id === props.selectedUserId && log.date === selectedDate.value)
)

const correctionsForDate = computed(() =>
  // dataStore.getCorrections(props.selectedUserId!, selectedDate.value, selectedDate.value)
  attendanceCorrections.value.filter(correction =>
    correction.staffId === props.selectedUserId && correction.date === selectedDate.value
  )
)

const combinedRecords = computed(() => {
  const seen = new Set<string>()

  const att = attendanceForDate.value.map(r => ({
    time: r.time,
    status: r.status,
    source: 'iClock'
  }))

  const cor = correctionsForDate.value.map(c => ({
    time: c.requestedTime,
    status: `${c.correctionType}`,
    source: c.status
  }))

  const merged = [...att, ...cor]

  const unique = merged.filter(item => {
    const key = `${item.time}-${item.status}-${item.source}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return unique.sort((a, b) => a.time.localeCompare(b.time))
})

const load = async () => {
  if (props.selectedUserId && selectedDate.value) {
    // await dataStore.loadAttendance(props.selectedUserId, selectedDate.value, selectedDate.value)
    await attendanceDataStore.loadAttendanceLogs(props.selectedUserId, selectedDate.value, selectedDate.value)
    // await dataStore.loadAttendanceCorrections(props.selectedUserId, selectedDate.value, selectedDate.value, true)
    await attendanceCorrectionDataStore.loadCorrections(props.selectedUserId, selectedDate.value, selectedDate.value)
  }
}



onMounted(load)
watch([() => props.selectedUserId, () => selectedDate.value], load)


// opens the form for this date
function openCorrectionForm() {
  showForm.value = true
}

</script>

<template>
  <div class="mt-4">
    <h2 class="text-lg font-semibold text-yellow-700 mb-2">Records Viewer</h2>
    <div class="flex items-center gap-4 mb-4">
      <div class="flex items-center">
        <label class="font-semibold mr-2">Select Date:</label>
        <input type="date" v-model="selectedDate" class="border px-2 py-1 rounded" />
      </div>
      <!-- 1. The “Apply Correction” button -->
      <button @click="openCorrectionForm" class="px-3 py-1 bg-blue-600 text-white rounded">
        Add Correction
      </button>
    </div>

    <div>
      <h3 class="font-bold mb-2">All Records</h3>
      <table class="table-auto w-full text-sm border">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-gray-300 px-2 py-1">Time</th>
            <th class="border border-gray-300 px-2 py-1">Type</th>
            <th class="border border-gray-300 px-2 py-1">Source</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rec in combinedRecords" :key="rec.time + rec.status + rec.source">
            <td class="border border-gray-300 px-2 py-1">{{ rec.time }}</td>
            <td class="border border-gray-300 px-2 py-1">{{ rec.status }}</td>
            <td class="border border-gray-300 px-2 py-1" :class="{
              'text-yellow-600': rec.source === 'pending',
              'text-red-600': rec.source === 'rejected',
              'text-green-600': rec.source === 'approved',
              'text-gray-500': rec.source === 'iClock'
            }">
              {{ rec.source === 'iClock' ? 'Attendance' : `Correction - ${rec.source}` }}
            </td>
          </tr>
          <tr v-if="combinedRecords.length === 0">
            <td colspan="3" class="border border-gray-300 px-2 py-2 text-center text-gray-500">No records found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. The modal form -->
    <CorrectionForm v-model:show="showForm" :staffId="props.selectedUserId" :startDate="selectedDate"
      :endDate="selectedDate" :date="selectedDate" />
  </div>
</template>
