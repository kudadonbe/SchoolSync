<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from '@/stores/authStore';
import AttendanceDayDetails from '@/components/hr/attendance/AttendanceDayDetails.vue';
import StaffInfo from '@/components/StaffInfo.vue';

const authStore = useAuthStore()

const staffId = computed(() => authStore.currentUser?.staffId ?? null)
const selectedUserId = ref(staffId.value)

// Handle staff selection
const updateUser = (userId: string) => {
  selectedUserId.value = userId
}

</script>
<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-3xl font-semibold text-rose-700 mb-6">Attendance Day Records</h1>
    <!-- Staff Info -->
    <div class="grid grid-cols-1 md:grid-cols-7 gap-6 shadow-md rounded-lg">
      <div class="md:col-span-4">
        <StaffInfo :selectedUserId="selectedUserId" @updateUser="updateUser" />
      </div>
    </div>
    <div class="mt-6">
      <AttendanceDayDetails :selectedUserId="selectedUserId" />
    </div>
  </div>
</template>
