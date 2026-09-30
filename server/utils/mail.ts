import type { H3Event } from 'h3'
import { getCfEnv } from './cf'

/** Sends a sign-in code. In dev the code goes to the terminal instead. */
export async function sendSignInCode(event: H3Event, to: string, code: string): Promise<void> {
  if (import.meta.dev) {
    console.warn(`[mail] sign-in code for ${to}: ${code}`)
    return
  }
  const env = getCfEnv(event)
  if (!env.EMAIL)
    throw new Error('EMAIL binding missing')
  const text = `Your Tally code is ${code}.\n\nIt works for the next 10 minutes. If you didn't ask for it, you can ignore this email.\n\ntally.vitex.dev`
  const html = `<div style="font-family:Georgia,serif;font-size:17px;line-height:1.5;color:#1a1d21">
<p>Your Tally code is</p>
<p style="font-family:ui-monospace,Menlo,monospace;font-size:32px;letter-spacing:6px;margin:8px 0 16px">${code}</p>
<p style="color:#5d636b;font-size:15px">It works for the next 10 minutes. If you didn't ask for it, you can ignore this email.</p>
<p style="color:#5d636b;font-size:15px"><a href="https://tally.vitex.dev" style="color:#3d5470">tally.vitex.dev</a></p>
</div>`
  await env.EMAIL.send({
    from: { email: env.MAIL_FROM ?? 'noreply@tally.vitex.dev', name: 'Tally' },
    to,
    subject: `${code} is your Tally code`,
    text,
    html,
  })
}
