import type { PinResult } from './types.ts'
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../sudoku/rng.ts'
import { CONTINENTS, MAX_POINTS, ROUND_SIZE } from './constants.ts'
import { COUNTRIES } from './countries.ts'
import { addPin, countriesIn, currentTarget, isFinished, newRound, roundScore } from './round.ts'
import { scorePin } from './score.ts'

const pin = (points: number): PinResult => ({ pin: [0, 0], nearest: [0, 0], km: 0, points })

describe('the country list', () => {
  it('holds the UN members and observers, with Palestine in place of Israel', () => {
    expect(COUNTRIES).toHaveLength(194)
    expect(new Set(COUNTRIES.map(c => c.id)).size).toBe(194)
    expect(COUNTRIES.some(c => c.id === 'ISR')).toBe(false)
    expect(COUNTRIES.find(c => c.id === 'PSE')?.continent).toBe('asia')
  })

  it('has enough countries on every continent for a round', () => {
    for (const continent of CONTINENTS)
      expect(countriesIn(continent).length).toBeGreaterThanOrEqual(ROUND_SIZE)
  })
})

describe('newRound', () => {
  it('asks ten different countries from the region', () => {
    const round = newRound('europe', mulberry32(7))
    expect(round.targets).toHaveLength(ROUND_SIZE)
    expect(new Set(round.targets).size).toBe(ROUND_SIZE)
    const europe = new Set(countriesIn('europe').map(c => c.id))
    expect(round.targets.every(id => europe.has(id))).toBe(true)
  })
})

describe('a round in play', () => {
  it('moves to the next country with each pin and adds up the score', () => {
    let round = newRound('world', mulberry32(1))
    expect(currentTarget(round)).toBe(round.targets[0])
    round = addPin(round, pin(600))
    round = addPin(round, pin(250))
    expect(currentTarget(round)).toBe(round.targets[2])
    expect(roundScore(round)).toBe(850)
    expect(isFinished(round)).toBe(false)
  })

  it('ignores pins after the last country', () => {
    let round = newRound('asia', mulberry32(2))
    for (let i = 0; i < ROUND_SIZE + 3; i++)
      round = addPin(round, pin(100))
    expect(round.pins).toHaveLength(ROUND_SIZE)
    expect(isFinished(round)).toBe(true)
    expect(currentTarget(round)).toBeNull()
  })
})

describe('scorePin', () => {
  it('gives full marks near the country', () => {
    expect(scorePin('world', 0)).toBe(MAX_POINTS)
    expect(scorePin('world', 150)).toBe(MAX_POINTS)
    expect(scorePin('europe', 25)).toBe(MAX_POINTS)
  })

  it('falls with distance, faster on a tighter map', () => {
    expect(scorePin('world', 412)).toBe(877)
    expect(scorePin('europe', 412)).toBeLessThan(scorePin('world', 412))
    expect(scorePin('world', 20000)).toBeLessThan(10)
    expect(scorePin('world', Number.POSITIVE_INFINITY)).toBe(0)
  })
})
