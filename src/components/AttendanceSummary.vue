<template>
  <div class="bg-white p-4 text-sm">
    <h2 class="text-lg font-semibold text-green-700 mb-4">Attendance Summary</h2>

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
        <tr>
          <td class="p-3">Days Attended</td>
          <td class="p-3">{{ summary.daysAttended }}</td>
          <td class="p-3">—</td>
        </tr>
        <tr class="bg-red-100">
          <td class="p-3">Absents</td>
          <td class="p-3">{{ summary.absents }}</td>
          <td class="p-3">—</td>
        </tr>
        <tr>
          <td class="p-3">Sick Leave - Phone</td>
          <td class="p-3">{{ summary.sickLeavePhone }}</td>
          <td class="p-3">{{ 15 - summary.sickLeavePhone }}</td>
        </tr>
        <tr>
          <td class="p-3">Sick Leave - MC</td>
          <td class="p-3">{{ summary.sickLeaveMC }}</td>
          <td class="p-3">{{ 30 - summary.sickLeaveMC }}</td>
        </tr>
        <tr>
          <td class="p-3">Family Responsibility Leave</td>
          <td class="p-3">{{ summary.familyLeave }}</td>
          <td class="p-3">{{ 10 - summary.familyLeave }}</td>
        </tr>
        <tr>
          <td class="p-3">Annual Leave</td>
          <td class="p-3">{{ summary.annualLeave }}</td>
          <td class="p-3">{{ 30 - summary.annualLeave }}</td>
        </tr>
        <tr>
          <td class="p-3">Hajju/Umra Leave</td>
          <td class="p-3">{{ summary.hajjuUmraLeave }}</td>
          <td class="p-3">{{ 40 - summary.hajjuUmraLeave }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import { attendanceSummaryRecords } from "@/data/mockData"; // ✅ Import test data
import type { AttendanceSummaryRecord } from "@/data/mockData"; // ✅ Use `import type` for type-only import

// ✅ Define Props to Accept `selectedUserId`
const props = defineProps<{ selectedUserId: string }>();

// ✅ Compute Attendance Summary for Selected User
const summary = computed(() => {
  const userRecords: AttendanceSummaryRecord[] = attendanceSummaryRecords.filter(
    record => record.user_id === props.selectedUserId
  );

  const daysAttended = userRecords.filter(record => record.status === "PRESENT").length;
  const absents = userRecords.filter(record => record.status === "ABSENT").length;
  const sickLeavePhone = userRecords.filter(record => record.status === "SICK_PHONE").length;
  const sickLeaveMC = userRecords.filter(record => record.status === "SICK_MC").length;
  const familyLeave = userRecords.filter(record => record.status === "FRL").length;
  const annualLeave = userRecords.filter(record => record.status === "ANNUAL_LEAVE").length;
  const hajjuUmraLeave = userRecords.filter(record => record.status === "HAJJU_UMRA").length;

  return {
    daysAttended,
    absents,
    sickLeavePhone,
    sickLeaveMC,
    familyLeave,
    annualLeave,
    hajjuUmraLeave
  };
});
</script>
