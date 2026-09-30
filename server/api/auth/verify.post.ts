import { readValidatedBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { z } from 'zod'
import { spendCode } from '../../services/codes'
import { findUserByEmailHash, markSignedIn, toPublicUser } from '../../services/users'
import { useDb } from '../../utils/db'
import { defineApiHandler } from '../../utils/handler'
import { limitByIp } from '../../utils/rate-limit'
import { useTallySession } from '../../utils/session'

const body = z.object({
  codeId: z.string().min(1).max(64),
  code: z.string().regex(/^\d{6}$/),
})

/** Fifteen minutes to pick a username once the email checks out. */
const PENDING_TTL_MS = 15 * 60_000

export default defineApiHandler(async (event) => {
  await limitByIp(event, 'verify')
  const input = await readValidatedBody(event, body.parse)
  const config = useRuntimeConfig(event)
  const db = useDb(event)
  const emailHash = await spendCode(db, input.codeId, input.code, config.emailHashKey)
  const session = await useTallySession(event)

  const user = await findUserByEmailHash(db, emailHash)
  if (user) {
    await markSignedIn(db, user)
    await session.update({ user: { id: user.id, username: user.username }, pending: undefined })
    return { status: 'signed-in' as const, user: toPublicUser(user) }
  }
  await session.update({ user: undefined, pending: { emailHash, expiresAt: Date.now() + PENDING_TTL_MS } })
  return { status: 'needs-username' as const }
})
