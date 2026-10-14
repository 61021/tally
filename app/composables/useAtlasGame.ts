import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { AtlasMap, AtlasRound, Country, PinResult, Point, Region } from '#shared/atlas/types'
import { computed, onMounted, ref, shallowRef } from 'vue'
import { COUNTRY_BY_ID } from '#shared/atlas/countries'
import { measurePin, parseRings } from '#shared/atlas/geo'
import { addPin, currentTarget, isFinished, newRound, roundScore } from '#shared/atlas/round'
import { scorePin } from '#shared/atlas/score'
import { loadAtlasMap } from '../utils/atlas-maps'
import { bestScore, loadRound, recordScore, saveRound } from '../utils/atlas-progress'

export type AtlasStatus = 'loading' | 'ready' | 'error'

/** Aiming at a country, looking at where it really is, or reading the round's score. */
export type AtlasPhase = 'aim' | 'reveal' | 'done'

export interface UseAtlasGame {
  status: Ref<AtlasStatus>
  map: ShallowRef<AtlasMap | null>
  round: ShallowRef<AtlasRound | null>
  phase: ComputedRef<AtlasPhase>
  /** The country being asked, or the one just revealed. */
  country: ComputedRef<Country | null>
  /** The pin just placed, while it's revealed. */
  result: ComputedRef<PinResult | null>
  score: ComputedRef<number>
  best: Ref<number | null>
  newBest: Ref<boolean>
  pin: (point: Point) => void
  next: () => void
  playAgain: () => void
  retry: () => void
}

export function useAtlasGame(region: Region): UseAtlasGame {
  const status = ref<AtlasStatus>('loading')
  const map = shallowRef<AtlasMap | null>(null)
  const round = shallowRef<AtlasRound | null>(null)
  const revealing = ref(false)
  const best = ref<number | null>(null)
  const newBest = ref(false)
  const rings = new Map<string, Point[][]>()

  const phase = computed<AtlasPhase>(() => {
    if (revealing.value)
      return 'reveal'
    return round.value && isFinished(round.value) ? 'done' : 'aim'
  })

  const country = computed(() => {
    const r = round.value
    if (!r)
      return null
    const id = phase.value === 'reveal' ? r.targets[r.pins.length - 1] : currentTarget(r)
    return (id && COUNTRY_BY_ID.get(id)) || null
  })

  const result = computed(() => (phase.value === 'reveal' ? round.value?.pins.at(-1) ?? null : null))
  const score = computed(() => (round.value ? roundScore(round.value) : 0))

  function ringsOf(id: string): Point[][] {
    let found = rings.get(id)
    if (!found) {
      found = parseRings(map.value?.countries.find(c => c.id === id)?.d ?? '')
      rings.set(id, found)
    }
    return found
  }

  function start(): void {
    round.value = newRound(region, Math.random)
    saveRound(round.value)
    revealing.value = false
    newBest.value = false
  }

  async function load(): Promise<void> {
    status.value = 'loading'
    try {
      map.value = await loadAtlasMap(region)
      best.value = bestScore(region)
      const saved = loadRound(region)
      if (saved && !isFinished(saved))
        round.value = saved
      else
        start()
      status.value = 'ready'
    }
    catch {
      status.value = 'error'
    }
  }

  function pin(point: Point): void {
    const r = round.value
    const m = map.value
    const id = r && currentTarget(r)
    if (!r || !m || !id || phase.value !== 'aim')
      return
    const { km, nearest } = measurePin(m.frame, point, ringsOf(id))
    round.value = addPin(r, { pin: point, nearest, km, points: scorePin(region, km) })
    saveRound(round.value)
    revealing.value = true
    if (isFinished(round.value)) {
      newBest.value = recordScore(region, roundScore(round.value))
      best.value = bestScore(region)
    }
  }

  function next(): void {
    revealing.value = false
  }

  onMounted(load)

  return { status, map, round, phase, country, result, score, best, newBest, pin, next, playAgain: start, retry: load }
}
