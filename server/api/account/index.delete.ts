import { deleteUser } from '../../services/users'
import { useDb } from '../../utils/db'
import { defineApiHandler } from '../../utils/handler'
import { requireUser, useTallySession } from '../../utils/session'

export default defineApiHandler(async (event) => {
  const db = useDb(event)
  await deleteUser(db, await requireUser(event, db))
  await (await useTallySession(event)).clear()
  return { ok: true }
})
