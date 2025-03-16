import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const route = useRoute()
  const isAuthenticated = ref(localStorage.getItem('isAuthenticated') === 'true')
  const user = ref(localStorage.getItem('user') || null)

  const login = (username: string, password: string) => {
    // Simulate authentication (Replace with real authentication API call)
    if (username === 'admin' && password === '231_word') {
      isAuthenticated.value = true
      user.value = username
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('user', username)

      // Redirect to admin dashboard after login
      router.push('/')
    } else {
      alert('Invalid username or password')
    }
  }

  const logout = () => {
    isAuthenticated.value = false
    user.value = null
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')

    if (route.meta.requiresAuth) {
      router.push('/')
    }
  }

  return { isAuthenticated, user, login, logout }
})
