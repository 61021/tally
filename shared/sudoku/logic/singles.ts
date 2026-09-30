import type { LogicState, Step } from '../types.ts'
import { UNITS } from '../constants.ts'
import { bit, bitCount, digitsOf } from '../grid.ts'

/** A digit that fits in only one cell of a box, row or column. */
export function findHiddenSingle(state: LogicState): Step | null {
  for (const unit of UNITS) {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d)
      let at = -1
      let count = 0
      for (const c of unit.cells) {
        if (state.candidates[c]! & b) {
          at = c
          if (++count > 1)
            break
        }
      }
      if (count === 1)
        return { technique: 'hidden-single', placements: [{ cell: at, digit: d }], eliminations: [], pattern: [at], digits: [d], units: [unit] }
    }
  }
  return null
}

/** A cell where only one digit is still possible. */
export function findNakedSingle(state: LogicState): Step | null {
  for (let i = 0; i < 81; i++) {
    const mask = state.candidates[i]!
    if (!state.cells[i] && bitCount(mask) === 1) {
      const digit = digitsOf(mask)[0]!
      return { technique: 'naked-single', placements: [{ cell: i, digit }], eliminations: [], pattern: [i], digits: [digit], units: [] }
    }
  }
  return null
}
