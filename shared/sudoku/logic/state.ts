import type { Cells, LogicState, Step } from '../types.ts'
import { PEERS } from '../constants.ts'
import { bit, computeCandidates } from '../grid.ts'

export function createLogicState(cells: Cells): LogicState {
  return { cells: Uint8Array.from(cells), candidates: computeCandidates(cells) }
}

export function place(state: LogicState, cell: number, digit: number): void {
  state.cells[cell] = digit
  state.candidates[cell] = 0
  const b = bit(digit)
  for (const p of PEERS[cell]!)
    state.candidates[p]! &= ~b
}

export function applyStep(state: LogicState, step: Step): void {
  for (const { cell, digit } of step.placements)
    place(state, cell, digit)
  for (const { cell, digit } of step.eliminations)
    state.candidates[cell]! &= ~bit(digit)
}

export function isSolved(state: LogicState): boolean {
  return state.cells.every(v => v !== 0)
}
