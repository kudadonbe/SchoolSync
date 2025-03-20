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
import { computed, defineProps } from "vue";
import { useMockDataStore } from "@/stores/mockDataStore"; // ✅ Use Pinia store

// ✅ Get state from Pinia store
const mockDataStore = useMockDataStore();
const { attendanceSummaryRecords } = mockDataStore;

// ✅ Define Props to Accept `selectedUserId`
const props = defineProps<{ selectedUserId: string }>();

// ✅ Define Attendance Summary Type
type AttendanceSummary = {
  daysAttended: number;
  absents: number;
  SICK_FORM: number;
  SICK_MC: number;
  FRL: number;
  ANNUAL_LEAVE: number;
  HAJJU: number;
  UMRA: number;
  UNPAID_LEAVE: number;
};

// ✅ Find Selected User's Attendance Records
const selectedUserRecords = computed(() =>
  attendanceSummaryRecords.filter((record) => record.user_id === props.selectedUserId)
);

// ✅ Define Leave Limits
const leaveLimits: Record<keyof AttendanceSummary, number | null> = {
  daysAttended: null,
  absents: null,
  SICK_FORM: 15,
  SICK_MC: 30,
  FRL: 10,
  ANNUAL_LEAVE: 30,
  HAJJU: 40,
  UMRA: 40,
  UNPAID_LEAVE: null, // No limit
};

// ✅ Define Leave Labels for Display
const leaveLabels: Record<keyof AttendanceSummary, string> = {
  daysAttended: "Days Attended",
  absents: "Absents",
  SICK_FORM: "Sick Leave - Form",
  SICK_MC: "Sick Leave - MC",
  FRL: "Family Responsibility Leave",
  ANNUAL_LEAVE: "Annual Leave",
  HAJJU: "Hajju Leave",
  UMRA: "Umra Leave",
  UNPAID_LEAVE: "Unpaid Leave",
};

// ✅ Compute Attendance Summary for Selected User
const summary = computed<AttendanceSummary>(() => {
  const summaryData: AttendanceSummary = {
    daysAttended: 0,
    absents: 0,
    SICK_FORM: 0,
    SICK_MC: 0,
    FRL: 0,
    ANNUAL_LEAVE: 0,
    HAJJU: 0,
    UMRA: 0,
    UNPAID_LEAVE: 0,
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
