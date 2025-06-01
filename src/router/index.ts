// File: src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import HomeView from '@/views/public/HomeView.vue'
import NoticeBoardView from '@/views/public/NoticeBoardView.vue'
import LoginView from '@/views/public/LoginView.vue'

import AdminDashboardView from '@/views/admin/AdminDashboardView.vue'

import StockManagementView from '@/views/admin/StockManagementView.vue'
import AttendanceView from '@/views/admin/AttendanceView.vue'
import HrManagmentView from '@/views/admin/HrManagmentView.vue'
import AttendanceIssuesView from '@/views/admin/AttendanceIssuesView.vue'
import AttendanceDayView from '@/views/admin/AttendanceDayView.vue'

const routes: RouteRecordRaw[] = [
  // Public Routes
  { path: '/', name: 'home', component: HomeView },
  { path: '/about', name: 'about', component: () => import('@/views/public/AboutView.vue') },
  { path: '/notice-board', name: 'notice-board', component: NoticeBoardView },
  { path: '/login', name: 'login', component: LoginView },

  { path: '/dev/test', name: 'DevTest', component: () => import('@/views/dev/DevTestView.vue') },

  // Admin Routes (No authentication for now)
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: {
      requiresAuth: true,
      roles: ['developer', 'administrator', 'administrative_officer'],
    },
  },
  {
    path: '/hr',
    name: 'HR-dashboard',
    component: HrManagmentView,
    meta: {
      requiresAuth: true,
      roles: ['developer', 'administrator', 'administrative_officer', 'hr'],
    },
  },
  {
    path: '/dashboard',
    name: 'academic-dashboard',
    component: AdminDashboardView,
    meta: {
      requiresAuth: true,
      roles: ['developer', 'administrator', 'principal', 'leading_teacher'],
    },
  },
  {
    path: '/admin/stock',
    name: 'admin-stock',
    component: StockManagementView,
    meta: {
      requiresAuth: true,
      roles: ['administrative_officer', 'administrator', 'principal', 'developer'],
    },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UsersManagementView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['administrator', 'principal', 'developer'],
    },
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('@/views/admin/SettingsView.vue'),
    meta: { requiresAuth: true, roles: ['administrator', 'developer'] },
  },
  {
    path: '/attendance',
    name: 'staff-attendance',
    component: AttendanceView,
    meta: {
      requiresAuth: true,
      roles: [
        'developer',
        'principal',
        'administrator',
        'administrative_officer',
        'leading_teacher',
        'teacher',
        'labor',
      ],
    },
  },
  {
    path: '/missing',
    name: 'staff-attendance-issues',
    component: AttendanceIssuesView,
    meta: {
      requiresAuth: true,
      roles: [
        'developer',
        'principal',
        'administrator',
        'administrative_officer',
        'leading_teacher',
        'teacher',
        'labor',
      ],
    },
  },
  {
    path: '/dayrecords',
    name: 'staff-attendance-dayrecords',
    component: AttendanceDayView,
    meta: {
      requiresAuth: true,
      roles: [
        'developer',
        'principal',
        'administrator',
        'administrative_officer',
        'leading_teacher',
        'teacher',
        'labor',
      ],
    },
  },

  // 404 Page
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/public/NotFoundView.vue'),
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
