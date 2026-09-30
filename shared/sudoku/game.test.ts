import { describe, expect, it } from 'vitest'
import { checkMistakes, createGame, eraseCell, fromProgress, placeDigit, redoMove, remainingDigits, toggleNote, toProgress, undoMove, wrongCells } from './game.ts'
import { bit } from './grid.ts'

const PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'
const SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'

describe('game moves', () => {
  it('places and clears a digit, never touching a given', () => {
    let game = placeDigit(createGame(PUZZLE, SOLUTION), 2, 4)
    expect(game.values[2]).toBe(4)
    game = placeDigit(game, 2, 4)
    expect(game.values[2]).toBe(0)
    expect(placeDigit(game, 0, 9).values[0]).toBe(5)
  })

  it('drops a placed digit from the notes of every peer', () => {
    let game = toggleNote(createGame(PUZZLE, SOLUTION), 3, 4)
    game = toggleNote(game, 11, 4)
    game = placeDigit(game, 2, 4)
    expect(game.notes[3]! & bit(4)).toBe(0)
    expect(game.notes[11]! & bit(4)).toBe(0)
  })

  it('undoes and redoes in order', () => {
    let game = placeDigit(createGame(PUZZLE, SOLUTION), 2, 4)
    game = placeDigit(game, 3, 6)
    game = undoMove(game)
    expect(game.values.slice(2, 4)).toEqual([4, 0])
    game = redoMove(game)
    expect(game.values.slice(2, 4)).toEqual([4, 6])
    game = eraseCell(undoMove(game), 2)
    expect(game.future).toEqual([])
  })

  it('flags wrong digits on a check until they change', () => {
    let game = placeDigit(createGame(PUZZLE, SOLUTION), 2, 1)
    expect(wrongCells(game)).toEqual([2])
    game = checkMistakes(game)
    expect(game).toMatchObject({ flagged: [2], checks: 1 })
    expect(placeDigit(game, 2, 4).flagged).toEqual([])
  })

  it('counts what is left of each digit and notices a finished board', () => {
    const game = createGame(PUZZLE, SOLUTION)
    expect(remainingDigits(game)[5]).toBe(9 - [...PUZZLE].filter(c => c === '5').length)
    const nearly = fromProgress(PUZZLE, SOLUTION, { ...toProgress(game), values: `0${SOLUTION.slice(1)}` })
    expect(nearly.completed).toBe(false)
    expect(placeDigit(nearly, 0, 5).completed).toBe(false)
    const done = placeDigit(fromProgress(PUZZLE, SOLUTION, { ...toProgress(game), values: `53${'0'}${SOLUTION.slice(3)}` }), 2, 4)
    expect(done.completed).toBe(true)
  })
})

describe('saved progress', () => {
  it('round-trips, and starts fresh when the save does not fit the puzzle', () => {
    const game = toggleNote(placeDigit(createGame(PUZZLE, SOLUTION), 2, 4), 3, 6)
    const back = fromProgress(PUZZLE, SOLUTION, toProgress(game))
    expect(back.values).toEqual(game.values)
    expect(back.notes).toEqual(game.notes)
    expect(fromProgress(PUZZLE, SOLUTION, { ...toProgress(game), values: '1'.repeat(81) }).values).toEqual(createGame(PUZZLE, SOLUTION).values)
    expect(fromProgress(PUZZLE, SOLUTION, null).values).toEqual(createGame(PUZZLE, SOLUTION).values)
  })
})
