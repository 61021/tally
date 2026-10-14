import type { AtlasMap, Box, Frame, LonLat, MapCountry, Point, Projection, Region } from '../shared/atlas/types.ts'
import { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { REGIONS } from '../shared/atlas/constants.ts'
import { COUNTRIES } from '../shared/atlas/countries.ts'
import { insideRings } from '../shared/atlas/geo.ts'
import { project } from '../shared/atlas/projection.ts'

const NATURAL_EARTH = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson'
// The Saudi Arabia worldview draws Israel's land as Palestine and keeps the Golan in Syria.
const COUNTRIES_FILE = 'ne_10m_admin_0_countries_sau.geojson'
// Its only real gap is Abyei; disputed areas no country covers are laid in as land nobody is asked about.
const DISPUTED_FILE = 'ne_10m_admin_0_disputed_areas.geojson'
const CACHE = 'node_modules/.cache/tally-atlas'
const OUT = 'public/atlas'

/** Every map is this wide in SVG units; its height follows the region's shape. */
const WIDTH = 1000
/** Douglas-Peucker tolerance in SVG units: well under a pixel at the sizes the maps are drawn. */
const TOLERANCE = 0.25
/** Islands smaller than this, in SVG units, are dropped unless they are a whole country. */
const MIN_ISLAND = 0.6
/** Land nobody is asked about, inside the region (Greenland beside the Americas), needs less detail than a country. */
const CONTEXT_TOLERANCE = 0.6
/** Land beyond the region only frames it: coarser the farther out it lies, with fewer islands. */
const FAR_TOLERANCE = 1
const FAR_MIN_ISLAND = 4
/** The widest laptop and the narrowest phone the map fills: it ships land enough around the region for both. */
const WIDEST_SCREEN = 2.4
const NARROWEST_SCREEN = 0.45
/** A country smaller than this, in SVG units, gets a ring when it's revealed. */
const TINY = 3

/** Land the UN counts as part of a member state, drawn as one shape with it. */
const PART_OF: Record<string, string> = { CYN: 'CYP', CNM: 'CYP', SOL: 'SOM', KAB: 'KAZ' }

interface RegionSpec {
  projection: Projection
  /** The longitudes and latitudes the map must show; the frame is the box around them. */
  lon: [number, number]
  lat: [number, number]
}

const SPECS: Record<Region, RegionSpec> = {
  world: { projection: { kind: 'equal-earth', lon0: 0 }, lon: [-180, 180], lat: [-56, 84] },
  africa: { projection: { kind: 'azimuthal', lon0: 18, lat0: 2 }, lon: [-26, 64], lat: [-35.5, 38] },
  americas: { projection: { kind: 'azimuthal', lon0: -84, lat0: 10 }, lon: [-170, -32], lat: [-56, 72] },
  asia: { projection: { kind: 'azimuthal', lon0: 88, lat0: 28 }, lon: [25, 150], lat: [-11, 56] },
  europe: { projection: { kind: 'azimuthal', lon0: 15, lat0: 52 }, lon: [-25, 45], lat: [34, 71.5] },
  oceania: { projection: { kind: 'azimuthal', lon0: 165, lat0: -15 }, lon: [110, 210], lat: [-48, 15] },
}

type Polygon = LonLat[][]

interface Feature {
  id: string
  polygons: Polygon[]
}

interface GeoJson {
  features: {
    properties: Record<string, string | number | null>
    geometry: { type: 'Polygon', coordinates: Polygon } | { type: 'MultiPolygon', coordinates: Polygon[] }
  }[]
}

async function load(file: string): Promise<GeoJson> {
  const path = join(CACHE, file)
  if (!existsSync(path)) {
    console.log(`Downloading ${file}`)
    const response = await fetch(`${NATURAL_EARTH}/${file}`)
    if (!response.ok)
      throw new Error(`Natural Earth answered ${response.status} for ${file}`)
    await mkdir(CACHE, { recursive: true })
    await writeFile(path, Buffer.from(await response.arrayBuffer()))
  }
  return JSON.parse(await readFile(path, 'utf8')) as GeoJson
}

const polygonsOf = (geometry: GeoJson['features'][number]['geometry']): Polygon[] => geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

function covers(polygons: Polygon[], place: LonLat): boolean {
  return polygons.some(([outer, ...holes]) => insideRings(place, [outer!]) && !holes.some(hole => insideRings(place, [hole])))
}

function readFeatures(countries: GeoJson, disputed: GeoJson): Feature[] {
  const byId = new Map<string, Polygon[]>()
  for (const { properties: p, geometry } of countries.features) {
    if (p.FCLASS_SA === 'Unrecognized')
      continue
    const adm = String(p.ADM0_A3)
    const iso = String(p.ISO_A3_EH)
    const id = PART_OF[adm] ?? (iso !== '-99' ? iso : adm)
    byId.set(id, [...(byId.get(id) ?? []), ...polygonsOf(geometry)])
  }
  const missing = COUNTRIES.filter(c => !byId.has(c.id))
  if (missing.length)
    throw new Error(`Natural Earth has no shape for ${missing.map(c => c.id).join(', ')}`)
  const all = [...byId.values()].flat()
  for (const { properties: p, geometry } of disputed.features) {
    const label: LonLat = [Number(p.LABEL_X), Number(p.LABEL_Y)]
    if (!covers(all, label))
      byId.set(`gap:${p.NAME}`, polygonsOf(geometry))
  }
  return [...byId].map(([id, polygons]) => ({ id, polygons }))
}

function sampleEdges(spec: RegionSpec): LonLat[] {
  const [w, e] = spec.lon
  const [s, n] = spec.lat
  const out: LonLat[] = []
  for (let i = 0; i <= 64; i++) {
    const t = i / 64
    out.push([w + (e - w) * t, s], [w + (e - w) * t, n], [w, s + (n - s) * t], [e, s + (n - s) * t])
  }
  return out
}

function frameFor(spec: RegionSpec): { frame: Frame, height: number } {
  const points = sampleEdges(spec).map(place => project(spec.projection, place)).filter(p => p !== null)
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const scale = WIDTH / (maxX - minX)
  return {
    frame: { projection: spec.projection, scale, dx: -minX * scale, dy: maxY * scale },
    height: Math.round((maxY - minY) * scale),
  }
}

function toMapPoint(frame: Frame, place: LonLat): Point | null {
  const p = project(frame.projection, place)
  return p && [p[0] * frame.scale + frame.dx, frame.dy - p[1] * frame.scale]
}

function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length < 5)
    return points
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length) {
    const [first, last] = stack.pop()!
    const [ax, ay] = points[first]!
    const [bx, by] = points[last]!
    const length = Math.hypot(bx - ax, by - ay)
    let worst = 0
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i]!
      const d = length === 0 ? Math.hypot(px - ax, py - ay) : Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length
      if (d > worst) {
        worst = d
        index = i
      }
    }
    if (worst > tolerance) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  const out = points.filter((_, i) => keep[i])
  return out.length >= 4 ? out : points
}

