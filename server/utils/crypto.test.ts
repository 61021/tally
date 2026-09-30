import { describe, expect, it } from 'vitest'
import { hmacHex, normalizeEmail, randomCode, sameText } from './crypto'

describe('crypto helpers', () => {
  it('makes six-digit codes', () => {
    for (let i = 0; i < 200; i++)
      expect(randomCode()).toMatch(/^\d{6}$/)
  })

  it('hashes an email the same way every time, and differently per key', async () => {
    const a = await hmacHex('key-one', normalizeEmail('  Khaled@Example.com '))
    expect(a).toBe(await hmacHex('key-one', 'khaled@example.com'))
    expect(a).not.toBe(await hmacHex('key-two', 'khaled@example.com'))
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('compares text', () => {
    expect(sameText('123456', '123456')).toBe(true)
    expect(sameText('123456', '123457')).toBe(false)
    expect(sameText('12345', '123456')).toBe(false)
  })
})
