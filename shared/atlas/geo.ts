import type { Frame, LonLat, Point } from './types.ts'
import { EARTH_KM } from './constants.ts'
import { fromMap, toMap } from './projection.ts'

const RAD = Math.PI / 180

/** Great-circle angle between two places, in radians. */
function angle([lon1, lat1]: LonLat, [lon2, lat2]: LonLat): number {
  const dLat = (lat2 - lat1) * RAD
  const dLon = (lon2 - lon1) * RAD
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

function bearing([lon1, lat1]: LonLat, [lon2, lat2]: LonLat): number {
  const p1 = lat1 * RAD
  const p2 = lat2 * RAD
  const dl = (lon2 - lon1) * RAD
  return Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl))
}

/** The place a fraction of the way along the great circle from a to b. */
function between(a: LonLat, b: LonLat, f: number, delta: number): LonLat {
  if (delta < 1e-12)
    return a
  const s = Math.sin(delta)
  const wa = Math.sin((1 - f) * delta) / s
  const wb = Math.sin(f * delta) / s
  const [l1, p1] = [a[0] * RAD, a[1] * RAD]
  const [l2, p2] = [b[0] * RAD, b[1] * RAD]
  const x = wa * Math.cos(p1) * Math.cos(l1) + wb * Math.cos(p2) * Math.cos(l2)
  const y = wa * Math.cos(p1) * Math.sin(l1) + wb * Math.cos(p2) * Math.sin(l2)
  const z = wa * Math.sin(p1) + wb * Math.sin(p2)
  return [Math.atan2(y, x) / RAD, Math.atan2(z, Math.hypot(x, y)) / RAD]
}

export function distanceKm(a: LonLat, b: LonLat): number {
  return angle(a, b) * EARTH_KM
}

/** The closest place on the great-circle segment a-b to p, and its angle from p. */
export function closestOnSegment(p: LonLat, a: LonLat, b: LonLat): { place: LonLat, angle: number } {
  const dAB = angle(a, b)
  const dAP = angle(a, p)
  if (dAB < 1e-12)
    return { place: a, angle: dAP }
  const offset = bearing(a, p) - bearing(a, b)
  const cross = Math.asin(Math.sin(dAP) * Math.sin(offset))
  if (Math.cos(offset) <= 0)
    return { place: a, angle: dAP }
  const along = Math.acos(Math.min(1, Math.max(-1, Math.cos(dAP) / Math.cos(cross))))
  if (along >= dAB) {
    return { place: b, angle: angle(b, p) }
  }
  return { place: between(a, b, along / dAB, dAB), angle: Math.abs(cross) }
}

/** Reads the path data the atlas generator writes (`M` then relative `l` moves, rings closed by `z`). */
export function parseRings(d: string): Point[][] {
  const rings: Point[][] = []
  let ring: Point[] = []
  let x = 0
  let y = 0
  let command = ''
  const tokens = d.match(/[MLmlZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!
    if (/^[MLZ]$/i.test(token)) {
      command = token
      if (token === 'z' || token === 'Z') {
        if (ring.length)
          rings.push(ring)
        ring = []
      }
      continue
    }
    const nx = Number(token)
    const ny = Number(tokens[++i])
    if (command === 'M' || command === 'L') {
      x = nx
      y = ny
    }
    else {
      x += nx
      y += ny
    }
    if (command === 'M' && ring.length) {
      rings.push(ring)
      ring = []
    }
    ring.push([x, y])
    if (command === 'M')
      command = 'L'
    else if (command === 'm')
      command = 'l'
  }
  if (ring.length)
    rings.push(ring)
  return rings
}

/** Even-odd, so a pin inside an enclave (Lesotho inside South Africa) is outside the surrounding country. */
export function insideRings([px, py]: Point, rings: readonly Point[][]): boolean {
  let inside = false
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]!
      const [xj, yj] = ring[j]!
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)
        inside = !inside
    }
  }
  return inside
}

/** How far a pin on the map is from a country, along the ground, and the country's closest point to it. */
export function measurePin(frame: Frame, pin: Point, rings: readonly Point[][]): { km: number, nearest: Point } {
  if (insideRings(pin, rings))
    return { km: 0, nearest: pin }
  const place = fromMap(frame, pin)
  if (!place)
    return { km: Number.POSITIVE_INFINITY, nearest: pin }
  let best = Number.POSITIVE_INFINITY
  let bestPlace: LonLat | null = null
  for (const ring of rings) {
    const places = ring.map(point => fromMap(frame, point))
    for (let i = 0; i < places.length; i++) {
      const a = places[i]
      const b = places[(i + 1) % places.length]
      if (!a || !b)
        continue
      const closest = closestOnSegment(place, a, b)
      if (closest.angle < best) {
        best = closest.angle
        bestPlace = closest.place
      }
    }
  }
  const nearest = bestPlace && toMap(frame, bestPlace)
  return { km: best * EARTH_KM, nearest: nearest ?? pin }
}
