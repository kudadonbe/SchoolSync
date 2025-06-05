<script setup lang="ts">
// src/components/AttendanceSheet.vue
import type { ProcessedAttendance, AttendanceCorrectionLog, DisplayAttendanceRecord, RemovedPunchLog, BreakType, BreakPunch } from '@/types'
import { ref, computed, watch, onMounted } from 'vue'
import { getScheduledInTime, getScheduledOutTime, normalizePunchStatus, calculateLateMinutes, isHoliday } from '@/utils'
import { getCurrentWeek, sortPunchRecords, newAttendanceRecord, formatDateLocal, getCurrentMonth } from '@/utils'
import { getCurrentYear, getPayablePeriod, getPaidPeriod, formatTimeHHMMSS, extractHHMM, cleanDisplayAttendanceLogs } from '@/utils'
import { formatDateDDMMYYYY, formatBreakPairs } from '@/utils'

import { useDataStore } from '@/stores/dataStore'
import { storeToRefs } from 'pinia'

const props = defineProps<{ selectedUserId: string | null }>()
const today = new Date()

const dataStore = useDataStore()
const { staffList, dutyRoster, attendancePolicies, attendanceCorrections, attendanceLogs } = storeToRefs(dataStore)


const correctionsMap = computed(() => {
  const map = new Map<string, AttendanceCorrectionLog[]>()
  attendanceCorrections.value
    .filter((c) => c.staffId === props.selectedUserId)
    .forEach((c) => {
      const key = `${c.date}_${c.correctionType}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    })
  return map
})

const startDate = ref(formatDateLocal(today))
const endDate = ref(formatDateLocal(today))

const setCurrentWeek = () => {
  const { start, end } = getCurrentWeek()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}
const setCurrentMonth = () => {
  const { start, end } = getCurrentMonth()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}
const setCurrentYear = () => {
  const { start, end } = getCurrentYear()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}
const setPayablePeriod = () => {
  const { start, end } = getPayablePeriod()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}
const setPaidPeriod = () => {
  const { start, end } = getPaidPeriod()
  startDate.value = formatDateLocal(start)
  endDate.value = formatDateLocal(end)
}



const load = async () => {
  if (!props.selectedUserId) return
  await dataStore.loadAttendance(props.selectedUserId as string, startDate.value, endDate.value)
  // console.log('[Debug] Loaded Logs:', dataStore.attendanceLogs)
  await dataStore.loadAttendanceCorrections(props.selectedUserId as string, startDate.value, endDate.value)

}
let hasLogged = false
onMounted(() => {
  setCurrentWeek()
  if (props.selectedUserId) load()
})

watch(
  [() => props.selectedUserId, startDate, endDate],
  () => {
    hasLogged = false
    load() // if you want to re-fetch too (optional, already handled elsewhere)
  }
)




const dataRefersh = async () => {
  if (!props.selectedUserId) return
  await dataStore.loadAttendance(
    props.selectedUserId,
    startDate.value,
    endDate.value,
    true
  )
  await dataStore.loadAttendanceCorrections(
    props.selectedUserId,
    startDate.value,
    endDate.value,
    true
  )
  console.log('Attendance corrections refreshed')
}

const refeshDayRecords = async (day: string) => {
  if (!props.selectedUserId) return
  await dataStore.loadAttendance(
    props.selectedUserId,
    day,
    day,
    true
  )
  console.log('Attendance records refreshed')
  await dataStore.loadAttendanceCorrections(
    props.selectedUserId,
    day,
    day,
    true
  )
  console.log('Attendance corrections refreshed')
}


const cleanedAttendance = computed((): { records: DisplayAttendanceRecord[]; removed: RemovedPunchLog[] } => {
  const userId = props.selectedUserId
  if (!userId) {
    return {
      records: [],
      removed: [],
    }

  }

  const rawDisplayRecords = attendanceLogs.value
  const corrections = attendanceCorrections.value.filter(c => c.staffId === userId)

  const thresholdSeconds = 60
  const skipCancellation = false
  const skipNoiseFilter = false

  const { iClockLog, correctionLog, removed } = cleanDisplayAttendanceLogs(rawDisplayRecords, corrections, thresholdSeconds, skipCancellation, skipNoiseFilter)
  const finalDisplayRecords = [...iClockLog, ...correctionLog]

  if (!hasLogged && finalDisplayRecords.length > 0) {
    console.groupCollapsed('🧹 Cleaned Attendance Logs')
    console.log('iClock:', iClockLog)
    console.log('Corrections:', correctionLog)
    console.log('Removed:', removed)
    console.groupEnd()
    hasLogged = false
  }

  return {
    records: sortPunchRecords(finalDisplayRecords),
    removed,
  }
})



const filteredRecords = computed<ProcessedAttendance[]>(() => {
  const cleaned = cleanedAttendance.value as { records: DisplayAttendanceRecord[]; removed: RemovedPunchLog[] }
  // console.log('cleaned records', cleaned);


  const userRecords = sortPunchRecords(cleaned.records)

  const removedKeys = new Set(
    cleaned.removed.map(r => `${r.record.date}_${formatTimeHHMMSS(r.record.time)}_${r.record.status}`)
  )

  const recordsMap = new Map<string, ProcessedAttendance>()

  userRecords.forEach((record) => {
    const originalStatus = record.status
    record.time = formatTimeHHMMSS(record.time)
    if (!recordsMap.has(record.date)) {
      recordsMap.set(record.date, newAttendanceRecord(record.date))
    }
    const dayRecord = recordsMap.get(record.date)!

    const scheduledInTime = getScheduledInTime(
      record.user_id,
      record.date,
      dayRecord.firstCheckIn,
      dutyRoster.value,
      staffList.value,
    )
    const scheduledOutTime = getScheduledOutTime(scheduledInTime)

    record.status = normalizePunchStatus(
      record.time,
      scheduledInTime,
      scheduledOutTime,
      record.status,
    )

    if (record.status === 'CHECK IN' && !dayRecord.firstCheckIn)
      dayRecord.firstCheckIn = record.time

    if (
      dayRecord.firstCheckIn &&
      !dayRecord.isWeekend &&
      !isHoliday(record.date, dutyRoster.value.publicHolidays, dutyRoster.value.specialHolidays)
    ) {
      dayRecord.lateMinutes = calculateLateMinutes(
        scheduledInTime,
        dayRecord.firstCheckIn,
        attendancePolicies.value.late.grace_period_minutes,
      )
    }

    if (record.status === 'CHECK OUT') dayRecord.lastCheckOut = record.time

    if (originalStatus === 'BREAK IN' || originalStatus === 'BREAK OUT') {
      dayRecord.breaks.push({
        time: record.time,
        type: originalStatus === 'BREAK IN' ? '(IN)' : '(OUT)' as BreakType,
        missing: false,
      })
    }
  })

  const daysArray: ProcessedAttendance[] = []
  const currentDate = new Date(startDate.value)
  const end = new Date(endDate.value)

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayName = currentDate.toLocaleString('en-us', { weekday: 'long' })
    const isWeekend = dayName === 'Friday' || dayName === 'Saturday'
    const isHolidayDate = isHoliday(
      dateStr,
      dutyRoster.value.publicHolidays,
      dutyRoster.value.specialHolidays,
    )

    const record = recordsMap.get(dateStr) || newAttendanceRecord(dateStr)
    record.isHoliday = isHolidayDate
    record.day = dayName
    record.isWeekend = isWeekend
    record.missingCheckIn = !record.firstCheckIn && !isWeekend && !isHolidayDate
    record.missingCheckOut = !record.lastCheckOut && !isWeekend && !isHolidayDate

    const checkInCorrection = correctionsMap.value.get(`${dateStr}_checkIn`)?.[0]
    if (checkInCorrection) {
      record.firstCheckIn = formatTimeHHMMSS(checkInCorrection.requestedTime)
      record.correctedCheckIn = true
      record.missingCheckIn = false
    }

    const checkOutCorrection = correctionsMap.value.get(`${dateStr}_checkOut`)?.[0]
    if (checkOutCorrection) {
      record.lastCheckOut = formatTimeHHMMSS(checkOutCorrection.requestedTime)
      record.correctedCheckOut = true
      record.missingCheckOut = false
    }

    record.correctedBreaks = {}

    const breakInCorrections = correctionsMap.value.get(`${dateStr}_breakIn`) || []
    const breakOutCorrections = correctionsMap.value.get(`${dateStr}_breakOut`) || []

    const corrections = [...breakInCorrections, ...breakOutCorrections]
    const correctedHHMMs = new Set<string>()
    corrections.forEach(c => {
      const fullKey = `${c.date}_${formatTimeHHMMSS(c.requestedTime)}_${c.correctionType}`
      if (!removedKeys.has(fullKey)) {
        correctedHHMMs.add(extractHHMM(c.requestedTime))
      }
    })

    record.breaks = record.breaks.map<BreakPunch>((b) => {
      const hhmm = extractHHMM(b.time)
      if (correctedHHMMs.has(hhmm)) {
        record.correctedBreaks![b.time] = true
      }
      // Ensure type is strictly "(IN)" or "(OUT)"
      let breakType: BreakType
      if (b.type === '(IN)' || b.type === '(OUT)') {
        breakType = b.type
      } else if (b.type === 'BREAK IN') {
        breakType = '(IN)'
      } else if (b.type === 'BREAK OUT') {
        breakType = '(OUT)'
      } else {
        breakType = '(IN)' // fallback, should not happen
      }
      return {
        time: b.time,
        type: breakType,
        missing: b.missing,
      }
    })

    breakInCorrections.forEach((c) => {
      const fullKey = `${c.date}_${formatTimeHHMMSS(c.requestedTime)}_breakIn`
      if (removedKeys.has(fullKey)) return
      const fullTime = record.breaks.find(b => extractHHMM(b.time) === extractHHMM(c.requestedTime))?.time
      const timeToUse = fullTime || formatTimeHHMMSS(c.requestedTime)
      if (!record.correctedBreaks![timeToUse]) {
        record.breaks.push({ time: timeToUse, type: '(IN)' as BreakType, missing: false })
        record.correctedBreaks![timeToUse] = true
      }
      // console.log('adding breakOut', fullKey, removedKeys.has(fullKey) ? 'REMOVED (SKIP)' : 'ADDED')

    })

    breakOutCorrections.forEach((c) => {
      const fullKey = `${c.date}_${formatTimeHHMMSS(c.requestedTime)}_breakOut`
      if (removedKeys.has(fullKey)) return
      const fullTime = record.breaks.find(b => extractHHMM(b.time) === extractHHMM(c.requestedTime))?.time
      const timeToUse = fullTime || formatTimeHHMMSS(c.requestedTime)
      if (!record.correctedBreaks![timeToUse]) {
        record.breaks.push({ time: timeToUse, type: '(OUT)' as BreakType, missing: false })
        record.correctedBreaks![timeToUse] = true
      }
    })

    let breakOutCount = 0
    let breakInCount = 0
    record.breaks.forEach((b) => {
      if (b.type === '(OUT)') breakOutCount++
      if (b.type === '(IN)') breakInCount++
    })
    if (breakOutCount !== breakInCount) {
      const lastBreak = record.breaks[record.breaks.length - 1]
      const isCorrected = record.correctedBreaks?.[lastBreak.time]
      if (!isCorrected) lastBreak.missing = true
    }

    record.breaks.sort((a, b) => a.time.localeCompare(b.time))
    daysArray.push(record)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return daysArray
})



const btnMouseOver =
  'text-sm md:text-lg font-semibold text-gray-200 hover:text-white hover:bg-green-700 rounded-md px-4 py-2 transition-colors duration-200 ease-in-out'
</script>



<template>
  <div class="bg-white p-4 md:p-6 shadow-md rounded-lg mt-6">
    <!-- Attendance Sheet Heading -->
    <div class="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-4">
      <h2 @click="dataRefersh" class="text-[10px] md:text-lg font-semibold text-green-700">ATTENDANCE</h2>
      <button @click="setCurrentWeek" :class="btnMouseOver">Week</button>
      <button @click="setCurrentMonth" :class="btnMouseOver">Month</button>
      <button @click="setPaidPeriod" :class="btnMouseOver">Paid</button>
      <button @click="setPayablePeriod" :class="btnMouseOver">Payble</button>
      <button @click="setCurrentYear" :class="btnMouseOver">Year</button>
      <!-- Date Range Selection -->
      <div class="flex gap-2 md:gap-4 mt-2 md:mt-0">
        <div>
          <label class="text-[10px] md:text-lg font-semibold text-green-700">FROM: </label>
          <input type="date" v-model="startDate"
            class="p-1 md:p-2 text-[10px] md:text-lg font-semibold text-green-500" />
        </div>
        <div>
          <label class="text-[10px] md:text-lg font-semibold text-green-700">TO: </label>
          <input type="date" v-model="endDate" class="p-1 md:p-2 text-[10px] md:text-lg font-semibold text-green-500" />
        </div>
      </div>
    </div>

    <!-- Responsive Table Wrapper -->
    <div class="overflow-x-auto">
      <table class="w-full table-auto border border-gray-200 text-[10px] md:text-sm">
        <thead class="bg-green-600 text-white text-[10px] md:text-sm">
          <tr>
            <th class="p-2 md:p-3 text-center w-1/6 md:w-1/8">DATE</th>
            <th class="p-2 md:p-3 text-center w-1/6 md:w-1/8 hidden md:table-cell">DAY</th>
            <th class="p-2 md:p-3 text-center w-1/12 md:w-1/8">IN</th>
            <th class="p-2 md:p-3 text-center w-1/6 md:w-1/8">LATE</th>
            <th class="p-2 md:p-3 text-left w-1/4 md:w-auto">BREAKS</th>
            <th class="p-2 md:p-3 text-center w-1/12 md:w-1/8">OUT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in filteredRecords" :key="index" class="border-b border-gray-200">
            <td @click="refeshDayRecords(record.date)" class="p-1 md:p-3 text-center"
              :class="{ 'bg-gray-100 text-red-600': record.isWeekend || record.isHoliday }">
              {{ formatDateDDMMYYYY(record.date) }}
            </td>
            <td class="p-1 md:p-3 text-left hidden md:table-cell"
              :class="{ 'bg-gray-100 text-red-600': record.isWeekend || record.isHoliday }">
              {{ record.day }}
            </td>
            <td class="p-1 md:p-3 text-center" :class="{
              'bg-red-200 text-red-700': record.missingCheckIn,
              'bg-gray-100 text-gray-700': record.isWeekend || record.isHoliday,
            }">
              <span :class="record.correctedCheckIn ? 'text-yellow-600 font-semibold' : ''">
                {{ record.firstCheckIn || '--' }}
              </span>
            </td>
            <td class="p-1 md:p-3 text-center text-red-700"
              :class="{ 'bg-gray-100': record.isWeekend || record.isHoliday }">
              {{ record.lateMinutes > 0 ? `${record.lateMinutes} min` : '' }}
            </td>
            <td class="p-1 md:p-3 text-left whitespace-normal"
              :class="{ 'bg-gray-100': record.isWeekend || record.isHoliday }">
              <template v-for="(pair, idx) in formatBreakPairs(record.breaks)" :key="idx">
                <span class="inline-block mr-2">
                  [
                  <span :class="{
                    'bg-red-200 text-red-700 px-1 rounded': pair[0] === '--'
                  }">{{ pair[0] }}</span>
                  |
                  <span :class="{
                    'bg-red-200 text-red-700 px-1 rounded': pair[1] === '--'
                  }">{{ pair[1] }}</span>
                  ]
                  <span v-if="idx < formatBreakPairs(record.breaks).length - 1">,</span>
                </span>
              </template>
            </td>

            <td class="p-1 md:p-3 text-center" :class="{
              'bg-red-200 text-red-700': record.missingCheckOut,
              'bg-gray-100 text-gray-700': record.isWeekend || record.isHoliday,
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
