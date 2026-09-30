import type { Cells, Difficulty, GeneratedPuzzle, Random } from './types.ts'
import { boxOf, columnOf, GIVENS_TARGET, rowOf } from './constants.ts'
import { gradePuzzle } from './grade.ts'
import { bit, serializeGrid } from './grid.ts'
import { shuffle } from './rng.ts'
import { countSolutions } from './solve.ts'

/** A random complete grid, filled cell by cell with shuffled digits and backtracking. */
export function generateSolution(random: Random): Cells {
  const cells = new Uint8Array(81)
  const rows = new Uint16Array(9)
  const columns = new Uint16Array(9)
  const boxes = new Uint16Array(9)
  const fill = (i: number): boolean => {
    if (i === 81)
      return true
    const r = rowOf(i)
    const c = columnOf(i)
    const x = boxOf(i)
    for (const d of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random)) {
      const b = bit(d)
      if ((rows[r]! | columns[c]! | boxes[x]!) & b)
        continue
      cells[i] = d
      rows[r]! |= b
      columns[c]! |= b
      boxes[x]! |= b
      if (fill(i + 1))
        return true
      rows[r]! &= ~b
      columns[c]! &= ~b
      boxes[x]! &= ~b
    }
    cells[i] = 0
    return false
  }
  fill(0)
  return cells
}

/** Removes cells in rotationally symmetric pairs while the solution stays unique, down to `minGivens`. */
export function digPuzzle(solution: Cells, random: Random, minGivens: number): Cells {
  const puzzle = Uint8Array.from(solution)
  let givens = 81
  for (const i of shuffle(Array.from({ length: 41 }, (_, k) => k), random)) {
    const j = 80 - i
    const removes = i === j ? 1 : 2
    if (givens - removes < minGivens)
      continue
    const [a, b] = [puzzle[i]!, puzzle[j]!]
    puzzle[i] = 0
    puzzle[j] = 0
    if (countSolutions(puzzle, 2) === 1) {
      givens -= removes
    }
    else {
      puzzle[i] = a
      puzzle[j] = b
    }
  }
  return puzzle
}

/** Generates until a puzzle grades at exactly the requested difficulty, or gives up after `attempts`. */
export function generatePuzzle(difficulty: Difficulty, random: Random, attempts = 500): GeneratedPuzzle | null {
  const [min, max] = GIVENS_TARGET[difficulty]
  for (let n = 0; n < attempts; n++) {
    const solution = generateSolution(random)
    const target = min + Math.floor(random() * (max - min + 1))
    const puzzle = digPuzzle(solution, random, target)
    const grade = gradePuzzle(puzzle)
    if (grade.difficulty === difficulty)
      return { puzzle: serializeGrid(puzzle), solution: serializeGrid(solution), grade }
  }
  return null
}
