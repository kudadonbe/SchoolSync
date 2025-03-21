<template>
  <div class="bg-white p-4 md:p-6 shadow-md rounded-lg mt-6">
    <!-- Attendance Sheet Heading -->
    <div class="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-4">
      <h2 class="text-[10px] md:text-lg font-semibold text-green-700">ATTENDANCE</h2>

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
              :class="{ 'bg-red-200 text-red-700': record.missingCheckIn, 'bg-gray-100': record.isWeekend || record.isHoliday }">
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
              :class="{ 'bg-red-200 text-red-700': record.missingCheckOut, 'bg-gray-100': record.isWeekend || record.isHoliday }">
              {{ record.lastCheckOut || '--' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useMockDataStore } from "@/stores/dataStore"; // ✅ Pinia store
import { getScheduledInTime, calculateLateMinutes, isHoliday } from "@/utils/attendanceHelpers";
import type { ProcessedAttendance } from "@/types"

// ✅ Get data from Pinia store
const mockDataStore = useMockDataStore();
const { attendanceRecords, staffList, dutyRoster, attendancePolicies } = mockDataStore;

// ✅ Define Props to Accept `selectedUserId`
const props = defineProps<{ selectedUserId: string }>();



// ✅ Date range filters
const startDate = ref("2025-01-01");
const endDate = ref("2025-03-31");

// ✅ Compute Attendance for Selected User with Date Filtering
const filteredRecords = computed((): ProcessedAttendance[] => {
  const recordsMap = new Map<string, ProcessedAttendance>();

  // Filter records for the selected user within the date range
  const userRecords = attendanceRecords.filter(record =>
    record.user_id === props.selectedUserId &&
    record.date >= startDate.value &&
    record.date <= endDate.value
  );

  // Populate records
  userRecords.forEach(record => {
    if (!recordsMap.has(record.date)) {
      recordsMap.set(record.date, {
        date: record.date,
        day: new Date(record.date).toLocaleString('en-us', { weekday: 'long' }),
        firstCheckIn: "",
        lastCheckOut: "",
        breaks: [],
        missingCheckIn: false,
        missingCheckOut: false,
        isWeekend: false,
        lateMinutes: 0,
        isHoliday: false
      });
    }
    const dayRecord = recordsMap.get(record.date)!;

    if (record.status === "CHECK IN") dayRecord.firstCheckIn = record.time;
    if (
      dayRecord.firstCheckIn &&
      !dayRecord.isWeekend &&
      !isHoliday(record.date, dutyRoster.publicHolidays, dutyRoster.specialHolidays)
    ) {
      const scheduledInTime = getScheduledInTime(record.user_id, record.date, dayRecord.firstCheckIn, dutyRoster, staffList);
      dayRecord.lateMinutes = calculateLateMinutes(scheduledInTime, dayRecord.firstCheckIn, attendancePolicies.late.grace_period_minutes);
    }

    if (record.status === "CHECK OUT") dayRecord.lastCheckOut = record.time;

    if (record.status === "BREAK IN" || record.status === "BREAK OUT") {
      dayRecord.breaks.push({
        time: record.time,
        type: record.status === "BREAK IN" ? "(IN)" : "(OUT)",
        missing: false
      });
    }
  });

  // ✅ Generate all calendar days within the selected range
  const daysArray: ProcessedAttendance[] = [];
  const currentDate = new Date(startDate.value);
  const end = new Date(endDate.value);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayName = currentDate.toLocaleString('en-us', { weekday: 'long' });
    const isWeekend = dayName === "Friday" || dayName === "Saturday";
    const isHolidayDate = isHoliday(dateStr, dutyRoster.publicHolidays, dutyRoster.specialHolidays);

    const record = recordsMap.get(dateStr) || {
      date: dateStr,
      day: dayName,
      firstCheckIn: "",
      lastCheckOut: "",
      breaks: [],
      missingCheckIn: !isWeekend,
      missingCheckOut: !isWeekend,
      isWeekend,
      lateMinutes: 0,
      isHoliday: false


    };

    // Ensure missing attendance is flagged correctly
    record.missingCheckIn = !record.firstCheckIn && !isWeekend;
    record.missingCheckOut = !record.lastCheckOut && !isWeekend;
    record.isHoliday = isHolidayDate

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
</script>
