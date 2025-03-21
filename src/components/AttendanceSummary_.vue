<template>
  <div class="bg-white p-4 text-sm">
    <h2 class="text-lg font-semibold text-green-700 mb-4">Attendance Summary</h2>

    <div v-if="selectedUserRecords.length > 0">
      <!-- Summary Table -->
      <table class="w-full border border-gray-200">
        <thead class="bg-green-600 text-white">
          <tr>
            <th class="p-3 text-left">Detail</th>
            <th class="p-3 text-left">Used</th>
            <th class="p-3 text-left">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(limit, key) in leaveLimits" :key="key">
            <td class="p-3">{{ leaveLabels[key] }}</td>
            <td class="p-3">{{ summary[key as keyof typeof summary] }}</td>
            <td class="p-3">{{ limit !== null ? limit - summary[key as keyof typeof summary] : "—" }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="text-gray-500">No attendance records found for the selected staff.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMockDataStore } from "@/stores/dataStore"; // ✅ Use Pinia store

// ✅ Get state from Pinia store
const mockDataStore = useMockDataStore();
const { attendanceSummaryRecords } = mockDataStore;

// ✅ Define Props to Accept `selectedUserId`
const props = defineProps<{ selectedUserId: string }>();

// ✅ Define Attendance Summary Type
type AttendanceSummary = {
  daysAttended: number;
  absents: number;
  slForm: number;
  slMc: number;
  frl: number;
  annualLeave: number;
  hajjuLeave: number;
  umraLeave: number;
  nopayLeave: number;
  specialLeave: number;
};

// ✅ Find Selected User's Attendance Records
const selectedUserRecords = computed(() =>
  attendanceSummaryRecords.filter((record) => record.user_id === props.selectedUserId)
);

// ✅ Define Leave Limits
const leaveLimits: Record<keyof AttendanceSummary, number | null> = {
  daysAttended: null,
  absents: null,
  slForm: 15,
  slMc: 30,
  frl: 10,
  annualLeave: 30,
  hajjuLeave: 40,
  umraLeave: 40,
  nopayLeave: null, // No limit
  specialLeave: null, // No limit
};

// ✅ Define Leave Labels for Display
const leaveLabels: Record<keyof AttendanceSummary, string> = {
  daysAttended: "Days Attended",
  absents: "Absents",
  slForm: "Sick Leave - Form",
  slMc: "Sick Leave - MC",
  frl: "Family Responsibility Leave",
  annualLeave: "Annual Leave",
  hajjuLeave: "Hajju Leave",
  umraLeave: "Umra Leave",
  nopayLeave: "Unpaid Leave",
  specialLeave: "Special Leave",
};

// ✅ Compute Attendance Summary for Selected User
const summary = computed<AttendanceSummary>(() => {
  const summaryData: AttendanceSummary = {
    daysAttended: 0,
    absents: 0,
    slForm: 0,
    slMc: 0,
    frl: 0,
    annualLeave: 0,
    hajjuLeave: 0,
    umraLeave: 0,
    nopayLeave: 0,
    specialLeave: 0,
  };

  // ✅ Efficiently count occurrences using `.forEach()`
  selectedUserRecords.value.forEach((record) => {
    if (summaryData.hasOwnProperty(record.status)) {
      summaryData[record.status as keyof AttendanceSummary]++;
    }
  });

  return summaryData;
});
</script>
