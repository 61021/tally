import { describe, expect, it } from 'vitest'
import { formatKm, formatPoints } from './atlas-format'

describe('formatPoints', () => {
  it('groups thousands with Western digits', () => {
    expect(formatPoints(8412)).toBe('8,412')
    expect(formatPoints(0)).toBe('0')
  })
})

describe('formatKm', () => {
  it('keeps single kilometres when close', () => {
    expect(formatKm(412.4)).toBe('412 km')
  })

  it('rounds to tens when far', () => {
    expect(formatKm(4087)).toBe('4,090 km')
  })
})
