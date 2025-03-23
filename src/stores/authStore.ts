// src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const { loginWithGoogle, logout } = useAuth()

  const isAuthenticated = ref(false)
  const user = ref<string | null>(null)

  // Firebase session check on page reload
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      isAuthenticated.value = true
      user.value = firebaseUser.displayName ?? null
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('user', user.value || '')
    } else {
      isAuthenticated.value = false
      user.value = null
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('user')
    }
  })

  const login = async () => {
    try {
      await loginWithGoogle()
      // No need to set isAuthenticated/user here again — it's handled in onAuthStateChanged
      router.push('/admin')
    } catch (error) {
      alert('Login failed')
      console.error(error)
    }
  }

  const logoutUser = async () => {
    await logout()
    isAuthenticated.value = false
    user.value = null
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    router.push('/')
  }

  return {
    isAuthenticated,
    user,
    loginWithGoogle: login,
    logout: logoutUser,
  }
})
