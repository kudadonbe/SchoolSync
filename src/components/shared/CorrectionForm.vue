<script setup lang="ts">
import { ref, toRefs, watch, computed } from 'vue'
import { submitAttendanceCorrection, updateAttendanceCorrection, deleteAttendanceCorrection } from '@/services/firebaseServices'
import { useDataStore } from '@/stores/dataStore'
import type { AttendanceCorrectionLog } from '@/types'

const props = defineProps<{
  show: boolean
  staffId: string | null
  startDate: string
  endDate: string
  date: string
  correction?: AttendanceCorrectionLog
}>()

const { show, staffId, startDate, endDate, date, correction } = toRefs(props)

const editableDate = ref(false)
const selectedDate = ref(date.value)

watch([date, editableDate], ([newDate, editable]) => {
  if (!editable) selectedDate.value = newDate
})

const correctionType = ref('')
const correctionTime = ref('')
const correctionReason = ref('')

const dataStore = useDataStore()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'submitted'): void
}>()

watch([show, correction], ([visible]) => {
  if (visible) {
    if (correction.value) {
      correctionType.value = correction.value.correctionType
      correctionTime.value = correction.value.requestedTime
      correctionReason.value = correction.value.reason
      selectedDate.value = correction.value.date
      editableDate.value = false
    } else {
      correctionType.value = ''
      correctionTime.value = ''
      correctionReason.value = ''
      selectedDate.value = date.value
      editableDate.value = false
    }
  }
})

const isEditing = computed(() => !!correction.value)
const isValid = computed(() =>
  !!staffId.value && !!correctionType.value && !!correctionTime.value && !!correctionReason.value
)

async function onSave() {
  if (!isValid.value) return
  try {
    if (isEditing.value && correction.value?.id) {
      await updateAttendanceCorrection({
        id: correction.value.id,
        data: {
          correctionType: correctionType.value,
          requestedTime: correctionTime.value,
          reason: correctionReason.value,
        },
      })
    } else {
      await submitAttendanceCorrection({
        staffId: staffId.value!,
        date: selectedDate.value,
        correctionType: correctionType.value,
        requestedTime: correctionTime.value,
        reason: correctionReason.value,
      })
    }
    await dataStore.loadAttendanceCorrections(
      staffId.value!,
      startDate.value,
      endDate.value
    )
    emit('submitted')
    emit('update:show', false)
  } catch (err) {
    console.error('❌ Failed to save correction:', err)
    alert('Operation failed—please try again.')
  }
}

async function onDelete() {
  if (!correction.value?.id) return
  const confirmDelete = confirm('Are you sure you want to delete this correction?')
  if (!confirmDelete) return
  try {
    await deleteAttendanceCorrection(correction.value.id)
    await dataStore.loadAttendanceCorrections(
      staffId.value!,
      startDate.value,
      endDate.value
    )
    emit('submitted')
    emit('update:show', false)
  } catch (err) {
    console.error('❌ Failed to delete correction:', err)
    alert('Deletion failed—please try again.')
  }
}

function onCancel() {
  emit('update:show', false)
}
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">
          {{ isEditing ? 'Edit Correction' : 'Apply for Correction' }}
        </h3>
        <form @submit.prevent="onSave" class="space-y-4">
          <div>
            <label class="block text-sm font-medium">Date</label>
            <div class="flex items-center gap-2">
              <input
                v-if="editableDate"
                type="date"
                v-model="selectedDate"
                class="border rounded px-2 py-1 w-full"
              />
              <input
                v-else
                type="text"
                :value="selectedDate"
                disabled
                class="border rounded px-2 py-1 w-full bg-gray-100"
              />
              <button
                type="button"
                @click="editableDate = !editableDate"
                class="text-xs text-blue-600 underline"
              >
                {{ editableDate ? 'Use original date' : 'Edit date' }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium">Correction Type</label>
            <select v-model="correctionType" class="border rounded px-2 py-1 w-full" required>
              <option disabled value="">-- Select --</option>
              <option value="checkIn">Check-In</option>
              <option value="checkOut">Check-Out</option>
              <option value="breakIn">Break-In</option>
              <option value="breakOut">Break-Out</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium">Correct Time</label>
            <input type="time" step="1" v-model="correctionTime" class="border rounded px-2 py-1 w-full" required />
          </div>
          <div>
            <label class="block text-sm font-medium">Reason</label>
            <textarea v-model="correctionReason" rows="2" class="border rounded px-2 py-1 w-full" required></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" @click="onCancel" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              Cancel
            </button>
            <button v-if="isEditing" type="button" @click="onDelete" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Delete
            </button>
            <button type="submit" :disabled="!isValid" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {{ isEditing ? 'Update' : 'Submit' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>
