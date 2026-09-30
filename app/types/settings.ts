import type { MistakeMode } from '#shared/sudoku/game-types'

export interface GameSettings {
  mistakes: MistakeMode
  highlightSame: boolean
  showTimer: boolean
}
