import './assets/main.css' // ✅ OK: Static CSS import
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useAuthStore } from '@/stores/authStore'

import App from './App.vue' // ✅ OK
import router from './router' // ✅ SPA router

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

app.mount('#app')

// ✅ Correct placement: auth setup after mount
const authStore = useAuthStore()
authStore.initAuthListener()
