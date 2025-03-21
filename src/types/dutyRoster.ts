// This file contains the types for the duty roster data structure
export interface DutyRoster {
  dutyTimes: DutyTime[]
  dailyOverrides: DailyOverride[]
  specialDutys: SpecialDuty[]
  publicHolidays: Holidays[]
  specialHolidays: Holidays[]
}

export interface Holidays {
  name: string
  date: string
}

export interface SpecialDuty {
  name: string
  time: string
  from: string
  to: string
}

export interface DailyOverride {
  date: string
  EarlyDuty: string[]
}

export interface DutyTime {
  type: string
  time: string
}
