<script setup lang="ts">
import type { AtlasMap, AtlasRound, Point } from '#shared/atlas/types'
import type { AtlasPhase } from '../../composables/useAtlasGame'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { parseRings } from '#shared/atlas/geo'
import { KEY_STEP, MAX_ZOOM } from '../../constants/atlas'
import AtlasLand from './AtlasLand.vue'

const props = defineProps<{
  map: AtlasMap
  round: AtlasRound
  phase: AtlasPhase
  label: string
}>()

const emit = defineEmits<{ pin: [point: Point] }>()

const svgRef = useTemplateRef<SVGSVGElement>('svg')

interface View { x: number, y: number, w: number, h: number }

// The visible part of the map, written straight to the viewBox: zooming and panning never go through Vue.
let view: View = { x: 0, y: 0, w: props.map.width, h: props.map.height }
let measureFrame: number | undefined
let tween: number | undefined

// Map units per screen pixel, so pins and rings keep their size at any zoom on any screen.
const unit = ref(1)
const zoomed = ref(false)

function measure(): void {
  measureFrame = undefined
  const svg = svgRef.value
  if (!svg)
    return
  unit.value = view.w / Math.max(1, svg.clientWidth)
  zoomed.value = view.w < props.map.width - 0.5
}

function clampView(v: Pick<View, 'x' | 'y' | 'w'>): View {
  const { width, height } = props.map
  const w = Math.min(width, Math.max(width / MAX_ZOOM, v.w))
  const h = (w * height) / width
  return { w, h, x: Math.min(width - w, Math.max(0, v.x)), y: Math.min(height - h, Math.max(0, v.y)) }
}

