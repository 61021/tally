import { describe, expect, it } from 'vitest'
import { parseGrid, serializeGrid } from './grid.ts'
import { countSolutions, solve } from './solve.ts'

const WIKI = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'
const WIKI_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

describe('solve', () => {
  it('solves a known puzzle', () => {
    expect(serializeGrid(solve(parseGrid(WIKI))!)).toBe(WIKI_SOLUTION)
  })

  it('returns null for a grid that already breaks the rules', () => {
    expect(solve(parseGrid(`55${'0'.repeat(79)}`))).toBeNull()
  })
})

describe('countSolutions', () => {
  it('finds exactly one solution for a proper puzzle', () => {
    expect(countSolutions(parseGrid(WIKI))).toBe(1)
  })

  it('stops at the limit for a grid with many solutions', () => {
    expect(countSolutions(parseGrid('0'.repeat(81)))).toBe(2)
    expect(countSolutions(parseGrid('0'.repeat(81)), 5)).toBe(5)
  })

  it('finds none for a contradiction', () => {
    expect(countSolutions(parseGrid(`55${'0'.repeat(79)}`))).toBe(0)
  })
})
