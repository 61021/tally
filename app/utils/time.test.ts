import { describe, expect, it } from 'vitest'
import { formatTime } from './time'

describe('formatTime', () => {
  it('shows minutes and seconds, and hours only when there are some', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(425_000)).toBe('7:05')
    expect(formatTime(3_729_000)).toBe('1:02:09')
  })
})
