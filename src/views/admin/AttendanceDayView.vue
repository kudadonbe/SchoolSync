<script setup lang="ts">
import { ref, computed } from "vue";
import { useAuthStore } from '@/stores/authStore';
import AttendanceDayDetails from '@/components/hr/attendance/AttendanceDayDetails.vue';

const authStore = useAuthStore()

const staffId = computed(() => authStore.currentUser?.staffId ?? null)
const selectedUserId = ref(staffId.value)

</script>
<template>
  <div class="p-6 max-w-6xl mx-auto">
    <h1 class="text-3xl font-semibold text-rose-700 mb-6">Attendance Day Records</h1>
    <div class="mt-6">
      <AttendanceDayDetails :selectedUserId="selectedUserId" />
    </div>
  </div>
</template>
