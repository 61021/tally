import { defineApiHandler } from '../../utils/handler'
import { useTallySession } from '../../utils/session'

export default defineApiHandler(async (event) => {
  await (await useTallySession(event)).clear()
  return { ok: true }
})
