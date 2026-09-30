/** 81 cells in row-major order; 0 is an empty cell. */
export type Cells = Uint8Array

/** One 9-bit mask per cell; bit `d - 1` is set while digit `d` is still possible. */
export type Candidates = Uint16Array

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export type TechniqueId
  = | 'hidden-single'
    | 'naked-single'
    | 'pointing'
    | 'claiming'
    | 'naked-pair'
    | 'hidden-pair'
    | 'naked-triple'
    | 'hidden-triple'
    | 'x-wing'
    | 'xy-wing'
    | 'naked-quad'
    | 'swordfish'
    | 'xyz-wing'

export type UnitKind = 'row' | 'column' | 'box'

export interface Unit {
  kind: UnitKind
  /** 0-8, top to bottom, left to right. */
  index: number
  cells: readonly number[]
}

export interface Technique {
  id: TechniqueId
  name: string
  /** The lowest difficulty a puzzle needing this technique can have. */
  tier: Difficulty
  /** Adds to a puzzle's score each time the technique is needed. */
  weight: number
}

export interface CellDigit {
  cell: number
  digit: number
}

/** One logical deduction, rich enough to explain as a hint. */
export interface Step {
  technique: TechniqueId
  placements: CellDigit[]
  eliminations: CellDigit[]
  /** The cells that form the pattern, for highlighting. */
  pattern: number[]
  digits: number[]
  units: Unit[]
}

export interface LogicState {
  cells: Cells
  candidates: Candidates
}

export interface Grade {
  /** null when the puzzle needs a technique beyond the ones we teach. */
  difficulty: Difficulty | null
  score: number
  hardest: TechniqueId | null
  givens: number
  counts: Partial<Record<TechniqueId, number>>
}

export interface GeneratedPuzzle {
  puzzle: string
  solution: string
  grade: Grade
}

export type Random = () => number
