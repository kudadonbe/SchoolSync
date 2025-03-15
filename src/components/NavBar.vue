<script setup lang="ts">

import { RouterLink, useRoute } from 'vue-router'
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { Bars3Icon, XMarkIcon, UserIcon } from '@heroicons/vue/24/outline'


import { useAuthStore } from "@/stores/authStore";

import logo from '@/assets/logo.png';

const logoUrl = logo;


const route = useRoute();
const authStore = useAuthStore()  // Initialize auth store


const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Admin', href: '/admin/dashboard' },
]


</script>

<template>
  <Disclosure as="nav" class="bg-green-800" v-slot="{ open }">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
          <!-- Mobile menu button-->
          <DisclosureButton
            class="relative inline-flex items-center justify-center rounded-md p-2 text-green-400 hover:bg-green-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
            <span class="absolute -inset-0.5" />
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!open" class="block size-6" aria-hidden="true" />
            <XMarkIcon v-else class="block size-6" aria-hidden="true" />
          </DisclosureButton>
        </div>
        <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
          <div class="flex shrink-0 items-center">
            <RouterLink to="/">
              <img class="h-8 w-auto" :src="logoUrl" alt="Makunudhoo School" />
            </RouterLink>
          </div>
          <div class="hidden sm:ml-6 sm:block">
            <div class="flex space-x-4">
              <RouterLink v-for="item in navigation" :key="item.name" :to="item.href" :class="[route.path === item.href ? 'bg-green-900 text-white' : 'text-green-300 hover:bg-green-700 hover:text-white',
                'rounded-md px-3 py-2 text-sm font-medium']" :aria-current="item.name ? 'page' : undefined">{{
                  item.name }}
              </RouterLink>
            </div>
          </div>
        </div>
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
          <button v-if="!authStore.isAuthenticated" type="button"
            class="text-green-300 hover:bg-green-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium">
            <RouterLink to="/login">Sign in</RouterLink>
          </button>
          <!-- Profile dropdown -->
          <Menu v-if="authStore.isAuthenticated" as="div" class="relative ml-3">
            <div>
              <MenuButton
                class="relative flex rounded-full bg-green-800 text-sm focus:ring-2 focus:ring-green focus:ring-offset-2 focus:ring-offset-green-800 focus:outline-hidden">
                <span class="absolute -inset-1.5" />
                <span class="sr-only">Open user menu</span>
                <UserIcon class="block size-6" aria-hidden="true" />
              </MenuButton>
            </div>
            <transition enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95">
              <MenuItems
                class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5 focus:outline-hidden">
                <MenuItem v-slot="{ active }">
                <a href="#"
                  :class="[active ? 'bg-green-100 outline-hidden' : '', 'block px-4 py-2 text-sm text-green-700']">Your
                  Profile</a>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                <a href="#"
                  :class="[active ? 'bg-green-100 outline-hidden' : '', 'block px-4 py-2 text-sm text-green-700']">Settings</a>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                <div @click="authStore.logout"
                  :class="[active ? 'bg-green-100 outline-hidden' : '', 'block px-4 py-2 text-sm text-green-700']">Sign
                  out</div>
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>
    </div>

    <DisclosurePanel class="sm:hidden">
      <div class="space-y-1 px-2 pt-2 pb-3">
        <RouterLink v-for="item in navigation" :key="item.name" as="a" :to="item.href" :class="[route.path === item.href ? 'bg-green-900 text-white' : 'text-green-300 hover:bg-green-700 hover:text-white',
          'block rounded-md px-3 py-2 text-base font-medium']" :aria-current="item.name ? 'page' : undefined">{{
            item.name }}</RouterLink>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
