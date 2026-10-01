<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'
import { NuxtLink } from '#components'
import { useAccount } from '../composables/useAccount'
import TallyWordmark from './TallyWordmark.vue'

const { user } = useAccount()

const TOOLTIP = { side: 'right', sideOffset: 6 } as const
</script>

<template>
  <header class="sticky top-0 h-dvh w-16 shrink-0 flex-col items-center border-r border-default bg-page py-6">
    <NuxtLink to="/" aria-label="Tally, home" class="rounded-md">
      <TallyWordmark :size="19" />
    </NuxtLink>
    <nav class="mt-auto grid gap-1.5" aria-label="Main">
      <UTooltip text="Settings" :content="TOOLTIP">
        <NuxtLink to="/settings" class="item" aria-label="Settings">
          <UIcon name="i-ph-gear-six" class="size-6" />
        </NuxtLink>
      </UTooltip>
      <UTooltip v-if="user" :text="user.username" :content="TOOLTIP">
        <NuxtLink to="/account" class="item" :aria-label="`Account: ${user.username}`">
          <span class="grid size-7 place-items-center rounded-full border border-default bg-surface text-[13px]">{{ user.username[0]!.toUpperCase() }}</span>
        </NuxtLink>
      </UTooltip>
      <UTooltip v-else text="Sign in" :content="TOOLTIP">
        <NuxtLink to="/signin" class="item" aria-label="Sign in">
          <UIcon name="i-ph-sign-in" class="size-6" />
        </NuxtLink>
      </UTooltip>
    </nav>
  </header>
</template>

<style scoped>
.item {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  color: var(--ink);
}

.item.router-link-active {
  color: var(--user);
}

.item:focus-visible {
  outline: 2px solid var(--user);
}

@media (hover: hover) and (pointer: fine) {
  .item:hover {
    background: var(--peer);
  }
}
</style>
