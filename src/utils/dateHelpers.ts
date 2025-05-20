import type { DateRange } from '@/types'

export function formatDate(date: Date): string {
  // ISO date to yyyy-mm-dd
  return date.toISOString().slice(0, 10)
}

/**
 * Format a Date object into "YYYY-MM-DD" using local time (safe from timezone shifts).
 *
 * @param date - JavaScript Date object
 * @returns Formatted string in "YYYY-MM-DD"
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a Date object into "HH:mm:ss" (24-hour time).
 *
 * @param date - JavaScript Date object
 * @returns Formatted string in "HH:mm:ss"
 */
export function formatTimeLocal(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function getCurrentMonth(): DateRange {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function getCurrentWeek(): DateRange {
  const start = new Date()
  start.setDate(start.getDate() - start.getDay()) // Set to Sunday
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 6) // Set to Saturday
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function getCurrentYear(): DateRange {
  const start = new Date()
  start.setMonth(0, 1) // Set to January 1st
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setFullYear(end.getFullYear() + 1)
  end.setDate(0) // Set to December 31st
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

// payble period is last month 16 to this month 15
export function getPayablePeriod(): DateRange {
  const start = new Date()
  start.setMonth(start.getMonth() - 1) // Set to last month
  start.setDate(16) // Set to 16th
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setMonth(end.getMonth() + 1) // Set to this month
  end.setDate(15)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

// paid period is last month 1 to this month 15
export function getPaidPeriod(): DateRange {
  const start = new Date()
  start.setMonth(start.getMonth() - 2) // Set to last month
  start.setDate(16) // Set to 16th
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setMonth(end.getMonth() + 1) // Set to this month
  end.setDate(15)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}


export function formatTimeHHMMSS(time: string): string {
  // Accepts: "07:55" or "07:55:30"
  const [h = "00", m = "00", s = "00"] = time.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
}

export function extractHHMM(time: string): string {
  return time.split(':').slice(0, 2).join(':');
}

export function formatDateDDMMYYYY(dateStr: string): string {
  const [yyyy, mm, dd] = dateStr.split('-')
  return `${dd}-${mm}-${yyyy}`
}



/**
 * Format a Date object into "HH:mm:ss" in **UTC**
 */
export function formatTimeUTC(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}




