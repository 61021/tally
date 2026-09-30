import type { Db } from '../db/client'
import { and, desc, eq, gt, isNull, lt, sql } from 'drizzle-orm'
import { signInCodes } from '../db/schema'
import { hmacHex, newId, randomCode, sameText } from '../utils/crypto'
import { badRequest, tooMany } from '../utils/errors'

const MINUTE = 60_000
const CODE_TTL_MS = 10 * MINUTE
const RESEND_AFTER_MS = MINUTE
const CODES_PER_HOUR = 5
const MAX_ATTEMPTS = 5

const hashCode = (secret: string, id: string, code: string): Promise<string> => hmacHex(secret, `code:${id}:${code}`)

/** A fresh code for this email, within the resend cooldown and the hourly cap. */
export async function issueCode(db: Db, emailHash: string, secret: string): Promise<{ codeId: string, code: string }> {
  const now = Date.now()
  const recent = await db
    .select({ createdAt: signInCodes.createdAt })
    .from(signInCodes)
    .where(and(eq(signInCodes.emailHash, emailHash), gt(signInCodes.createdAt, now - 60 * MINUTE)))
    .orderBy(desc(signInCodes.createdAt))
  const last = recent[0]
  if (last && now - last.createdAt < RESEND_AFTER_MS)
    throw tooMany('code_cooldown', { retryAfter: Math.ceil((RESEND_AFTER_MS - (now - last.createdAt)) / 1000) })
  if (recent.length >= CODES_PER_HOUR)
    throw tooMany('code_limit')

  const codeId = newId('code')
  const code = randomCode()
  await db.insert(signInCodes).values({ id: codeId, emailHash, codeHash: await hashCode(secret, codeId, code), createdAt: now, expiresAt: now + CODE_TTL_MS })
  await db.delete(signInCodes).where(lt(signInCodes.createdAt, now - 24 * 60 * MINUTE))
  return { codeId, code }
}

/** A code that never reached the inbox shouldn't count against the cooldown. */
export async function revokeCode(db: Db, codeId: string): Promise<void> {
  await db.delete(signInCodes).where(eq(signInCodes.id, codeId))
}

/** Spends a code and returns the email hash it was sent for. */
export async function spendCode(db: Db, codeId: string, code: string, secret: string): Promise<string> {
  const now = Date.now()
  const row = await db.query.signInCodes.findFirst({ where: eq(signInCodes.id, codeId) })
  if (!row || row.usedAt || row.expiresAt < now)
    throw badRequest('code_expired')
  if (row.attempts >= MAX_ATTEMPTS)
    throw badRequest('code_locked')
  if (!sameText(await hashCode(secret, codeId, code), row.codeHash)) {
    await db.update(signInCodes).set({ attempts: sql`${signInCodes.attempts} + 1` }).where(eq(signInCodes.id, codeId))
    const left = MAX_ATTEMPTS - row.attempts - 1
    throw badRequest(left > 0 ? 'code_wrong' : 'code_locked', { attemptsLeft: left })
  }
  const spent = await db.update(signInCodes).set({ usedAt: now }).where(and(eq(signInCodes.id, codeId), isNull(signInCodes.usedAt))).returning({ id: signInCodes.id })
  if (!spent.length)
    throw badRequest('code_expired')
  return row.emailHash
}
