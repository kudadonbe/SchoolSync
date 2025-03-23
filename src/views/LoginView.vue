<template>
  <PublicLayout>
    <div class="flex justify-center items-center min-h-screen">
      <div class="w-full max-w-sm bg-white p-8 rounded-lg shadow-md text-center">
        <!-- Firebase-style logo or icon -->
        <div class="flex justify-center mb-6">
          <img src="https://firebase.google.com/downloads/brand-guidelines/PNG/logo-vertical.png" alt="Firebase"
            class="h-12" />
        </div>

        <h1 class="text-2xl font-semibold text-green-800 mb-2">Welcome</h1>
        <p class="text-gray-600 text-sm mb-6">Sign in to continue</p>

        <button @click="authStore.loginWithGoogle"
          class="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:shadow-md text-gray-700 font-medium py-2 px-4 rounded transition-all">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="h-5 w-5" />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup lang="ts">
import PublicLayout from '@/layouts/PublicLayout.vue'
import { useAuthStore } from '@/stores/authStore'
import { watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

// Watch for changes in currentUser and redirect
watch(
  () => authStore.currentUser, // this is the value we're watching
  (user) => {
    if (user) {
      const redirect = router.currentRoute.value.query.redirect || '/'
      router.push(redirect as string)
    }
  },
  { immediate: true }
)
</script>
