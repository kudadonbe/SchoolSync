<template>
  <div class="p-6">
    <h1 class="text-xl font-bold">Development Test Area</h1>

    <div class="">
      <!-- Attendance Data testing area -->
      <!-- <div class="border rounded-md p-4">
        <AttendanceDataTest />
      </div> -->

      <!-- Firestore collection uploader -->
      <!-- <div class="border rounded-md p-4">
        <h2 class="text-lg font-semibold mb-2">Firestore Uploader</h2>
        <UploadCollections />
      </div> -->

      <div>
        <!-- Attendance Correction Data testing area -->
        <div class="border rounded-md p-4">
          <AttendanceCorrectionDataTest />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// file: src/views/dev/DevTestView.vue
// import UploadCollections from '@/dev/test/UploadCollections.vue'
import AttendanceDataTest from '@/dev/test/AttendanceDataTest.vue'
import AttendanceCorrectionDataTest from '../test/AttendanceCorrectionDataTest.vue';
</script>
