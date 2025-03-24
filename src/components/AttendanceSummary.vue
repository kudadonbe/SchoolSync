<template>
  <div class="bg-white p-4 text-sm">
    <h2 class="text-lg font-semibold text-green-700 mb-4">Attendance Summary</h2>

    <div v-if="selectedUserRecords.length > 0">
      <!-- Summary Table -->
      <table class="w-full border border-gray-200">
        <thead class="bg-green-600 text-white">
          <tr>
            <th class="p-3 text-left">Detail</th>
            <th class="p-3 text-center">Used</th>
            <th class="p-3 text-center">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(limit, key) in leaveLimits" :key="key">
            <td class="p-3">{{ leaveLabels[key] }}</td>
            <td class="p-3 text-center">{{ summary[key as keyof typeof summary] }}</td>
            <td class="p-3 text-center">{{ limit !== null ? limit - summary[key as keyof typeof summary] : "—" }}</td>
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
import type { AttendanceSummary } from "@/types"; // ✅ Import AttendanceSummary type
import { camelToSnake } from "@/utils/stringHelpers"

// ✅ Get state from Pinia store
const mockDataStore = useMockDataStore();

// ✅ Define Props to Accept `selectedUserId`
const props = defineProps<{ selectedUserId: string }>();

// ✅ Get attendance summary records from store
const { attendanceSummaryRecords, attendancePolicies } = mockDataStore;

// ✅ Filter records for the selected user
const selectedUserRecords = computed(() =>
  attendanceSummaryRecords.filter((record) => record.user_id === props.selectedUserId)
);


const leaveLabels: Record<keyof AttendanceSummary, string> = {
  absents: "Absences",
  slForm: "Sick Leave (with Form)",
  slMc: "Sick Leave (with Medical Certificate)",
  frl: "Family Responsibility Leave",
  annualLeave: "Annual Leave",
  hajjuLeave: "Hajj Leave",
  umraLeave: "Umrah Leave",
  nopayLeave: "Nopay Leave",
  specialLeave: "Special Leave",
  daysAttended: "Attended",
};


const leaveLimits = computed(() => {
  const result = {
    slForm: 0,
    slMc: 0,
    frl: 0,
    annualLeave: 0,
    hajjuLeave: 0,
    umraLeave: 0,
    nopayLeave: 0,
    specialLeave: 0,
    daysAttended: 0,
    absents: 0
  };


  for (const key in result) {
    const snakeKey = camelToSnake(key) as keyof typeof attendancePolicies.leave_limits;
    result[key as keyof AttendanceSummary] = attendancePolicies.leave_limits[snakeKey] ?? 0;
  }



  return result
});

const summary = computed<AttendanceSummary>(() => {
  const summaryData: AttendanceSummary = {
    slForm: 0,
    slMc: 0,
    frl: 0,
    annualLeave: 0,
    hajjuLeave: 0,
    umraLeave: 0,
    nopayLeave: 0,
    specialLeave: 0,
    daysAttended: 0,
    absents: 0
  };

  selectedUserRecords.value.forEach((record) => {
    switch (record.status) {
      case "PRESENT":
        summaryData.daysAttended++;
        break;
      case "ABSENT":
        summaryData.absents++;
        break;
      case "SL_FORM":
        summaryData.slForm++;
        break;
      case "SL_MC":
        summaryData.slMc++;
        break;
      case "FRL":
        summaryData.frl++;
        break;
      case "ANNUAL_LEAVE":
        summaryData.annualLeave++;
        break;
      case "HAJJU":
        summaryData.hajjuLeave++;
        break;
      case "UMRA":
        summaryData.umraLeave++;
        break;
      case "NOPAY_LEAVE":
        summaryData.nopayLeave++;
        break;
      case "SPECIAL_LEAVE":
        summaryData.specialLeave++;
        break;
    }
  });

  return summaryData;
});

</script>
