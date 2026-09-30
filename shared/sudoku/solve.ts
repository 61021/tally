import type { Cells } from './types.ts'
import { boxOf, columnOf, rowOf } from './constants.ts'
import { bit, bitCount } from './grid.ts'

interface SearchState {
  cells: Cells
  rows: Uint16Array
  columns: Uint16Array
  boxes: Uint16Array
  found: number
  limit: number
  first: Cells | null
}

function init(cells: Cells, limit: number): SearchState | null {
  const state: SearchState = { cells: Uint8Array.from(cells), rows: new Uint16Array(9), columns: new Uint16Array(9), boxes: new Uint16Array(9), found: 0, limit, first: null }
  for (let i = 0; i < 81; i++) {
    const v = cells[i]!
    if (!v)
      continue
    const b = bit(v)
    const r = rowOf(i)
    const c = columnOf(i)
    const x = boxOf(i)
    if ((state.rows[r]! | state.columns[c]! | state.boxes[x]!) & b)
      return null
    state.rows[r]! |= b
    state.columns[c]! |= b
    state.boxes[x]! |= b
  }
  return state
}

function search(s: SearchState): void {
  let best = -1
  let bestMask = 0
  let bestCount = 10
  for (let i = 0; i < 81; i++) {
    if (s.cells[i])
      continue
    const mask = ~(s.rows[rowOf(i)]! | s.columns[columnOf(i)]! | s.boxes[boxOf(i)]!) & 0x1FF
    const n = bitCount(mask)
    if (n < bestCount) {
      best = i
      bestMask = mask
      bestCount = n
      if (n <= 1)
        break
    }
  }
  if (best === -1) {
    s.found++
    s.first ??= Uint8Array.from(s.cells)
    return
  }
  const r = rowOf(best)
  const c = columnOf(best)
  const x = boxOf(best)
  for (let d = 1; d <= 9 && s.found < s.limit; d++) {
    const b = bit(d)
    if (!(bestMask & b))
      continue
    s.cells[best] = d
    s.rows[r]! |= b
    s.columns[c]! |= b
    s.boxes[x]! |= b
    search(s)
    s.rows[r]! &= ~b
    s.columns[c]! &= ~b
    s.boxes[x]! &= ~b
  }
  s.cells[best] = 0
}

/** Counts solutions, stopping at `limit`; a puzzle is proper when this returns 1 with a limit of 2. */
export function countSolutions(cells: Cells, limit = 2): number {
  const state = init(cells, limit)
  if (!state)
    return 0
  search(state)
  return state.found
}

/** The first solution found, or null when there is none. */
export function solve(cells: Cells): Cells | null {
  const state = init(cells, 1)
  if (!state)
    return null
  search(state)
  return state.first
}
