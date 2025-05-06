export type StaffType = 'Admin' | 'Academic' | 'Labor' | 'Unknown'

export interface Staff {
  user_id: string
  name: string
  department: string
  position: string
  join_date: string | null
  leave_count_date: string | null
  staff_type: StaffType
  email?: string
}
