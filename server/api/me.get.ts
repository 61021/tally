import { defineApiHandler } from '../utils/handler'
import { useTallySession } from '../utils/session'

/** Who the cookie says is signed in, without a database read; account pages load the full row. */
export default defineApiHandler(async (event) => {
  const session = await useTallySession(event)
  return { user: session.data.user ?? null }
})
