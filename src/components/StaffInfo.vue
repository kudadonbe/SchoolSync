<template>
  <div class="bg-white p-6 relative">
    <h2 class="text-xl font-semibold text-green-700 mb-4">Staff Information</h2>

    <!-- Search Staff -->
    <div class="relative">
      <input v-model="searchQuery" type="text" placeholder="Search staff by name..."
        class="w-full p-2 border border-gray-300 rounded-md mb-3" />

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
            <td class="p-3 font-semibold">Staff ID:</td>
            <td class="p-3">{{ selectedUser.user_id }}</td>
          </tr>
          <tr>
            <td class="p-3 font-semibold">Department:</td>
            <td class="p-3">{{ selectedUser.department }}</td>
          </tr>
          <tr>
            <td class="p-3 font-semibold">Position:</td>
            <td class="p-3">{{ selectedUser.position }}</td>
          </tr>
          <tr>
            <td class="p-3 font-semibold">Join Date:</td>
            <td class="p-3">{{ selectedUser.join_date }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps } from "vue";
import { staffList } from "@/data/mockData"; // ✅ Import staff data

// ✅ Props to accept selectedUserId from parent
const props = defineProps<{ selectedUserId: string }>();

// ✅ Emit event when user is selected
const emit = defineEmits(["updateUser"]);

// ✅ Track selected user (sync with parent)
const selectedUserId = ref(props.selectedUserId);

// ✅ Search Query
const searchQuery = ref("");

// ✅ Filter staff list based on search query
const filteredStaff = computed(() => {
  if (!searchQuery.value) return [];
  return staffList.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// ✅ Find selected user's details
const selectedUser = computed(() => {
  return staffList.find((user) => user.user_id === selectedUserId.value);
});

// ✅ Update user when selection changes
const selectUser = (userId: string) => {
  selectedUserId.value = userId;
  searchQuery.value = ""; // Clear search after selection
  emit("updateUser", userId);
};
</script>
