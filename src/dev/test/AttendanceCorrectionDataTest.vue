<template>
  <div class="p-4 rounded-xl border ">
    <h2 class="font-bold text-base">Attendance Correction Data Layer Test</h2>

    <div class="flex flex-col gap-2">
      <label>User ID: <input v-model="userId" class="input" /></label>
      <label>Start Date: <input type="date" v-model="start" class="input" /></label>
      <label>End Date: <input type="date" v-model="end" class="input" /></label>
    </div>

    <div class="flex gap-2">
      <button @click="load(false)" class="px-3 py-1 rounded bg-blue-600 text-white">Load</button>
      <button @click="load(true)" class="px-3 py-1 rounded bg-yellow-600 text-white">Force Load</button>
    </div>

    <div v-if="correction.length" class="bg-gray-100 p-2 rounded">
      <h3 class="font-semibold">Loaded Attendance ({{ correction.length }} records)</h3>
      <pre class="whitespace-pre-wrap text-xs">{{ correction }}</pre>
    </div>

    <div v-if="fetched" class="text-green-600">
      Last Fetched: {{ fetched }}
    </div>

    <!-- form -->
    <CorrectionFormDev :show="showForm" :staffId="userId" :startDate="start" :endDate="end"
      :date="correction[0]?.date || ''" :correction="correction[0]" @submitted="load" />
  </div>
</template>

<script setup lang="ts">
// src/dev/test/AttendanceDataTest.vue
import { ref, computed } from 'vue'
import { formatDateLocal } from '@/utils'
import { useAttendanceCorrectionsStore } from '@/stores/data/attendanceCorrections'
import CorrectionFormDev from '@/components/shared/CorrectionFormDev.vue'

const userId = ref('153') // or any test user
const start = ref(formatDateLocal(new Date(new Date().setDate(new Date().getDate() - 7)))) // 7 days ago
const end = ref(formatDateLocal(new Date())) // today

const showForm = ref(true)

const attendanceCorrectionStore = useAttendanceCorrectionsStore()

const correction = computed(() => attendanceCorrectionStore.corrections)
const fetched = computed(() => attendanceCorrectionStore.lastFetched[userId.value] ?? 'Never')

async function load(force = false) {
  await attendanceCorrectionStore.loadCorrections(userId.value, start.value, end.value, force)
}
</script>
