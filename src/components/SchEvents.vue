<script setup lang="ts">
import { ref } from 'vue'

// Sample event data
const event = ref({
  title: "Sports Fiesta 2023",
  date: "November 5, 2023",
  description: "Join us for an exciting day of sports and activities! Cheer for your teams and participate in fun games.",
  image: "/images/sports.jpg"
})
</script>

<template>
  <div class="relative w-full h-[400px] overflow-hidden">
    <!-- Background Image -->
    <img :src="event.image" class="w-full h-full object-cover" />

    <!-- Gradient Overlay -->
    <div
      class="absolute inset-0 bg-gradient-to-b from-emerald-800/80 to-black/60 flex flex-col justify-end p-8 text-white">
      <h1 class="text-3xl font-bold">{{ event.title }}</h1>
      <p class="text-sm text-gray-200">{{ event.date }}</p>
      <p class="mt-2 text-gray-300">{{ event.description }}</p>

      <!-- CTA Button -->
      <button class="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg">
        View Details
      </button>
    </div>
  </div>
</template>
