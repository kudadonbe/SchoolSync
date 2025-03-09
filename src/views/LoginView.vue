<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Reactive form fields
const username = ref('');
const password = ref('');
const errorMessage = ref('');

// Handle login
const handleLogin = () => {
  if (username.value === 'admin' && password.value === '123_456') {
    // Save fake user session
    localStorage.setItem('user', 'admin');
    router.push('/admin/dashboard'); // Redirect to admin dashboard
  } else {
    errorMessage.value = 'Invalid username or password';
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-center mb-4">Login</h2>

      <!-- Error Message -->
      <p v-if="errorMessage" class="text-red-500 text-center mb-3">{{ errorMessage }}</p>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="username" class="block text-gray-700">Username</label>
          <input v-model="username" type="text" id="username"
            class="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-green-500" required />
        </div>

        <div class="mb-4">
          <label for="password" class="block text-gray-700">Password</label>
          <input v-model="password" type="password" id="password"
            class="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-green-500" required />
        </div>

        <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
          Login
        </button>
      </form>
    </div>
  </div>
</template>
