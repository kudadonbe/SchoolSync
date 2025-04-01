/**
* ✅ Component: AttendanceSheetLive.vue
* 🧠 Description: Displays live attendance logs using Firestore and Pinia.
* - Listens to Firestore logs via onSnapshot()
* - Converts Firestore logs to display format using helper
* - Supports live updates for selected user
*/

<template>
  <div class="bg-white p-4 md:p-6 shadow-md rounded-lg mt-6">
    <div class="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-4">
      <h2 class="text-[10px] md:text-lg font-semibold text-green-700">ATTENDANCE</h2>
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

    <div class="overflow-x-auto">
      <table class="w-full table-auto border border-gray-200 text-[10px] md:text-sm">
        <thead class="bg-green-600 text-white text-[10px] md:text-sm">
          <tr>
            <th class="p-2 md:p-3 text-center">DATE</th>
            <th class="p-2 md:p-3 text-center hidden md:table-cell">DAY</th>
            <th class="p-2 md:p-3 text-center">IN</th>
            <th class="p-2 md:p-3 text-center">LATE</th>
            <th class="p-2 md:p-3 text-left">BREAKS</th>
            <th class="p-2 md:p-3 text-center">OUT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in recordToUI" :key="index" class="border-b border-gray-200">
            <td class="p-1 md:p-3 text-center">{{ record.date }}</td>
            <td class="p-1 md:p-3 text-left hidden md:table-cell">{{ record.day }}</td>
            <td class="p-1 md:p-3 text-center">{{ record.firstCheckIn || '--' }}</td>
            <td class="p-1 md:p-3 text-center text-red-700">{{ record.lateMinutes > 0 ? `${record.lateMinutes} min` : ''
              }}</td>
            <td class="p-1 md:p-3 text-left whitespace-normal">
              <span v-for="(b, i) in record.breaks" :key="i" class="inline-block px-1"
                :class="{ 'bg-red-100 text-red-700': b.missing }">
                {{ b.time }} {{ b.type }}
              </span>
            </td>
            <td class="p-1 md:p-3 text-center">{{ record.lastCheckOut || '--' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAttendanceStore } from '@/stores/attendanceStore'
import firestoreService from '@/services/db/firestoreService'
import { getPeriodKeyFromDate, getCurrentMonthRange, groupAttendanceByPeriod } from '@/utils/attendanceHelpers'
import { ensureStaffLogsInPeriod, hasLogsForDateRange, } from '@/utils/attendanceStoreHelpers'
import type { ProcessedAttendance } from '@/types'

const props = defineProps<{ selectedUserId: string }>()

// Date range (defaults to current OT period)
const { from, to } = getCurrentMonthRange()



const startDate = ref(from)
const endDate = ref(to)

const attendanceStore = useAttendanceStore()
const periodKey = getPeriodKeyFromDate(startDate.value)



onMounted(async () => {
  await ensureStaffLogsInPeriod(attendanceStore, periodKey, props.selectedUserId, {
    staffId: props.selectedUserId,
    from: startDate.value,
    to: endDate.value
  })
})

watch(
  () => [startDate.value, endDate.value, props.selectedUserId],
  async ([from, to, staffId]) => {
    if (!hasLogsForDateRange(attendanceStore.logsMap, staffId, from, to)) {
      console.log(`no logs for ${staffId} ${from} - ${to}`);
      const logs = await firestoreService.getAttendanceByQuery({ staffId, from, to })
      console.log(logs);
      const grouped = groupAttendanceByPeriod(logs)
      for (const [periodKey, logsForPeriod] of grouped.entries()) {
        attendanceStore.addLogsToPeriod(periodKey, logsForPeriod)
      }
    }
  }
)



const recordToUI: ProcessedAttendance[] = []
/*

while (currentDate <= end) {

}


const filteredRecords = computed<ProcessedAttendance[]>(() => {
  const rawLog = filterLogsForStaff(
    attendanceStore.getLogsForPeriod(periodKey),
    props.selectedUserId
  )
  console.log(`${periodKey} made from ${startDate.value}`);
  return rawLog.map(transformLogToBasicProcessed)
})

// */


</script>
