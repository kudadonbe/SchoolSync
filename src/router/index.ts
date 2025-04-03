import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import HomeView from '@/views/HomeView.vue'
import NoticeBoardView from '@/views/NoticeBoardView.vue'
import LoginView from '@/views/LoginView.vue'

import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'
import StockManagementView from '@/views/admin/StockManagementView.vue'

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
    meta: { requiresAuth: true, roles: ['admin_staff', 'administrator', 'principal'] },
  },
  {
    path: '/admin/stock',
    name: 'admin-stock',
    component: StockManagementView,
    meta: { requiresAuth: true, roles: ['admin_staff', 'administrator', 'principal'] },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UsersManagementView.vue'),
    meta: { requiresAuth: true, roles: ['admin_staff', 'administrator', 'principal'] },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('@/views/admin/SettingsView.vue'),
    meta: { requiresAuth: true, roles: ['administrator'] },
  },

  // 404 Page
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Clean URLs
  routes,
})

// Global Navigation Guard for Admin Routes
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait until Firebase auth state is resolved
  if (authStore.loading) {
    await new Promise((resolve) => {
      const stop = watch(
        () => authStore.loading,
        (val) => {
          if (!val) {
            stop()
            resolve(true)
          }
        },
      )
    })
  }

  const allowedRoles = to.meta.roles as string[] | undefined
  const userRole = authStore.currentUser?.role

  const isLoggedIn = !!authStore.currentUser

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (allowedRoles && !allowedRoles.includes(userRole ?? '')) {
    // ✅ Redirect if role is not allowed (including 'public')
    next({ path: '/' })
  } else {
    next()
  }
})

export default router
