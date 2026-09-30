import { readValidatedBody } from 'h3'
import { z } from 'zod'
import { checkUsername } from '#shared/account/username'
import { createUser, findUserByEmailHash, toPublicUser } from '../../services/users'
import { useDb } from '../../utils/db'
import { badRequest } from '../../utils/errors'
import { defineApiHandler } from '../../utils/handler'
import { useTallySession } from '../../utils/session'

const body = z.object({ username: z.string().max(64) })

export default defineApiHandler(async (event) => {
  const { username } = await readValidatedBody(event, body.parse)
  const session = await useTallySession(event)
  const pending = session.data.pending
  if (!pending || pending.expiresAt < Date.now())
    throw badRequest('signup_expired')
  const problem = checkUsername(username)
  if (problem)
    throw badRequest('username_invalid', { problem })

  const db = useDb(event)
  // Two tabs finishing the same sign-up: the second one just signs in.
  const user = await findUserByEmailHash(db, pending.emailHash) ?? await createUser(db, username, pending.emailHash)
  await session.update({ user: { id: user.id, username: user.username }, pending: undefined })
  return { user: toPublicUser(user) }
})
