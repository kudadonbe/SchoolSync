// src/stores/dataStore.ts
import { defineStore } from 'pinia'

// ✅ Import types from types folder
import type {
  Staff,
  DutyRoster,
  AttendancePolicyGrouped,
  AttendanceSummaryRecord,
  AttendanceRecord,
  DisplayAttendanceRecord,
  DisplayAttendanceStatus,
  PunchStatus,
} from '@/types'

// ✅ Import raw JSON data (all based on new structure)
import staffList from '@/data/staffList.json'
import attendanceRaw from '@/data/attendanceRecords.json'
import attendanceSummaryRecords from '@/data/attendanceSummaryRecords.json'
import dutyRoster from '@/data/dutyRoster.json'
import attendancePolicies from '@/data/attendancePolicies.json'

// ✅ Convert punch_status → readable text
const mapPunchStatusToStatus = (status?: PunchStatus): DisplayAttendanceStatus => {
  switch (status) {
    case 0:
      return 'CHECK IN'
    case 1:
      return 'CHECK OUT'
    case 2:
      return 'BREAK OUT'
    case 3:
      return 'BREAK IN'
    default:
      return 'UNKNOWN'
  }
}

// ✅ Transform raw attendance records into display-ready format
const attendanceRecords: DisplayAttendanceRecord[] = (attendanceRaw as AttendanceRecord[]).map(
  (record) => ({
    user_id: record.user_id,
    date: record.date,
    time: record.time,
    status: mapPunchStatusToStatus(record.punch_status),
  }),
)

// ✅ Define the mock data store
export const useMockDataStore = defineStore('mockData', {
  state: () => ({
    staffList: staffList as Staff[],
    attendanceRecords,
    attendanceSummaryRecords: attendanceSummaryRecords as AttendanceSummaryRecord[],
    dutyRoster: dutyRoster as DutyRoster,
    attendancePolicies: attendancePolicies as AttendancePolicyGrouped,
  }),
})
