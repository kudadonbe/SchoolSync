import { defineStore } from "pinia";
import rawAttendanceRecords from "@/data/attendanceRecords.json";
import staffList from "@/data/staffList.json";
import dutyRoster from "@/data/dutyRoster.json";
import attendancePolicies from "@/data/attendancePolicies.json";
import attendanceSummaryRecords from "@/data/attendanceSummaryRecords.json";

// ✅ Define Staff Interface
export interface Staff {
  user_id: string;
  name: string;
  department: string;
  position: string;
  join_date: string | null;
  leave_count_date: string | null;
}

// ✅ Define Attendance Record Interface
export interface AttendanceRecord {
  user_id: string;
  date: string;
  time: string;
  status: "CHECK IN" | "CHECK OUT" | "BREAK IN" | "BREAK OUT" | "UNKNOWN";
}

// ✅ Define Raw Attendance Record Interface (Matches JSON Format)
export interface RawAttendanceRecord {
  user_id: string;
  date: string;
  time: string;
  punch_status: number;
}

// ✅ Function to convert `punch_status` to `status`
const mapPunchStatusToStatus = (punch_status: number | undefined): AttendanceRecord["status"] => {
  switch (punch_status) {
    case 0:
      return "CHECK IN";
    case 1:
      return "CHECK OUT";
    case 2:
      return "BREAK OUT";
    case 3:
      return "BREAK IN";
    default:
      return "UNKNOWN"; // ✅ Ensures unknown punch values are handled safely
  }
};

// ✅ Convert raw attendance data to match `AttendanceRecord` structure
const attendanceRecords: AttendanceRecord[] = (rawAttendanceRecords as RawAttendanceRecord[]).map((rec) => ({
  user_id: rec.user_id,
  date: rec.date,
  time: rec.time,
  status: mapPunchStatusToStatus(rec.punch_status), // ✅ Fixes missing `status`
}));

// ✅ Define Pinia Store
export const useMockDataStore = defineStore("mockData", {
  state: (): {
    attendanceRecords: AttendanceRecord[];
    attendanceSummaryRecords: typeof attendanceSummaryRecords;
    staffList: Staff[];
    dutyRoster: typeof dutyRoster;
    attendancePolicies: typeof attendancePolicies;
  } => ({
    attendanceRecords,
    attendanceSummaryRecords,
    staffList: staffList as Staff[],
    dutyRoster,
    attendancePolicies,
  }),
});
