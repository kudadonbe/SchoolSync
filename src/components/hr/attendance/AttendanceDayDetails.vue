<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import CorrectionForm from '@/components/shared/CorrectionForm.vue';

const props = defineProps<{
  selectedUserId: string | null
}>()

const selectedDate = ref<string>(new Date().toISOString().slice(0, 10))

const showForm = ref(false)


const dataStore = useDataStore()

const attendanceForDate = computed(() =>
  dataStore.getAttendance(props.selectedUserId!, selectedDate.value, selectedDate.value)
)

const correctionsForDate = computed(() =>
  dataStore.getCorrections(props.selectedUserId!, selectedDate.value, selectedDate.value)
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
    status: `${c.correctionType} (Correction Log)`,
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
    await dataStore.loadAttendance(props.selectedUserId, selectedDate.value, selectedDate.value)
    await dataStore.loadAttendanceCorrections(props.selectedUserId, selectedDate.value, selectedDate.value, true)
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
    <h2 class="text-lg font-semibold mb-2">Records Viewer</h2>

    <div class="mb-4">
      <label class="font-semibold mr-2">Select Date:</label>
      <input type="date" v-model="selectedDate" class="border px-2 py-1 rounded" />
    </div>

    <div>
      <h3 class="font-bold mb-2">All Records (Attendance + Corrections)</h3>
      <table class="table-auto w-full text-sm border">
        <thead>
          <tr class="bg-gray-100">
            <th class="border px-2 py-1">Time</th>
            <th class="border px-2 py-1">Status</th>
            <th class="border px-2 py-1">Source</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rec in combinedRecords" :key="rec.time + rec.status + rec.source">
            <td class="border px-2 py-1">{{ rec.time }}</td>
            <td class="border px-2 py-1">{{ rec.status }}</td>
            <td class="border px-2 py-1" :class="{
              'text-yellow-600': rec.source === 'pending',
              'text-red-600': rec.source === 'rejected',
              'text-green-600': rec.source === 'approved',
              'text-gray-500': rec.source === 'iClock'
            }">
              {{ rec.source === 'iClock' ? 'Attendance' : rec.source }}
            </td>
          </tr>
          <tr v-if="combinedRecords.length === 0">
            <td colspan="3" class="border px-2 py-2 text-center text-gray-500">No records found</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 1. The “Apply Correction” button -->
    <div class="mt-4 flex justify-end">
      <button @click="openCorrectionForm" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Apply Correction
      </button>
    </div>

    <!-- 2. The modal form -->
    <CorrectionForm v-model:show="showForm" :staffId="props.selectedUserId" :startDate="selectedDate"
      :endDate="selectedDate" :date="selectedDate" />
  </div>
</template>
