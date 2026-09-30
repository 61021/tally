import type { H3Event } from 'h3'
import type { Db } from '../db/client'
import { createDb } from '../db/client'
import { getCfEnv } from './cf'

export function useDb(event: H3Event): Db {
  const ctx = event.context as { _db?: Db }
  ctx._db ??= createDb(getCfEnv(event).DB)
  return ctx._db
}
