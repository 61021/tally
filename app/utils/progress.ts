import type { GameProgress } from '#shared/sudoku/game-types'
import type { Difficulty } from '#shared/sudoku/types'
import { BANK_SIZE, STORAGE_PREFIX } from '../constants/sudoku'
import { readJson, writeJson } from './storage'

const progressKey = (difficulty: Difficulty, number: number): string => `${STORAGE_PREFIX}:${difficulty}:${number}`
const lastKey = (difficulty: Difficulty): string => `${STORAGE_PREFIX}:last:${difficulty}`
const solvedKey = (difficulty: Difficulty): string => `${STORAGE_PREFIX}:solved:${difficulty}`

export function loadProgress(difficulty: Difficulty, number: number): GameProgress | null {
  return readJson<GameProgress>(progressKey(difficulty, number))
}

export function saveProgress(difficulty: Difficulty, number: number, progress: GameProgress): void {
  writeJson(progressKey(difficulty, number), progress)
  writeJson(lastKey(difficulty), number)
}

export function solvedNumbers(difficulty: Difficulty): Set<number> {
  return new Set(readJson<number[]>(solvedKey(difficulty)) ?? [])
}

export function markSolved(difficulty: Difficulty, number: number): void {
  const solved = solvedNumbers(difficulty)
  solved.add(number)
  writeJson(solvedKey(difficulty), [...solved])
}

/** The puzzle left unfinished at this difficulty, if any. */
export function unfinished(difficulty: Difficulty): number | null {
  const last = readJson<number>(lastKey(difficulty))
  if (!last)
    return null
  const progress = loadProgress(difficulty, last)
  return progress && !progress.completed ? last : null
}

/** The unfinished puzzle, or a random one not solved yet. */
export function nextNumber(difficulty: Difficulty): number {
  const open = unfinished(difficulty)
  if (open)
    return open
  const solved = solvedNumbers(difficulty)
  for (let tries = 0; tries < 50; tries++) {
    const n = 1 + Math.floor(Math.random() * BANK_SIZE)
    if (!solved.has(n))
      return n
  }
  return 1 + Math.floor(Math.random() * BANK_SIZE)
}
