<script setup lang="ts">
import { ref } from 'vue'

// Sample notices
const notices = ref([
  { id: 1, title: "School Reopening", date: "March 20, 2025", content: "School will reopen for the new term. Please check your class schedules." },
  { id: 2, title: "Exam Schedule Released", date: "March 25, 2025", content: "The term exam schedule is now available. Check the notice board for details." },
  { id: 3, title: "Parent-Teacher Meeting", date: "April 5, 2025", content: "Parents are invited for the PTM. Please confirm your attendance." }
])
</script>

<template>
  <div class="w-full mx-auto p-6 m-6 bg-white rounded-lg shadow-lg">
    <!-- Notice Board Header -->
    <div class="bg-green-800 text-white text-center p-4 rounded-t-lg">
      <h1 class="text-2xl font-bold">Notice Board</h1>
    </div>

    <!-- Notice List -->
    <div class="space-y-4 p-4">
      <div v-for="notice in notices" :key="notice.id"
        class="bg-emerald-50 border border-emerald-300 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
        <h2 class="text-lg font-semibold text-emerald-900">{{ notice.title }}</h2>
        <p class="text-sm text-emerald-700">{{ notice.date }}</p>
        <p class="mt-2 text-emerald-800">{{ notice.content }}</p>
      </div>
    </div>
  </div>
</template>
