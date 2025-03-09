<script setup lang="ts">
import AdminSidebar from '../components/AdminSidebar.vue';

</script>

<template>
  <div class="flex min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <AdminSidebar />

    <div class="flex-1 flex flex-col">
      <header class="bg-primary p-4 text-white shadow-md">
        <h1 class="text-lg font-bold">Admin Panel</h1>
      </header>

      <!-- Main Content -->
      <main class="p-6 flex-1">
        <slot></slot>
      </main>

      <!-- Footer -->
      <footer class="bg-secondary text-white p-4 text-center">
        <p>&copy; 2025 Makunudhoo School Admin</p>
      </footer>
    </div>
  </div>
</template>
