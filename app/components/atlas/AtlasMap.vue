<script setup lang="ts">
import type { AtlasMap, AtlasRound, Point } from '#shared/atlas/types'
import type { AtlasPhase } from '../../composables/useAtlasGame'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { parseRings } from '#shared/atlas/geo'
import { KEY_STEP } from '../../constants/atlas'

const props = defineProps<{
  map: AtlasMap
  round: AtlasRound
  phase: AtlasPhase
  label: string
}>()

const emit = defineEmits<{ pin: [point: Point] }>()

const svgRef = useTemplateRef<SVGSVGElement>('svg')

// Map units per screen pixel, so pins and rings keep their size on any screen.
const unit = ref(1)
let observer: ResizeObserver | undefined

onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    unit.value = props.map.width / Math.max(1, entry!.contentRect.width)
  })
  observer.observe(svgRef.value!)
})

onBeforeUnmount(() => observer?.disconnect())

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

function onClick(event: MouseEvent): void {
  const ctm = svgRef.value?.getScreenCTM()
  if (props.phase !== 'aim' || !ctm)
    return
  const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse())
  emit('pin', [p.x, p.y])
}

// The keyboard way to play: arrows move a marker, Enter drops the pin under it.
const cursor = ref<Point | null>(null)

const ARROWS: Record<string, Point> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }

function onKey(event: KeyboardEvent): void {
  if (props.phase !== 'aim' || event.altKey || event.ctrlKey || event.metaKey)
    return
  const arrow = ARROWS[event.key]
  if (arrow) {
    event.preventDefault()
    const [x, y] = cursor.value ?? [props.map.width / 2, props.map.height / 2]
    const step = KEY_STEP * (event.shiftKey ? 5 : 1)
    cursor.value = [
      Math.min(props.map.width, Math.max(0, x + arrow[0] * step)),
      Math.min(props.map.height, Math.max(0, y + arrow[1] * step)),
    ]
  }
  else if ((event.key === 'Enter' || event.key === ' ') && cursor.value) {
    event.preventDefault()
    emit('pin', cursor.value)
  }
}
</script>

<template>
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
    @pointermove="cursor = null"
  >
    <path class="grid" :d="map.graticule" />
    <path class="land" :d="map.land" />
    <path v-for="c in map.countries" :key="c.id" class="land" :class="{ asked: asked.has(c.id) }" :d="c.d" :data-country="c.id" />
    <path v-if="currentPath" class="target" :d="currentPath" />
    <circle v-for="r in rings" :key="r.id" class="ring" :class="{ now: r.id === current }" :cx="r.centre[0]" :cy="r.centre[1]" :r="9 * unit" />
    <g v-for="p in pins" :key="p.i" class="pin">
      <line v-if="p.km > 0" class="miss" :x1="p.pin[0]" :y1="p.pin[1]" :x2="p.nearest[0]" :y2="p.nearest[1]" />
      <path class="mark" :d="cross(p.pin)" />
    </g>
    <path v-if="cursor && phase === 'aim'" class="cursor" :d="crosshair(cursor)" />
  </svg>
</template>

<style scoped>
.atlas {
  --land: color-mix(in oklab, var(--ink) 9%, var(--surface));
  --border: color-mix(in oklab, var(--ink) 26%, var(--surface));
  --asked: color-mix(in oklab, var(--accent) 34%, var(--land));
  display: block;
  width: 100%;
  height: auto;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

.atlas.aim {
  cursor: crosshair;
}

.atlas:focus-visible {
  outline: none;
}

path,
line,
circle {
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.grid {
  fill: none;
  stroke: var(--cell-line);
  stroke-width: 1px;
}

.land {
  fill: var(--land);
  stroke: var(--border);
  stroke-width: 0.75px;
  transition: fill 200ms ease-out;
}

.land.asked {
  fill: var(--asked);
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
</style>
