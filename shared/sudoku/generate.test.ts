import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, EASY_MIN_GIVENS } from './constants.ts'
import { generatePuzzle } from './generate.ts'
import { parseGrid } from './grid.ts'
import { mulberry32 } from './rng.ts'
import { countSolutions } from './solve.ts'

describe('generatePuzzle', () => {
  it.each(DIFFICULTIES)('makes a unique, symmetric %s puzzle that grades as asked', (difficulty) => {
    const result = generatePuzzle(difficulty, mulberry32(42), 3000)
    expect(result).not.toBeNull()
    const { puzzle, solution, grade } = result!
    const cells = parseGrid(puzzle)
    expect(grade.difficulty).toBe(difficulty)
    expect(countSolutions(cells)).toBe(1)
    for (let i = 0; i < 81; i++) {
      expect(cells[i] === 0).toBe(cells[80 - i] === 0)
      if (cells[i])
        expect(puzzle[i]).toBe(solution[i])
    }
    if (difficulty === 'easy')
      expect(grade.givens).toBeGreaterThanOrEqual(EASY_MIN_GIVENS)
  })

  it('is reproducible from its seed', () => {
    expect(generatePuzzle('medium', mulberry32(7))).toEqual(generatePuzzle('medium', mulberry32(7)))
  })
})
