interface TurnstileVerifyResponse {
  'success': boolean
  'error-codes'?: string[]
}

/** Checks a Turnstile token with Cloudflare; tokens are single-use and die after five minutes. */
export async function verifyTurnstile(secret: string, token: string | undefined, ip: string | null): Promise<boolean> {
  if (!token)
    return false
  const body = new FormData()
  body.set('secret', secret)
  body.set('response', token)
  if (ip)
    body.set('remoteip', ip)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
  if (!res.ok) {
    console.error('[turnstile] siteverify answered', res.status)
    return false
  }
  const data = await res.json() as TurnstileVerifyResponse
  if (!data.success)
    console.warn('[turnstile] rejected', (data['error-codes'] ?? []).join(','))
  return data.success
}
