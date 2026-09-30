import type { Candidates, Cells } from './types.ts'
import { ALL_CANDIDATES, PEERS } from './constants.ts'

const POPCOUNT = Uint8Array.from({ length: 512 }, (_, mask) => {
  let n = 0
  for (let m = mask; m; m &= m - 1) n++
  return n
})

export const bit = (digit: number): number => 1 << (digit - 1)

export const bitCount = (mask: number): number => POPCOUNT[mask]!

export function digitsOf(mask: number): number[] {
  const digits: number[] = []
  for (let d = 1; d <= 9; d++) {
    if (mask & bit(d))
      digits.push(d)
  }
  return digits
}

/** Reads 81 characters; `0` or `.` is an empty cell. */
export function parseGrid(text: string): Cells {
  const clean = text.replace(/\s/g, '')
  if (!/^[\d.]{81}$/.test(clean))
    throw new Error(`A grid is 81 characters of 0-9 or ".", got ${clean.length}`)
  return Uint8Array.from(clean, ch => (ch === '.' ? 0 : Number(ch)))
}

export function serializeGrid(cells: Cells): string {
  return Array.from(cells).join('')
}

export function countGivens(cells: Cells): number {
  let n = 0
  for (const v of cells) {
    if (v)
      n++
  }
  return n
}

export function computeCandidates(cells: Cells): Candidates {
  const candidates = new Uint16Array(81)
  for (let i = 0; i < 81; i++) {
    if (cells[i])
      continue
    let mask = ALL_CANDIDATES
    for (const p of PEERS[i]!) {
      const v = cells[p]!
      if (v)
        mask &= ~bit(v)
    }
    candidates[i] = mask
  }
  return candidates
}

/** Cells whose digit repeats in a row, column or box. */
export function findConflicts(cells: Cells): Set<number> {
  const conflicts = new Set<number>()
  for (let i = 0; i < 81; i++) {
    const v = cells[i]
    if (!v)
      continue
    for (const p of PEERS[i]!) {
      if (cells[p] === v) {
        conflicts.add(i)
        conflicts.add(p)
      }
    }
  }
  return conflicts
}
