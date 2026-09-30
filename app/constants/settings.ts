import type { MistakeMode } from '#shared/sudoku/game-types'
import type { GameSettings } from '../types/settings'

export const DEFAULT_SETTINGS: GameSettings = { mistakes: 'request', highlightSame: true, showTimer: true }

export const SETTINGS_COOKIE = 'tally-settings'

export const MISTAKE_MODES: readonly { id: MistakeMode, name: string }[] = [
  { id: 'request', name: 'When I check' },
  { id: 'instant', name: 'As I play' },
  { id: 'off', name: 'Never' },
]
