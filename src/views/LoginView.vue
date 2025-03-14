<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import PublicLayout from '@/layouts/PublicLayout.vue'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')

const handleLogin = () => {
  authStore.login(username.value, password.value)
}
</script>

<template>
  <PublicLayout>
    <div class="flex justify-center items-center min-h-screen bg-gray-100">
      <div class="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-2xl font-semibold text-center text-green-800">Login</h2>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700">Username</label>
          <input v-model="username" type="text" class="w-full p-2 border rounded-md focus:ring focus:ring-green-300" />
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input v-model="password" type="password"
            class="w-full p-2 border rounded-md focus:ring focus:ring-green-300" />
        </div>

        <button @click="handleLogin" class="w-full mt-4 bg-green-700 text-white py-2 rounded-md hover:bg-green-800">
          Sign In
        </button>
      </div>
    </div>
  </PublicLayout>
</template>
