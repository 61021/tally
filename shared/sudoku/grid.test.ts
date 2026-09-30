import { describe, expect, it } from 'vitest'
import { bit, computeCandidates, countGivens, digitsOf, findConflicts, parseGrid, serializeGrid } from './grid.ts'

const WIKI = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

describe('parseGrid', () => {
  it('round-trips through serializeGrid, reading dots as empty cells', () => {
    expect(serializeGrid(parseGrid(WIKI))).toBe(WIKI)
    expect(serializeGrid(parseGrid(WIKI.replace(/0/g, '.')))).toBe(WIKI)
  })

  it('rejects anything that is not 81 cells', () => {
    expect(() => parseGrid('123')).toThrow()
    expect(() => parseGrid(`${WIKI.slice(0, 80)}x`)).toThrow()
  })
})

describe('computeCandidates', () => {
  it('leaves only the digits no peer uses', () => {
    const candidates = computeCandidates(parseGrid(WIKI))
    expect(digitsOf(candidates[2]!)).toEqual([1, 2, 4])
    expect(candidates[0]).toBe(0)
  })
})

describe('grid helpers', () => {
  it('counts givens and maps digits to bits', () => {
    expect(countGivens(parseGrid(WIKI))).toBe(30)
    expect(bit(1)).toBe(1)
    expect(bit(9)).toBe(256)
  })

  it('finds cells that repeat a digit in a row, column or box', () => {
    const cells = parseGrid(WIKI)
    cells[2] = 5
    expect([...findConflicts(cells)].sort((a, b) => a - b)).toEqual([0, 2])
  })
})
