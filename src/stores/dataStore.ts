// src/stores/dataStore.ts
import { defineStore } from 'pinia'
import {
  fetchAttendanceForUser,
  fetchUsers,
  fetchStaffList,
  fetchStaff,
  fetchAttendanceCorrectionsForUser,
} from '@/services/firebaseServices'
import { convertToDisplayRecords } from '@/utils/attendanceHelpers'

// ✅ Import types
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

// ✅ Import raw JSON data
import attendanceSummaryRecords from '@/data/attendanceSummaryRecords.json'
import dutyRoster from '@/data/dutyRoster.json'
import attendancePolicies from '@/data/attendancePolicies.json'

export const useDataStore = defineStore('data', {
  state: () => ({
    // Static data
    attendanceSummaryRecords: attendanceSummaryRecords as AttendanceSummaryRecord[],
    dutyRoster: dutyRoster as DutyRoster,
    attendancePolicies: attendancePolicies as AttendancePolicyGrouped,

    // Dynamic attendance caches
    attendanceCache: {} as Record<string, DisplayAttendanceRecord[]>,
    attendanceCorrectionCache: {} as Record<string, AttendanceCorrectionLog[]>,

    // Cache sync tracking
    lastFetchedEndDate: {} as Record<string, string>, // Shared key map (can split later if needed)

    // Dynamic data
    staffList: [] as Staff[],
    staffListLastFetched: '' as string,
    currentStaff: null as Staff | null,
    attendanceCorrectionLog: [] as AttendanceCorrectionLog[],
  }),

  actions: {
    async loadAttendance(userId: string, start: string, end: string) {
      const key = `${userId}_${start}_${end}`
      const cached = this.attendanceCache[key]
      const hasEndDate = cached?.some((r) => r.date === end)
      const lastDate = this.lastFetchedEndDate[userId]

      if (hasEndDate && lastDate && lastDate >= end) {
        return // Already fetched
      }

      const logs: StaffAttendanceLog[] = await fetchAttendanceForUser(
        userId,
        new Date(start),
        new Date(end),
      )
      const attendanceRecords: DisplayAttendanceRecord[] = convertToDisplayRecords(logs)

      this.attendanceCache[key] = attendanceRecords
      this.lastFetchedEndDate[userId] = end
    },

    getAttendance(userId: string, start: string, end: string): DisplayAttendanceRecord[] {
      const key = `${userId}_${start}_${end}`
      return this.attendanceCache[key] ?? []
    },

    async loadAttendanceCorrections(userId: string, start: string, end: string, force = false) {
      const key = `${userId}_${start}_${end}`
      const cached = this.attendanceCorrectionCache[key]


      if (!force) {
        const hasEndDate = cached?.some((r) => r.date === end)
        const lastDate = this.lastFetchedEndDate[userId]
        if (hasEndDate && lastDate && lastDate >= end) {
          return // Skip fetch unless forced
        }
      }

      const logs: AttendanceCorrectionLog[] = await fetchAttendanceCorrectionsForUser(
        userId,
        start,
        end,
      )

      // if (logs.length === 0) {
      //   console.info(`No correction logs found for ${userId} between ${start} and ${end}`)
      // }

      this.attendanceCorrectionCache[key] = logs
      this.attendanceCorrectionLog = logs

      // Only update lastFetchedEndDate if not forced
      if (!force) {
        this.lastFetchedEndDate[userId] = end
      }
    },

    getAttendanceCorrections(userId: string, start: string, end: string): AttendanceCorrectionLog[] {
      const key = `${userId}_${start}_${end}`
      return this.attendanceCorrectionCache[key] ?? []
    },

    async getUserList(): Promise<User[]> {
      const users: User[] = await fetchUsers()
      return users
    },

    async loadStaffList(forceRefresh = false): Promise<Staff[]> {
      if (!forceRefresh && this.staffList.length > 0) {
        return this.staffList
      }

      const staff = await fetchStaffList()
      this.staffList = staff
      return staff
    },

    async refreshStaffList(): Promise<Staff[]> {
      return await this.loadStaffList(true)
    },

    async loadCurrentStaff(userId: string): Promise<void> {
      if (this.currentStaff && this.currentStaff.user_id === userId) {
        return
      }

      const staff = await fetchStaff(userId)
      if (staff) {
        this.currentStaff = staff
      } else {
        console.warn('Staff not found for userId:', userId)
      }
    },
  },

  // 💾 Enable persistence
  persist: true,
})
