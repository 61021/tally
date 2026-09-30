import type { Difficulty } from '../shared/sudoku/types.ts'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DIFFICULTIES } from '../shared/sudoku/constants.ts'
import { gradePuzzle } from '../shared/sudoku/grade.ts'
import { parseGrid } from '../shared/sudoku/grid.ts'
import { countSolutions } from '../shared/sudoku/solve.ts'

interface BankFile {
  difficulty: Difficulty
  seed: number
  puzzles: string[]
}

const banks = DIFFICULTIES.map(d => JSON.parse(readFileSync(new URL(`../public/bank/${d}.json`, import.meta.url), 'utf8')) as BankFile)

describe('puzzle bank', () => {
  it('holds 2500 distinct puzzles per difficulty, none shared between files', () => {
    const all = banks.flatMap(b => b.puzzles)
    expect(banks.map(b => b.puzzles.length)).toEqual([2500, 2500, 2500, 2500])
    expect(new Set(all).size).toBe(all.length)
  })

  it.each(banks.map(b => [b.difficulty, b] as const))('%s: a sample is unique and grades as filed', (difficulty, bank) => {
    for (let i = 0; i < bank.puzzles.length; i += 50) {
      const cells = parseGrid(bank.puzzles[i]!)
      expect(countSolutions(cells)).toBe(1)
      expect(gradePuzzle(cells).difficulty).toBe(difficulty)
    }
  })
})
