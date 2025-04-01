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
 *
 * @param date
 * @returns formated date "YYYY-MM-DD"
 */
export function formatDateLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}
