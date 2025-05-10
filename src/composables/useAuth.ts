// src/composables/useAuth.ts
import { auth, googleProvider } from '@/firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { ref } from 'vue'

const currentUser = ref<User | null>(null)

onAuthStateChanged(auth, (user) => {
  currentUser.value = user
})

export function useAuth() {
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Google sign-in failed:', error)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    loginWithGoogle,
    logout,
    currentUser,
  }
}
