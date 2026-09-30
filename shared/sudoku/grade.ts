import type { Cells, Grade, TechniqueId } from './types.ts'
import { EASY_MIN_GIVENS, TECHNIQUE_BY_ID, TECHNIQUES } from './constants.ts'
import { countGivens } from './grid.ts'
import { applyStep, createLogicState, findNextStep, isSolved } from './logic/index.ts'

const RANK = new Map(TECHNIQUES.map((t, i) => [t.id, i]))

/** Solves the way a person would, always taking the easiest step, and grades by the hardest step needed. */
export function gradePuzzle(puzzle: Cells): Grade {
  const state = createLogicState(puzzle)
  const counts: Partial<Record<TechniqueId, number>> = {}
  let score = 0
  let hardest: TechniqueId | null = null
  while (!isSolved(state)) {
    const step = findNextStep(state)
    if (!step)
      break
    applyStep(state, step)
    counts[step.technique] = (counts[step.technique] ?? 0) + 1
    score += TECHNIQUE_BY_ID[step.technique].weight
    if (hardest === null || RANK.get(step.technique)! > RANK.get(hardest)!)
      hardest = step.technique
  }
  const givens = countGivens(puzzle)
  let difficulty: Grade['difficulty'] = null
  if (isSolved(state) && hardest) {
    difficulty = TECHNIQUE_BY_ID[hardest].tier
    if (difficulty === 'easy' && givens < EASY_MIN_GIVENS)
      difficulty = 'medium'
  }
  return { difficulty, score, hardest, givens, counts }
}
