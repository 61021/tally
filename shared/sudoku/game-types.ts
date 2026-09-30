import type { Step, TechniqueId } from './types.ts'

export type MistakeMode = 'request' | 'instant' | 'off'

export interface Snapshot {
  values: number[]
  notes: number[]
}

export interface Game {
  puzzle: string
  solution: string
  /** Givens and the player's digits; 0 is empty. */
  values: number[]
  /** Pencil marks per cell as 9-bit masks. */
  notes: number[]
  past: Snapshot[]
  future: Snapshot[]
  /** Wrong digits shown after a check, until each one changes. */
  flagged: number[]
  checks: number
  hints: number
  elapsedMs: number
  completed: boolean
}

/** What gets saved between visits; undo history stays behind. */
export interface GameProgress {
  values: string
  notes: number[]
  elapsedMs: number
  checks: number
  hints: number
  completed: boolean
}

export type Hint
  = | { kind: 'mistake', cells: number[], box: number }
    | {
      kind: 'step'
      cell: number
      digit: number
      box: number
      /** The hardest step on the way to this placement: what the hint teaches. */
      key: Step
      technique: TechniqueId
      /** Steps taken before the placement, all of them removing candidates. */
      leadIn: number
    }

export type HintLevel = 1 | 2 | 3

export interface HintView {
  text: string
  /** Cells to highlight while this level shows. */
  cells: number[]
  /** The cell the hint is about, once it is named. */
  target: number | null
}
