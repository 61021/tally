import type { AtlasRound, Region } from '#shared/atlas/types'
import { STORAGE_PREFIX } from '../constants/atlas'
import { readJson, writeJson } from './storage'

const roundKey = (region: Region): string => `${STORAGE_PREFIX}:round:${region}`
const bestKey = (region: Region): string => `${STORAGE_PREFIX}:best:${region}`

/** The round being played in this region, finished or not, until a new one replaces it. */
export function loadRound(region: Region): AtlasRound | null {
  const round = readJson<AtlasRound>(roundKey(region))
  return round?.region === region && Array.isArray(round.targets) && Array.isArray(round.pins) ? round : null
}

export function saveRound(round: AtlasRound): void {
  writeJson(roundKey(round.region), round)
}

export function bestScore(region: Region): number | null {
  return readJson<number>(bestKey(region))
}

/** Keeps the higher score; true when this one beat the old best. */
export function recordScore(region: Region, score: number): boolean {
  const best = bestScore(region)
  if (best !== null && best >= score)
    return false
  writeJson(bestKey(region), score)
  return true
}
