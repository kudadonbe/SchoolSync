<script setup lang="ts">
// src/views/admin/StaffView.vue

import AttendanceSummary from "@/components/AttendanceSummary.vue";
import StaffInfo from "@/components/StaffInfo.vue";
import AttendanceSheet from "@/components/AttendanceSheet.vue";
import { ref } from "vue";

import { useDataStore } from "@/stores/dataStore"; // ✅ Pinia store
import { storeToRefs } from "pinia";


const dataStore = useDataStore()
const { staffList } = storeToRefs(dataStore);

// 1️⃣ Grab the staffId right off the logged-in user
// const myStaffId = computed(() => authStore.currentUser?.staffId ?? null);

// console.log("staffList", staffList.value);


// ✅ Track the selected user across components
const selectedUserId = ref("101"); // Default to the first user

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
      <AttendanceSheet :selectedUserId="selectedUserId" />

    </div>
  </div>
</template>
