<script setup lang="ts">


import AttendanceSummary from "@/components/AttendanceSummary.vue";
import StaffInfo from "@/components/StaffInfo.vue";
// import AttendanceSheet from "@/components/AttendanceSheet.vue";
import AttendanceSheetLive from "@/components/AttendanceSheetLive.vue";
import { ref } from "vue";
// import TestFirestoreRecord from "@/components/TestFirestoreRecord.vue";
// import TestAttendanceRecord from "@/components/TestAttendanceRecord.vue";




// ✅ Track the selected user across components
const selectedUserId = ref("105"); // Default to the first user

// ✅ Update selected user when changed in StaffInfo
const updateUser = (userId: string) => {
  selectedUserId.value = userId;
};

</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-3xl font-semibold text-green-700 mb-6">Staff Attendance Overview</h1>

    <!-- Two-column layout -->
    <div class="grid grid-cols-1 md:grid-cols-7 gap-6 shadow-md rounded-lg">
      <!-- Left: Staff Information -->
      <div class="md:col-span-4">
        <StaffInfo :selectedUserId="selectedUserId" @updateUser="updateUser" />
      </div>

      <!-- Right: Attendance Summary (Small font) -->
      <div class="md:col-span-3">
        <AttendanceSummary :selectedUserId="selectedUserId" />
      </div>
    </div>

    <!-- Full width: Attendance Sheet -->
    <div class="mt-6">
      <!-- <AttendanceSheet :selectedUserId="selectedUserId" /> -->
      <AttendanceSheetLive :selectedUserId="selectedUserId" />
      <!-- <TestFirestoreRecord /> -->
      <!-- <TestAttendanceRecord /> -->
    </div>
  </div>
</template>
