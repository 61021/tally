import { mulberry32, shuffle } from '#shared/sudoku/rng'

export interface WallWord {
  text: string
  x: number
  /** Top of the word's row. */
  y: number
  width: number
  /** How strongly the word shows before anything lights it, 0-1. */
  alpha: number
}

export interface WallLayout {
  width: number
  height: number
  rowHeight: number
  gap: number
  seed: number
}

/**
 * Centred rows of words, each running a little past both edges so the wall has no ragged margin.
 * The list is shuffled once and read on from row to row, so neighbours never repeat in a pattern.
 */
export function layoutWall(texts: readonly string[], measure: (text: string) => number, layout: WallLayout): WallWord[] {
  if (!texts.length)
    return []
  const random = mulberry32(layout.seed)
  const order = shuffle([...texts], random)
  const widths = new Map<string, number>()
  const widthOf = (text: string): number => {
    let w = widths.get(text)
    if (w === undefined) {
      w = measure(text)
      widths.set(text, w)
    }
    return w
  }
  const words: WallWord[] = []
  let next = 0
  for (let y = 0; y < layout.height; y += layout.rowHeight) {
    const row: string[] = []
    let rowWidth = 0
    while (rowWidth < layout.width) {
      const text = order[next++ % order.length]!
      rowWidth += (row.length ? layout.gap : 0) + widthOf(text)
      row.push(text)
    }
    let x = (layout.width - rowWidth) / 2
    for (const text of row) {
      words.push({ text, x, y, width: widthOf(text), alpha: 0.07 + random() * 0.07 })
      x += widthOf(text) + layout.gap
    }
  }
  return words
}

/** From a point to the nearest part of a word's line. */
export function distanceToWord(word: WallWord, rowHeight: number, px: number, py: number): number {
  const dx = Math.max(word.x - px, 0, px - (word.x + word.width))
  return Math.hypot(dx, word.y + rowHeight / 2 - py)
}

/** How brightly one point of the pointer's trail lights a word: full beneath it, nothing at `radius` or once `life` has passed. */
export function glow(distance: number, ageMs: number, radius: number, lifeMs: number): number {
  if (distance >= radius || ageMs >= lifeMs)
    return 0
  const near = 1 - (distance / radius) ** 2
  const fresh = 1 - ageMs / lifeMs
  return near * near * fresh * fresh
}

/** Eases a word's light toward where it should be: quick to light, slower to fade. */
export function approach(level: number, target: number, dtMs: number): number {
  const tau = target > level ? 45 : 160
  return level + (target - level) * (1 - Math.exp(-dtMs / tau))
}
