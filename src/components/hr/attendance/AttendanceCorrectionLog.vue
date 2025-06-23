<script setup lang="ts">
// file: src/components/hr/attendance/AttendanceCorrectionLog.vue

import debounce from 'lodash/debounce'

import { computed, ref, watch } from 'vue'
import type { AttendanceCorrectionLog } from '@/types'
import { formatDateDDMMYYYY } from '@/utils'

import { storeToRefs } from 'pinia'
// import { useDataStore } from '@/stores/dataStore'
import { useAttendanceCorrectionsStore } from '@/stores/data/attendanceCorrections';
import { useAuthStore } from '@/stores/authStore'

import CorrectionForm from '@/components/shared/CorrectionForm.vue'

// Auth and privileges
const authStore = useAuthStore()
const userRole = computed(() => authStore.currentUser?.role ?? '')
const isPrivileged = computed(() =>
  ['developer', 'hr', 'leading_teacher', 'principal', 'administrator'].includes(userRole.value),
)

// Props
const props = defineProps<{ selectedUserId: string | null; startDate: string; endDate: string }>()

// Data store
// const dataStore = useDataStore()
const attendanceCorrectionDataStore = useAttendanceCorrectionsStore()

// const { attendanceCorrections } = storeToRefs(dataStore)
const { corrections: attendanceCorrections } = storeToRefs(attendanceCorrectionDataStore)

// Form modal state
const showForm = ref(false)
const editingCorrection = ref<AttendanceCorrectionLog | undefined>(undefined)

function openForm(correction?: AttendanceCorrectionLog) {
  editingCorrection.value = correction
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  editingCorrection.value = undefined
}


async function onDelete(log: AttendanceCorrectionLog) {
  if (!log.id) return
  if (!confirm('Are you sure you want to delete this correction?')) return
  try {
    const { success, deleted } = await attendanceCorrectionDataStore.deleteCorrection(log.id)
    if (success) {
      console.log(`Deleted correction: ${log.id}`, deleted)
    } else {
      console.error(`❌ Failed to delete correction: ${log.id}`, deleted)
      alert('Failed to delete correction. It may not exist or has already been deleted.')
      return
    }

    await load()
    alert('Correction deleted successfully.')
  } catch (err) {
    console.error('Deletion error:', err)
    alert('Failed to delete correction.')
  }
}

async function approve(log: AttendanceCorrectionLog) {
  if (!log.id) return
  try {
    const reviewer = authStore.currentUser!.displayName

    const approved = {
      ...log,
      status: 'approved',
      reviewedBy: reviewer,
      reviewedAt: new Date(),
    }

    await attendanceCorrectionDataStore.updateCorrection(approved)
    await load()
    alert('Correction approved successfully.')
  } catch (err) {
    console.error('Approval error:', err)
    alert('Failed to approve correction.')
  }
}

async function reject(log: AttendanceCorrectionLog) {
  if (!log.id) return
  try {
    const reviewer = authStore.currentUser!.displayName
    const rejected = {
      ...log,
      status: 'rejected',
      reviewedBy: reviewer,
      reviewedAt: new Date(),
    }
    const rejectedCorection = await attendanceCorrectionDataStore.updateCorrection(rejected)
    console.log(`Rejected correction: ${log.id}`, rejectedCorection);

    await load()
    alert('Correction rejected successfully.')
  } catch (err) {
    console.error('Rejection error:', err)
    alert('Failed to reject correction.')
  }
}

async function load(force = false) {
  if (!props.selectedUserId) return
  await attendanceCorrectionDataStore.loadCorrections(
    props.selectedUserId,
    props.startDate,
    props.endDate,
    force,
  )
  // await logIndexedDBCorrections(props.selectedUserId)
}

const debouncedLoad = debounce(load, 300)

watch(
  [() => props.selectedUserId, () => props.startDate, () => props.endDate],
  () => {
    if (props.selectedUserId) debouncedLoad()
  },
  { immediate: true },
)
watch(
  () => attendanceCorrections.value,
  (val) => {
    console.log('✅ attendanceCorrections updated:', val.length)
  },
)

const getWeekday = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' })

