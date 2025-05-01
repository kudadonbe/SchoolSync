// src/utils/stringHelpers.ts

/**
 * Converts camelCase to snake_case
 * Example: "slForm" → "sl_form"
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Converts camelCase to "Friendly Label"
 * Example: "annualLeave" → "Annual Leave"
 */
export function camelToLabel(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
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
