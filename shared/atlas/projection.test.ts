import type { Frame, LonLat, Projection } from './types.ts'
import { describe, expect, it } from 'vitest'
import { fromMap, project, toMap, unproject } from './projection.ts'

const PLACES: LonLat[] = [[0, 0], [44.36, 33.31], [-0.13, 51.51], [151.2, -33.87], [-70.6, -33.45], [179.5, -16.5], [-179.5, 65], [10, 80]]

describe('project and unproject', () => {
  const projections: Projection[] = [
    { kind: 'equal-earth', lon0: 0 },
    { kind: 'equal-earth', lon0: 11 },
    { kind: 'azimuthal', lon0: 15, lat0: 52 },
    { kind: 'azimuthal', lon0: 160, lat0: -15 },
  ]

  it.each(projections)('round-trips every place it can show (%o)', (projection) => {
    for (const place of PLACES) {
      const point = project(projection, place)
      if (!point)
        continue
      const back = unproject(projection, point)!
      expect(back[0]).toBeCloseTo(place[0], 6)
      expect(back[1]).toBeCloseTo(place[1], 6)
    }
  })

  it('puts the centre of each projection at the origin', () => {
    expect(project({ kind: 'equal-earth', lon0: 0 }, [0, 0])).toEqual([0, 0])
    const centre = project({ kind: 'azimuthal', lon0: 15, lat0: 52 }, [15, 52])!
    expect(centre[0]).toBeCloseTo(0, 12)
    expect(centre[1]).toBeCloseTo(0, 12)
  })

  it('draws north up and east to the right', () => {
    const projection: Projection = { kind: 'azimuthal', lon0: 15, lat0: 52 }
    const north = project(projection, [15, 60])!
    const east = project(projection, [25, 52])!
    expect(north[1]).toBeGreaterThan(0)
    expect(east[0]).toBeGreaterThan(0)
  })

  it('refuses the far side of the globe on an azimuthal map', () => {
    expect(project({ kind: 'azimuthal', lon0: 15, lat0: 52 }, [-165, -52])).toBeNull()
  })

  it('finds nothing off the edge of the world', () => {
    expect(unproject({ kind: 'equal-earth', lon0: 0 }, [4, 0])).toBeNull()
    expect(unproject({ kind: 'azimuthal', lon0: 0, lat0: 0 }, [2.5, 0])).toBeNull()
  })
})

describe('toMap and fromMap', () => {
  const frame: Frame = { projection: { kind: 'equal-earth', lon0: 0 }, scale: 180, dx: 500, dy: 250 }

  it('flips y so north is up on screen', () => {
    expect(toMap(frame, [0, 45])![1]).toBeLessThan(250)
  })

  it('round-trips through map units', () => {
    const back = fromMap(frame, toMap(frame, [44.36, 33.31])!)!
    expect(back[0]).toBeCloseTo(44.36, 6)
    expect(back[1]).toBeCloseTo(33.31, 6)
  })
})
