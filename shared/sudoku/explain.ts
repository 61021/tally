import type { Hint, HintLevel, HintView } from './game-types.ts'
import type { Unit } from './types.ts'

export function unitName(unit: Unit): string {
  return `${unit.kind} ${unit.index + 1}`
}

function listOf(items: readonly (string | number)[]): string {
  if (items.length < 2)
    return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

/** "rows 2 and 5" from two row units. */
function linesName(units: readonly Unit[]): string {
  const kind = units[0]!.kind
  return `${kind}s ${listOf(units.map(u => u.index + 1))}`
}

function explainKey(hint: Extract<Hint, { kind: 'step' }>): string {
  const { key } = hint
  const d = key.digits.join(', ')
  const [first, second] = key.units
  const z = key.eliminations[0]?.digit
  switch (key.technique) {
    case 'hidden-single':
      return `${hint.digit} fits in only one cell of ${unitName(first!)}.`
    case 'naked-single':
      return `Every other number is already in this cell's row, column or box.`
    case 'pointing':
      return `In ${unitName(first!)}, every ${d} sits on ${unitName(second!)}, so ${d} can't go anywhere else on that ${second!.kind}.`
    case 'claiming':
      return `On ${unitName(first!)}, every ${d} sits in ${unitName(second!)}, so ${d} can't go anywhere else in that box.`
    case 'naked-pair':
    case 'naked-triple':
    case 'naked-quad':
      return `These ${key.pattern.length} cells in ${unitName(first!)} can only hold ${listOf(key.digits)}, so those numbers leave the rest of the ${first!.kind}.`
    case 'hidden-pair':
    case 'hidden-triple':
      return `In ${unitName(first!)}, ${listOf(key.digits)} fit only in these ${key.pattern.length} cells, so nothing else can go in them.`
    case 'x-wing':
    case 'swordfish': {
      const n = key.technique === 'x-wing' ? 2 : 3
      return `In ${linesName(key.units.slice(0, n))}, ${d} fits only in ${linesName(key.units.slice(n))}, so ${d} leaves the rest of those ${key.units[n]!.kind}s.`
    }
    case 'xy-wing':
      return `Whichever number the middle cell takes, one of the two outer cells becomes ${z}, so a cell that sees both can't be ${z}.`
    case 'xyz-wing':
      return `One of these three cells has to be ${z}, so a cell that sees all three can't be ${z}.`
  }
}

/** What the player reads at each level: where to look, why, then the answer. */
export function explainHint(hint: Hint, level: HintLevel): HintView {
  if (hint.kind === 'mistake') {
    const many = hint.cells.length > 1
    if (level === 1)
      return { text: `Something in box ${hint.box + 1} doesn't fit.`, cells: [], target: null }
    if (level === 2)
      return { text: many ? 'These numbers don\'t belong here.' : 'This number doesn\'t belong here.', cells: hint.cells, target: null }
    return { text: many ? 'Removed them.' : 'Removed it.', cells: [], target: null }
  }
  if (level === 1)
    return { text: `Look at box ${hint.box + 1}.`, cells: [], target: null }
  if (level === 2) {
    const then = hint.key.placements.length ? '' : ' After that, this cell has only one answer.'
    return { text: `${explainKey(hint)}${then}`, cells: [...new Set([...hint.key.pattern, hint.cell])], target: hint.cell }
  }
  return { text: `It's a ${hint.digit}.`, cells: [hint.cell], target: hint.cell }
}
