// src/stores/dataStore.ts
import { defineStore } from 'pinia'
import { fetchUsers } from '@/services/firebaseServices'

import type {
  Staff,
  DutyRoster,
  AttendancePolicyGrouped,
  AttendanceSummaryRecord,
  DisplayAttendanceRecord,
  User,
  AttendanceCorrectionLog,
} from '@/types'

import attendanceSummaryRecords from '@/data/attendanceSummaryRecords.json'
import dutyRoster from '@/data/dutyRoster.json'
import attendancePolicies from '@/data/attendancePolicies.json'

import { getStaffList, getStaffById } from '@/services/dataProviders/staffListProvider'
import { getAttendanceLogs } from '@/services/dataProviders/attendanceLogsProvider.ts'
import { getAttendanceCorrections } from '@/services/dataProviders/attendanceCorrectionsProvider.ts'

export const useDataStore = defineStore('data', {
  state: () => ({
    // Static data
    attendanceSummaryRecords: attendanceSummaryRecords as AttendanceSummaryRecord[],
    dutyRoster: dutyRoster as DutyRoster,
    attendancePolicies: attendancePolicies as AttendancePolicyGrouped,

    // Cache sync tracking
    lastFetchedEndDate: {} as Record<string, string>,

    // Dynamic data
    attendanceLogs: [] as DisplayAttendanceRecord[],
    attendanceCorrections: [] as AttendanceCorrectionLog[],
    staffList: [] as Staff[],
    staffListLastFetched: '' as string,
    currentStaff: null as Staff | null,
  }),

  actions: {
    async loadAttendance(userId: string, start: string, end: string, force = false) {
      const logs: DisplayAttendanceRecord[] = await getAttendanceLogs(
        userId,
        new Date(start),
        new Date(end),
        force,
      )
      this.attendanceLogs = logs
    },

    async loadAttendanceCorrections(userId: string, start: string, end: string, force = false) {
      const corrections: AttendanceCorrectionLog[] = await getAttendanceCorrections(
        userId,
        new Date(start),
        new Date(end),
        force,
      )
      this.attendanceCorrections = corrections
    },

    async getUserList(): Promise<User[]> {
      const users: User[] = await fetchUsers()
      return users
    },

    async loadStaffList(forceRefresh = false): Promise<Staff[]> {
      const staff = await getStaffList(forceRefresh)
      this.staffList = staff
      return staff
    },

    async refreshStaffList(): Promise<Staff[]> {
      return await this.loadStaffList(true)
    },

    // NOTE: This uses IndexedDB only. If staff can be added by other HR users,
    // consider falling back to `fetchStaff(userId)` from Firestore if not found.
    async loadCurrentStaff(userId: string): Promise<void> {
      if (this.currentStaff && this.currentStaff.user_id === userId) {
        return
      }

      const staff = await getStaffById(userId)

      if (staff) {
        this.currentStaff = staff
      } else {
        console.warn('Staff not found for userId:', userId)
      }
    },
  },

  // Enable persistence
  persist: true,
})
