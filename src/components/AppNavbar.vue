<script setup lang="ts">
import { RouterLink } from 'vue-router'
import logo from '@/assets/logo.png';




const logoUrl = logo;


</script>

<template>
  <nav class="bg-green-200 p-4 text-green-900 shadow-lg">
    <div class="container mx-auto flex flex-col items-center">
      <!-- Logo -->
      <div class="mb-2">
        <img :src="logoUrl" alt="School Logo" class="h-12" />
      </div>

      <!-- Navigation Links -->
      <nav class="flex space-x-6 text-lg font-medium">
        <RouterLink to="/" class="hover:text-accent">Home</RouterLink>
        <RouterLink to="/about" class="hover:text-accent">About</RouterLink>
        <RouterLink to="/notice-board" class="hover:text-accent">Notice Board</RouterLink>
        <RouterLink to="/login" class="hover:text-accent">Login</RouterLink>
      </nav>
    </div>
  </nav>
</template>
