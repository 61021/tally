import type { AtlasMap, Region } from '#shared/atlas/types'

const maps = new Map<Region, Promise<AtlasMap>>()

async function fetchMap(region: Region): Promise<AtlasMap> {
  const response = await fetch(`/atlas/${region}.json`)
  if (!response.ok)
    throw new Error(`Map ${region} answered ${response.status}`)
  return await response.json() as AtlasMap
}

/** Each region's map is fetched once per visit; a failed fetch is forgotten so the next try goes out again. */
export function loadAtlasMap(region: Region): Promise<AtlasMap> {
  let map = maps.get(region)
  if (!map) {
    map = fetchMap(region)
    map.catch(() => maps.delete(region))
    maps.set(region, map)
  }
  return map
}
