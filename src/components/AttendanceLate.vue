<script setup lang="ts">
import { ref, computed } from "vue";
import { useMockDataStore } from "@/stores/mockDataStore"; // ✅ Use Pinia Store
import type { AttendanceRecord, Staff } from "@/stores/mockDataStore"; // ✅ Import Types

// ✅ Get state from Pinia store
const mockDataStore = useMockDataStore();
const { attendanceRecords, staffList, dutyRoster } = mockDataStore;

// ✅ Reference for selected period
const selectedPeriod = ref<{ start: string; end: string }>({ start: "", end: "" });

// ✅ Function to get scheduled check-in time
const getScheduledTime = (user_id: string): string => {
  const staff = staffList.find((s: Staff) => s.user_id === user_id);
  if (!staff) return dutyRoster.DefaultSchedule ?? "08:00";

  const departmentSchedule = dutyRoster[staff.department as keyof typeof dutyRoster];

  // ✅ If schedule is an object (EarlyDuty), get its time property
  if (typeof departmentSchedule === "object" && "time" in departmentSchedule) {
    return departmentSchedule.time;
  }

  // ✅ If schedule is a string, return it directly
  return typeof departmentSchedule === "string" ? departmentSchedule : dutyRoster.DefaultSchedule;
};

// ✅ Function to calculate late minutes
const calculateLateMinutes = (checkIn: string, scheduledIn: string): number => {
  const [chH, chM] = checkIn.split(":").map(Number);
  const [scH, scM] = scheduledIn.split(":").map(Number);
  const lateMinutes = (chH * 60 + chM) - (scH * 60 + scM);
  return lateMinutes > 0 ? lateMinutes : 0;
};

// ✅ Function to get leave count start date
const getLeaveCountStartDate = (user_id: string): string => {
  const staff = staffList.find((s: Staff) => s.user_id === user_id);
  let leaveCountDate = staff?.leave_count_date || staff?.join_date;

  if (!leaveCountDate) {
    const currentYear = new Date().getFullYear();
    leaveCountDate = `${currentYear}-01-01`;
  }

  return leaveCountDate;
};

// ✅ Compute daily late records
const dailyLateRecords = computed(() =>
  attendanceRecords
    .filter((rec: AttendanceRecord) => rec.status === "CHECK IN")
    .map((rec: AttendanceRecord) => ({
      user_id: rec.user_id,
      date: rec.date,
      late_minutes: calculateLateMinutes(rec.time, getScheduledTime(rec.user_id)),
    }))
);

// ✅ Compute late records for selected period
const periodLateRecords = computed(() =>
  attendanceRecords
    .filter(
      (rec: AttendanceRecord) =>
        rec.status === "CHECK IN" &&
        rec.date >= selectedPeriod.value.start &&
        rec.date <= selectedPeriod.value.end
    )
    .map((rec: AttendanceRecord) => ({
      user_id: rec.user_id,
      date: rec.date,
      late_minutes: calculateLateMinutes(rec.time, getScheduledTime(rec.user_id)),
    }))
);

// ✅ Compute full-year late records based on leave count date
const fullYearLateRecords = computed(() =>
  attendanceRecords
    .filter((rec: AttendanceRecord) => rec.status === "CHECK IN" && rec.date >= getLeaveCountStartDate(rec.user_id))
    .map((rec: AttendanceRecord) => ({
      user_id: rec.user_id,
      date: rec.date,
      late_minutes: calculateLateMinutes(rec.time, getScheduledTime(rec.user_id)),
    }))
);
</script>

<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Attendance Sheet - Late Minutes</h1>

    <!-- Daily Late Records -->
    <h2 class="text-lg font-semibold mt-4">Daily Late Records</h2>
    <table class="w-full border-collapse border border-gray-300 mt-2">
      <thead>
        <tr class="bg-gray-100">
          <th class="border p-2">Staff ID</th>
          <th class="border p-2">Date</th>
          <th class="border p-2">Late Minutes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rec in dailyLateRecords" :key="`${rec.user_id}-${rec.date}`">
          <td class="border p-2">{{ rec.user_id }}</td>
          <td class="border p-2">{{ rec.date }}</td>
          <td class="border p-2">{{ rec.late_minutes }} mins</td>
        </tr>
      </tbody>
    </table>

    <!-- Late Records for Selected Period -->
    <h2 class="text-lg font-semibold mt-4">Late Records for Selected Period</h2>
    <div class="mb-2">
      <input v-model="selectedPeriod.start" type="date" class="p-2 border border-gray-300 rounded-md mr-2" />
      <input v-model="selectedPeriod.end" type="date" class="p-2 border border-gray-300 rounded-md" />
    </div>
    <table class="w-full border-collapse border border-gray-300 mt-2">
      <thead>
        <tr class="bg-gray-100">
          <th class="border p-2">Staff ID</th>
          <th class="border p-2">Date</th>
          <th class="border p-2">Late Minutes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rec in periodLateRecords" :key="`${rec.user_id}-${rec.date}`">
          <td class="border p-2">{{ rec.user_id }}</td>
          <td class="border p-2">{{ rec.date }}</td>
          <td class="border p-2">{{ rec.late_minutes }} mins</td>
        </tr>
      </tbody>
    </table>

    <!-- Full Year Late Records -->
    <h2 class="text-lg font-semibold mt-4">Full Year Late Records</h2>
    <table class="w-full border-collapse border border-gray-300 mt-2">
      <thead>
        <tr class="bg-gray-100">
          <th class="border p-2">Staff ID</th>
          <th class="border p-2">Date</th>
          <th class="border p-2">Late Minutes</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="rec in fullYearLateRecords" :key="`${rec.user_id}-${rec.date}`">
          <td class="border p-2">{{ rec.user_id }}</td>
          <td class="border p-2">{{ rec.date }}</td>
          <td class="border p-2">{{ rec.late_minutes }} mins</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
