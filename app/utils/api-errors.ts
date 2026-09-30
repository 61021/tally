import type { UsernameProblem } from '#shared/account/username'

interface ErrorData {
  code?: string
  retryAfter?: number
  attemptsLeft?: number
  problem?: UsernameProblem
  availableAt?: number
}

export const USERNAME_PROBLEMS: Record<UsernameProblem, string> = {
  'too-short': 'At least 3 characters.',
  'too-long': '20 characters at most.',
  'characters': 'Letters and numbers only.',
  'not-allowed': 'That name isn\'t available.',
}

export function formatDay(ms: number): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(ms)
}

/** The server sends a code and details; this turns them into a sentence. */
export function apiErrorMessage(error: unknown): string {
  const data = ((error as { data?: { data?: ErrorData } })?.data?.data ?? {}) as ErrorData
  switch (data.code) {
    case 'code_cooldown':
      return `Wait ${data.retryAfter ?? 60} seconds before asking for another code.`
    case 'code_limit':
      return 'That\'s five codes in an hour. Try again later.'
    case 'rate_limited':
      return 'Too many tries from here. Wait a minute and try again.'
    case 'turnstile_failed':
      return 'The check didn\'t pass. Try again.'
    case 'code_send_failed':
      return 'The email didn\'t go out. Try again in a moment.'
    case 'code_wrong':
      return `That code isn't right. ${data.attemptsLeft} ${data.attemptsLeft === 1 ? 'try' : 'tries'} left.`
    case 'code_locked':
      return 'Too many wrong tries. Ask for a new code.'
    case 'code_expired':
      return 'That code has expired. Ask for a new one.'
    case 'signup_expired':
      return 'That took too long. Start again with your email.'
    case 'username_invalid':
      return data.problem ? USERNAME_PROBLEMS[data.problem] : 'That name won\'t work.'
    case 'username_taken':
      return 'Someone already has that name.'
    case 'rename_too_soon':
      return `You can change it again on ${formatDay(data.availableAt ?? Date.now())}.`
    case 'invalid_input':
      return 'That doesn\'t look right. Check it and try again.'
    case 'signed_out':
      return 'You\'re signed out. Sign in again.'
    default:
      return 'Something went wrong. Try again.'
  }
}
