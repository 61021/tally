import { describe, expect, it } from 'vitest'
import { approach, distanceToWord, glow, layoutWall } from './word-wall'

const measure = (text: string): number => text.length * 10

describe('layoutWall', () => {
  const words = layoutWall(['Iraq', 'Chad', 'Peru', 'Mali', 'Oman', 'Fiji'], measure, { width: 200, height: 60, rowHeight: 20, gap: 12, seed: 1 })

  it('fills every row past both edges, centred', () => {
    const rows = [0, 20, 40].map(y => words.filter(w => w.y === y))
    for (const row of rows) {
      const left = row[0]!.x
      const right = row.at(-1)!.x + row.at(-1)!.width
      expect(left).toBeLessThanOrEqual(0)
      expect(right).toBeGreaterThanOrEqual(200)
      expect(left + right).toBeCloseTo(200, 6)
    }
  })

  it('keeps every word faint', () => {
    expect(words.every(w => w.alpha >= 0.035 && w.alpha <= 0.085)).toBe(true)
  })

  it('lays out the same way from the same seed', () => {
    const again = layoutWall(['Iraq', 'Chad', 'Peru', 'Mali', 'Oman', 'Fiji'], measure, { width: 200, height: 60, rowHeight: 20, gap: 12, seed: 1 })
    expect(again).toEqual(words)
  })

  it('draws nothing without words', () => {
    expect(layoutWall([], measure, { width: 200, height: 60, rowHeight: 20, gap: 12, seed: 1 })).toEqual([])
  })
})

describe('distanceToWord', () => {
  const word = { text: 'Iraq', x: 100, y: 0, width: 40, alpha: 0.1 }

  it('is zero on the word and measures from its nearest end', () => {
    expect(distanceToWord(word, 20, 120, 10)).toBe(0)
    expect(distanceToWord(word, 20, 90, 10)).toBe(10)
    expect(distanceToWord(word, 20, 150, 10)).toBe(10)
    expect(distanceToWord(word, 20, 120, 40)).toBe(30)
  })
})

describe('glow', () => {
  it('is full under a fresh point and fades with distance and age', () => {
    expect(glow(0, 0, 100, 1000)).toBe(1)
    expect(glow(50, 0, 100, 1000)).toBeCloseTo(0.5625, 6)
    expect(glow(0, 500, 100, 1000)).toBeCloseTo(0.25, 6)
    expect(glow(100, 0, 100, 1000)).toBe(0)
    expect(glow(0, 1000, 100, 1000)).toBe(0)
  })
})

describe('approach', () => {
  it('lights faster than it fades', () => {
    const lit = approach(0, 1, 45)
    const faded = 1 - approach(1, 0, 45)
    expect(lit).toBeGreaterThan(faded)
    expect(approach(0.4, 0.4, 16)).toBe(0.4)
  })
})
