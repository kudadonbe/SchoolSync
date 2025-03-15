// ✅ Define Staff Interface
export interface Staff {
  user_id: string
  name: string
  department: string
  position: string
  join_date: string
}

// ✅ Define Attendance Record Interface
export interface AttendanceRecord {
  user_id: string
  date: string
  time: string
  status: 'CHECK IN' | 'CHECK OUT' | 'BREAK IN' | 'BREAK OUT'
}

// ✅ Define Interface for Attendance Summary Records
export interface AttendanceSummaryRecord {
  user_id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'SICK_PHONE' | 'SICK_MC' | 'FRL' | 'ANNUAL_LEAVE' | 'HAJJU_UMRA'
}

// ✅ Sample Staff Data
export const staffList: Staff[] = [
  {
    user_id: '153',
    name: 'Hussain Shareef',
    department: 'Procurement',
    position: 'Administrative Officer',
    join_date: '2020-06-15',
  },
  {
    user_id: '101',
    name: 'Nadheema Mohamed',
    department: 'HR',
    position: 'Administrative Officer',
    join_date: '2018-02-20',
  },
]

// ✅ Sample Attendance Data
export const attendanceRecords: AttendanceRecord[] = [
  { user_id: '153', date: '2025-02-25', time: '08:00:00', status: 'CHECK IN' },
  { user_id: '153', date: '2025-02-25', time: '12:15:00', status: 'BREAK OUT' },
  { user_id: '153', date: '2025-02-25', time: '13:00:00', status: 'BREAK IN' },
  { user_id: '153', date: '2025-02-25', time: '17:00:00', status: 'CHECK OUT' },
  { user_id: '153', date: '2025-02-26', time: '12:00:00', status: 'BREAK OUT' },
  { user_id: '153', date: '2025-02-26', time: '08:30:00', status: 'CHECK IN' },
]

// ✅ Sample Attendance Summary Data
export const attendanceSummaryRecords: AttendanceSummaryRecord[] = [
  { user_id: '153', date: '2025-02-01', status: 'PRESENT' },
  { user_id: '153', date: '2025-02-02', status: 'ABSENT' },
  { user_id: '153', date: '2025-03-01', status: 'SICK_PHONE' },
  { user_id: '153', date: '2025-03-02', status: 'SICK_PHONE' },
  { user_id: '153', date: '2025-03-03', status: 'SICK_PHONE' },
  { user_id: '153', date: '2025-03-10', status: 'SICK_PHONE' },
  { user_id: '153', date: '2025-03-04', status: 'SICK_MC' },
  { user_id: '153', date: '2025-03-05', status: 'FRL' },
  { user_id: '153', date: '2025-03-06', status: 'ANNUAL_LEAVE' },
  { user_id: '153', date: '2025-03-07', status: 'HAJJU_UMRA' },
]
