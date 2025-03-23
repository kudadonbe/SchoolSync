import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { auth } from '@/firebase'
import { useAuthStore } from '@/stores/authStore'

import HomeView from '@/views/HomeView.vue'
import NoticeBoardView from '@/views/NoticeBoardView.vue'
import LoginView from '@/views/LoginView.vue'

import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import StockManagementView from '../views/admin/StockManagementView.vue'

const routes: RouteRecordRaw[] = [
  // Public Routes
  { path: '/', name: 'home', component: HomeView },
  { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
  { path: '/notice-board', name: 'notice-board', component: NoticeBoardView },
  { path: '/login', name: 'login', component: LoginView },

  // Admin Routes (No authentication for now)
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/stock',
    name: 'admin-stock',
    component: StockManagementView,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UsersManagementView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('@/views/admin/SettingsView.vue'),
    meta: { requiresAuth: true },
  },

  // 404 Page
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history:
    import.meta.env.MODE === 'production'
      ? createWebHashHistory(import.meta.env.BASE_URL) // GitHub Pages (Hash Mode)
      : createWebHistory(import.meta.env.BASE_URL), // Local Dev (Clean URLs)
  routes,
})

// Global Navigation Guard for Admin Routes
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = auth.currentUser || authStore.isAuthenticated

  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/') // Redirect to 404 if trying to access a protected page while unauthenticated
  } else {
    next()
  }
})

export default router
