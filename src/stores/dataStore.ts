import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { fetchUsers } from '@/services/firebaseServices'

import type {
  User,
  Staff,
  DutyRoster,
  AttendancePolicyGrouped,
  AttendanceSummaryRecord,
  DisplayAttendanceRecord,
  AttendanceCorrectionLog,
  LastFetchedMap,
} from '@/types'

import attendanceSummaryRecordsData from '@/data/attendanceSummaryRecords.json'
import dutyRosterData from '@/data/dutyRoster.json'
import attendancePoliciesData from '@/data/attendancePolicies.json'

import { getStaffList, getStaffById } from '@/services/dataProviders/staffListProvider'
import { getAttendanceLogs } from '@/services/dataProviders/attendanceLogsProvider'
import { getAttendanceCorrections } from '@/services/dataProviders/attendanceCorrectionsProvider'

import { formatDateLocal, mergeAttendanceLogs, mergeAttendanceCorrections } from '@/utils'

export const useDataStore = defineStore(
  'data',
  () => {
    // Static data
    const attendanceSummaryRecords = ref(attendanceSummaryRecordsData as AttendanceSummaryRecord[])
    const dutyRoster = ref(dutyRosterData as DutyRoster)
    const attendancePolicies = ref(attendancePoliciesData as AttendancePolicyGrouped)

    // Sync tracking
    const lastFetched = reactive<LastFetchedMap>({
      attendanceLogs: '',
      attendanceCorrections: '',
      attendancePolicies: '',
      attendanceSummaryRecords: '',
      dutyRoster: '',
      staffList: '',
    })

    // Dynamic data
    const attendanceLogs = ref<DisplayAttendanceRecord[]>([])
    const attendanceCorrections = ref<AttendanceCorrectionLog[]>([])
    const staffList = ref<Staff[]>([])
    const staffListLastFetched = ref('')
    const currentStaff = ref<Staff | null>(null)

    // Actions
    async function loadAttendance(userId: string, start: string, end: string, force = false) {
      const startDate = new Date(start)
      let endDate = new Date(end)
      const today = new Date()

      // console.log('Requested Range:', { start, end }) // (DEBUG)

      // Step 1 – Cap future endDate to today
      if (endDate > today) {
        // console.log('End date is in the future, capping to today') // (DEBUG)
        endDate = today
      }

      const lastFetchedStr = lastFetched.attendanceLogs
      const lastFetchedDate = lastFetchedStr ? new Date(lastFetchedStr) : null

      // console.log('Last fetched from Firebase:', lastFetchedStr) // (DEBUG)

      // Step 2 – Decide whether to fetch from Firebase
      const shouldFetchFromFirebase = force || !lastFetchedDate || endDate > lastFetchedDate

      if (shouldFetchFromFirebase) {
        let fetchStartDate = lastFetchedDate
          ? new Date(lastFetchedDate.getTime() - 86400000) // lastFetched - 1 day
          : startDate

        if (force) {
          fetchStartDate = new Date(start)
        }

        // console.log('Fetching from Firebase:', {
        //   from: formatDateLocal(fetchStartDate),
        //   to: formatDateLocal(endDate),
        //   reason: force ? 'force = true' : 'endDate > lastFetched',
        // }) // (DEBUG)

        const freshLogs = await getAttendanceLogs(userId, fetchStartDate, endDate, true)
        console.log('Fetched from Firebase:', freshLogs.length, 'records') // (DEBUG)

        const now = formatDateLocal(new Date())
        lastFetched.attendanceLogs = now
        // console.log('Updated lastFetched.attendanceLogs:', now) // (DEBUG)
      } else {
        // console.log('Skipped Firebase fetch — data is already fresh') // (DEBUG)
      }

      // Step 4 – Always load full requested range from IndexedDB
      const finalLogs = await getAttendanceLogs(userId, startDate, endDate, false)
      // console.log('Loaded from IndexedDB:', finalLogs.length, 'records') // (DEBUG)

      // Step 5 – Append or overwrite
      if (force) {
        attendanceLogs.value = mergeAttendanceLogs(attendanceLogs.value, finalLogs)
      } else {
        attendanceLogs.value = finalLogs
      }
    }

    async function loadAttendanceCorrections(
      userId: string,
      start: string,
      end: string,
      force = false,
    ) {
      const corrections = await getAttendanceCorrections(
        userId,
        new Date(start),
        new Date(end),
        force,
      )

      attendanceCorrections.value = mergeAttendanceCorrections(
        attendanceCorrections.value,
        corrections,
        start,
        end,
      )
    }

    async function getUserList(): Promise<User[]> {
      const users: User[] = await fetchUsers()
      return users
    }

    async function loadStaffList(forceRefresh = false): Promise<Staff[]> {
      const staff = await getStaffList(forceRefresh)
      staffList.value = staff
      return staff
    }

    async function refreshStaffList(): Promise<Staff[]> {
      return await loadStaffList(true)
    }

    async function loadCurrentStaff(userId: string): Promise<void> {
      if (currentStaff.value && currentStaff.value.user_id === userId) {
        return
      }

      const staff = await getStaffById(userId)

      if (staff) {
        currentStaff.value = staff
      } else {
        // console.warn('Staff not found for userId:', userId)
      }
    }

    function getAttendance(userId: string, start: string, end: string): DisplayAttendanceRecord[] {
      return attendanceLogs.value.filter(
        (log) => log.user_id === userId && log.date >= start && log.date <= end,
      )
    }

    function getCorrections(userId: string, start: string, end: string): AttendanceCorrectionLog[] {
      return attendanceCorrections.value.filter(
        (log) => log.staffId === userId && log.date >= start && log.date <= end,
      )
    }

    return {
      // state
      attendanceSummaryRecords,
      dutyRoster,
      attendancePolicies,
      lastFetched,
      attendanceLogs,
      attendanceCorrections,
      staffList,
      staffListLastFetched,
      currentStaff,

      // actions
      loadAttendance,
      loadAttendanceCorrections,
      getUserList,
      loadStaffList,
      refreshStaffList,
      loadCurrentStaff,
      getAttendance,
      getCorrections,
    }
  },
  {
    persist: {
      storage: localStorage,
      pick: ['currentStaff', 'staffListLastFetched', 'lastFetched'],
    },
  },
)
