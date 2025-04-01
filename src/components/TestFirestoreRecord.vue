<template>
  <div class="p-4">
    <h2 class="font-semibold text-lg text-green-600">🔎 Firestore Test Record</h2>
    <div v-if="record" class="mt-2 text-sm text-gray-800 space-y-1">
      <div><strong>staffId:</strong> {{ record.staffId }}</div>
      <div><strong>status:</strong> {{ record.status }}</div>
      <div><strong>timestamp:</strong> {{ record.timestamp.toDate().toISOString() }}</div>
      <div><strong>parsed:</strong> {{ parsed.date }} | {{ parsed.day }} | {{ parsed.time }}</div>
    </div>
    <div v-else class="text-gray-500 mt-2">Loading record...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { doc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { parseTimestampToDateTime } from '@/utils/attendanceStoreHelpers'
import type { UploadedAttendanceRecord } from '@/services/db/types'

const record = ref<UploadedAttendanceRecord | null>(null)
const parsed = ref({ date: '', time: '', day: '' })

onMounted(async () => {
  try {
    // 🔧 Replace with your actual document ID (one you know exists)
    const docRef = doc(db, 'staffAttendanceLogs', '000fb814f72b6fa473ee9f00ca7a8601')
    const snapshot = await getDoc(docRef)

    if (snapshot.exists()) {
      const data = snapshot.data() as UploadedAttendanceRecord
      record.value = { id: snapshot.id, ...data }

      // ✅ Safe parsing for Firestore Timestamp
      parsed.value = parseTimestampToDateTime(data.timestamp as Timestamp)
    }
  } catch (err) {
    console.error('Failed to fetch record:', err)
  }
})
</script>
