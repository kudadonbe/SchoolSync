<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import AdminLayout from '@/layouts/AdminLayout.vue';
import { useDataStore } from "@/stores/dataStore"; // ✅ Pinia store
import type { User } from "@/types"
import { useAuthStore } from '@/stores/authStore'; // ✅ import authStore
import { updateUserInFirestore } from '@/services/firebaseServices'

const authStore = useAuthStore();
const currentUser = computed(() => authStore.currentUser); // ✅ use currentUser from authStore
// console.log("currentUser", currentUser.value);


const dataStore = useDataStore();
const users = ref<User[]>([]);


const isAdmin = computed(() => currentUser.value?.role === 'administrator' || currentUser.value?.role === 'developer');


onMounted(async () => {
  // Fetch user data when the component is mounted
    users.value = await dataStore.getUserList();
    // sort users by staffId
    users.value.sort((a, b) => {
      if (a.staffId && b.staffId) {
        return a.staffId.localeCompare(b.staffId);
      } else if (a.staffId) {
        return -1;
      } else if (b.staffId) {
        return 1;
      }
      return 0;
    });
    // console.log(users.value);
});

const editingUserId = ref<string | null>(null);

function enableEdit(uid: string) {
  editingUserId.value = uid;
}

async function saveEdit(user: User) {
  // ✅ send update to server via dataStore or directly
  // console.log('Saving user:', user);
  try {
    await updateUserInFirestore(user);
    // console.log('User updated successfully:', user);
  } catch (error) {
    console.error('Error updating user:', error);
  } finally{
    editingUserId.value = null;
  }
}


</script>

<template>
  <AdminLayout>
    <h1 class="text-2xl font-bold mb-4">User Management</h1>

    <div class="bg-white p-4 rounded shadow">
      <table class="w-full border-collapse border border-gray-300">
  <thead class="bg-gray-100">
    <tr>
      <th class="border border-gray-300 p-2">ID</th>
      <th class="border border-gray-300 p-2">Name</th>
      <th class="border border-gray-300 p-2">Role</th>
      <th class="border border-gray-300 p-2">Email</th>
      <th class="border border-gray-300 p-2">Action</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="user in users" :key="user.uid" class="text-center">
      <td class="border border-gray-300 p-2">
        <template v-if="editingUserId === user.uid">
          <input v-model="user.staffId" class="border p-1 text-sm w-24" />
        </template>
        <template v-else>
          {{ user.staffId || '-' }}
        </template>
      </td>
      <td class="border border-gray-300 p-2 text-left">{{ user.displayName }}</td>
      <td class="border border-gray-300 p-2 text-left">
        <template v-if="editingUserId === user.uid">
          <select v-model="user.role" class="border p-1 text-sm w-32 text-left">
            <option value="principal">Principal</option>
            <option value="administrator">Administrator</option>
            <option value="leading_teacher">Leading Teacher</option>
            <option value="teacher">Teacher</option>
            <option value="administrative_officer">Administrative Officer</option>
            <option value="labor">Labor</option>
            <option value="public">Public</option>
          </select>
        </template>
        <template v-else>
          {{ user.role }}
        </template>
      </td>
      <td class="border border-gray-300 p-2 text-left">{{ user.email }}</td>
      <td class="border border-gray-300 p-2">
        <template v-if="isAdmin">
          <button
            v-if="editingUserId !== user.uid"
            @click="enableEdit(user.uid)"
            class="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Edit
          </button>
          <button
            v-else
            @click="saveEdit(user)"
            class="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Save
          </button>
        </template>
      </td>
    </tr>
  </tbody>
</table>

    </div>
  </AdminLayout>
</template>
