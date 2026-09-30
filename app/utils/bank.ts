import type { Difficulty } from '#shared/sudoku/types'

interface BankFile {
  puzzles: string[]
}

const banks = new Map<Difficulty, Promise<string[]>>()

async function fetchBank(difficulty: Difficulty): Promise<string[]> {
  const response = await fetch(`/bank/${difficulty}.json`)
  if (!response.ok)
    throw new Error(`Bank ${difficulty} answered ${response.status}`)
  return (await response.json() as BankFile).puzzles
}

/** Each difficulty's bank is fetched once per visit; a failed fetch is forgotten so the next try goes out again. */
export function loadBank(difficulty: Difficulty): Promise<string[]> {
  let bank = banks.get(difficulty)
  if (!bank) {
    bank = fetchBank(difficulty)
    bank.catch(() => banks.delete(difficulty))
    banks.set(difficulty, bank)
  }
  return bank
}
