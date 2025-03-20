<script setup lang="ts">
const title = 'Quran Tournment'
const description = 'Congratulations to the winners of the Quran Tournment!'

const getPublicImage = (fileName: string) => `${import.meta.env.BASE_URL}images/${fileName}`
</script>

<template>
  <div class="relative w-full h-[500px] overflow-hidden rounded-lg">
    <!-- Background Image -->
    <img :src="getPublicImage('home.jpg')" class="w-full h-full object-cover rounded-lg" />

    <!-- Soft Emerald Gradient Overlay -->
    <div
      class="absolute inset-0 flex flex-col justify-end p-8 rounded-lg">
        <h1 class="text-3xl font-bold text-emerald-600">{{ title }}</h1>
        <p class="text-lg mt-2 text-emerald-600">{{ description }}</p>
    </div>
  </div>
</template>
