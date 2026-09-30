import type { H3Event } from 'h3'
import { env as workerEnv } from 'cloudflare:workers'

export interface CloudflareEnv {
  DB: D1Database
  EMAIL?: SendEmail
  AUTH_RATE_LIMIT?: RateLimit
  ENVIRONMENT?: string
  MAIL_FROM?: string
}

/** Bindings from the request when present, else from the module env: internal $fetch events carry no request context on Workers. */
export function getCfEnv(event: H3Event): CloudflareEnv {
  const fromEvent = event.context.cloudflare?.env as CloudflareEnv | undefined
  const env = fromEvent?.DB ? fromEvent : workerEnv as unknown as CloudflareEnv
  if (!env?.DB)
    throw new Error('Cloudflare bindings unavailable on this request')
  return env
}

/** A deployed Worker that lost its ENVIRONMENT var counts as production, so a bad vars block closes the dev doors. */
export function isProduction(event: H3Event): boolean {
  return !import.meta.dev && (getCfEnv(event).ENVIRONMENT ?? 'production') === 'production'
}

export function getClientIp(event: H3Event): string | null {
  return event.headers.get('cf-connecting-ip')
}
