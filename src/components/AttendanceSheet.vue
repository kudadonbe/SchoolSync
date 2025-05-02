<script setup lang="ts">
// src/components/StaffAttendance.vue
import { ref, computed, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDataStore } from "@/stores/dataStore"; // ✅ Pinia store
import {
  getScheduledInTime, getScheduledOutTime,
  normalizePunchStatus,
  calculateLateMinutes,
  isHoliday,
  toMinutes,
  sortPunchRecords,
  newAttendanceRecord,
  formatDateLocal,
  getCurrentWeek, getCurrentMonth, getCurrentYear, getPayablePeriod, getPaidPeriod
} from "@/utils";
import type { ProcessedAttendance, } from "@/types"
// ✅ Get data from Pinia store

const dataStore = useDataStore()

const { staffList, dutyRoster, attendancePolicies } = storeToRefs(dataStore);

const props = defineProps<{ selectedUserId: string | null }>();
const today = new Date();


// ✅ Date range filters
const startDate = ref(formatDateLocal(today));
const endDate = ref(formatDateLocal(today));


const setToday = () => {
  startDate.value = formatDateLocal(today);
  endDate.value = formatDateLocal(today);
}

const setCurrentWeek = () => {
  const { start, end } = getCurrentWeek()
  startDate.value = formatDateLocal(start);
  endDate.value = formatDateLocal(end);
}

const setCurrentMonth = () => {
  const { start, end } = getCurrentMonth()
  startDate.value = formatDateLocal(start);
  endDate.value = formatDateLocal(end);
}

const setCurrentYear = () => {
  const { start, end } = getCurrentYear()
  startDate.value = formatDateLocal(start);
  endDate.value = formatDateLocal(end);
}

const setPayablePeriod = () => {
  const { start, end } = getPayablePeriod()
  startDate.value = formatDateLocal(start);
  endDate.value = formatDateLocal(end);
}

const setPaidPeriod = () => {
  const { start, end } = getPaidPeriod()
  startDate.value = formatDateLocal(start);
  endDate.value = formatDateLocal(end);
}


const attendanceRecords = computed(() =>
  dataStore.getAttendance(props.selectedUserId as string, startDate.value, endDate.value)
);

const load = async () => {
  await dataStore.loadAttendance(props.selectedUserId as string, startDate.value, endDate.value);
}

onMounted(load)
watch([() => props.selectedUserId, startDate, endDate], load);

const threshold = attendancePolicies.value.punch.duplicate_threshold_minutes;


// ✅ Compute Attendance for Selected User with Date Filtering
const filteredRecords = computed<ProcessedAttendance[]>(() => {

  const recordsMap = new Map<string, ProcessedAttendance>();

  // Filter records for the selected user within the date range
  const userRecords = sortPunchRecords(attendanceRecords.value);

  // this for debugging
  // const totalPunches = userRecords.length;
  // let normalizedCount = 0;

  // Populate records
  userRecords.forEach(record => {

    if (!recordsMap.has(record.date)) {
      recordsMap.set(record.date, newAttendanceRecord(record.date));
    }
    const dayRecord = recordsMap.get(record.date)!;

    const scheduledInTime = getScheduledInTime(record.user_id, record.date, dayRecord.firstCheckIn, dutyRoster.value, staffList.value);
    const scheduledOutTime = getScheduledOutTime(scheduledInTime);


    // for debugging
    // const originalStatus = record.status;


    record.status = normalizePunchStatus(record.time, scheduledInTime, scheduledOutTime, record.status);

    // for debugging
    // if (record.status !== originalStatus) {
    //   normalizedCount++;
    //   console.log(`🔁 Normalized ${originalStatus} → ${record.status} on ${record.date} at ${record.time}`);
    // }
    // abouve for debudding



    if (record.status === "CHECK IN" && !dayRecord.firstCheckIn) dayRecord.firstCheckIn = record.time;
    if (
      dayRecord.firstCheckIn &&
      !dayRecord.isWeekend &&
      !isHoliday(record.date, dutyRoster.value.publicHolidays, dutyRoster.value.specialHolidays)
    ) {
      dayRecord.lateMinutes = calculateLateMinutes(scheduledInTime, dayRecord.firstCheckIn, attendancePolicies.value.late.grace_period_minutes);
    }

    if (record.status === "CHECK OUT") dayRecord.lastCheckOut = record.time;

    if (record.status === "BREAK IN" || record.status === "BREAK OUT") {

      const lastTime = dayRecord.lastBreakTimes[record.status];
      const currentMin = toMinutes(record.time);
      const lastMin = lastTime ? toMinutes(lastTime) : -Infinity;

      if (currentMin - lastMin >= threshold) {
        dayRecord.lastBreakTimes[record.status] = record.time
        dayRecord.breaks.push({
          time: record.time,
          type: record.status === "BREAK IN" ? "(IN)" : "(OUT)",
          missing: false
        });

      }

    }

  });


  // console.log(`📊 Total punches processed: ${totalPunches}`);
  // console.log(`🔁 Total normalized punches: ${normalizedCount}`);

  // ✅ Generate all calendar days within the selected range
  const daysArray: ProcessedAttendance[] = [];
  const currentDate = new Date(startDate.value);
  const end = new Date(endDate.value);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayName = currentDate.toLocaleString('en-us', { weekday: 'long' });
    const isWeekend = dayName === "Friday" || dayName === "Saturday";
    const isHolidayDate = isHoliday(dateStr, dutyRoster.value.publicHolidays, dutyRoster.value.specialHolidays);

    const record = recordsMap.get(dateStr) || newAttendanceRecord(dateStr);

    // Ensure missing attendance is flagged correctly
    record.isHoliday = isHolidayDate
    record.day = dayName;
    record.isWeekend = isWeekend;
    record.missingCheckIn = !record.firstCheckIn && !isWeekend && !isHolidayDate;
    record.missingCheckOut = !record.lastCheckOut && !isWeekend && !isHolidayDate;

    // ✅ Break Validation - Highlight only missing pairs
    let breakOutCount = 0;
    let breakInCount = 0;

    record.breaks.forEach(b => {
      if (b.type === "(OUT)") breakOutCount++;
      if (b.type === "(IN)") breakInCount++;
    });

    // If mismatched, mark the last unmatched as missing
    if (breakOutCount !== breakInCount) {
      record.breaks[record.breaks.length - 1].missing = true;
    }

    daysArray.push(record);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return daysArray;
});


