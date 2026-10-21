import { describe, expect, it } from 'vitest'
import { validateDateInput, displayDate } from '../dateOnly'

describe('DDS Vue date-only input contract', () => {
  it('keeps API dates canonical while accepting the Korean display format', () => {
    expect(validateDateInput('2026/10/22').value).toBe('2026-10-22')
    expect(validateDateInput('2026-10-22').valid).toBe(true)
    expect(displayDate('2026-10-22')).toBe('2026/10/22')
  })
  it.each(['2026/02/31', '2026-02-29', '1900-02-29', '0000-01-01', '2026/1/2', '2026-10', '2026-13-01'])('rejects invalid or incomplete %s without rolling it forward', value => {
    expect(validateDateInput(value)).toMatchObject({ valid: false, value: null })
  })
  it('accepts leap dates including Gregorian century rules', () => {
    expect(validateDateInput('2024/02/29').valid).toBe(true)
    expect(validateDateInput('2000-02-29').valid).toBe(true)
  })
  it('enforces inclusive calendar bounds without timezone conversion', () => {
    expect(validateDateInput('2026/10/22', true, '2026-10-22', '2026-10-23').valid).toBe(true)
    expect(validateDateInput('2026/10/21', true, '2026-10-22').valid).toBe(false)
    expect(validateDateInput('2026/10/24', true, undefined, '2026-10-23').valid).toBe(false)
  })
  it('distinguishes optional empty values from missing required values', () => {
    expect(validateDateInput('', false)).toEqual({ valid: true, value: '' })
    expect(validateDateInput('')).toEqual({ valid: false, value: null })
  })
})
