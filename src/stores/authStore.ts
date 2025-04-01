// src/stores/authStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { syncUserToFirestore } from '@/services/authHelpers'
import type { User } from '@/types'
import { useRouter, useRoute } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  let authListenerInitialized = false // ✅ Guard flag
  const currentUser = ref<User | null>(null)
  const loading = ref(true)

  const router = useRouter()
  const route = useRoute()

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    // const result = await signInWithPopup(auth, provider)
    await signInWithPopup(auth, provider)

    // const firebaseUser = result.user
    // const user = await syncUserToFirestore(firebaseUser)
    // currentUser.value = user
  }

  async function logout() {
    await auth.signOut()
    currentUser.value = null

    // 🚨 Redirect if current route was protected
    if (route.meta.requiresAuth) {
      router.push('/')
    }
  }

  function initAuthListener() {
    console.log('[authStore] initAuthListener called')

    if (authListenerInitialized) return
    authListenerInitialized = true

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[authStore] Firebase user detected')
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
