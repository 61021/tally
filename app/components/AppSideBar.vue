<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { NuxtLink } from '#components'
import { useAccount } from '../composables/useAccount'
import TallyWordmark from './TallyWordmark.vue'

const { user } = useAccount()
</script>

<template>
  <header class="sticky top-0 h-dvh w-[88px] shrink-0 flex-col items-center border-r border-default bg-page py-6">
    <NuxtLink to="/" aria-label="Tally, home" class="rounded-md">
      <TallyWordmark />
    </NuxtLink>
    <nav class="mt-auto grid gap-1" aria-label="Main">
      <NuxtLink to="/settings" class="item">
        <UIcon name="i-ph-gear-six" class="size-6" />
        Settings
      </NuxtLink>
      <NuxtLink v-if="user" to="/account" class="item" :title="user.username">
        <span class="grid size-6 place-items-center rounded-full border border-default bg-surface text-[12px]">{{ user.username[0]!.toUpperCase() }}</span>
        <span class="max-w-full truncate">{{ user.username }}</span>
      </NuxtLink>
      <NuxtLink v-else to="/signin" class="item">
        <UIcon name="i-ph-sign-in" class="size-6" />
        Sign in
      </NuxtLink>
    </nav>
  </header>
</template>

<style scoped>
.item {
  display: grid;
  justify-items: center;
  gap: 4px;
  width: 72px;
  padding: 10px 4px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--muted);
}

.item :deep(svg),
.item > span:first-child {
  color: var(--ink);
}

.item.router-link-active,
.item.router-link-active :deep(svg) {
  color: var(--user);
}

.item:focus-visible {
  outline: 2px solid var(--user);
}

@media (hover: hover) and (pointer: fine) {
  .item:hover {
    background: var(--peer);
    color: var(--ink);
  }
}
</style>