function size(ring: Point[]): number {
  const xs = ring.map(p => p[0])
  const ys = ring.map(p => p[1])
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
}

const within = ([x, y]: Point, box: Box): boolean => x > box.x && x < box.x + box.width && y > box.y && y < box.y + box.height

/** How far a ring's closest point lies outside a box, in SVG units. */
function distanceTo(ring: Point[], box: Box): number {
  let best = Number.POSITIVE_INFINITY
  for (const [x, y] of ring) {
    const dx = Math.max(box.x - x, 0, x - (box.x + box.width))
    const dy = Math.max(box.y - y, 0, y - (box.y + box.height))
    best = Math.min(best, Math.hypot(dx, dy))
  }
  return best
}

/** The region plus what a wider or taller screen shows around it, and a little more for panning. */
function boundsFor(height: number): Box {
  const aspect = WIDTH / height
  const side = Math.max(0, (WIDEST_SCREEN / aspect - 1) / 2) + 0.05
  const top = Math.max(0, (aspect / NARROWEST_SCREEN - 1) / 2) + 0.05
  return { x: -side * WIDTH, y: -top * height, width: WIDTH * (1 + 2 * side), height: height * (1 + 2 * top) }
}

const num = (n: number): string => String(Math.round(n * 10) / 10 || 0)

/** `M` to the first point, then relative moves, with each ring closed by `z`. */
function encode(rings: Point[][], close = true): string {
  let d = ''
  for (const ring of rings) {
    const rounded = ring.map(([x, y]): Point => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])
    d += `M${num(rounded[0]![0])} ${num(rounded[0]![1])}`
    let moves = ''
    for (let i = 1; i < rounded.length; i++) {
      const dx = rounded[i]![0] - rounded[i - 1]![0]
      const dy = rounded[i]![1] - rounded[i - 1]![1]
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05)
        continue
      const pair = `${num(dx)}${dy < 0 ? '' : ' '}${num(dy)}`
      moves += moves && !pair.startsWith('-') ? ` ${pair}` : pair
    }
    if (moves)
      d += `l${moves}`
    if (close)
      d += 'z'
  }
  return d
}

