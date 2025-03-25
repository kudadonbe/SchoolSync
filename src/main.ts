import './assets/main.css' // ✅ OK: Static CSS import
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue' // ✅ OK
import router from './router' // ✅ SPA router

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// ✅ Correct placement: auth setup after mount
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()
authStore.initAuthListener()
