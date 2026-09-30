import { toPublicUser } from '../../services/users'
import { useDb } from '../../utils/db'
import { defineApiHandler } from '../../utils/handler'
import { requireUser } from '../../utils/session'

export default defineApiHandler(async (event) => {
  return { user: toPublicUser(await requireUser(event, useDb(event))) }
})
