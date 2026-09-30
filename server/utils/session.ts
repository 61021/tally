import type { H3Event } from 'h3'
import type { Db } from '../db/client'
import type { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { useSession } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { users as usersTable } from '../db/schema'
import { DomainError } from './errors'

export interface SessionUser {
  id: string
  username: string
}

export interface TallySession {
  user?: SessionUser
  /** Set after a code checks out for an email with no account yet; spent when a username is picked. */
  pending?: { emailHash: string, expiresAt: number }
}

type SessionManager = Awaited<ReturnType<typeof useSession<TallySession>>>

/** A sealed cookie; the server keeps no session table. */
export function useTallySession(event: H3Event): Promise<SessionManager> {
  const { sessionPassword } = useRuntimeConfig(event)
  if (!sessionPassword || sessionPassword.length < 32)
    throw new Error('NUXT_SESSION_PASSWORD must be at least 32 characters')
  return useSession<TallySession>(event, {
    name: 'tally-session',
    password: sessionPassword,
    maxAge: 60 * 60 * 24 * 180,
    cookie: { sameSite: 'lax', httpOnly: true, secure: !import.meta.dev, path: '/' },
  })
}

/** The signed-in user's row; a session whose account is gone is cleared on the spot. */
export async function requireUser(event: H3Event, db: Db): Promise<typeof users.$inferSelect> {
  const session = await useTallySession(event)
  const id = session.data.user?.id
  const row = id ? await db.query.users.findFirst({ where: eq(usersTable.id, id) }) : undefined
  if (!row) {
    if (id)
      await session.clear()
    throw new DomainError('signed_out', 401)
  }
  return row
}