function apply(next: View): void {
  view = next
  svgRef.value?.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`)
  measureFrame ??= requestAnimationFrame(measure)
}

function zoomAt([px, py]: Point, factor: number): void {
  const w = view.w / factor
  const k = w / view.w
  apply(clampView({ w, x: px - (px - view.x) * k, y: py - (py - view.y) * k }))
}

const FULL = (): View => ({ x: 0, y: 0, w: props.map.width, h: props.map.height })

/** Eases the view to a target over a quarter second, or jumps there when motion is reduced. */
function glide(target: View): void {
  if (tween !== undefined)
    cancelAnimationFrame(tween)
  if (matchMedia('(prefers-reduced-motion: reduce)').matches)
    return apply(target)
  const from = view
  const start = performance.now()
  const step = (now: number): void => {
    const t = Math.min(1, (now - start) / 250)
    const e = 1 - (1 - t) ** 3
    apply({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e })
    tween = t < 1 ? requestAnimationFrame(step) : undefined
  }
  tween = requestAnimationFrame(step)
}

function fit(): void {
  glide(FULL())
}

function toMap(clientX: number, clientY: number): Point | null {
  const ctm = svgRef.value?.getScreenCTM()
  if (!ctm)
    return null
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
  return [p.x, p.y]
}

let observer: ResizeObserver | undefined

onMounted(() => {
  observer = new ResizeObserver(() => measure())
  observer.observe(svgRef.value!)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (measureFrame !== undefined)
    cancelAnimationFrame(measureFrame)
  if (tween !== undefined)
    cancelAnimationFrame(tween)
})

const asked = computed(() => new Set(props.round.targets.slice(0, props.round.pins.length)))
const current = computed(() => (props.phase === 'reveal' ? props.round.targets[props.round.pins.length - 1] ?? null : null))
const currentPath = computed(() => props.map.countries.find(c => c.id === current.value)?.d ?? null)

// The pin just placed while it's revealed; every pin of the round once it's over.
const pins = computed(() => {
  const all = props.round.pins.map((p, i) => ({ ...p, i }))
  if (props.phase === 'done')
    return all
  return props.phase === 'reveal' ? all.slice(-1) : []
})

// A reveal or the round's end that falls outside a zoomed view backs out to the whole map.
watch(() => props.phase, (phase) => {
  if (phase === 'aim')
    return
  const marks = pins.value.flatMap(p => [p.pin, p.nearest])
  const outside = marks.some(([x, y]) => x < view.x || x > view.x + view.w || y < view.y || y > view.y + view.h)
  if (phase === 'done' || outside)
    fit()
})

function centreOf(d: string): Point {
  const points = parseRings(d).flat()
  const xs = points.map(p => p[0])
  const ys = points.map(p => p[1])
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
}

// Countries too small to see get a ring once they've been asked.
const rings = computed(() => props.map.countries
  .filter(c => c.tiny && asked.value.has(c.id))
  .map(c => ({ id: c.id, centre: centreOf(c.d) })))

function cross([x, y]: Point): string {
  const s = 5 * unit.value
  return `M${x - s} ${y - s}L${x + s} ${y + s}M${x + s} ${y - s}L${x - s} ${y + s}`
}

function crosshair([x, y]: Point): string {
  const [a, b] = [4 * unit.value, 11 * unit.value]
  return `M${x - b} ${y}H${x - a}M${x + a} ${y}H${x + b}M${x} ${y - b}V${y - a}M${x} ${y + a}V${y + b}`
}

function onWheel(event: WheelEvent): void {
  const at = toMap(event.clientX, event.clientY)
  if (!at)
    return
  event.preventDefault()
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1)
  // A trackpad pinch arrives as a wheel with ctrl held and small steps.
  zoomAt(at, Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0025)))
}

// The keyboard way to play: arrows move a marker, Enter drops the pin under it, + and - zoom around it.
const cursor = ref<Point | null>(null)

// Drag to pan, two fingers to pinch; a press that barely moved is a pin.
const pointers = new Map<number, { x: number, y: number }>()
let travel = 0

function onPointerDown(event: PointerEvent): void {
  if (pointers.size === 0)
    travel = 0
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (tween !== undefined) {
    cancelAnimationFrame(tween)
    tween = undefined
  }
}

function onPointerMove(event: PointerEvent): void {
  const prev = pointers.get(event.pointerId)
  if (!prev) {
    if (event.pointerType === 'mouse')
      cursor.value = null
    return
  }
  const now = { x: event.clientX, y: event.clientY }
  if (pointers.size === 1) {
    travel += Math.hypot(now.x - prev.x, now.y - prev.y)
    if (travel > 6 && zoomed.value) {
      const k = view.w / Math.max(1, svgRef.value!.clientWidth)
      apply(clampView({ w: view.w, x: view.x - (now.x - prev.x) * k, y: view.y - (now.y - prev.y) * k }))
    }
  }
  else if (pointers.size === 2) {
    travel = Number.POSITIVE_INFINITY
    const other = [...pointers].find(([id]) => id !== event.pointerId)![1]
    const before = Math.hypot(prev.x - other.x, prev.y - other.y)
    const after = Math.hypot(now.x - other.x, now.y - other.y)
    const mid = toMap((now.x + other.x) / 2, (now.y + other.y) / 2)
    if (mid && before > 0)
      zoomAt(mid, after / before)
  }
  pointers.set(event.pointerId, now)
}

function onPointerUp(event: PointerEvent): void {
  pointers.delete(event.pointerId)
}

function onClick(event: MouseEvent): void {
  if (props.phase !== 'aim' || travel > 6)
    return
  const at = toMap(event.clientX, event.clientY)
  if (at)
    emit('pin', at)
}

const ARROWS: Record<string, Point> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }

function onKey(event: KeyboardEvent): void {
  if (event.altKey || event.ctrlKey || event.metaKey)
    return
  const centre: Point = cursor.value ?? [view.x + view.w / 2, view.y + view.h / 2]
  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    return zoomAt(centre, 1.5)
  }
  if (event.key === '-') {
    event.preventDefault()
    return zoomAt(centre, 1 / 1.5)
  }
  if (event.key === '0') {
    event.preventDefault()
    return fit()
  }
  if (props.phase !== 'aim')
    return
  const arrow = ARROWS[event.key]
  if (arrow) {
    event.preventDefault()
    const step = KEY_STEP * unit.value * (event.shiftKey ? 5 : 1)
    const next: Point = [
      Math.min(props.map.width, Math.max(0, centre[0] + arrow[0] * step)),
      Math.min(props.map.height, Math.max(0, centre[1] + arrow[1] * step)),
    ]
    cursor.value = next
    // The view follows a marker that walks off its edge.
    if (next[0] < view.x || next[0] > view.x + view.w || next[1] < view.y || next[1] > view.y + view.h)
      apply(clampView({ w: view.w, x: next[0] - view.w / 2, y: next[1] - view.h / 2 }))
  }
  else if ((event.key === 'Enter' || event.key === ' ') && cursor.value) {
    event.preventDefault()
    emit('pin', cursor.value)
  }
}
</script>

<template>
  <div class="wrap">
    <svg
      ref="svg"
      class="atlas"
      :class="phase"
      :viewBox="`0 0 ${map.width} ${map.height}`"
      role="application"
      :aria-label="label"
      tabindex="0"
      @click="onClick"
      @keydown="onKey"
      @wheel="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <AtlasLand :map="map" :asked="asked" />
      <path v-if="currentPath" class="target" :d="currentPath" />
      <circle v-for="r in rings" :key="r.id" class="ring" :class="{ now: r.id === current }" :cx="r.centre[0]" :cy="r.centre[1]" :r="9 * unit" />
      <g v-for="p in pins" :key="p.i" class="pin">
        <line v-if="p.km > 0" class="miss" :x1="p.pin[0]" :y1="p.pin[1]" :x2="p.nearest[0]" :y2="p.nearest[1]" />
        <path class="mark" :d="cross(p.pin)" />
      </g>
      <path v-if="cursor && phase === 'aim'" class="cursor" :d="crosshair(cursor)" />
    </svg>
    <button v-if="zoomed" type="button" class="fit" aria-label="Show the whole map" @click="fit">
      <UIcon name="i-ph-corners-out" class="size-5" />
    </button>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
}

.atlas {
  --land: color-mix(in oklab, var(--ink) 14%, var(--surface));
  --border: color-mix(in oklab, var(--ink) 34%, var(--surface));
  --asked: color-mix(in oklab, var(--accent) 40%, var(--land));
  display: block;
  width: 100%;
  height: auto;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}

.atlas.aim {
  cursor: crosshair;
}

/* The frame around the map draws the keyboard ring; the browser's own would be clipped to a stray line. */
.atlas:focus {
  outline: none;
}

path,
line,
circle {
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.target {
  fill: var(--accent);
  stroke: color-mix(in oklab, var(--accent) 55%, var(--ink));
  stroke-width: 1px;
  pointer-events: none;
}

.ring {
  fill: none;
  stroke: var(--asked);
  stroke-width: 1.5px;
  pointer-events: none;
}

.ring.now {
  stroke: var(--accent);
}

.pin {
  pointer-events: none;
}

.miss {
  stroke: var(--ink);
  stroke-width: 1.25px;
  stroke-dasharray: 2 4;
}

.mark {
  fill: none;
  stroke: var(--ink);
  stroke-width: 2px;
}

.cursor {
  fill: none;
  stroke: var(--user);
  stroke-width: 1.5px;
  pointer-events: none;
}

.fit {
  position: absolute;
  top: 12px;
  left: 12px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  box-shadow: var(--cel-shadow);
  transition: scale 150ms ease-out;
}

.fit:active {
  scale: 0.96;
}

.fit:focus-visible {
  outline: 2px solid var(--user);
}

@media (hover: hover) and (pointer: fine) {
  .fit:hover {
    background: var(--peer);
  }
}
</style>
