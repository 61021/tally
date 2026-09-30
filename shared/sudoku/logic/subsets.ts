import type { CellDigit, LogicState, Step, TechniqueId } from '../types.ts'
import { combinations } from '../combinations.ts'
import { UNITS } from '../constants.ts'
import { bit, bitCount, digitsOf } from '../grid.ts'

/** N cells in a unit that share exactly N candidates: those digits leave the unit's other cells. */
export function findNakedSubset(state: LogicState, size: number, technique: TechniqueId): Step | null {
  for (const unit of UNITS) {
    const open = unit.cells.filter(c => !state.cells[c] && bitCount(state.candidates[c]!) <= size)
    if (open.length < size)
      continue
    for (const group of combinations(open, size)) {
      let union = 0
      for (const c of group) union |= state.candidates[c]!
      if (bitCount(union) !== size)
        continue
      const eliminations: CellDigit[] = []
      for (const c of unit.cells) {
        if (group.includes(c))
          continue
        for (const digit of digitsOf(state.candidates[c]! & union))
          eliminations.push({ cell: c, digit })
      }
      if (eliminations.length)
        return { technique, placements: [], eliminations, pattern: group, digits: digitsOf(union), units: [unit] }
    }
  }
  return null
}

/** N digits confined to the same N cells of a unit: every other candidate leaves those cells. */
export function findHiddenSubset(state: LogicState, size: number, technique: TechniqueId): Step | null {
  for (const unit of UNITS) {
    const where = new Map<number, number[]>()
    for (let d = 1; d <= 9; d++) {
      const cells = unit.cells.filter(c => state.candidates[c]! & bit(d))
      if (cells.length >= 2 && cells.length <= size)
        where.set(d, cells)
    }
    if (where.size < size)
      continue
    for (const digits of combinations([...where.keys()], size)) {
      const cells = [...new Set(digits.flatMap(d => where.get(d)!))]
      if (cells.length !== size)
        continue
      let keep = 0
      for (const d of digits) keep |= bit(d)
      const eliminations: CellDigit[] = []
      for (const c of cells) {
        for (const digit of digitsOf(state.candidates[c]! & ~keep))
          eliminations.push({ cell: c, digit })
      }
      if (eliminations.length)
        return { technique, placements: [], eliminations, pattern: cells, digits, units: [unit] }
    }
  }
  return null
}
