import type { LogicState, Step, TechniqueId } from '../types.ts'
import { TECHNIQUES } from '../constants.ts'
import { findFish } from './fish.ts'
import { findClaiming, findPointing } from './intersections.ts'
import { findHiddenSingle, findNakedSingle } from './singles.ts'
import { findHiddenSubset, findNakedSubset } from './subsets.ts'
import { findXyWing, findXyzWing } from './wings.ts'

const FINDERS: Record<TechniqueId, (state: LogicState) => Step | null> = {
  'hidden-single': findHiddenSingle,
  'naked-single': findNakedSingle,
  'pointing': findPointing,
  'claiming': findClaiming,
  'naked-pair': s => findNakedSubset(s, 2, 'naked-pair'),
  'hidden-pair': s => findHiddenSubset(s, 2, 'hidden-pair'),
  'naked-triple': s => findNakedSubset(s, 3, 'naked-triple'),
  'hidden-triple': s => findHiddenSubset(s, 3, 'hidden-triple'),
  'x-wing': s => findFish(s, 2, 'x-wing'),
  'xy-wing': findXyWing,
  'naked-quad': s => findNakedSubset(s, 4, 'naked-quad'),
  'swordfish': s => findFish(s, 3, 'swordfish'),
  'xyz-wing': findXyzWing,
}

/** The easiest deduction available, in the order people are taught them. */
export function findNextStep(state: LogicState): Step | null {
  for (const technique of TECHNIQUES) {
    const step = FINDERS[technique.id](state)
    if (step)
      return step
  }
  return null
}

export { applyStep, createLogicState, isSolved, place } from './state.ts'
