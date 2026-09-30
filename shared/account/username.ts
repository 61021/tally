export const USERNAME_MIN = 3
export const USERNAME_MAX = 20

/** Days between username changes, so nobody hops names to confuse a leaderboard. */
export const RENAME_COOLDOWN_DAYS = 30

export type UsernameProblem = 'too-short' | 'too-long' | 'characters' | 'not-allowed'

/** Names people would mistake for the site, or that break things. */
const RESERVED = new Set(['admin', 'administrator', 'root', 'support', 'help', 'tally', 'vitex', 'moderator', 'mod', 'staff', 'system', 'null', 'undefined', 'official', 'anonymous', 'guest', 'account', 'settings', 'signin', 'signout'])

/** Blocked anywhere inside a name; kept short so ordinary names don't trip it. */
const NEVER_INSIDE = ['fuck', 'cunt', 'nigg', 'fagg', 'whore', 'hitler']

/** Blocked as the whole name only: they sit inside too many real names. */
const NEVER_WHOLE = new Set(['shit', 'bitch', 'slut', 'dick', 'cock', 'pussy', 'asshole', 'retard', 'rape', 'porn', 'sex', 'nazi'])

/** Usernames compare without case: "Khaled" and "khaled" are the same name. */
export function usernameKey(name: string): string {
  return name.toLowerCase()
}

export function checkUsername(name: string): UsernameProblem | null {
  if (name.length < USERNAME_MIN)
    return 'too-short'
  if (name.length > USERNAME_MAX)
    return 'too-long'
  if (!/^[a-z0-9]+$/i.test(name))
    return 'characters'
  const key = usernameKey(name)
  if (RESERVED.has(key) || NEVER_WHOLE.has(key) || NEVER_INSIDE.some(word => key.includes(word)))
    return 'not-allowed'
  return null
}

/** The first day a username may change again, or null when it may change now. */
export function nextRenameAt(changedAt: number | null, now = Date.now()): number | null {
  if (changedAt === null)
    return null
  const next = changedAt + RENAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  return next > now ? next : null
}
