import type { Difficulty } from '#shared/sudoku/types'

export const BANK_SIZE = 2500

/** A level still loading after this long shows a spinner on its row. */
export const SLOW_OPEN_MS = 150

export const DIFFICULTY_NAMES: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' }

export const STORAGE_PREFIX = 'tally:sudoku'
