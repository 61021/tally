import { defineNuxtPlugin } from '#imports'
import { useAccount } from '../composables/useAccount'

// The server reads the session once per page load; the client inherits it with the rest of the state.
export default defineNuxtPlugin(async () => {
  if (import.meta.server)
    await useAccount().refresh().catch(() => {})
})
