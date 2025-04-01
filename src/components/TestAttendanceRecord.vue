<template>
  <div class="p-4">
    <h2 class="text-green-600 font-semibold text-lg mb-4">🧪 Test Attendance Record</h2>

    <table class="w-full table-auto border border-gray-200 text-[10px] md:text-sm">
      <thead class="bg-green-600 text-white text-[10px] md:text-sm">
        <tr>
          <th class="p-2 md:p-3 text-center">DATE</th>
          <th class="p-2 md:p-3 text-center hidden md:table-cell">DAY</th>
          <th class="p-2 md:p-3 text-center">IN</th>
          <th class="p-2 md:p-3 text-center">LATE</th>
          <th class="p-2 md:p-3 text-left">BREAKS</th>
          <th class="p-2 md:p-3 text-center">OUT</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="record" class="border-b border-gray-200">
          <td class="p-1 md:p-3 text-center">{{ record.date }}</td>
          <td class="p-1 md:p-3 text-left hidden md:table-cell">{{ record.day }}</td>
          <td class="p-1 md:p-3 text-center">{{ record.firstCheckIn || '--' }}</td>
          <td class="p-1 md:p-3 text-center text-red-700">{{ record.lateMinutes ? `${record.lateMinutes} min` : '' }}
          </td>
          <td class="p-1 md:p-3 text-left whitespace-normal">
            <span v-for="(b, i) in record.breaks" :key="i" class="inline-block px-1"
              :class="{ 'bg-red-100 text-red-700': b.missing }">
              {{ b.time }} {{ b.type }}
            </span>
          </td>
          <td class="p-1 md:p-3 text-center">{{ record.lastCheckOut || '--' }}</td>
        </tr>
        <tr v-else>
          <td colspan="6" class="text-center p-4 text-gray-500">Loading record...</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { parseTimestampToDateTime } from '@/utils/attendanceStoreHelpers'
import type { UploadedAttendanceRecord } from '@/services/db/types'
import type { ProcessedAttendance } from '@/types'

// 🔧 Replace with your known Firestore document ID
const TEST_DOC_ID = '000fb814f72b6fa473ee9f00ca7a8601'

const record = ref<ProcessedAttendance | null>(null)

onMounted(async () => {
  const docRef = doc(db, 'staffAttendanceLogs', TEST_DOC_ID)
  const snapshot = await getDoc(docRef)

  if (snapshot.exists()) {
    const data = snapshot.data() as UploadedAttendanceRecord
    const parsed = parseTimestampToDateTime(data.timestamp)

    record.value = {
      date: parsed.date,
      day: parsed.day,
      firstCheckIn: data.workCode === 0 ? parsed.time : '',
      lastCheckOut: data.workCode === 1 ? parsed.time : '',
      lateMinutes: 0,
      isHoliday: false,
      isWeekend: false,
      missingCheckIn: false,
      missingCheckOut: false,
      breaks: [],
      lastBreakTimes: {
        'BREAK IN': null,
        'BREAK OUT': null,
      },
    }
  }
})
</script>
