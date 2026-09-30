import type { Ref } from 'vue'
import type { PublicUser, SessionUser } from '#shared/account/types'
import { useRequestFetch, useState } from '#imports'

export interface UseAccount {
  user: Ref<SessionUser | null>
  refresh: () => Promise<void>
  setUser: (user: PublicUser | SessionUser | null) => void
  signOut: () => Promise<void>
}

export function useAccount(): UseAccount {
  const user = useState<SessionUser | null>('account-user', () => null)
  const requestFetch = useRequestFetch()
  return {
    user,
    async refresh() {
      user.value = (await requestFetch<{ user: SessionUser | null }>('/api/me')).user
    },
    setUser(next) {
      user.value = next ? { id: next.id, username: next.username } : null
    },
    async signOut() {
      await $fetch('/api/auth/signout', { method: 'POST' })
      user.value = null
    },
  }
}
