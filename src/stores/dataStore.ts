// src/stores/dataStore.ts
import { defineStore } from 'pinia'
import { fetchAttendanceForUser, fetchUsers } from '@/services/firebaseServices'
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
} from '@/types'

// ✅ Import raw JSON data (all based on new structure)
import staffList from '@/data/staffList.json'
// import attendanceRaw from '@/data/attendanceRecords.json'
import attendanceSummaryRecords from '@/data/attendanceSummaryRecords.json'
import dutyRoster from '@/data/dutyRoster.json'
import attendancePolicies from '@/data/attendancePolicies.json'

export const useDataStore = defineStore('data', {
  state: () => ({
    // Static data
    staffList: staffList as Staff[],
    attendanceSummaryRecords: attendanceSummaryRecords as AttendanceSummaryRecord[],
    dutyRoster: dutyRoster as DutyRoster,
    attendancePolicies: attendancePolicies as AttendancePolicyGrouped,


    // Dynamic attendance cache
    attendanceCache: {} as Record<string, DisplayAttendanceRecord[]>,
    lastFetchedEndDate: {} as Record<string, string>,



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

    async getUserList(): Promise<User[]>{
      const users: User[] = await fetchUsers()
      return users
    },

  },
  // persist cache & lastFetchedEndDate across reloads
  persist: true,
})
