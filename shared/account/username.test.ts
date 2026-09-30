import { describe, expect, it } from 'vitest'
import { checkUsername, nextRenameAt, usernameKey } from './username.ts'

describe('checkUsername', () => {
  it('takes 3 to 20 letters and digits, in any case', () => {
    expect(checkUsername('khaled')).toBeNull()
    expect(checkUsername('Rania22')).toBeNull()
    expect(checkUsername('abc')).toBeNull()
    expect(checkUsername('a'.repeat(20))).toBeNull()
  })

  it('names what is wrong', () => {
    expect(checkUsername('ab')).toBe('too-short')
    expect(checkUsername('a'.repeat(21))).toBe('too-long')
    expect(checkUsername('kh_aled')).toBe('characters')
    expect(checkUsername('khaled!')).toBe('characters')
    expect(checkUsername('خالد')).toBe('characters')
    expect(checkUsername('Admin')).toBe('not-allowed')
    expect(checkUsername('xfuckx')).toBe('not-allowed')
  })

  it('leaves ordinary names that contain a blocked word alone', () => {
    expect(checkUsername('Dickens')).toBeNull()
    expect(checkUsername('grape')).toBeNull()
    expect(checkUsername('Essex')).toBeNull()
  })
})

describe('usernames', () => {
  it('compare without case', () => {
    expect(usernameKey('KhAlEd')).toBe('khaled')
  })

  it('may change again 30 days after the last change', () => {
    const day = 24 * 60 * 60 * 1000
    expect(nextRenameAt(null)).toBeNull()
    expect(nextRenameAt(0, 31 * day)).toBeNull()
    expect(nextRenameAt(0, 10 * day)).toBe(30 * day)
  })
})
