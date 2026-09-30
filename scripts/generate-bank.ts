import type { Difficulty } from '../shared/sudoku/types.ts'
import { mkdir, writeFile } from 'node:fs/promises'
import { availableParallelism } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads'
import { DIFFICULTIES } from '../shared/sudoku/constants.ts'
import { generatePuzzle } from '../shared/sudoku/generate.ts'
import { mulberry32 } from '../shared/sudoku/rng.ts'

interface Job {
  difficulty: Difficulty
  seed: number
  count: number
}

function work({ difficulty, seed, count }: Job): string[] {
  const random = mulberry32(seed)
  const puzzles: string[] = []
  while (puzzles.length < count) {
    const result = generatePuzzle(difficulty, random, 100_000)
    if (result)
      puzzles.push(result.puzzle)
  }
  return puzzles
}

function runWorker(job: Job): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: job })
    worker.once('message', resolve)
    worker.once('error', reject)
  })
}

async function generate(difficulty: Difficulty, per: number, seed: number, threads: number): Promise<string[]> {
  const unique = new Set<string>()
  // Each round seeds its workers apart from every other round and difficulty, so output depends only on the seed.
  for (let round = 0; unique.size < per; round++) {
    const missing = per - unique.size
    const share = Math.ceil(missing / threads)
    const jobs = Array.from({ length: threads }, (_, w) => ({
      difficulty,
      seed: seed * 100_000 + DIFFICULTIES.indexOf(difficulty) * 10_000 + round * 100 + w,
      count: share,
    }))
    for (const batch of await Promise.all(jobs.map(runWorker))) {
      for (const puzzle of batch) unique.add(puzzle)
    }
  }
  return [...unique].slice(0, per)
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      per: { type: 'string', default: '2500' },
      seed: { type: 'string', default: '2026' },
      out: { type: 'string', default: 'public/bank' },
    },
  })
  const per = Number(values.per)
  const seed = Number(values.seed)
  const threads = Math.max(1, availableParallelism() - 2)
  await mkdir(values.out, { recursive: true })
  for (const difficulty of DIFFICULTIES) {
    const started = performance.now()
    const puzzles = await generate(difficulty, per, seed, threads)
    const body = `{\n  "difficulty": "${difficulty}",\n  "seed": ${seed},\n  "puzzles": [\n${puzzles.map(p => `    "${p}"`).join(',\n')}\n  ]\n}\n`
    await writeFile(join(values.out, `${difficulty}.json`), body)
    process.stdout.write(`${difficulty}: ${puzzles.length} puzzles in ${((performance.now() - started) / 1000).toFixed(1)}s\n`)
  }
}

if (isMainThread)
  await main()
else
  parentPort!.postMessage(work(workerData as Job))
