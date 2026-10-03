<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { NuxtLink } from '#components'
import { useAccount } from '../composables/useAccount'
import TallyWordmark from './TallyWordmark.vue'

const { user } = useAccount()
</script>

<template>
  <header>
    <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-8" aria-label="Main">
      <NuxtLink to="/" aria-label="Tally, home" class="rounded-md">
        <TallyWordmark />
      </NuxtLink>
      <div class="flex items-center gap-2 text-[16px]">
        <NuxtLink to="/settings" class="link flex h-10 items-center gap-2 rounded-lg px-3">
          <UIcon name="i-ph-gear-six" class="size-5" />
          Settings
        </NuxtLink>
        <NuxtLink v-if="user" to="/account" class="link flex h-10 items-center gap-2.5 rounded-lg px-3">
          <span class="grid size-7 place-items-center rounded-full border border-default bg-surface text-[13px]">{{ user.username[0]!.toUpperCase() }}</span>
          {{ user.username }}
        </NuxtLink>
        <NuxtLink v-else to="/signin" class="link flex h-10 items-center rounded-lg border border-default px-4">
          Sign in
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<style scoped>
@media (hover: hover) and (pointer: fine) {
  .link:hover {
    background: var(--peer);
  }
}

.link.router-link-active {
  color: var(--user);
  background: var(--surface);
}
</style>
