import { readValidatedBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { z } from 'zod'
import { issueCode, revokeCode } from '../../services/codes'
import { getClientIp, isProduction } from '../../utils/cf'
import { hmacHex, normalizeEmail } from '../../utils/crypto'
import { useDb } from '../../utils/db'
import { DomainError, forbidden } from '../../utils/errors'
import { defineApiHandler } from '../../utils/handler'
import { sendSignInCode } from '../../utils/mail'
import { limitByIp } from '../../utils/rate-limit'
import { verifyTurnstile } from '../../utils/turnstile'

const body = z.object({
  email: z.email().max(254),
  turnstileToken: z.string().max(4096).optional(),
})

export default defineApiHandler(async (event) => {
  await limitByIp(event, 'code')
  const input = await readValidatedBody(event, body.parse)
  const config = useRuntimeConfig(event)

  if (!config.turnstileSecretKey) {
    if (isProduction(event))
      throw new DomainError('turnstile_not_configured', 503)
  }
  else if (!await verifyTurnstile(config.turnstileSecretKey, input.turnstileToken, getClientIp(event))) {
    throw forbidden('turnstile_failed')
  }

  const email = normalizeEmail(input.email)
  const db = useDb(event)
  const { codeId, code } = await issueCode(db, await hmacHex(config.emailHashKey, `email:${email}`), config.emailHashKey)
  try {
    await sendSignInCode(event, email, code)
  }
  catch (error) {
    console.error('[auth] code send failed', error)
    await revokeCode(db, codeId).catch(() => {})
    throw new DomainError('code_send_failed', 502)
  }
  return { codeId, ...(import.meta.dev ? { devCode: code } : {}) }
})
