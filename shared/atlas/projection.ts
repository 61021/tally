import type { Frame, LonLat, Point, Projection } from './types.ts'

const RAD = Math.PI / 180

// Equal Earth (Šavrič, Patterson and Jenny, 2018), on the unit sphere.
const A1 = 1.340264
const A2 = -0.081106
const A3 = 0.000893
const A4 = 0.003796
const M = Math.sqrt(3) / 2

/** Into -180°..180°, keeping both edges so the world's east edge stays east. */
function wrap(lambda: number): number {
  while (lambda > Math.PI)
    lambda -= 2 * Math.PI
  while (lambda < -Math.PI)
    lambda += 2 * Math.PI
  return lambda
}

function equalEarth(lambda: number, phi: number): Point {
  const theta = Math.asin(M * Math.sin(phi))
  const t2 = theta * theta
  const t6 = t2 * t2 * t2
  return [
    (lambda * Math.cos(theta)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))),
    theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)),
  ]
}

function equalEarthInverse(x: number, y: number): [number, number] | null {
  let theta = y
  for (let i = 0; i < 12; i++) {
    const t2 = theta * theta
    const t6 = t2 * t2 * t2
    const delta = (theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)) - y) / (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))
    theta -= delta
    if (Math.abs(delta) < 1e-12)
      break
  }
  const t2 = theta * theta
  const t6 = t2 * t2 * t2
  const sinPhi = Math.sin(theta) / M
  const lambda = (M * x * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))) / Math.cos(theta)
  if (Math.abs(sinPhi) > 1 || Math.abs(lambda) > Math.PI + 1e-9)
    return null
  return [lambda, Math.asin(sinPhi)]
}

// Lambert azimuthal equal-area: true areas around a centre, the usual atlas projection for a continent.
function azimuthal(lambda: number, phi: number, phi0: number): Point | null {
  const cosC = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda)
  // Near the far side of the globe the projection tears apart; nothing a continent map shows sits there.
  if (cosC < -0.9)
    return null
  const k = Math.sqrt(2 / (1 + cosC))
  return [
    k * Math.cos(phi) * Math.sin(lambda),
    k * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)),
  ]
}

function azimuthalInverse(x: number, y: number, phi0: number): [number, number] | null {
  const rho = Math.hypot(x, y)
  if (rho > 2)
    return null
  if (rho < 1e-12)
    return [0, phi0]
  const c = 2 * Math.asin(rho / 2)
  const phi = Math.asin(Math.cos(c) * Math.sin(phi0) + (y * Math.sin(c) * Math.cos(phi0)) / rho)
  const lambda = Math.atan2(x * Math.sin(c), rho * Math.cos(phi0) * Math.cos(c) - y * Math.sin(phi0) * Math.sin(c))
  return [lambda, phi]
}

/** Projects onto the unit sphere's plane; null where the projection can't show the point. */
export function project(projection: Projection, [lon, lat]: LonLat): Point | null {
  const lambda = wrap((lon - projection.lon0) * RAD)
  const phi = lat * RAD
  return projection.kind === 'equal-earth' ? equalEarth(lambda, phi) : azimuthal(lambda, phi, projection.lat0 * RAD)
}

export function unproject(projection: Projection, [x, y]: Point): LonLat | null {
  const result = projection.kind === 'equal-earth' ? equalEarthInverse(x, y) : azimuthalInverse(x, y, projection.lat0 * RAD)
  if (!result)
    return null
  return [wrap(result[0] + projection.lon0 * RAD) / RAD, result[1] / RAD]
}

/** A place on the map, in the map's SVG units. */
export function toMap(frame: Frame, lonLat: LonLat): Point | null {
  const p = project(frame.projection, lonLat)
  return p && [p[0] * frame.scale + frame.dx, frame.dy - p[1] * frame.scale]
}

/** The place under a point of the map; null off the edge of the world. */
export function fromMap(frame: Frame, [x, y]: Point): LonLat | null {
  return unproject(frame.projection, [(x - frame.dx) / frame.scale, (frame.dy - y) / frame.scale])
}
