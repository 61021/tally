import type { Game, GameProgress, Snapshot } from './game-types.ts'
import { PEERS } from './constants.ts'
import { bit } from './grid.ts'

const HISTORY_LIMIT = 300

export function createGame(puzzle: string, solution: string): Game {
  return {
    puzzle,
    solution,
    values: Array.from(puzzle, Number),
    notes: Array.from<number>({ length: 81 }).fill(0),
    past: [],
    future: [],
    flagged: [],
    checks: 0,
    hints: 0,
    elapsedMs: 0,
    completed: false,
  }
}

export const isGiven = (game: Game, cell: number): boolean => game.puzzle[cell] !== '0'

function isSolvedBy(values: readonly number[], solution: string): boolean {
  return values.every((v, i) => v === Number(solution[i]))
}

/** Records the current board for undo, then moves to the next one. */
function commit(game: Game, values: number[], notes: number[], flagged = game.flagged): Game {
  const snapshot: Snapshot = { values: game.values, notes: game.notes }
  return {
    ...game,
    values,
    notes,
    flagged,
    past: [...game.past, snapshot].slice(-HISTORY_LIMIT),
    future: [],
    completed: isSolvedBy(values, game.solution),
  }
}

/** Places a digit, or clears it when the same digit is placed again; peers drop it from their notes. */
export function placeDigit(game: Game, cell: number, digit: number): Game {
  if (game.completed || isGiven(game, cell))
    return game
  const values = [...game.values]
  const notes = [...game.notes]
  values[cell] = values[cell] === digit ? 0 : digit
  notes[cell] = 0
  if (values[cell]) {
    for (const p of PEERS[cell]!) notes[p]! &= ~bit(digit)
  }
  return commit(game, values, notes, game.flagged.filter(c => c !== cell))
}

export function toggleNote(game: Game, cell: number, digit: number): Game {
  if (game.completed || game.values[cell])
    return game
  const notes = [...game.notes]
  notes[cell]! ^= bit(digit)
  return commit(game, game.values, notes)
}

export function eraseCell(game: Game, cell: number): Game {
  if (game.completed || isGiven(game, cell) || (!game.values[cell] && !game.notes[cell]))
    return game
  const values = [...game.values]
  const notes = [...game.notes]
  values[cell] = 0
  notes[cell] = 0
  return commit(game, values, notes, game.flagged.filter(c => c !== cell))
}

export function undoMove(game: Game): Game {
  const previous = game.past.at(-1)
  if (!previous || game.completed)
    return game
  return { ...game, ...previous, past: game.past.slice(0, -1), future: [...game.future, { values: game.values, notes: game.notes }], flagged: [] }
}

export function redoMove(game: Game): Game {
  const next = game.future.at(-1)
  if (!next || game.completed)
    return game
  return { ...game, ...next, future: game.future.slice(0, -1), past: [...game.past, { values: game.values, notes: game.notes }], flagged: [] }
}

/** Placed digits that differ from the solution. */
export function wrongCells(game: Game): number[] {
  return game.values.flatMap((v, i) => (v && !isGiven(game, i) && v !== Number(game.solution[i]) ? [i] : []))
}

/** Flags every wrong digit until it changes; each check counts against the daily time. */
export function checkMistakes(game: Game): Game {
  if (game.completed)
    return game
  return { ...game, flagged: wrongCells(game), checks: game.checks + 1 }
}

export function recordHint(game: Game): Game {
  return { ...game, hints: game.hints + 1 }
}

/** How many of each digit are still to place, indexed 1-9. */
export function remainingDigits(game: Game): number[] {
  const left = Array.from({ length: 10 }, (_, d) => (d ? 9 : 0))
  for (const v of game.values) {
    if (v)
      left[v]!--
  }
  return left
}

export function addTime(game: Game, ms: number): Game {
  return game.completed ? game : { ...game, elapsedMs: game.elapsedMs + ms }
}

export function toProgress(game: Game): GameProgress {
  return { values: game.values.join(''), notes: game.notes, elapsedMs: game.elapsedMs, checks: game.checks, hints: game.hints, completed: game.completed }
}

/** Rebuilds a game from saved progress; anything that doesn't fit this puzzle starts it fresh. */
export function fromProgress(puzzle: string, solution: string, progress: GameProgress | null | undefined): Game {
  const game = createGame(puzzle, solution)
  if (!progress || !/^\d{81}$/.test(progress.values) || progress.notes?.length !== 81)
    return game
  const values = Array.from(progress.values, Number)
  if (values.some((v, i) => isGiven(game, i) && v !== game.values[i]))
    return game
  return {
    ...game,
    values,
    notes: progress.notes.map(n => n & 0x1FF),
    elapsedMs: Math.max(0, progress.elapsedMs || 0),
    checks: progress.checks || 0,
    hints: progress.hints || 0,
    completed: isSolvedBy(values, solution),
  }
}
