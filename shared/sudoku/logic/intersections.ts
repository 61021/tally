import type { CellDigit, LogicState, Step, Unit } from '../types.ts'
import { BOXES, boxOf, columnOf, COLUMNS, rowOf, ROWS } from '../constants.ts'
import { bit } from '../grid.ts'

function cellsWith(state: LogicState, unit: Unit, digit: number): number[] {
  const b = bit(digit)
  return unit.cells.filter(c => state.candidates[c]! & b)
}

function eliminate(state: LogicState, target: Unit, keep: readonly number[], digit: number): CellDigit[] {
  const b = bit(digit)
  return target.cells.filter(c => !keep.includes(c) && state.candidates[c]! & b).map(cell => ({ cell, digit }))
}

/** Inside a box a digit is confined to one row or column, so it leaves the rest of that line. */
export function findPointing(state: LogicState): Step | null {
  for (const box of BOXES) {
    for (let d = 1; d <= 9; d++) {
      const cells = cellsWith(state, box, d)
      if (cells.length < 2)
        continue
      for (const [lines, lineOf] of [[ROWS, rowOf], [COLUMNS, columnOf]] as const) {
        const line = lineOf(cells[0]!)
        if (!cells.every(c => lineOf(c) === line))
          continue
        const eliminations = eliminate(state, lines[line]!, box.cells, d)
        if (eliminations.length)
          return { technique: 'pointing', placements: [], eliminations, pattern: cells, digits: [d], units: [box, lines[line]!] }
      }
    }
  }
  return null
}

/** Inside a row or column a digit is confined to one box, so it leaves the rest of that box. */
export function findClaiming(state: LogicState): Step | null {
  for (const line of [...ROWS, ...COLUMNS]) {
    for (let d = 1; d <= 9; d++) {
      const cells = cellsWith(state, line, d)
      if (cells.length < 2)
        continue
      const box = boxOf(cells[0]!)
      if (!cells.every(c => boxOf(c) === box))
        continue
      const eliminations = eliminate(state, BOXES[box]!, line.cells, d)
      if (eliminations.length)
        return { technique: 'claiming', placements: [], eliminations, pattern: cells, digits: [d], units: [line, BOXES[box]!] }
    }
  }
  return null
}
