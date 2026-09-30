import type { H3Event } from 'h3'
import { getCfEnv, getClientIp } from './cf'
import { tooMany } from './errors'

/** A per-IP brake from the Workers rate limiter; per-email caps live with the codes themselves. */
export async function limitByIp(event: H3Event, action: string): Promise<void> {
  const limiter = getCfEnv(event).AUTH_RATE_LIMIT
  const ip = getClientIp(event)
  if (!limiter || !ip)
    return
  const { success } = await limiter.limit({ key: `${action}:${ip}` })
  if (!success)
    throw tooMany('rate_limited')
}
