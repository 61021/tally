import type { CellDigit, LogicState, Step } from '../types.ts'
import { PEER_SETS, PEERS } from '../constants.ts'
import { bitCount, digitsOf } from '../grid.ts'

function eliminateSeenBy(state: LogicState, seers: readonly number[], zBit: number): CellDigit[] {
  const [first, ...rest] = seers
  const digit = digitsOf(zBit)[0]!
  return PEERS[first!]!
    .filter(c => !seers.includes(c) && state.candidates[c]! & zBit && rest.every(s => PEER_SETS[s]!.has(c)))
    .map(cell => ({ cell, digit }))
}

/** Pivot {x,y} sees pincers {x,z} and {y,z}: whichever way the pivot goes, one pincer is z. */
export function findXyWing(state: LogicState): Step | null {
  for (let pivot = 0; pivot < 81; pivot++) {
    const pm = state.candidates[pivot]!
    if (bitCount(pm) !== 2)
      continue
    for (const a of PEERS[pivot]!) {
      const am = state.candidates[a]!
      if (bitCount(am) !== 2 || bitCount(am & pm) !== 1)
        continue
      const z = am & ~pm
      const want = (pm & ~am) | z
      for (const b of PEERS[pivot]!) {
        if (b === a || state.candidates[b] !== want)
          continue
        const eliminations = eliminateSeenBy(state, [a, b], z)
        if (eliminations.length)
          return { technique: 'xy-wing', placements: [], eliminations, pattern: [pivot, a, b], digits: digitsOf(pm | z), units: [] }
      }
    }
  }
  return null
}

/** Pivot {x,y,z} sees pincers {x,z} and {y,z}: z is in one of the three, so cells seeing all three lose it. */
export function findXyzWing(state: LogicState): Step | null {
  for (let pivot = 0; pivot < 81; pivot++) {
    const pm = state.candidates[pivot]!
    if (bitCount(pm) !== 3)
      continue
    const pincers = PEERS[pivot]!.filter(c => bitCount(state.candidates[c]!) === 2 && (state.candidates[c]! & ~pm) === 0)
    for (let i = 0; i < pincers.length; i++) {
      for (let j = i + 1; j < pincers.length; j++) {
        const a = pincers[i]!
        const b = pincers[j]!
        const am = state.candidates[a]!
        const bm = state.candidates[b]!
        const z = am & bm
        if ((am | bm) !== pm || bitCount(z) !== 1)
          continue
        const eliminations = eliminateSeenBy(state, [pivot, a, b], z)
        if (eliminations.length)
          return { technique: 'xyz-wing', placements: [], eliminations, pattern: [pivot, a, b], digits: digitsOf(pm), units: [] }
      }
    }
  }
  return null
}
