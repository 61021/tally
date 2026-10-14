export type Continent = 'africa' | 'americas' | 'asia' | 'europe' | 'oceania'

/** A map you can play: the whole world or one continent. */
export type Region = 'world' | Continent

export interface Country {
  /** ISO 3166-1 alpha-3. */
  id: string
  name: string
  continent: Continent
}

/** Longitude and latitude in degrees. */
export type LonLat = readonly [lon: number, lat: number]

/** A point in a map's own SVG units. */
export type Point = readonly [x: number, y: number]

export type Projection
  = | { kind: 'equal-earth', lon0: number }
    | { kind: 'azimuthal', lon0: number, lat0: number }

/** How a map's SVG units relate to its projection: x = px * scale + dx, y = dy - py * scale. */
export interface Frame {
  projection: Projection
  scale: number
  dx: number
  dy: number
}

export interface MapCountry {
  id: string
  /** Closed rings as SVG path data in map units: `M` then relative `l` moves, `z` between rings. */
  d: string
  /** Too small to see at this scale, so a ring marks it once revealed. */
  tiny: boolean
}

/** One region's map, as `scripts/generate-atlas.ts` writes it to `public/atlas/<region>.json`. */
export interface AtlasMap {
  region: Region
  width: number
  height: number
  frame: Frame
  /** Every country this region asks about. */
  countries: MapCountry[]
  /** The rest of the land in view, drawn but never asked. */
  land: string
  /** Meridians and parallels every 15°. */
  graticule: string
}

/** Where a pin landed, measured against the country it was meant for. */
export interface PinResult {
  pin: Point
  /** The closest point of the country to the pin, in map units; the pin itself when it landed inside. */
  nearest: Point
  km: number
  points: number
}

export interface AtlasRound {
  region: Region
  /** Ten country ids in the order they're asked. */
  targets: string[]
  pins: PinResult[]
}
