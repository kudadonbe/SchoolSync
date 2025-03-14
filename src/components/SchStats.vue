<script setup lang="ts">
import { ref } from 'vue'
import { UsersIcon, UserGroupIcon, CalendarIcon, TrophyIcon } from '@heroicons/vue/24/solid'

// Sample statistics data
const stats = ref([
  { id: 1, label: "Students", value: "1,250", icon: UsersIcon },
  { id: 2, label: "Teachers", value: "75", icon: UserGroupIcon },
  { id: 3, label: "Events", value: "30+", icon: CalendarIcon },
  { id: 4, label: "Awards", value: "15", icon: TrophyIcon }
])
</script>

<template>
  <div class="w-full bg-emerald-50 py-12">
    <div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <div v-for="stat in stats" :key="stat.id" class="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition">
        <component :is="stat.icon" class="w-12 h-12 text-emerald-600 mx-auto" />
        <p class="text-4xl font-bold text-emerald-700 mt-2">{{ stat.value }}</p>
        <p class="text-gray-700 text-sm">{{ stat.label }}</p>
      </div>
    </div>
  </div>
</template>
