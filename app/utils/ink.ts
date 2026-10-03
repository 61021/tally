import type { TransitionProps } from 'vue'
import { INK_HOLD_MS, INK_LINES_MS, INK_MS, INK_SPREAD_MS } from '../constants/ink'

const INK_LATE_MS = Math.round(INK_SPREAD_MS + INK_MS * 0.7)
const ROOT_VARS = ['--ink-ms', '--ink-late', '--ink-lines-ms'] as const

interface Inking {
  timer: ReturnType<typeof setTimeout>
  nodes: HTMLElement[]
}

const inking = new WeakMap<Element, Inking>()

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

function startInk(root: HTMLElement): HTMLElement[] {
  const box = root.getBoundingClientRect()
  const height = Math.max(1, Math.min(box.height, innerHeight - Math.max(box.top, 0)))
  const nodes = [...root.querySelectorAll<HTMLElement>('*')]
  // Every position is read before any delay is written, so the page lays out once.
  const delays = nodes.map((node) => {
    const r = node.getBoundingClientRect()
    return Math.round((clamp01((r.top - box.top) / height) * 0.8 + clamp01((r.left - box.left) / box.width) * 0.2) * INK_SPREAD_MS)
  })
  nodes.forEach((node, i) => node.style.setProperty('--ink-delay', `${delays[i]}ms`))
  root.style.setProperty('--ink-ms', `${INK_MS}ms`)
  root.style.setProperty('--ink-late', `${INK_LATE_MS}ms`)
  root.style.setProperty('--ink-lines-ms', `${INK_LINES_MS}ms`)
  root.classList.replace('ink-pre', 'ink-run')
  return nodes
}

function settle(el: Element): void {
  const state = inking.get(el)
  if (state) {
    clearTimeout(state.timer)
    state.nodes.forEach(node => node.style.removeProperty('--ink-delay'))
    inking.delete(el)
  }
  el.classList.remove('ink-pre', 'ink-run')
  ROOT_VARS.forEach(name => (el as HTMLElement).style.removeProperty(name))
}

/** "Ink in": the old page goes at once, the new one lands as a pencil sketch and inks in from the top. */
export const inkTransition: TransitionProps = {
  mode: 'out-in',
  css: false,
  onLeave: (_el, done) => done(),
  onBeforeEnter: (el) => {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
      el.classList.add('ink-pre')
  },
  onEnter: (el, done) => {
    if (!el.classList.contains('ink-pre'))
      return done()
    const state: Inking = {
      nodes: [],
      timer: setTimeout(() => {
        state.nodes = startInk(el as HTMLElement)
        state.timer = setTimeout(done, INK_LATE_MS + INK_LINES_MS)
      }, INK_HOLD_MS),
    }
    inking.set(el, state)
  },
  onAfterEnter: settle,
  onEnterCancelled: settle,
}
