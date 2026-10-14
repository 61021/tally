import type { Frame, LonLat, Point } from './types.ts'
import { describe, expect, it } from 'vitest'
import { closestOnSegment, distanceKm, insideRings, measurePin, parseRings } from './geo.ts'
import { toMap } from './projection.ts'

const BAGHDAD: LonLat = [44.366, 33.315]
const LONDON: LonLat = [-0.128, 51.507]

describe('distanceKm', () => {
  it('measures along the ground', () => {
    expect(distanceKm(BAGHDAD, LONDON)).toBeGreaterThan(4050)
    expect(distanceKm(BAGHDAD, LONDON)).toBeLessThan(4120)
    expect(distanceKm(BAGHDAD, BAGHDAD)).toBe(0)
  })

  it('goes the short way across the date line', () => {
    expect(distanceKm([179.5, 0], [-179.5, 0])).toBeLessThan(120)
  })
})

describe('closestOnSegment', () => {
  it('drops a perpendicular onto the middle of a segment', () => {
    const { place, angle } = closestOnSegment([5, 1], [0, 0], [10, 0])
    expect(place[0]).toBeCloseTo(5, 3)
    expect(place[1]).toBeCloseTo(0, 3)
    expect(angle * 6371).toBeCloseTo(111.2, 0)
  })

  it('stops at the ends', () => {
    expect(closestOnSegment([-3, 0], [0, 0], [10, 0]).place).toEqual([0, 0])
    expect(closestOnSegment([14, 1], [0, 0], [10, 0]).place).toEqual([10, 0])
  })
})

describe('parseRings', () => {
  it('reads absolute starts and relative moves, ring by ring', () => {
    expect(parseRings('M10 10l5 0 0 5-5 0zM100.5 -2l1.5 1z')).toEqual([
      [[10, 10], [15, 10], [15, 15], [10, 15]],
      [[100.5, -2], [102, -1]],
    ])
  })
})

describe('insideRings', () => {
  const outer: Point[] = [[0, 0], [10, 0], [10, 10], [0, 10]]
  const hole: Point[] = [[4, 4], [6, 4], [6, 6], [4, 6]]

  it('counts a point inside the outline', () => {
    expect(insideRings([2, 2], [outer])).toBe(true)
    expect(insideRings([12, 2], [outer])).toBe(false)
  })

  it('treats an enclave as outside', () => {
    expect(insideRings([5, 5], [outer, hole])).toBe(false)
    expect(insideRings([5, 5], [hole])).toBe(true)
  })
})

describe('measurePin', () => {
  const frame: Frame = { projection: { kind: 'equal-earth', lon0: 0 }, scale: 100, dx: 300, dy: 150 }
  // A box from 0°E to 10°E and 0°N to 10°N, traced a degree at a time like a real border.
  const edge: LonLat[] = [
    ...Array.from({ length: 10 }, (_, i): LonLat => [i, 0]),
    ...Array.from({ length: 10 }, (_, i): LonLat => [10, i]),
    ...Array.from({ length: 10 }, (_, i): LonLat => [10 - i, 10]),
    ...Array.from({ length: 10 }, (_, i): LonLat => [0, 10 - i]),
  ]
  const rings = [edge.map(place => toMap(frame, place)!)]

  it('scores a pin inside as no distance at all', () => {
    const pin = toMap(frame, [5, 5])!
    expect(measurePin(frame, pin, rings)).toEqual({ km: 0, nearest: pin })
  })

  it('measures a miss to the closest edge', () => {
    const { km, nearest } = measurePin(frame, toMap(frame, [5, -2])!, rings)
    expect(km).toBeCloseTo(222.4, 0)
    const expected = toMap(frame, [5, 0])!
    expect(nearest[0]).toBeCloseTo(expected[0], 3)
    expect(nearest[1]).toBeCloseTo(expected[1], 3)
  })
})
