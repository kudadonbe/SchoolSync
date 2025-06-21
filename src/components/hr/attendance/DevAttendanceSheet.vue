<template>
  <div class="bg-white p-4 md:p-6 shadow-md rounded-lg mt-6">
    <!-- Attendance Sheet Heading -->
    <div class="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-4">
      <h2 class="text-xs md:text-lg font-semibold text-green-700">
        ATTENDANCE
      </h2>

      <!-- Buttons (hidden on mobile) -->


      <!-- Date Inputs -->
      <div class="flex gap-2 md:gap-4 mt-2 md:mt-0">
        <div>
          <label class="text-xs md:text-base font-semibold text-green-700">FROM: </label>
          <input type="date" v-model="startDate" class="p-1 md:p-2 text-xs md:text-base font-semibold text-green-500" />
        </div>
        <div>
          <label class="text-xs md:text-base font-semibold text-green-700">TO: </label>
          <input type="date" v-model="endDate" class="p-1 md:p-2 text-xs md:text-base font-semibold text-green-500" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full table-auto border border-gray-300 text-xs md:text-sm">
        <thead class="bg-green-600 text-white">
          <tr>
            <th class="p-2 text-center w-20 md:w-24">DATE</th>
            <th class="p-2 text-center hidden md:table-cell w-20">DAY</th>
            <th class="p-2 text-center w-12 md:w-16">IN</th>
            <th class="p-2 text-center hidden md:table-cell w-20">LATE</th>
            <th class="p-2 text-left w-32 md:w-auto">BREAKS</th>
            <th class="p-2 text-center w-12 md:w-16">OUT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in attendanceRange" :key="index"
            class="border-b border-gray-200 text-[10px] md:text-sm">
            <td :class="['p-1 text-center', record.isWeekend || record.isHoliday ? 'bg-gray-100 text-red-600' : '']">
              {{ formatDateDDMMYYYY(record.date) }}
            </td>
            <td class="p-1 text-center hidden md:table-cell"
              :class="record.isWeekend || record.isHoliday ? 'bg-gray-100 text-red-600' : ''">
              {{ record.day }}
            </td>
            <td class="p-1 text-center" :class="{
              'bg-red-200 text-red-700': record.missingCheckIn,
              'bg-gray-100 text-gray-700': record.isWeekend || record.isHoliday
            }">
              <span :class="record.correctedCheckIn ? 'text-yellow-600 font-semibold' : ''">
                {{ record.firstCheckIn || '--' }}
              </span>
            </td>
            <td class="p-1 text-center hidden md:table-cell text-red-700"
              :class="record.isWeekend || record.isHoliday ? 'bg-gray-100' : ''">
              {{ record.lateMinutes > 0 ? `${record.lateMinutes} min` : '' }}
            </td>
            <td class="p-1 text-left whitespace-nowrap overflow-x-auto flex flex-row gap-1 items-center justify-start">
              <template v-for="(pair, idx) in formatBreakPairs(record.breaks)" :key="idx">
                <span class="inline-block">
                  [
                  <span class="px-1 rounded" :class="pair[0] === '--' ? 'bg-red-200 text-red-700' : ''">{{ pair[0]
                    }}</span>
                  |
                  <span class="px-1 rounded" :class="pair[1] === '--' ? 'bg-red-200 text-red-700' : ''">{{ pair[1]
                    }}</span>
                  ]
                </span>
                <span v-if="idx < formatBreakPairs(record.breaks).length - 1">,</span>
              </template>
            </td>
            <td class="p-1 text-center" :class="{
              'bg-red-200 text-red-700': record.missingCheckOut,
              'bg-gray-100 text-gray-700': record.isWeekend || record.isHoliday
            }">
              <span :class="record.correctedCheckOut ? 'text-yellow-600 font-semibold' : ''">
                {{ record.lastCheckOut || '--' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { formatDateLocal, formatDateDDMMYYYY, formatBreakPairs } from '@/utils'
import { generateAttendanceRange } from '@/utils/experimentalHelpers'
import type { ProcessedAttendance } from '@/types'
import { sampleData } from '@/data/sampleData'

const today = new Date()
const startDate = ref(formatDateLocal(new Date(today.getTime() - 86400000 * 6)))
const endDate = ref(formatDateLocal(today))

const sampleAttendance: ProcessedAttendance[] = sampleData

const attendanceRange = computed<ProcessedAttendance[]>(() =>
  generateAttendanceRange(startDate.value, endDate.value, sampleAttendance)
)

const viewClass = ref('view-desktop')

function setViewClass() {
  const width = window.innerWidth
  if (width < 480) viewClass.value = 'view-mobile'
  else if (width < 768) viewClass.value = 'view-tablet'
  else viewClass.value = 'view-desktop'
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', setViewClass)
})

onMounted(() => {
  setViewClass()
  window.addEventListener('resize', setViewClass)
})


</script>
