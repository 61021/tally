import type { Continent, Region } from './types.ts'

export const REGIONS: readonly Region[] = ['world', 'africa', 'americas', 'asia', 'europe', 'oceania']

export const CONTINENTS: readonly Continent[] = ['africa', 'americas', 'asia', 'europe', 'oceania']

export const REGION_NAMES: Record<Region, string> = {
  world: 'World',
  africa: 'Africa',
  americas: 'Americas',
  asia: 'Asia',
  europe: 'Europe',
  oceania: 'Oceania',
}

export const ROUND_SIZE = 10

export const MAX_POINTS = 1000

/**
 * How close counts, per region: a pin within `nearKm` of the country scores full marks, and the score
 * then falls by about two thirds every `spreadKm`. A tighter map asks for a tighter pin.
 */
export const SCORING: Record<Region, { nearKm: number, spreadKm: number }> = {
  world: { nearKm: 150, spreadKm: 2000 },
  africa: { nearKm: 60, spreadKm: 900 },
  americas: { nearKm: 60, spreadKm: 1000 },
  asia: { nearKm: 60, spreadKm: 1000 },
  europe: { nearKm: 25, spreadKm: 450 },
  oceania: { nearKm: 60, spreadKm: 900 },
}

/** Mean Earth radius. */
export const EARTH_KM = 6371.0088
