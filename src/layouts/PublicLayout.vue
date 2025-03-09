<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue';
import AppFooter from '@/components/AppFooter.vue';
</script>

<template>


  <div class="flex flex-col min-h-screen bg-primaryBackground text-primaryText">
    <!-- Navbar -->
    <AppNavbar />

    <!-- Main Content -->
    <main class="flex-1 container mx-auto p-4">
      <slot></slot>
    </main>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>
