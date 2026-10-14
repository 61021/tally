<script setup lang="ts">
import type { WallWord } from '../utils/word-wall'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { approach, distanceToWord, glow, layoutWall } from '../utils/word-wall'

const props = defineProps<{
  words: readonly string[]
  /** Elements the wall makes room around, like the page's heading. */
  clear?: readonly string[]
}>()

/** How far the pointer's light reaches, in CSS pixels. */
const RADIUS = 110
/** How long a point of the trail keeps glowing. */
const LIFE_MS = 900
/** Fast moves are filled in so the trail never breaks into dots. */
const STEP = 14
const MAX_POINTS = 48

// Only for a real mouse: on touch there is no pointer to follow, and a still wall is only noise.
const enabled = ref(false)
const wallRef = useTemplateRef<HTMLElement>('wall')
const baseRef = useTemplateRef<HTMLCanvasElement>('base')
const glowRef = useTemplateRef<HTMLCanvasElement>('glow')

interface TrailPoint { x: number, y: number, born: number }

let words: WallWord[] = []
let width = 0
let height = 0
let levels = new Float32Array(0)
let rowHeight = 0
let font = ''
let spacing = '0px'
let ink = ''
let accent = ''
let trail: TrailPoint[] = []
let frame: number | undefined
let rebuild: number | undefined
let last = 0
let calm = false
const cleanups: (() => void)[] = []

function contextOf(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  ctx.font = font
  ctx.letterSpacing = spacing
  ctx.textBaseline = 'middle'
  return ctx
}

