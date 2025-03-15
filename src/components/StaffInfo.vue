<template>
  <div class="bg-white p-6">
    <h2 class="text-xl font-semibold text-green-700 mb-4">Staff Information</h2>

    <!-- Staff Details -->
    <div v-if="selectedUser" class="mt-4">
      <table class="w-full border border-gray-200">
        <tbody>
          <tr>
            <td class="p-3 font-semibold">Name:</td>
            <td class="p-3">{{ selectedUser.name }}</td>
          </tr>
          <tr>
            <td class="p-3 font-semibold">Staff ID:</td>
            <td class="p-3">
              <select v-model="selectedUserId" @change="updateSelectedUser" class="py-2 w-full">
                <option v-for="user in uniqueUsers" :key="user.user_id" :value="user.user_id">
                  {{ user.user_id }}
                </option>
              </select>
            </td>
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
import { staffList } from "@/data/testData"; // ✅ Import staff data

// ✅ Props to accept selectedUserId from parent
const props = defineProps<{ selectedUserId: string }>();

// ✅ Emit event when user is selected
const emit = defineEmits(["updateUser"]);

// ✅ Get unique users
const uniqueUsers = computed(() => staffList);

// ✅ Track selected user (sync with parent)
const selectedUserId = ref(props.selectedUserId);

// ✅ Find selected user's details
const selectedUser = computed(() => {
  return staffList.find(user => user.user_id === selectedUserId.value);
});

// ✅ Update user when selection changes
const updateSelectedUser = () => {
  emit("updateUser", selectedUserId.value);
};
</script>
