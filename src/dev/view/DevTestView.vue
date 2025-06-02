<template>
  <div class="p-6 space-y-6">
    <h1 class="text-xl font-bold">Development Test Area</h1>

    <div class="grid gap-6 md:grid-cols-2">
      <!-- IndexedDB testing area -->
      <div class="border rounded-md p-4">
        <h2 class="text-lg font-semibold mb-2">IndexedDB Test</h2>
        <IndexedDBTest />
      </div>

      <!-- Firestore collection uploader -->
      <div class="border rounded-md p-4">
        <h2 class="text-lg font-semibold mb-2">Firestore Uploader</h2>
        <UploadCollections />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// file: src/views/dev/DevTestView.vue
import IndexedDBTest from '@/dev/test/IndexedDBTest.vue'
import UploadCollections from '@/dev/test/UploadCollections.vue'
</script>
