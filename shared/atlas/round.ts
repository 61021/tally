import type { Random } from '../sudoku/types.ts'
import type { AtlasRound, Country, PinResult, Region } from './types.ts'
import { shuffle } from '../sudoku/rng.ts'
import { ROUND_SIZE } from './constants.ts'
import { COUNTRIES } from './countries.ts'

export function countriesIn(region: Region): Country[] {
  return region === 'world' ? [...COUNTRIES] : COUNTRIES.filter(c => c.continent === region)
}

/** Ten countries, none twice. */
export function newRound(region: Region, random: Random): AtlasRound {
  const ids = shuffle(countriesIn(region).map(c => c.id), random)
  return { region, targets: ids.slice(0, ROUND_SIZE), pins: [] }
}

export function addPin(round: AtlasRound, result: PinResult): AtlasRound {
  if (round.pins.length >= round.targets.length)
    return round
  return { ...round, pins: [...round.pins, result] }
}

export function roundScore(round: AtlasRound): number {
  return round.pins.reduce((sum, pin) => sum + pin.points, 0)
}

export function isFinished(round: AtlasRound): boolean {
  return round.pins.length >= round.targets.length
}

/** The country being asked now, or null once every pin is down. */
export function currentTarget(round: AtlasRound): string | null {
  return round.targets[round.pins.length] ?? null
}
