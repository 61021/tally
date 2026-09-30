import type { CellDigit, LogicState, Step, TechniqueId } from '../types.ts'
import { combinations } from '../combinations.ts'
import { COLUMNS, ROWS } from '../constants.ts'
import { bit } from '../grid.ts'

/**
 * X-Wing (size 2) and Swordfish (size 3): in N rows a digit fits only in the same N columns,
 * so it leaves those columns everywhere else. Also run with rows and columns swapped.
 */
export function findFish(state: LogicState, size: number, technique: TechniqueId): Step | null {
  for (const [bases, covers] of [[ROWS, COLUMNS], [COLUMNS, ROWS]] as const) {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d)
      const positions = new Map<number, number[]>()
      for (const base of bases) {
        const at = base.cells.map((c, k) => (state.candidates[c]! & b ? k : -1)).filter(k => k >= 0)
        if (at.length >= 2 && at.length <= size)
          positions.set(base.index, at)
      }
      if (positions.size < size)
        continue
      for (const chosen of combinations([...positions.keys()], size)) {
        const coverIndexes = [...new Set(chosen.flatMap(i => positions.get(i)!))]
        if (coverIndexes.length !== size)
          continue
        const eliminations: CellDigit[] = []
        for (const ci of coverIndexes) {
          for (const c of covers[ci]!.cells) {
            if (state.candidates[c]! & b && !chosen.some(bi => bases[bi]!.cells.includes(c)))
              eliminations.push({ cell: c, digit: d })
          }
        }
        if (eliminations.length) {
          const pattern = chosen.flatMap(bi => bases[bi]!.cells.filter(c => state.candidates[c]! & b))
          return { technique, placements: [], eliminations, pattern, digits: [d], units: [...chosen.map(bi => bases[bi]!), ...coverIndexes.map(ci => covers[ci]!)] }
        }
      }
    }
  }
  return null
}
