<template>
  <div :class="[viewClass, 'attendance-sheet']">
    <h2 class="attendance-title">Simplified Attendance Sheet</h2>

    <div class="date-inputs">
      <label>From: <input type="date" v-model="startDate" /></label>
      <label>To: <input type="date" v-model="endDate" /></label>
    </div>

    <table class="attendance-table">
      <thead>
        <tr>
          <th>DATE</th>
          <th>DAY</th>
          <th>IN</th>
          <th>L</th>
          <th>BREAKS</th>
          <th>OUT</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(a, i) in attendanceRange" :key="i">
          <td>{{ a.date }}</td>
          <td>{{ a.day }}</td>
          <td>{{ a.firstCheckIn }}</td>
          <td>{{ a.lateMinutes || '' }}</td>
          <td class="breaks-cell">
            <div class="breaks-wrap">
              <div v-for="(b, j) in a.breaks" :key="j">{{ b.time }}</div>
            </div>
          </td>
          <td>{{ a.lastCheckOut }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { formatDateLocal } from '@/utils'
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

<style scoped>
/* === Base Layout Styles === */
.attendance-sheet {
  padding: 1rem;
}

.attendance-title {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.date-inputs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.attendance-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: center;
}

.attendance-table th,
.attendance-table td {
  border: 1px solid #ccc;
  white-space: nowrap;
  padding: 2px 4px;
}

/* === Table Layout Modifiers by View === */

/* Desktop View */
.view-desktop .attendance-title {
  font-size: 20px;
}

.view-desktop .date-inputs label {
  font-size: 14px;
}

.view-desktop .attendance-table {
  font-size: 13px;
}

.view-desktop .attendance-table th:nth-child(1),
.view-desktop .attendance-table td:nth-child(1) {
  width: 80px;
}

/* DATE */
.view-desktop .attendance-table th:nth-child(2),
.view-desktop .attendance-table td:nth-child(2) {
  width: 80px;
}

/* DAY */
.view-desktop .attendance-table th:nth-child(3),
.view-desktop .attendance-table td:nth-child(3),
.view-desktop .attendance-table th:nth-child(6),
.view-desktop .attendance-table td:nth-child(6) {
  width: 60px;
}

/* IN/OUT */
.view-desktop .attendance-table th:nth-child(4),
.view-desktop .attendance-table td:nth-child(4) {
  width: 40px;
}

/* LATE */
.view-desktop .attendance-table th:nth-child(5),
.view-desktop .attendance-table td:nth-child(5) {
  width: 160px;
}

/* BREAKS */

/* Tablet View */
.view-tablet .attendance-title {
  font-size: 16px;
}

.view-tablet .date-inputs label {
  font-size: 12px;
}

.view-tablet .attendance-table {
  font-size: 9px;
}

.view-tablet .attendance-table th:nth-child(1),
.view-tablet .attendance-table td:nth-child(1),
.view-tablet .attendance-table th:nth-child(2),
.view-tablet .attendance-table td:nth-child(2) {
  width: 70px;
}

.view-tablet .attendance-table th:nth-child(3),
.view-tablet .attendance-table td:nth-child(3),
.view-tablet .attendance-table th:nth-child(6),
.view-tablet .attendance-table td:nth-child(6) {
  width: 48px;
}

.view-tablet .attendance-table th:nth-child(4),
.view-tablet .attendance-table td:nth-child(4) {
  width: 32px;
}

.view-tablet .attendance-table th:nth-child(5),
.view-tablet .attendance-table td:nth-child(5) {
  width: 120px;
}

/* Mobile View */
.view-mobile .attendance-title {
  font-size: 13px;
}

.view-mobile .date-inputs label {
  font-size: 10px;
}

.view-mobile .attendance-table {
  font-size: 8px;
}

/* Hide DAY and LATE columns on mobile */
.view-mobile .attendance-table th:nth-child(2),
.view-mobile .attendance-table td:nth-child(2),
.view-mobile .attendance-table th:nth-child(4),
.view-mobile .attendance-table td:nth-child(4) {
  display: none;
}

.view-mobile .attendance-table th:nth-child(1),
.view-mobile .attendance-table td:nth-child(1),
.view-mobile .attendance-table th:nth-child(2),
.view-mobile .attendance-table td:nth-child(2) {
  width: 55px;
}

.view-mobile .attendance-table th:nth-child(3),
.view-mobile .attendance-table td:nth-child(3),
.view-mobile .attendance-table th:nth-child(6),
.view-mobile .attendance-table td:nth-child(6) {
  width: 40px;
}

.view-mobile .attendance-table th:nth-child(4),
.view-mobile .attendance-table td:nth-child(4) {
  width: 26px;
}

.view-mobile .attendance-table th:nth-child(5),
.view-mobile .attendance-table td:nth-child(5) {
  width: 90px;
}

.view-mobile .breaks-wrap {
  font-size: 8px;
}

.breaks-wrap {
  display: flex;
  flex-direction: row;
  /* horizontal layout */
  flex-wrap: nowrap;
  /* prevent line wrapping */
  gap: 4px;
  /* spacing between break pairs */
  white-space: nowrap;
  /* keep content inline */
  overflow-x: auto;
  /* enable horizontal scroll if too wide */
  align-items: center;
  justify-content: center;
}
</style>
