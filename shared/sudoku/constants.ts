import type { Difficulty, Technique, TechniqueId, Unit } from './types.ts'

export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export const ALL_CANDIDATES = 0b111111111

const range9 = [0, 1, 2, 3, 4, 5, 6, 7, 8]

export const ROWS: readonly Unit[] = range9.map(r => ({ kind: 'row', index: r, cells: range9.map(c => r * 9 + c) }))

export const COLUMNS: readonly Unit[] = range9.map(c => ({ kind: 'column', index: c, cells: range9.map(r => r * 9 + c) }))

export const BOXES: readonly Unit[] = range9.map(b => ({
  kind: 'box',
  index: b,
  cells: range9.map(k => (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)),
}))

/** Boxes first: a box is where people look for singles first. */
export const UNITS: readonly Unit[] = [...BOXES, ...ROWS, ...COLUMNS]

export const rowOf = (cell: number): number => Math.floor(cell / 9)
export const columnOf = (cell: number): number => cell % 9
export const boxOf = (cell: number): number => Math.floor(cell / 27) * 3 + Math.floor((cell % 9) / 3)

/** The 20 cells that share a row, column or box with each cell. */
export const PEERS: readonly (readonly number[])[] = Array.from({ length: 81 }, (_, cell) => {
  const peers = new Set([...ROWS[rowOf(cell)]!.cells, ...COLUMNS[columnOf(cell)]!.cells, ...BOXES[boxOf(cell)]!.cells])
  peers.delete(cell)
  return [...peers]
})

export const PEER_SETS: readonly ReadonlySet<number>[] = PEERS.map(p => new Set(p))

/** Applied in this order, so a hint always shows the easiest deduction available. */
export const TECHNIQUES: readonly Technique[] = [
  { id: 'hidden-single', name: 'Hidden single', tier: 'easy', weight: 1 },
  { id: 'naked-single', name: 'Naked single', tier: 'easy', weight: 2 },
  { id: 'pointing', name: 'Pointing pair', tier: 'medium', weight: 12 },
  { id: 'claiming', name: 'Box-line reduction', tier: 'medium', weight: 14 },
  { id: 'naked-pair', name: 'Naked pair', tier: 'medium', weight: 16 },
  { id: 'hidden-pair', name: 'Hidden pair', tier: 'medium', weight: 20 },
  { id: 'naked-triple', name: 'Naked triple', tier: 'hard', weight: 30 },
  { id: 'hidden-triple', name: 'Hidden triple', tier: 'hard', weight: 36 },
  { id: 'x-wing', name: 'X-Wing', tier: 'hard', weight: 40 },
  { id: 'xy-wing', name: 'XY-Wing', tier: 'hard', weight: 45 },
  { id: 'naked-quad', name: 'Naked quad', tier: 'hard', weight: 50 },
  { id: 'swordfish', name: 'Swordfish', tier: 'expert', weight: 70 },
  { id: 'xyz-wing', name: 'XYZ-Wing', tier: 'expert', weight: 80 },
]

export const TECHNIQUE_BY_ID = Object.fromEntries(TECHNIQUES.map(t => [t.id, t])) as Record<TechniqueId, Technique>

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert']

/** A singles-only puzzle with fewer givens than this is Medium: there is less to see at once. */
export const EASY_MIN_GIVENS = 34

/** How many givens the generator leaves before grading; hard and expert dig as far as uniqueness allows. */
export const GIVENS_TARGET: Record<Difficulty, readonly [min: number, max: number]> = {
  easy: [36, 40],
  medium: [28, 33],
  hard: [17, 26],
  expert: [17, 26],
}
