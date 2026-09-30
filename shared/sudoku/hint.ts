import type { Hint } from './game-types.ts'
import type { Step } from './types.ts'
import { boxOf, TECHNIQUES } from './constants.ts'
import { applyStep, createLogicState, findNextStep } from './logic/index.ts'

const RANK = new Map(TECHNIQUES.map((t, i) => [t.id, i]))

/**
 * The next thing worth telling the player. Wrong digits come first; otherwise the solver
 * works forward from the board as it stands until a digit can be placed, and the hint
 * teaches the hardest step it needed on the way.
 */
export function findHint(values: readonly number[], solution: string): Hint | null {
  const wrong = values.flatMap((v, i) => (v && v !== Number(solution[i]) ? [i] : []))
  if (wrong.length)
    return { kind: 'mistake', cells: wrong, box: boxOf(wrong[0]!) }

  const state = createLogicState(Uint8Array.from(values))
  let key: Step | null = null
  let leadIn = 0
  for (let guard = 0; guard < 200; guard++) {
    const step = findNextStep(state)
    if (!step)
      break
    if (!key || RANK.get(step.technique)! > RANK.get(key.technique)!)
      key = step
    const placement = step.placements[0]
    if (placement)
      return { kind: 'step', cell: placement.cell, digit: placement.digit, box: boxOf(placement.cell), key, technique: key.technique, leadIn }
    applyStep(state, step)
    leadIn++
  }

  // Beyond what the solver can explain: reveal the first empty cell rather than leave the player stuck.
  const cell = values.findIndex(v => !v)
  if (cell < 0)
    return null
  const reveal: Step = { technique: 'naked-single', placements: [{ cell, digit: Number(solution[cell]) }], eliminations: [], pattern: [cell], digits: [Number(solution[cell])], units: [] }
  return { kind: 'step', cell, digit: Number(solution[cell]), box: boxOf(cell), key: reveal, technique: 'naked-single', leadIn: 0 }
}
