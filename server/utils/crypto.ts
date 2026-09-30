const encoder = new TextEncoder()

const toHex = (bytes: ArrayBuffer): string => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('')

export async function hmacHex(key: string, value: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toHex(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(value)))
}

/** Compares without leaking how many leading characters matched. */
export function sameText(a: string, b: string): boolean {
  if (a.length !== b.length)
    return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Six digits, uniform: values past the last whole million are drawn again. */
export function randomCode(): string {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / 1_000_000) * 1_000_000
  do crypto.getRandomValues(buf)
  while (buf[0]! >= limit)
  return String(buf[0]! % 1_000_000).padStart(6, '0')
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