/** Projects a feature's rings and keeps those in view; small islands go unless they are all the country has. */
function drawFeature(feature: Feature, frame: Frame, bounds: Box, core: Box, asked: boolean): Point[][] {
  const rings: Point[][] = []
  let largest: Point[] | null = null
  for (const polygon of feature.polygons) {
    for (const [i, ring] of polygon.entries()) {
      const projected = ring.map(place => toMapPoint(frame, place))
      if (projected.includes(null) || !(projected as Point[]).some(p => within(p, bounds)))
        continue
      const near = (projected as Point[]).some(p => within(p, core))
      const away = near ? 0 : distanceTo(projected as Point[], core) / WIDTH
      const points = simplify(projected as Point[], near ? (asked ? TOLERANCE : CONTEXT_TOLERANCE) : FAR_TOLERANCE * (1 + 4 * away))
      if (i === 0 && (!largest || size(points) > size(largest)))
        largest = points
      if (size(points) >= (near ? MIN_ISLAND : FAR_MIN_ISLAND * (1 + 4 * away)))
        rings.push(points)
    }
  }
  if (!rings.length && largest)
    rings.push(largest)
  return rings
}

function graticule(frame: Frame, bounds: Box): string {
  const lines: Point[][] = []
  const trace = (places: LonLat[]): void => {
    let line: Point[] = []
    for (const place of places) {
      const p = toMapPoint(frame, place)
      if (p && within(p, bounds)) {
        line.push(p)
      }
      else {
        if (line.length > 1)
          lines.push(line)
        line = []
      }
    }
    if (line.length > 1)
      lines.push(line)
  }
  const [south, north] = [-85, 85]
  for (let lon = -180; lon < 180; lon += 15)
    trace(Array.from({ length: north - south + 1 }, (_, i): LonLat => [lon, south + i]))
  for (let lat = -75; lat <= 75; lat += 15)
    trace(Array.from({ length: 361 }, (_, i): LonLat => [-180 + i, lat]))
  return encode(lines.map(line => simplify(line, TOLERANCE)), false)
}

function buildMap(region: Region, features: Feature[]): AtlasMap {
  const spec = SPECS[region]
  const { frame, height } = frameFor(spec)
  const bounds = boundsFor(height)
  const core: Box = { x: -0.05 * WIDTH, y: -0.05 * height, width: 1.1 * WIDTH, height: 1.1 * height }
  const asked = new Set(COUNTRIES.filter(c => region === 'world' || c.continent === region).map(c => c.id))
  const countries: MapCountry[] = []
  const land: Point[][] = []
  for (const feature of features) {
    const rings = drawFeature(feature, frame, bounds, core, asked.has(feature.id))
    if (!rings.length) {
      if (asked.has(feature.id))
        throw new Error(`${feature.id} is asked in ${region} but not on its map`)
      continue
    }
    if (asked.has(feature.id))
      countries.push({ id: feature.id, d: encode(rings), tiny: Math.max(...rings.map(size)) < TINY })
    else
      land.push(...rings)
  }
  countries.sort((a, b) => a.id.localeCompare(b.id))
  const round = (n: number): number => Math.round(n * 1000) / 1000
  return {
    region,
    width: WIDTH,
    height,
    bounds: { x: round(bounds.x), y: round(bounds.y), width: round(bounds.width), height: round(bounds.height) },
    frame: { ...frame, scale: round(frame.scale), dx: round(frame.dx), dy: round(frame.dy) },
    countries,
    land: encode(land),
    graticule: graticule(frame, bounds),
  }
}

/** The hub's little globe: the land seen from above the Middle East, as one shape for a CSS mask. */
function globe(features: Feature[]): string {
  const [lon0, lat0] = [30 * Math.PI / 180, 22 * Math.PI / 180]
  const R = 100
  const rings: Point[][] = []
  for (const feature of features) {
    for (const polygon of feature.polygons) {
      const points: Point[] = []
      let seen = false
      for (const [lon, lat] of polygon[0]!) {
        const l = lon * Math.PI / 180 - lon0
        const p = lat * Math.PI / 180
        const cosC = Math.sin(lat0) * Math.sin(p) + Math.cos(lat0) * Math.cos(p) * Math.cos(l)
        let x = Math.cos(p) * Math.sin(l)
        let y = Math.cos(lat0) * Math.sin(p) - Math.sin(lat0) * Math.cos(p) * Math.cos(l)
        if (cosC < 0) {
          // Behind the globe: pin the point to the horizon so a shape that wraps round keeps a clean edge.
          const r = Math.hypot(x, y) || 1
          x /= r
          y /= r
        }
        else {
          seen = true
        }
        points.push([R + x * R, R - y * R])
      }
      const simple = simplify(points, 1.2)
      if (seen && size(simple) >= 2.5)
        rings.push(simple)
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="${encode(rings)}"/></svg>\n`
}

async function main(): Promise<void> {
  const features = readFeatures(await load(COUNTRIES_FILE), await load(DISPUTED_FILE))
  await mkdir(OUT, { recursive: true })
  for (const region of REGIONS) {
    const map = buildMap(region, features)
    const json = JSON.stringify(map)
    await writeFile(join(OUT, `${region}.json`), json)
    console.log(`${region}: ${map.countries.length} countries, ${map.width}x${map.height}, ${Math.round(json.length / 1024)} KB`)
  }
  await writeFile(join(OUT, 'globe.svg'), globe(features))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
