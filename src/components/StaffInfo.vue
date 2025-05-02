<script setup lang="ts">
// src/components/StaffInfo.vue
import { ref, computed } from "vue";
import { useDataStore } from "@/stores/dataStore"; // ✅ Use Pinia store
import type { Staff } from "@/types"; // ✅ Import Staff type
import { useAuthStore } from '@/stores/authStore'


const authStore = useAuthStore()

const staffRole = computed(() => authStore.currentUser?.role ?? null)
// console.log("staffRole:", staffRole.value);
const showSearch = computed(() => {
  return staffRole.value === "administrator" || staffRole.value === "leading_teacher" || staffRole.value === "principal" || staffRole.value === "developer"
})


// ✅ Get state from Pinia store
const dataStore = useDataStore();
const { staffList } = dataStore;

// ✅ Props to accept selectedUserId from parent
const props = defineProps<{ selectedUserId: string | null }>();

// ✅ Emit event when user is selected
const emit = defineEmits(["updateUser"]);

// ✅ Track selected user (sync with parent)
const selectedUserId = ref(props.selectedUserId);

// ✅ Search Query
const searchQuery = ref("");

// ✅ Filter staff list based on search query
const filteredStaff = computed((): Staff[] => {
  if (!searchQuery.value) return [];
  return staffList.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// ✅ Find selected user's details
const selectedUser = computed((): Staff | undefined => {
  return staffList.find((user) => user.user_id === selectedUserId.value);
});

// ✅ Update user when selection changes
const selectUser = (userId: string) => {
  selectedUserId.value = userId;
  searchQuery.value = ""; // Clear search after selection
  emit("updateUser", userId);
};
</script>
<template>
  <div class="bg-white p-6 relative">
    <h2 class="text-xl font-semibold text-green-700 mb-4">Staff Information</h2>

    <!-- Search Staff -->
    <div class="relative">
      <div v-if="showSearch" class="mb-3">
        <input v-model="searchQuery" type="text" placeholder="Search staff by name..."
          class="w-full p-2 border border-gray-300 rounded-md mb-3" />
      </div>

      <!-- Filtered Staff List (Floating Dropdown) -->
      <div v-if="searchQuery && filteredStaff.length > 0"
        class="absolute w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
        <ul>
          <li v-for="user in filteredStaff" :key="user.user_id" @click="selectUser(user.user_id)"
            class="p-2 hover:bg-green-100 cursor-pointer">
            {{ user.name }}
          </li>
        </ul>
      </div>
    </div>

    <!-- No Results Message -->
    <p v-if="searchQuery && filteredStaff.length === 0" class="text-red-600 mt-2">
      No staff found matching "{{ searchQuery }}"
    </p>

    <!-- Staff Details (Only Shown When a Staff Member is Selected) -->
    <div v-if="selectedUser" class="mt-4">
      <table class="w-full border border-gray-200">
        <tbody>
          <tr>
            <td class="p-3 font-semibold">Name:</td>
            <td class="p-3">{{ selectedUser.name }}</td>
          </tr>
          <tr>
            <td class="p-3 font-semibold">Designation:</td>
            <td class="p-3">{{ selectedUser.position }}</td>
          </tr>
          <tr>
            <td class="p-3 font-semibold">Appointed Date:</td>
            <td class="p-3">{{ selectedUser.join_date || "N/A" }}</td>
          </tr>
          <tr>
            <td class="p-3 font-semibold">Joined Date:</td>
            <td class="p-3">{{ selectedUser.leave_count_date || "N/A" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
