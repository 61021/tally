import type { LogicState, Step, TechniqueId } from '../types.ts'
import { describe, expect, it } from 'vitest'
import { ALL_CANDIDATES, TECHNIQUES } from '../constants.ts'
import { digPuzzle, generateSolution } from '../generate.ts'
import { bit } from '../grid.ts'
import { mulberry32 } from '../rng.ts'
import { findFish } from './fish.ts'
import { applyStep, createLogicState, findNextStep, isSolved } from './index.ts'
import { findClaiming, findPointing } from './intersections.ts'
import { findHiddenSingle, findNakedSingle } from './singles.ts'
import { findHiddenSubset, findNakedSubset } from './subsets.ts'
import { findXyWing, findXyzWing } from './wings.ts'

/** An empty board where every cell still allows every digit; tests carve patterns into it. */
function openBoard(): LogicState {
  return { cells: new Uint8Array(81), candidates: new Uint16Array(81).fill(ALL_CANDIDATES) }
}

function only(state: LogicState, cell: number, ...digits: number[]): void {
  state.candidates[cell] = digits.reduce((mask, d) => mask | bit(d), 0)
}

function remove(state: LogicState, cells: readonly number[], digit: number): void {
  for (const c of cells) state.candidates[c]! &= ~bit(digit)
}

const eliminated = (step: Step | null): string[] => (step?.eliminations ?? []).map(e => `${e.cell}:${e.digit}`)
const row = (r: number): number[] => Array.from({ length: 9 }, (_, c) => r * 9 + c)

describe('technique patterns', () => {
  it('finds a hidden single and a naked single', () => {
    const state = openBoard()
    remove(state, row(0).slice(1), 7)
    expect(findHiddenSingle(state)?.placements).toEqual([{ cell: 0, digit: 7 }])
    only(state, 40, 3)
    expect(findNakedSingle(state)?.placements).toEqual([{ cell: 40, digit: 3 }])
  })

  it('finds a pointing pair: 4 in box 1 sits only on row 1', () => {
    const state = openBoard()
    remove(state, [2, 9, 10, 11, 18, 19, 20], 4)
    const step = findPointing(state)
    expect(step?.pattern).toEqual([0, 1])
    expect(eliminated(step)).toContain('3:4')
  })

  it('finds a box-line reduction: 6 in row 3 sits only in box 2', () => {
    const state = openBoard()
    remove(state, [18, 19, 20, 23, 24, 25, 26], 6)
    const step = findClaiming(state)
    expect(step?.pattern).toEqual([21, 22])
    expect(eliminated(step)).toContain('3:6')
  })

  it('finds naked and hidden pairs', () => {
    const naked = openBoard()
    only(naked, 0, 1, 2)
    only(naked, 1, 1, 2)
    expect(findNakedSubset(naked, 2, 'naked-pair')).toMatchObject({ pattern: [0, 1], digits: [1, 2] })

    const hidden = openBoard()
    remove(hidden, row(0).slice(2), 8)
    remove(hidden, row(0).slice(2), 9)
    remove(hidden, [9, 10, 11, 18, 19, 20], 8)
    remove(hidden, [9, 10, 11, 18, 19, 20], 9)
    const step = findHiddenSubset(hidden, 2, 'hidden-pair')
    expect(step?.digits).toEqual([8, 9])
    expect(eliminated(step)).toContain('0:1')
  })

  it('finds a naked quad', () => {
    const state = openBoard()
    only(state, 0, 1, 2)
    only(state, 1, 2, 3)
    only(state, 2, 3, 4)
    only(state, 3, 1, 4)
    only(state, 4, 1, 5, 6)
    expect(eliminated(findNakedSubset(state, 4, 'naked-quad'))).toContain('4:1')
  })

  it('finds an X-Wing and a Swordfish', () => {
    const xWing = openBoard()
    remove(xWing, [...row(1), ...row(4)].filter(c => c % 9 !== 2 && c % 9 !== 6), 5)
    const step = findFish(xWing, 2, 'x-wing')
    expect(step?.pattern).toEqual([11, 15, 38, 42])
    expect(eliminated(step)).toContain('2:5')

    const swordfish = openBoard()
    const keep: Record<number, number[]> = { 0: [1, 4], 3: [4, 8], 6: [1, 8] }
    for (const [r, cols] of Object.entries(keep))
      remove(swordfish, row(Number(r)).filter(c => !cols.includes(c % 9)), 7)
    expect(eliminated(findFish(swordfish, 3, 'swordfish'))).toContain('10:7')
  })

  it('finds an XY-Wing and an XYZ-Wing', () => {
    const xy = openBoard()
    only(xy, 0, 1, 2)
    only(xy, 5, 1, 3)
    only(xy, 36, 2, 3)
    expect(eliminated(findXyWing(xy))).toContain('41:3')

    const xyz = openBoard()
    only(xyz, 0, 1, 2, 3)
    only(xyz, 1, 1, 3)
    only(xyz, 9, 2, 3)
    expect(eliminated(findXyzWing(xyz))).toContain('10:3')
  })
})

describe('findNextStep', () => {
  it('never places a wrong digit or removes the right one, across 1500 generated puzzles', () => {
    const random = mulberry32(20260930)
    const seen = new Set<TechniqueId>()
    for (let n = 0; n < 1500; n++) {
      const solution = generateSolution(random)
      const state = createLogicState(digPuzzle(solution, random, 17))
      while (!isSolved(state)) {
        const step = findNextStep(state)
        if (!step)
          break
        seen.add(step.technique)
        for (const { cell, digit } of step.placements)
          expect(digit, `${step.technique} placed a wrong digit`).toBe(solution[cell])
        for (const { cell, digit } of step.eliminations)
          expect(digit, `${step.technique} removed the answer`).not.toBe(solution[cell])
        applyStep(state, step)
      }
    }
    const common = TECHNIQUES.filter(t => t.tier !== 'expert' && t.id !== 'naked-quad').map(t => t.id)
    expect([...seen]).toEqual(expect.arrayContaining(common))
  }, 30_000)
})
