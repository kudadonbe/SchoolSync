// src/stores/dataStore.ts
import { defineStore } from 'pinia'
import {
  fetchAttendanceForUser,
  fetchUsers,
  fetchStaffList,
  fetchStaff,
} from '@/services/firebaseServices'
import { convertToDisplayRecords } from '@/utils/attendanceHelpers'

// ✅ Import types from types folder
import type {
  Staff,
  DutyRoster,
  AttendancePolicyGrouped,
  AttendanceSummaryRecord,
  StaffAttendanceLog,
  DisplayAttendanceRecord,
  User,
  AttendanceCorrectionLog,
} from '@/types'

// ✅ Import raw JSON data (all based on new structure)
// import staffList from '@/data/staffList.json'
// import attendanceRaw from '@/data/attendanceRecords.json'
import attendanceSummaryRecords from '@/data/attendanceSummaryRecords.json'
import dutyRoster from '@/data/dutyRoster.json'
import attendancePolicies from '@/data/attendancePolicies.json'
import attendanceCorrectionLog from '@/data/attendanceCorrectionLog.json'

export const useDataStore = defineStore('data', {
  state: () => ({
    // Static data
    attendanceSummaryRecords: attendanceSummaryRecords as AttendanceSummaryRecord[],
    dutyRoster: dutyRoster as DutyRoster,
    attendancePolicies: attendancePolicies as AttendancePolicyGrouped,
    attendanceCorrectionLog: attendanceCorrectionLog as AttendanceCorrectionLog[],

    // Dynamic attendance cache
    attendanceCache: {} as Record<string, DisplayAttendanceRecord[]>,
    lastFetchedEndDate: {} as Record<string, string>,

    // Dynamic data
    staffList: [] as Staff[],
    staffListLastFetched: '' as string, // ⏱️ Track last fetch time
    currentStaff: null as Staff | null,
  }),
  actions: {
    async loadAttendance(userId: string, start: string, end: string) {
      const key = `${userId}_${start}_${end}`
      const cached = this.attendanceCache[key]
      const hasEndDate = cached?.some((r) => r.date === end)
      const lastDate = this.lastFetchedEndDate[userId]

      // if we've already cached through 'end', skip the fetch
      if (hasEndDate && lastDate && lastDate >= end) {
        return
      }

      //
      const logs: StaffAttendanceLog[] = await fetchAttendanceForUser(
        userId,
        new Date(start),
        new Date(end),
      )
      const attendanceRecords: DisplayAttendanceRecord[] = convertToDisplayRecords(logs)

      // Save to cache
      this.attendanceCache[key] = attendanceRecords
      this.lastFetchedEndDate[userId] = end
    },

    // retrive cached attendance records (empty array if none).

    getAttendance(userId: string, start: string, end: string): DisplayAttendanceRecord[] {
      const key = `${userId}_${start}_${end}`
      return this.attendanceCache[key] ?? []
    },

    async getUserList(): Promise<User[]> {
      const users: User[] = await fetchUsers()
      return users
    },

    async loadStaffList(forceRefresh = false): Promise<void> {
      // Only fetch from Firebase if no cache or forced refresh
      if (!forceRefresh && this.staffList.length > 0) {
        return
      }

      const staff = await fetchStaffList()
      this.staffList = staff
    },

    async refreshStaffList(): Promise<void> {
      await this.loadStaffList(true)
    },

    async loadCurrentStaff(userId: string): Promise<void> {
      if (this.currentStaff && this.currentStaff.user_id === userId) {
        return // already loaded
      }

      const staff = await fetchStaff(userId)
      if (staff) {
        this.currentStaff = staff
      } else {
        console.warn('Staff not found for userId:', userId)
      }
    },
  },
  // persist cache & lastFetchedEndDate across reloads
  persist: true,
})
