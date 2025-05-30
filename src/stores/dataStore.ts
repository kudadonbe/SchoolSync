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
    lastFetchedEndDate: {} as Record<string, string>,

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

      if (!force) {
        const cached = this.attendanceCorrectionCache[key]
        const hasEndDate = cached?.some((r) => r.date === end)
        const lastDate = this.lastFetchedEndDate[userId]
        if (hasEndDate && lastDate && lastDate >= end) {
          return // Skip fetch unless forced
        }
      } else {
        // Clear all previous correction ranges for this user
        Object.keys(this.attendanceCorrectionCache).forEach((k) => {
          if (k.startsWith(`${userId}_`)) delete this.attendanceCorrectionCache[k]
        })
        delete this.lastFetchedEndDate[userId]
      }

      const logs: AttendanceCorrectionLog[] = await fetchAttendanceCorrectionsForUser(
        userId,
        start,
        end,
      )

      this.attendanceCorrectionCache[key] = logs
      this.attendanceCorrectionLog = logs

      if (!force) {
        this.lastFetchedEndDate[userId] = end
      }
    },

    getAttendanceCorrections(
      userId: string,
      start: string,
      end: string,
    ): AttendanceCorrectionLog[] {
      const key = `${userId}_${start}_${end}`
      return this.attendanceCorrectionCache[key] ?? []
    },

    /**
     * Remove a single correction from cache and flat list.
     */
    removeAttendanceCorrection(userId: string, start: string, end: string, logId: string) {
      const key = `${userId}_${start}_${end}`
      const existing = this.attendanceCorrectionCache[key]
      if (existing) {
        this.attendanceCorrectionCache[key] = existing.filter((l) => l.id !== logId)
      }
      this.attendanceCorrectionLog = this.attendanceCorrectionLog.filter((l) => l.id !== logId)
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

  // Enable persistence
  persist: true,
})
