import { parseDate } from '@ark-ui/vue/date-picker'

/** UI text is localised; store/API dates remain ISO calendar dates, never UTC instants. */
export function displayDate(value: string): string { return value.replaceAll('-', '/') }
export function validateDateInput(input: string, required = true, min?: string, max?: string): { valid: boolean; value: string | null } {
  if (input === '') return { valid: !required, value: required ? null : '' }
  const value = /^\d{4}\/\d{2}\/\d{2}$/.test(input) ? input.replaceAll('/', '-') : input
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return { valid: false, value: null }
  try {
    if (parseDate(value).toString() !== value || (min && value < min) || (max && value > max)) return { valid: false, value: null }
    return { valid: true, value }
  } catch { return { valid: false, value: null } }
}
