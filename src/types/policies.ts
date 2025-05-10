export type MissingPunchPolicy = 'flag' | 'ignore' | 'auto-fill' | 'notify'

export interface AttendancePolicyGrouped {
  late: {
    fine_per_minute: number
    grace_period_minutes: number
  }
  break: {
    max_minutes: number
    apply_fine_for_excess: boolean
  }
  punch: {
    duplicate_threshold_minutes: number
    missing_punch_policy: MissingPunchPolicy
  }
  leave_limits: {
    sl_form: number
    sl_mc: number
    frl: number
    annual_leave: number
    hajju_leave: number
    umra_leave: number
    nopay_leave: number | null
    special_leave: number | null
    absents: number | null
    days_attended: number | null
  }
}
