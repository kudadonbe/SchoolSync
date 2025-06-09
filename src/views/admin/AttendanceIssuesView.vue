<script setup lang="ts">
// src/views/admin/AttendanceIssuesView.vue
import { ref, computed } from "vue";
import { useAuthStore } from '@/stores/authStore';
import { formatDateLocal, getCurrentWeek, getCurrentMonth, getCurrentYear, getPayablePeriod, getPaidPeriod, } from '@/utils'


import StaffInfo from '@/components/StaffInfo.vue';
import AttendanceIssues from '@/components/hr/attendance/AttendanceIssues.vue'
import AttendanceCorrectionLog from "@/components/hr/attendance/AttendanceCorrectionLog.vue";
import { useDataStore } from '@/stores/dataStore'

const authStore = useAuthStore()
const dataStore = useDataStore()

const staffId = computed(() => authStore.currentUser?.staffId ?? null)
const selectedUserId = ref(staffId.value)

// Handle staff selection
const updateUser = (userId: string) => {
  selectedUserId.value = userId
}

// Default to current week
const { start, end } = getCurrentWeek()
const startDate = ref(formatDateLocal(start))
const endDate = ref(formatDateLocal(end))

// Date range control functions
const today = new Date()
const setToday = () => {
  startDate.value = formatDateLocal(today)
  endDate.value = formatDateLocal(today)
}
const setCurrentWeek = () => {
  const { start, end } = getCurrentWeek()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}
const setCurrentMonth = () => {
  const { start, end } = getCurrentMonth()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}
const setCurrentYear = () => {
  const { start, end } = getCurrentYear()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}
const setPayablePeriod = () => {
  const { start, end } = getPayablePeriod()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}
const setPaidPeriod = () => {
  const { start, end } = getPaidPeriod()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}

// Manual data refresh
const refreshCorrections = async () => {
  if (!selectedUserId.value) return
  await dataStore.loadAttendanceCorrections(
    selectedUserId.value,
    startDate.value,
    endDate.value,
    true
  )
  console.log('✅ Corrections refreshed')
}

const btnMouseOver =
  'text-sm md:text-lg font-semibold text-gray-200 hover:text-white hover:bg-green-700 rounded-md px-4 py-2 transition-colors duration-200 ease-in-out'
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-3xl font-semibold text-rose-700 mb-6">Attendance Issues</h1>

    <!-- Staff Info -->
    <div class="grid grid-cols-1 md:grid-cols-7 gap-6 shadow-md rounded-lg">
      <div class="md:col-span-4">
        <StaffInfo :selectedUserId="selectedUserId" @updateUser="updateUser" />
      </div>
    </div>

    <!-- 🔘 Date Controls -->
    <div class="flex flex-wrap gap-2 mt-6">
      <!-- Hidden on mobile, visible on md+ -->
      <div class="hidden md:flex gap-2">
        <button @click="setToday" :class="btnMouseOver">Today</button>
        <button @click="setCurrentWeek" :class="btnMouseOver">Week</button>
        <button @click="setCurrentMonth" :class="btnMouseOver">Month</button>
        <button @click="setPaidPeriod" :class="btnMouseOver">Paid</button>
        <button @click="setPayablePeriod" :class="btnMouseOver">Payable</button>
        <button @click="setCurrentYear" :class="btnMouseOver">Year</button>
      </div>

      <div class="flex items-center gap-2">
        <label class="text-sm font-medium">From:</label>
        <input type="date" v-model="startDate" class="input" />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium">To:</label>
        <input type="date" v-model="endDate" class="input" />
      </div>
      <button @click="refreshCorrections" :class="btnMouseOver">Refresh</button>
    </div>

    <!-- Issues -->
    <div class="mt-6">
      <AttendanceIssues :selected-user-id="selectedUserId" :start-date="startDate" :end-date="endDate" />
    </div>

    <!-- Corrections -->
    <div class="mt-6">
      <AttendanceCorrectionLog :selected-user-id="selectedUserId" :start-date="startDate" :end-date="endDate" />
    </div>
  </div>
</template>
