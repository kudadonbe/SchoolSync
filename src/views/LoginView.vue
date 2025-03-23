<!-- src/views/LoginView.vue -->
<template>
  <PublicLayout>
    <div class="flex justify-center items-center min-h-screen bg-gray-100">
      <div class="w-full max-w-md bg-white p-6 rounded-lg shadow-md text-center">
        <h2 class="text-2xl font-semibold text-green-800 mb-4">Login</h2>
        <button @click="authStore.loginWithGoogle"
          class="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded">
          Sign in with Google
        </button>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import PublicLayout from '@/layouts/PublicLayout.vue'
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()
</script>
