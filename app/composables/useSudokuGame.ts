import type { Ref } from 'vue'
import type { Game, Hint, HintLevel, HintView } from '#shared/sudoku/game-types'
import type { Difficulty } from '#shared/sudoku/types'
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { explainHint } from '#shared/sudoku/explain'
import { checkMistakes, eraseCell, fromProgress, placeDigit, recordHint, redoMove, toggleNote, toProgress, undoMove } from '#shared/sudoku/game'
import { parseGrid, serializeGrid } from '#shared/sudoku/grid'
import { findHint } from '#shared/sudoku/hint'
import { solve } from '#shared/sudoku/solve'
import { loadBank } from '../utils/bank'
import { loadProgress, markSolved, saveProgress } from '../utils/progress'

export type GameStatus = 'loading' | 'ready' | 'missing' | 'error'

export interface ShownHint extends HintView {
  level: HintLevel
  box: number
}

export interface UseSudokuGame {
  status: Ref<GameStatus>
  game: Ref<Game | null>
  elapsedMs: Ref<number>
  hint: Ref<ShownHint | null>
  place: (cell: number, digit: number) => void
  note: (cell: number, digit: number) => void
  erase: (cell: number) => void
  undo: () => void
  redo: () => void
  check: () => void
  askHint: () => void
  retry: () => void
}

/** A tick longer than this means the tab slept; that time doesn't count. */
const MAX_TICK_MS = 1500

export function useSudokuGame(difficulty: Difficulty, number: number): UseSudokuGame {
  const status = ref<GameStatus>('loading')
  const game = shallowRef<Game | null>(null)
  const elapsedMs = ref(0)
  const active = shallowRef<{ hint: Hint, level: HintLevel } | null>(null)

  const hint = computed<ShownHint | null>(() => {
    if (!active.value)
      return null
    const { hint: h, level } = active.value
    return { ...explainHint(h, level), level, box: h.box }
  })

  function save(): void {
    if (game.value)
      saveProgress(difficulty, number, { ...toProgress(game.value), elapsedMs: elapsedMs.value })
  }

  function update(move: (g: Game) => Game, keepHint = false): void {
    const current = game.value
    if (!current)
      return
    const next = move(current)
    if (next === current)
      return
    game.value = next
    if (!keepHint)
      active.value = null
    if (next.completed && !current.completed)
      markSolved(difficulty, number)
    save()
  }

  async function load(): Promise<void> {
    status.value = 'loading'
    try {
      const puzzle = (await loadBank(difficulty))[number - 1]
      if (!puzzle) {
        status.value = 'missing'
        return
      }
      const solution = serializeGrid(solve(parseGrid(puzzle))!)
      game.value = fromProgress(puzzle, solution, loadProgress(difficulty, number))
      elapsedMs.value = game.value.elapsedMs
      status.value = 'ready'
      save()
    }
    catch {
      status.value = 'error'
    }
  }

  let timer: ReturnType<typeof setInterval> | undefined
  let lastTick = 0
  let ticks = 0

  function tick(): void {
    const now = performance.now()
    const delta = now - lastTick
    lastTick = now
    if (document.hidden || status.value !== 'ready' || game.value?.completed || delta > MAX_TICK_MS)
      return
    elapsedMs.value += delta
    if (++ticks % 5 === 0)
      save()
  }

  onMounted(() => {
    load()
    lastTick = performance.now()
    timer = setInterval(tick, 1000)
    addEventListener('pagehide', save)
  })

  onUnmounted(() => {
    clearInterval(timer)
    removeEventListener('pagehide', save)
    save()
  })

  function askHint(): void {
    const current = game.value
    if (!current || current.completed)
      return
    if (!active.value || active.value.level === 3) {
      const found = findHint(current.values, current.solution)
      if (!found)
        return
      game.value = recordHint(current)
      active.value = { hint: found, level: 1 }
      save()
      return
    }
    const level = (active.value.level + 1) as HintLevel
    const shown = active.value.hint
    active.value = { hint: shown, level }
    if (level === 3) {
      if (shown.kind === 'mistake')
        update(g => shown.cells.reduce((acc, cell) => eraseCell(acc, cell), g), true)
      else
        update(g => placeDigit(g, shown.cell, shown.digit), true)
    }
  }

  return {
    status,
    game,
    elapsedMs,
    hint,
    place: (cell, digit) => update(g => placeDigit(g, cell, digit)),
    note: (cell, digit) => update(g => toggleNote(g, cell, digit)),
    erase: cell => update(g => eraseCell(g, cell)),
    undo: () => update(undoMove),
    redo: () => update(redoMove),
    check: () => update(checkMistakes),
    askHint,
    retry: load,
  }
}
