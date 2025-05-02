// src/stores/authStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { syncUserToFirestore } from '@/services/authHelpers'
import { logUserActivity } from '@/stores/activityLogger'
import type { User } from '@/types'
import { useRouter, useRoute } from 'vue-router'

// ========== Auth Store Initialization ==========
export const useAuthStore = defineStore('auth', () => {
  // ========== State Variables ==========
  let authListenerInitialized = false // Flag to ensure the auth listener is initialized only once
  const currentUser = ref<User | null>(null) // Holds the currently authenticated user data
  const loading = ref(true) // Tracks loading state during auth checks

  const router = useRouter() // Router for navigation
  const route = useRoute() // Current route information

  // ========== Login with Google ==========
  // This function handles user login via Google authentication using Firebase Auth
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider() // Set up the Google provider

    try {
      // Sign in with Google using Firebase Auth
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user
      // Sync the user data to Firestore and set it in the store
      const user = await syncUserToFirestore(firebaseUser)
      currentUser.value = user

      // Don't log login here, it's already handled in onAuthStateChanged
    } catch (error) {
      console.error('[loginWithGoogle] Error:', error) // Handle any errors during login
    }
  }

  // ========== Logout Function ==========
  // This function clears user data, logs activity, and redirects if needed
  async function logout() {
    if (currentUser.value) {
      // Log the logout activity using the logUserActivity function
      await logUserActivity(
        currentUser.value.uid,
        'LOGOUT', // Action type is 'LOGOUT'
        {
          description: 'User logged out', // Additional metadata for the action
        },
        currentUser.value.displayName,
        currentUser.value.email,
      )
      // console.log(`[authStore] User Logged Out:
      //   Name: ${currentUser.value.displayName},
      //   Email: ${currentUser.value.email},
      //   UID: ${currentUser.value.uid},
      //   Time: ${new Date().toLocaleString()}`)
    }

    // Sign out the user from Firebase Auth
    await auth.signOut()
    currentUser.value = null // Reset currentUser in the store

    // Remove the session flag from localStorage when the user logs out
    localStorage.removeItem('hasLoggedIn')

    // Redirect if the current route requires authentication
    if (route.meta.requiresAuth) {
      router.push('/') // Redirect to the homepage or login page
    }
  }

  // ========== Initialize Auth Listener ==========
  // This function listens for authentication state changes (login/logout)
  function initAuthListener() {
    // console.log('[authStore] initAuthListener called')

    if (authListenerInitialized) return // Prevent re-initializing the listener
    authListenerInitialized = true

    // Listen for auth state changes using Firebase's onAuthStateChanged
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // console.log('[authStore] Firebase user detected')

        // Sync user data to Firestore and store it in the app's state
        const user = await syncUserToFirestore(firebaseUser)
        currentUser.value = user

        // Log the login activity only once (if not already logged in this session)
        if (!localStorage.getItem('hasLoggedIn')) {
          await logUserActivity(
            firebaseUser.uid,
            'LOGIN', // Action type is 'LOGIN'
            { method: 'google' }, // Login method (Google)
            firebaseUser.displayName,
            firebaseUser.email,
          )
          localStorage.setItem('hasLoggedIn', 'true') // Mark as logged in for this session
          // console.log(`[authStore] User Logged In:
          //   Name: ${firebaseUser.displayName},
          //   Email: ${firebaseUser.email},
          //   UID: ${firebaseUser.uid},
          //   Time: ${new Date().toLocaleString()}`)
        }
      } else {
        currentUser.value = null // Reset currentUser when user logs out
        localStorage.removeItem('hasLoggedIn') // Clear session flag when logged out
      }
      loading.value = false // Stop the loading spinner once auth state is determined
    })
  }

  // ========== Computed Property ==========
  // This property checks if the user is authenticated
  const isAuthenticated = computed(() => !!currentUser.value)

  // ========== Return Store Methods and State ==========
  return {
    currentUser, // Current authenticated user
    loading, // Loading state during auth initialization
    loginWithGoogle, // Login function using Google Auth
    logout, // Logout function
    initAuthListener, // Initialize Firebase Auth listener
    isAuthenticated, // Computed property to check if user is authenticated
  }
})