const uniqueCorrections = computed(() => {
  const seen = new Set<string>()
  return attendanceCorrections.value.filter((c) => {
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
  return uniqueCorrections.value.filter((c) => {
    const d = new Date(c.date)
    return c.staffId === props.selectedUserId && d >= start && d <= end
  })
})

const pending = computed(() =>
  correctionsForUser.value
    .filter((c) => c.status === 'pending')
    .sort((a, b) => a.date.localeCompare(b.date))
)
const reviewed = computed(() =>
  correctionsForUser.value
    .filter((c) => ['approved', 'rejected'].includes(c.status))
    .sort((a, b) => a.date.localeCompare(b.date))
)
</script>

<template>
  <div class="space-y-8">
    <!-- Pending Corrections -->
    <div>
      <h2 class="text-xs md:text-lg font-semibold text-yellow-700 mb-2">Pending Corrections</h2>
      <button v-if="props.selectedUserId" @click="openForm()"
        class="mb-2 px-3 py-1 text-xs md:text-sm bg-blue-600 text-white rounded">
        + Add Correction
      </button>

      <div class="overflow-x-auto relative">
        <table class="w-full table-fixed border text-[10px] md:text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-1 md:p-2 border border-gray-300 text-center min-w-[100px] sticky left-0 bg-gray-100 z-10">
                Date</th>
              <th class="p-1 md:p-2 border border-gray-300 hidden md:table-cell">Day</th>
              <th class="p-1 md:p-2 border border-gray-300">Correction</th>
              <th class="p-1 md:p-2 border border-gray-300">Reason</th>
              <th class="p-1 md:p-2 border border-gray-300">Status</th>
              <th class="p-1 md:p-2 border border-gray-300 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in pending" :key="log.id" class="border-t">
              <td class="p-1 md:p-2 border border-gray-300 text-center min-w-[100px] sticky left-0 bg-white z-0">
                {{ formatDateDDMMYYYY(log.date) }}
              </td>
              <td class="p-1 md:p-2 border border-gray-300 hidden md:table-cell">{{ getWeekday(log.date) }}</td>
              <td class="p-1 md:p-2 border border-gray-300 break-words">{{ log.requestedTime }} – {{ log.correctionType
              }}</td>
              <td class="p-1 md:p-2 border border-gray-300 break-words">{{ log.reason }}</td>
              <td class="p-1 md:p-2 border border-gray-300 text-yellow-700 capitalize">{{ log.status }}</td>
              <td class="p-1 md:p-2 border border-gray-300 text-center">
                <div class="flex flex-wrap justify-center gap-1">
                  <!-- Approve -->
                  <button v-if="isPrivileged" @click="approve(log)"
                    class="px-2 py-1 text-green-600 border border-green-600 text-xs rounded hover:bg-green-600 hover:text-white transition">
                    <span class="md:hidden">✅</span>
                    <span class="hidden md:inline">Approve</span>
                  </button>

                  <!-- Reject -->
                  <button v-if="isPrivileged" @click="reject(log)"
                    class="px-2 py-1 text-red-600 border border-red-600 text-xs rounded hover:bg-red-600 hover:text-white transition">
                    <span class="md:hidden">❌</span>
                    <span class="hidden md:inline">Reject</span>
                  </button>

                  <!-- Edit -->
                  <button v-if="!isPrivileged && log.staffId === props.selectedUserId" @click="openForm(log)"
                    class="px-2 py-1 text-indigo-600 border border-indigo-600 text-xs rounded hover:bg-indigo-600 hover:text-white transition">
                    <span class="md:hidden">✏️</span>
                    <span class="hidden md:inline">Edit</span>
                  </button>

                  <!-- Delete -->
                  <button v-if="!isPrivileged && log.staffId === props.selectedUserId" @click="onDelete(log)"
                    class="px-2 py-1 text-red-500 border border-red-500 text-xs rounded hover:bg-red-500 hover:text-white transition">
                    <span class="md:hidden">🗑️</span>
                    <span class="hidden md:inline">Delete</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="pending.length === 0">
              <td colspan="6" class="p-1 md:p-2 border border-gray-300 text-center text-gray-500">
                No pending corrections.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reviewed Corrections -->
    <div>
      <h2 class="text-xs md:text-lg font-semibold text-gray-700 mb-2">Reviewed Corrections</h2>
      <div class="overflow-x-auto">
        <table class="w-full table-fixed border text-[10px] md:text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-1 md:p-2 border border-gray-300 text-center min-w-[100px] sticky left-0 bg-gray-100 z-10">
                Date</th>
              <th class="p-1 md:p-2 border border-gray-300 hidden md:table-cell">Day</th>
              <th class="p-1 md:p-2 border border-gray-300">Correction</th>
              <th class="p-1 md:p-2 border border-gray-300">Reason</th>
              <th class="p-1 md:p-2 border border-gray-300">Status</th>
              <th class="p-1 md:p-2 border border-gray-300">Reviewed By</th>
              <th class="p-1 md:p-2 border border-gray-300 hidden md:table-cell">Reviewed At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in reviewed" :key="log.id" class="border-t">
              <td class="p-1 md:p-2 border border-gray-300 text-center min-w-[100px] sticky left-0 bg-white z-0">
                {{ formatDateDDMMYYYY(log.date) }}
              </td>
              <td class="p-1 md:p-2 border border-gray-300 hidden md:table-cell">{{ getWeekday(log.date) }}</td>
              <td class="p-1 md:p-2 border border-gray-300 break-words">{{ log.requestedTime }} – {{ log.correctionType
              }}</td>
              <td class="p-1 md:p-2 border border-gray-300 break-words">{{ log.reason }}</td>
              <td class="p-1 md:p-2 border border-gray-300 capitalize font-semibold" :class="{
                'text-green-600': log.status === 'approved',
                'text-red-600': log.status === 'rejected'
              }">
                {{ log.status }}
              </td>
              <td class="p-1 md:p-2 border border-gray-300 break-words">{{ log.reviewedBy ?? '-' }}</td>
              <td class="p-1 md:p-2 border border-gray-300 break-words hidden md:table-cell">{{ log.reviewedAt ?? '-' }}
              </td>
            </tr>
            <tr v-if="reviewed.length === 0">
              <td colspan="7" class="p-1 md:p-2 border border-gray-300 text-center text-gray-500">
                No reviewed corrections yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Correction Form Modal -->
    <CorrectionForm :show="showForm" :staffId="props.selectedUserId" :startDate="props.startDate"
      :endDate="props.endDate" :date="editingCorrection?.date || ''" :correction="editingCorrection" @submitted="load"
      @update:show="closeForm" />
  </div>
</template>
