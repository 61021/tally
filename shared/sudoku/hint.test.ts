import type { HintLevel } from './game-types.ts'
import type { TechniqueId } from './types.ts'
import { describe, expect, it } from 'vitest'
import { DIFFICULTIES } from './constants.ts'
import { explainHint } from './explain.ts'
import { generatePuzzle } from './generate.ts'
import { findHint } from './hint.ts'
import { mulberry32 } from './rng.ts'

const PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'
const SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

describe('findHint', () => {
  it('points at wrong digits before anything else', () => {
    const values = Array.from(PUZZLE, Number)
    values[2] = 1
    expect(findHint(values, SOLUTION)).toMatchObject({ kind: 'mistake', cells: [2], box: 0 })
  })

  it('starts with the easiest placement on a fresh board', () => {
    const hint = findHint(Array.from(PUZZLE, Number), SOLUTION)
    expect(hint).toMatchObject({ kind: 'step', technique: 'hidden-single' })
    if (hint?.kind === 'step')
      expect(hint.digit).toBe(Number(SOLUTION[hint.cell]))
  })

  it('solves whole puzzles of every difficulty from hints alone, explaining each one cleanly', () => {
    const taught = new Set<TechniqueId>()
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= 12; seed++) {
        const { puzzle, solution } = generatePuzzle(difficulty, mulberry32(seed * 31), 3000)!
        const values = Array.from(puzzle, Number)
        for (let guard = 0; guard < 81 && values.includes(0); guard++) {
          const hint = findHint(values, solution)
          expect(hint?.kind).toBe('step')
          if (hint?.kind !== 'step')
            break
          taught.add(hint.technique)
          for (const level of [1, 2, 3] as HintLevel[]) {
            const { text } = explainHint(hint, level)
            expect(text).not.toMatch(/undefined|—|!/)
          }
          expect(hint.digit).toBe(Number(solution[hint.cell]))
          values[hint.cell] = hint.digit
        }
        expect(values.join('')).toBe(solution)
      }
    }
    expect(taught.size).toBeGreaterThan(6)
  }, 30_000)
})
