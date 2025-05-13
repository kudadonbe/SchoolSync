<script setup lang="ts">
// src/components/AttendanceCorrectionLog.vue
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '@/stores/dataStore'
import type { AttendanceCorrectionLog } from '@/types'

import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const userRole = computed(() => authStore.currentUser?.role ?? '')

const isPrivileged = computed(() =>
  ['developer', 'hr', 'leading_teacher', 'principal'].includes(userRole.value)
)


const props = defineProps<{
  selectedUserId: string | null
  startDate: string
  endDate: string
}>()

const dataStore = useDataStore()
const { attendanceCorrectionCache } = storeToRefs(dataStore)

const getWeekday = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })

const uniqueCorrections = computed(() => {
  const seen = new Set()
  return Object.values(attendanceCorrectionCache.value)
    .flat()
    .filter(c => {
      const key = `${c.staffId}-${c.date}-${c.correctionType}-${c.requestedTime}-${c.status}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
})

const correctionsForUser = computed(() => {
  if (!props.selectedUserId) return []
  const start = new Date(props.startDate)
  const end = new Date(props.endDate)

  return uniqueCorrections.value.filter(c => {
    const date = new Date(c.date)
    return (
      c.staffId === props.selectedUserId &&
      date >= start &&
      date <= end
    )
  })
})

const pending = computed(() =>
  correctionsForUser.value.filter(c => c.status === 'pending')
)

const reviewed = computed(() =>
  correctionsForUser.value.filter(
    c => c.status && ['approved', 'rejected'].includes(c.status)
  )
)

const approve = (log: AttendanceCorrectionLog) => {
  console.log('✅ Approving:', log)
  // TODO: Implement Firestore or backend update
}

const reject = (log: AttendanceCorrectionLog) => {
  console.log('❌ Rejecting:', log)
  // TODO: Implement Firestore or backend update
}

const load = async () => {
  if (!props.selectedUserId) return
  await dataStore.loadAttendanceCorrections(
    props.selectedUserId,
    props.startDate,
    props.endDate
  )
}

onMounted(() => load())
watch([() => props.selectedUserId, () => props.startDate, () => props.endDate], load)
</script>

<template>
  <div class="space-y-8">
    <!-- 🟡 Pending Corrections -->
    <div>
      <h2 class="text-lg font-semibold text-yellow-700 mb-2">Pending Corrections</h2>
      <table class="w-full table-auto border text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-2 border">Date</th>
            <th class="p-2 border">Day</th>
            <th class="p-2 border">Correction</th>
            <th class="p-2 border">Reason</th>
            <th class="p-2 border">Status</th>
            <th v-if="isPrivileged" class="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in pending" :key="log.id" class="border-t">
            <td class="p-2 border">{{ log.date }}</td>
            <td class="p-2 border">{{ getWeekday(log.date) }}</td>
            <td class="p-2 border">{{ log.requestedTime }} – {{ log.correctionType }}</td>
            <td class="p-2 border">{{ log.reason }}</td>
            <td class="p-2 border text-yellow-700 capitalize">{{ log.status }}</td>
            <td v-if="isPrivileged" class="p-2 border space-x-2">
              <button @click="approve(log)" class="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
              <button @click="reject(log)" class="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
            </td>
          </tr>
          <tr v-if="pending.length === 0">
            <td colspan="6" class="p-2 border text-center text-gray-500">No pending corrections.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ✅/❌ Reviewed Corrections -->
    <div>
      <h2 class="text-lg font-semibold text-gray-700 mb-2">Reviewed Corrections</h2>
      <table class="w-full table-auto border text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-2 border">Date</th>
            <th class="p-2 border">Day</th>
            <th class="p-2 border">Correction</th>
            <th class="p-2 border">Reason</th>
            <th class="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in reviewed" :key="log.id" class="border-t">
            <td class="p-2 border">{{ log.date }}</td>
            <td class="p-2 border">{{ getWeekday(log.date) }}</td>
            <td class="p-2 border">{{ log.requestedTime }} – {{ log.correctionType }}</td>
            <td class="p-2 border">{{ log.reason }}</td>
            <td
              class="p-2 border capitalize font-semibold"
              :class="{
                'text-green-600': log.status === 'approved',
                'text-red-600': log.status === 'rejected'
              }"
            >
              {{ log.status }}
            </td>
          </tr>
          <tr v-if="reviewed.length === 0">
            <td colspan="5" class="p-2 border text-center text-gray-500">No reviewed corrections yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
