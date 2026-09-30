import { readValidatedBody } from 'h3'
import { z } from 'zod'
import { checkUsername } from '#shared/account/username'
import { renameUser, toPublicUser } from '../../services/users'
import { useDb } from '../../utils/db'
import { badRequest } from '../../utils/errors'
import { defineApiHandler } from '../../utils/handler'
import { requireUser, useTallySession } from '../../utils/session'

const body = z.object({ username: z.string().max(64) })

export default defineApiHandler(async (event) => {
  const { username } = await readValidatedBody(event, body.parse)
  const db = useDb(event)
  const user = await requireUser(event, db)
  const problem = checkUsername(username)
  if (problem)
    throw badRequest('username_invalid', { problem })
  const renamed = await renameUser(db, user, username)
  await (await useTallySession(event)).update({ user: { id: renamed.id, username: renamed.username } })
  return { user: toPublicUser(renamed) }
})