function readStyle(): void {
  const css = getComputedStyle(baseRef.value!)
  font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`
  spacing = css.letterSpacing === 'normal' ? '0px' : css.letterSpacing
  rowHeight = Number.parseFloat(css.lineHeight) || Number.parseFloat(css.fontSize) * 2
  ink = css.color
  accent = getComputedStyle(glowRef.value!).color
}

function drawBase(): void {
  const ctx = contextOf(baseRef.value!)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = ink
  for (const word of words) {
    ctx.globalAlpha = word.alpha
    ctx.fillText(word.text, word.x, word.y + rowHeight / 2)
  }
  ctx.globalAlpha = 1
}

function build(): void {
  rebuild = undefined
  const base = baseRef.value
  const lit = glowRef.value
  if (!base || !lit)
    return
  readStyle()
  // The whole page, so the light follows the mouse into the margins and gaps between the cards.
  width = document.documentElement.clientWidth
  height = Math.max(innerHeight, document.documentElement.scrollHeight)
  wallRef.value!.style.height = `${height}px`
  for (const canvas of [base, lit]) {
    canvas.width = Math.round(width * devicePixelRatio)
    canvas.height = Math.round(height * devicePixelRatio)
  }
  const ctx = contextOf(base)
  const gap = rowHeight * 0.9
  const room = (props.clear ?? []).flatMap(selector => [...document.querySelectorAll(selector)]).map(el => el.getBoundingClientRect()).filter(r => r.width && r.height).map(r => ({ left: r.left - 14, right: r.right + 14, top: r.top + scrollY - 6, bottom: r.bottom + scrollY + 6 }))
  words = layoutWall(props.words.map(w => w.toUpperCase()), text => ctx.measureText(text).width, { width, height, rowHeight, gap, seed: 2026 })
    .filter(w => !room.some(r => w.x < r.right && w.x + w.width > r.left && w.y < r.bottom && w.y + rowHeight > r.top))
  levels = new Float32Array(words.length)
  trail = []
  drawBase()
  contextOf(lit).clearRect(0, 0, width, height)
}

function tick(now: number): void {
  frame = undefined
  const dt = Math.min(64, now - (last || now - 16))
  last = now
  trail = trail.filter(p => now - p.born < LIFE_MS)
  const ctx = contextOf(glowRef.value!)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = accent
  let alive = trail.length > 0
  for (let i = 0; i < words.length; i++) {
    const word = words[i]!
    let target = 0
    for (const p of trail) {
      if (Math.abs(word.y + rowHeight / 2 - p.y) >= RADIUS)
        continue
      target = Math.max(target, glow(distanceToWord(word, rowHeight, p.x, p.y), calm ? 0 : now - p.born, RADIUS, LIFE_MS))
    }
    const level = calm ? target : approach(levels[i]!, target, dt)
    levels[i] = level < 0.002 ? 0 : level
    if (levels[i]! > 0) {
      alive = true
      ctx.globalAlpha = 0.92 * levels[i]!
      ctx.fillText(word.text, word.x, word.y + rowHeight / 2)
    }
  }
  ctx.globalAlpha = 1
  if (alive && !document.hidden)
    frame = requestAnimationFrame(tick)
  else
    last = 0
}

function wake(): void {
  frame ??= requestAnimationFrame(tick)
}

function onMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse')
    return
  const now = performance.now()
  // The wall sits at the top of the document, so page coordinates are its own.
  const [x, y] = [event.pageX, event.pageY]
  const prev = trail.at(-1)
  const steps = prev && !calm ? Math.min(12, Math.floor(Math.hypot(x - prev.x, y - prev.y) / STEP)) : 0
  for (let s = 1; s <= steps; s++) {
    const t = s / (steps + 1)
    trail.push({ x: prev!.x + (x - prev!.x) * t, y: prev!.y + (y - prev!.y) * t, born: now })
  }
  trail.push({ x, y, born: now })
  if (calm)
    trail = trail.slice(-1)
  else if (trail.length > MAX_POINTS)
    trail = trail.slice(-MAX_POINTS)
  wake()
}

function onLeave(): void {
  trail = []
  wake()
}

function schedule(): void {
  rebuild ??= requestAnimationFrame(build)
}

async function start(): Promise<void> {
  if (enabled.value)
    return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  calm = reduced.matches
  enabled.value = true
  await nextTick()
  await document.fonts.load(`${getComputedStyle(baseRef.value!).fontSize} ${getComputedStyle(baseRef.value!).fontFamily}`, 'A').catch(() => {})
  if (!enabled.value)
    return
  build()
  const html = document.documentElement
  addEventListener('pointermove', onMove, { passive: true })
  addEventListener('resize', schedule)
  html.addEventListener('pointerleave', onLeave)
  cleanups.push(() => removeEventListener('pointermove', onMove), () => removeEventListener('resize', schedule), () => html.removeEventListener('pointerleave', onLeave))
  // A scene or mode change repaints the wall in the new ink.
  const observer = new MutationObserver(() => {
    readStyle()
    drawBase()
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-scene', 'data-mode'] })
  const scheme = matchMedia('(prefers-color-scheme: dark)')
  const onScheme = (): void => {
    readStyle()
    drawBase()
  }
  const onReduced = (): void => {
    calm = reduced.matches
    trail = []
  }
  scheme.addEventListener('change', onScheme)
  reduced.addEventListener('change', onReduced)
  cleanups.push(() => observer.disconnect(), () => scheme.removeEventListener('change', onScheme), () => reduced.removeEventListener('change', onReduced))
}

// Some browsers say a laptop has no fine pointer (a touchscreen beside the trackpad); the first mouse move settles it.
function onFirstMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse')
    return
  removeEventListener('pointermove', onFirstMove)
  start().then(() => onMove(event))
}

onMounted(() => {
  if (matchMedia('(any-hover: hover) and (any-pointer: fine)').matches) {
    start()
    return
  }
  addEventListener('pointermove', onFirstMove, { passive: true })
  cleanups.push(() => removeEventListener('pointermove', onFirstMove))
})

onBeforeUnmount(() => {
  enabled.value = false
  cleanups.forEach(fn => fn())
  if (frame !== undefined)
    cancelAnimationFrame(frame)
  if (rebuild !== undefined)
    cancelAnimationFrame(rebuild)
})
</script>

<template>
  <div v-if="enabled" ref="wall" class="wall" aria-hidden="true">
    <canvas ref="base" class="base" />
    <canvas ref="glow" class="lit" />
  </div>
</template>

<style scoped>
/* Behind the whole page and over the painting; the cards sit on top of it. */
.wall {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
  transition: opacity 400ms ease-out;

  @starting-style {
    opacity: 0;
  }
}

canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  font-family: var(--font-serif);
  font-size: 12px;
  font-weight: 400;
  line-height: 26px;
  letter-spacing: 0.16em;
}

.base {
  color: var(--ink);
}

.lit {
  color: var(--accent);
}

/* On a pale painting the gold alone washes out; it takes some ink to show. */
:root[data-mode='light'] .lit {
  color: color-mix(in oklab, var(--accent) 55%, var(--ink));
}

@media (prefers-color-scheme: light) {
  :root[data-mode='system'] .lit {
    color: color-mix(in oklab, var(--accent) 55%, var(--ink));
  }
}
</style>
