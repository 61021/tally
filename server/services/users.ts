import type { Db } from '../db/client'
import type { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { nextRenameAt, usernameKey } from '#shared/account/username'
import { signInCodes, users as usersTable } from '../db/schema'
import { newId } from '../utils/crypto'
import { DomainError } from '../utils/errors'

export type UserRow = typeof users.$inferSelect

export interface PublicUser {
  id: string
  username: string
  createdAt: number
  /** When the username may change again; null means now. */
  renameAvailableAt: number | null
}

export function toPublicUser(row: UserRow): PublicUser {
  return { id: row.id, username: row.username, createdAt: row.createdAt, renameAvailableAt: nextRenameAt(row.usernameChangedAt) }
}

export function findUserByEmailHash(db: Db, emailHash: string): Promise<UserRow | undefined> {
  return db.query.users.findFirst({ where: eq(usersTable.emailHash, emailHash) })
}

function isUniqueViolation(error: unknown, column: string): boolean {
  const text = String((error as { cause?: unknown })?.cause ?? error)
  return text.includes('UNIQUE constraint failed') && text.includes(column)
}

export async function createUser(db: Db, username: string, emailHash: string): Promise<UserRow> {
  const row: UserRow = { id: newId('user'), username, usernameKey: usernameKey(username), emailHash, createdAt: Date.now(), usernameChangedAt: null, lastSignInAt: Date.now() }
  try {
    await db.insert(usersTable).values(row)
  }
  catch (error) {
    if (isUniqueViolation(error, 'username_key'))
      throw new DomainError('username_taken', 409)
    throw error
  }
  return row
}

export async function renameUser(db: Db, user: UserRow, username: string): Promise<UserRow> {
  const availableAt = nextRenameAt(user.usernameChangedAt)
  if (availableAt)
    throw new DomainError('rename_too_soon', 409, { availableAt })
  const next = { username, usernameKey: usernameKey(username), usernameChangedAt: Date.now() }
  try {
    await db.update(usersTable).set(next).where(eq(usersTable.id, user.id))
  }
  catch (error) {
    if (isUniqueViolation(error, 'username_key'))
      throw new DomainError('username_taken', 409)
    throw error
  }
  return { ...user, ...next }
}

export async function markSignedIn(db: Db, user: UserRow): Promise<void> {
  await db.update(usersTable).set({ lastSignInAt: Date.now() }).where(eq(usersTable.id, user.id))
}

/** Removes the account and any codes still waiting for its email. */
export async function deleteUser(db: Db, user: UserRow): Promise<void> {
  await db.batch([
    db.delete(signInCodes).where(eq(signInCodes.emailHash, user.emailHash)),
    db.delete(usersTable).where(eq(usersTable.id, user.id)),
  ])
}
