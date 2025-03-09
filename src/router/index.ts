import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

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
  { path: '/admin/dashboard', name: 'admin-dashboard', component: AdminDashboardView },
  { path: '/admin/stock', name: 'admin-stock', component: StockManagementView },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/admin/UsersManagementView.vue'),
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: () => import('@/views/admin/SettingsView.vue'),
  },

  // 404 Page
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