// style class
const btnMouseOver = 'text-[3px] md:text-lg font-semibold text-gray-200 hover:text-white hover:bg-green-700 rounded-md px-2 py-1 transition-colors duration-200 ease-in-out'

</script>

<template>
  <div class="bg-white p-4 md:p-6 shadow-md rounded-lg mt-6">
    <!-- Attendance Sheet Heading -->
    <div class="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-4">
      <h2 class="text-[10px] md:text-lg font-semibold text-green-700">ATTENDANCE</h2>
      <button @click="setToday" :class="btnMouseOver">Today</button>
      <button @click="setCurrentWeek" :class="btnMouseOver">Week</button>
      <button @click="setCurrentMonth" :class="btnMouseOver">Month</button>
      <button @click="setPaidPeriod" :class="btnMouseOver">Paid</button>
      <button @click="setPayablePeriod" :class="btnMouseOver">Payble</button>
      <button @click="setCurrentYear" :class="btnMouseOver">Year</button>
      <!-- Date Range Selection -->
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

    <!-- Responsive Table Wrapper -->
    <div class="overflow-x-auto">
      <table class="w-full table-auto border border-gray-200 text-[10px] md:text-sm">
        <thead class="bg-green-600 text-white text-[10px] md:text-sm">
          <tr>
            <th class="p-2 md:p-3 text-center w-1/6 md:w-1/8">DATE</th>
            <th class="p-2 md:p-3 text-center w-1/6 md:w-1/8 hidden md:table-cell">DAY</th>
            <th class="p-2 md:p-3 text-center w-1/12 md:w-1/8">IN</th>
            <th class="p-2 md:p-3 text-center w-1/6 md:w-1/8">LATE</th>
            <th class="p-2 md:p-3 text-left w-1/4 md:w-auto">BREAKS</th>
            <th class="p-2 md:p-3 text-center w-1/12 md:w-1/8">OUT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in filteredRecords" :key="index" class="border-b border-gray-200">
            <td class="p-1 md:p-3 text-center"
              :class="{ 'bg-gray-100 text-red-600': record.isWeekend || record.isHoliday }">{{ record.date
              }}</td>
            <td class="p-1 md:p-3 text-left hidden md:table-cell"
              :class="{ 'bg-gray-100 text-red-600': record.isWeekend || record.isHoliday }">
              {{ record.day }}
            </td>
            <td class="p-1 md:p-3 text-center"
              :class="{ 'bg-red-200 text-red-700': record.missingCheckIn, 'bg-gray-100 text-gray-700': record.isWeekend || record.isHoliday }">
              {{ record.firstCheckIn || '--' }}
            </td>
            <td class="p-1 md:p-3 text-center text-red-700"
              :class="{ 'bg-gray-100': record.isWeekend || record.isHoliday }">
              {{ record.lateMinutes > 0 ? `${record.lateMinutes} min` : '' }}
            </td>
            <td class="p-1 md:p-3 text-left whitespace-normal"
              :class="{ 'bg-gray-100': record.isWeekend || record.isHoliday }">
              <span v-for="(b, i) in record.breaks" :key="i" class="inline-block px-1"
                :class="{ 'bg-red-100 text-red-700': b.missing }">
                {{ b.time }} {{ b.type }}
              </span>
            </td>
            <td class="p-1 md:p-3 text-center"
              :class="{ 'bg-red-200 text-red-700': record.missingCheckOut, 'bg-gray-100 text-gray-700': record.isWeekend || record.isHoliday }">
              {{ record.lastCheckOut || '--' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
