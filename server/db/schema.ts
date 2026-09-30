import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  /** Lowercased username; makes names unique without case. */
  usernameKey: text('username_key').notNull(),
  /** Keyed hash of the email. The address itself is never stored: codes go to whatever address is typed at sign-in. */
  emailHash: text('email_hash').notNull(),
  createdAt: integer('created_at').notNull(),
  usernameChangedAt: integer('username_changed_at'),
  lastSignInAt: integer('last_sign_in_at'),
}, t => [
  uniqueIndex('users_username_key').on(t.usernameKey),
  uniqueIndex('users_email_hash').on(t.emailHash),
])

export const signInCodes = sqliteTable('sign_in_codes', {
  id: text('id').primaryKey(),
  emailHash: text('email_hash').notNull(),
  codeHash: text('code_hash').notNull(),
  attempts: integer('attempts').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
  usedAt: integer('used_at'),
}, t => [
  index('sign_in_codes_email_created').on(t.emailHash, t.createdAt),
])
