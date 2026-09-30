import { describe, expect, it } from 'vitest'
import { gradePuzzle } from './grade.ts'
import { parseGrid } from './grid.ts'
import { countSolutions } from './solve.ts'

describe('gradePuzzle', () => {
  it('grades a singles-only puzzle with 30 givens as medium', () => {
    const grade = gradePuzzle(parseGrid('530070000600195000098000060800060003400803001700020006060000280000419005000080079'))
    expect(grade).toMatchObject({ difficulty: 'medium', hardest: 'hidden-single', givens: 30 })
  })

  it('gives up on a puzzle beyond the techniques it knows', () => {
    const escargot = parseGrid('100007090030020008009600500005300900010080002600004000300000010040000007007000300')
    expect(countSolutions(escargot)).toBe(1)
    expect(gradePuzzle(escargot).difficulty).toBeNull()
  })
})
