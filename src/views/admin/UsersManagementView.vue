<script setup lang="ts">
import AdminLayout from '@/layouts/AdminLayout.vue';

// Example user list (Will be dynamic later)
const users = [
  { id: 1, name: 'Ismail Ibrahim', role: 'Teacher' },
  { id: 2, name: 'Hussain Shareef', role: 'Admin' },
  { id: 3, name: 'Ali Hussain', role: 'Student' }
];
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
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="text-center">
            <td class="border border-gray-300 p-2">{{ user.id }}</td>
            <td class="border border-gray-300 p-2">{{ user.name }}</td>
            <td class="border border-gray-300 p-2">{{ user.role }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminLayout>
</template>
