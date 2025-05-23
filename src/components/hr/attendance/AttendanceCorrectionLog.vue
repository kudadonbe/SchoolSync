<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '@/stores/dataStore'
import type { AttendanceCorrectionLog } from '@/types'
import { updateAttendanceCorrectionStatus, deleteAttendanceCorrection } from '@/services/firebaseServices'
import { useAuthStore } from '@/stores/authStore'
import CorrectionForm from '@/components/shared/CorrectionForm.vue'

// Auth and privileges
const authStore = useAuthStore()
const userRole = computed(() => authStore.currentUser?.role ?? '')
const isPrivileged = computed(() =>
  ['developer', 'hr', 'leading_teacher', 'principal'].includes(userRole.value)
)

// Props
const props = defineProps<{ selectedUserId: string | null; startDate: string; endDate: string }>()

// Data store
const dataStore = useDataStore()
const { attendanceCorrectionCache } = storeToRefs(dataStore)

// Form modal state
const showForm = ref(false)
const editingCorrection = ref<AttendanceCorrectionLog | undefined>(undefined)

// Open the form for new or edit
function openForm(correction?: AttendanceCorrectionLog) {
  editingCorrection.value = correction
  showForm.value = true
}

// Close the form and reset
function closeForm() {
  showForm.value = false
  editingCorrection.value = undefined
}

// Delete a correction (user)


async function onDelete(log: AttendanceCorrectionLog) {
  if (!log.id) return;
  if (!confirm('Are you sure you want to delete this correction?')) return;
  try {
    await deleteAttendanceCorrection(log.id);
    // remove from Pinia cache (instant UI update)
    dataStore.removeAttendanceCorrection(
      props.selectedUserId!,
      props.startDate,
      props.endDate,
      log.id
    );
    alert('Correction deleted successfully.');
  } catch (err) {
    console.error('Deletion error:', err);
    alert('Failed to delete correction.');
  }
}



// Approve correction (privileged)
async function approve(log: AttendanceCorrectionLog) {
  if (!log.id) return
  try {
    await updateAttendanceCorrectionStatus(log.id, 'approved', authStore.currentUser!.displayName)
    await load()
    alert('Correction approved successfully.')
  } catch (err) {
    console.error('Approval error:', err)
    alert('Failed to approve correction.')
  }
}

// Reject correction (privileged)
async function reject(log: AttendanceCorrectionLog) {
  if (!log.id) return
  try {
    await updateAttendanceCorrectionStatus(log.id, 'rejected', authStore.currentUser!.uid)
    await load()
    alert('Correction rejected successfully.')
  } catch (err) {
    console.error('Rejection error:', err)
    alert('Failed to reject correction.')
  }
}

// Load corrections from store/Firestore
async function load() {
  if (!props.selectedUserId) return
  await dataStore.loadAttendanceCorrections(
    props.selectedUserId,
    props.startDate,
    props.endDate
  )
}

onMounted(load)
watch([() => props.selectedUserId, () => props.startDate, () => props.endDate], load)

// Helpers for display
const getWeekday = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })
const uniqueCorrections = computed(() => {
  const seen = new Set<string>()
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
    const d = new Date(c.date)
    return c.staffId === props.selectedUserId && d >= start && d <= end
  })
})
const pending = computed(() => correctionsForUser.value.filter(c => c.status === 'pending'))
const reviewed = computed(() => correctionsForUser.value.filter(c => ['approved', 'rejected'].includes(c.status)))
</script>

<template>
  <div class="space-y-8">
    <!-- Pending Corrections -->
    <div>
      <h2 class="text-lg font-semibold text-yellow-700 mb-2">Pending Corrections</h2>
      <button v-if="props.selectedUserId" @click="openForm()" class="mb-2 px-3 py-1 bg-blue-600 text-white rounded">+
        Add Correction</button>
      <table class="w-full table-auto border text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="p-2 border">Date</th>
            <th class="p-2 border">Day</th>
            <th class="p-2 border">Correction</th>
            <th class="p-2 border">Reason</th>
            <th class="p-2 border">Status</th>
            <th class="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in pending" :key="log.id" class="border-t">
            <td class="p-2 border">{{ log.date }}</td>
            <td class="p-2 border">{{ getWeekday(log.date) }}</td>
            <td class="p-2 border">{{ log.requestedTime }} – {{ log.correctionType }}</td>
            <td class="p-2 border">{{ log.reason }}</td>
            <td class="p-2 border text-yellow-700 capitalize">{{ log.status }}</td>
            <td class="p-2 border space-x-2">
              <button v-if="isPrivileged" @click="approve(log)"
                class="px-2 py-1 bg-green-600 text-white rounded">Approve</button>
              <button v-if="isPrivileged" @click="reject(log)"
                class="px-2 py-1 bg-red-600 text-white rounded">Reject</button>
              <button v-if="!isPrivileged && log.staffId === props.selectedUserId" @click="openForm(log)"
                class="px-2 py-1 bg-indigo-500 text-white rounded">Edit</button>
              <button v-if="!isPrivileged && log.staffId === props.selectedUserId" @click="onDelete(log)"
                class="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
            </td>
          </tr>
          <tr v-if="pending.length === 0">
            <td colspan="6" class="p-2 border text-center text-gray-500">No pending corrections.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reviewed Corrections -->
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
            <th class="p-2 border">Reviewed By</th>
            <th class="p-2 border">Reviewed At</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in reviewed" :key="log.id" class="border-t">
            <td class="p-2 border">{{ log.date }}</td>
            <td class="p-2 border">{{ getWeekday(log.date) }}</td>
            <td class="p-2 border">{{ log.requestedTime }} – {{ log.correctionType }}</td>
            <td class="p-2 border">{{ log.reason }}</td>
            <td class="p-2 border capitalize font-semibold"
              :class="{ 'text-green-600': log.status === 'approved', 'text-red-600': log.status === 'rejected' }">{{
                log.status }}</td>
            <td class="p-2 border">{{ log.reviewedBy ?? '-' }}</td>
            <td class="p-2 border">{{ log.reviewedAt ? new Date(log.reviewedAt.seconds * 1000).toLocaleString() : '-' }}
            </td>
          </tr>
          <tr v-if="reviewed.length === 0">
            <td colspan="7" class="p-2 border text-center text-gray-500">No reviewed corrections yet.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Correction Form Modal -->
    <CorrectionForm :show="showForm" :staffId="props.selectedUserId" :startDate="props.startDate"
      :endDate="props.endDate" :date="editingCorrection?.date || ''" :correction="editingCorrection" @submitted="load()"
      @update:show="closeForm" />
  </div>
</template>
