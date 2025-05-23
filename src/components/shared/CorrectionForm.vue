<script setup lang="ts">
import { ref, toRefs, watch, computed } from 'vue'
import { submitAttendanceCorrection } from '@/services/firebaseServices'
import { useDataStore } from '@/stores/dataStore'

const props = defineProps<{
  show: boolean
  staffId: string | null
  startDate: string
  endDate: string
  date: string
}>()
const { show, staffId, startDate, endDate, date } = toRefs(props)

// Internal form state
const correctionType = ref('')
const correctionTime = ref('')
const correctionReason = ref('')

const dataStore = useDataStore()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'submitted'): void
}>()

// Reset form fields on open
watch(show, (visible) => {
  if (visible) {
    correctionType.value = ''
    correctionTime.value = ''
    correctionReason.value = ''
  }
})

// Computed validation
const isValid = computed(() =>
  !!staffId.value && !!correctionType.value && !!correctionTime.value && !!correctionReason.value
)

async function onSubmit() {
  if (!isValid.value) return
  try {
    await submitAttendanceCorrection({
      staffId: staffId.value!,
      date: date.value,
      correctionType: correctionType.value,
      requestedTime: correctionTime.value,
      reason: correctionReason.value,
    })
    await dataStore.loadAttendanceCorrections(
      staffId.value!,
      startDate.value,
      endDate.value
    )
    emit('submitted')
    emit('update:show', false)
  } catch (err) {
    console.error('❌ Failed to submit correction:', err)
    alert('Submission failed—please try again.')
  }
}

function onCancel() {
  emit('update:show', false)
}
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog"
      aria-modal="true">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold mb-4">Apply for Correction</h3>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium">Date</label>
            <input type="text" :value="date" disabled class="border rounded px-2 py-1 w-full bg-gray-100" />
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
            <button type="submit" :disabled="!isValid"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>
