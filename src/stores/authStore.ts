// src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { syncUserToFirestore } from '@/services/authHelpers'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const loading = ref(true)
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const firebaseUser = result.user
    const user = await syncUserToFirestore(firebaseUser)
    currentUser.value = user
  }

  async function logout() {
    await auth.signOut()
    currentUser.value = null
  }

  function initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await syncUserToFirestore(firebaseUser)
        currentUser.value = user
      } else {
        currentUser.value = null
      }
      loading.value = false
    })
  }

  const isAuthenticated = computed(() => !!currentUser.value)

  return {
    currentUser,
    loading,
    loginWithGoogle,
    logout,
    initAuthListener,
    isAuthenticated,
  }
})
