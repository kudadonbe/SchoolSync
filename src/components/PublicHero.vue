<script setup lang="ts">
import { ref, computed } from 'vue'
import HeroSlideTwo from './HeroSlideTwo.vue'
import HeroSlideThree from './HeroSlideThree.vue'
import HeroSlideOne from '@/components/HeroSlideOne.vue'

// Register the HeroTextSlide component



const slides = [
  { component: HeroSlideOne },
  { component: HeroSlideTwo },
  { component: HeroSlideThree }
]

const currentIndex = ref(0)

// Switch slides
const nextSlide = () => {
  currentIndex.value = (currentIndex.value + 1) % slides.length
}

const prevSlide = () => {
  currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length
}

// Get the current slide component
const currentSlide = computed(() => slides[currentIndex.value].component)
</script>


<template>
  <div class="relative w-full h-[500px] flex items-center justify-center overflow-hidden rounded-lg">
    <!-- Dynamic Component -->
    <component :is="currentSlide" class="absolute w-full h-full transition-all duration-500" />

    <!-- Navigation Buttons -->
    <button @click="prevSlide"
      class="absolute left-5 text-white text-2xl bg-black/50 px-2 py-1 rounded">&#10094;</button>
    <button @click="nextSlide"
      class="absolute right-5 text-white text-2xl bg-black/50 px-2 py-1 rounded">&#10095;</button>
  </div>








</template>
