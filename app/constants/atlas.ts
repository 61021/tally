import type { Region } from '#shared/atlas/types'

export const STORAGE_PREFIX = 'tally:atlas'

/** How far one arrow key moves the keyboard marker, in map units; Shift moves five times as far. */
export const KEY_STEP = 6

/** Each map's width over its height, so the frame holds its shape while the map loads. */
export const ASPECTS: Record<Region, number> = { world: 2.315, africa: 1.129, americas: 0.922, asia: 1.592, europe: 1.376, oceania: 1.403 }

/** How far in the map zooms: a sixth of its width fills the frame. */
export const MAX_ZOOM = 6
