import type { Region } from './types.ts'
import { MAX_POINTS, SCORING } from './constants.ts'

/** Full marks near the country, then a smooth fall that never quite reaches zero for a pin on the right continent. */
export function scorePin(region: Region, km: number): number {
  const { nearKm, spreadKm } = SCORING[region]
  if (!Number.isFinite(km))
    return 0
  if (km <= nearKm)
    return MAX_POINTS
  return Math.round(MAX_POINTS * Math.exp(-(km - nearKm) / spreadKm))
}
