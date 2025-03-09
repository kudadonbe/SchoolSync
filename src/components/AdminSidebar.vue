<script setup lang="ts">
import { useRouter } from 'vue-router';
// import { RouterLink } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('user'); // Remove user session
  router.push('/'); // Redirect to login page
};
</script>

<!-- <template>
  <aside class="w-64 bg-gray-900 text-white min-h-screen p-4">
    <h2 class="text-xl font-bold text-center mb-6">Admin Panel</h2>

    <nav class="space-y-4">
      <RouterLink to="/admin/dashboard" class="block px-4 py-2 hover:bg-gray-700 rounded">
        Dashboard
      </RouterLink>
      <RouterLink to="/admin/stock" class="block px-4 py-2 hover:bg-gray-700 rounded">
        Manage Stock
      </RouterLink>
      <RouterLink to="/admin/users" class="block px-4 py-2 hover:bg-gray-700 rounded">
        Users
      </RouterLink>
      <RouterLink to="/admin/settings" class="block px-4 py-2 hover:bg-gray-700 rounded">
        Settings
      </RouterLink>

      <button @click="logout" class="mt-6 block w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
        Logout
      </button>
    </nav>
  </aside>
</template> -->

<template>
  <aside class="w-64 bg-primary text-white min-h-screen p-4">
    <h2 class="text-xl font-bold text-center mb-6">Admin Panel</h2>

    <nav class="space-y-4">
      <RouterLink to="/admin/dashboard" class="block px-4 py-2 hover:bg-accent rounded">
        Dashboard
      </RouterLink>
      <RouterLink to="/admin/stock" class="block px-4 py-2 hover:bg-accent rounded">
        Manage Stock
      </RouterLink>
      <RouterLink to="/admin/users" class="block px-4 py-2 hover:bg-accent rounded">
        Users
      </RouterLink>
      <RouterLink to="/admin/settings" class="block px-4 py-2 hover:bg-accent rounded">
        Settings
      </RouterLink>

      <button @click="logout" class="mt-6 block w-full px-4 py-2 bg-secondary text-white rounded hover:bg-red-600">
        Logout
      </button>
    </nav>
  </aside>
</template>
