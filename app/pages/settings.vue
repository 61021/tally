<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import USwitch from '@nuxt/ui/components/Switch.vue'
import { NuxtLink } from '#components'
import { useHead, useRouter } from '#imports'
import AppearancePicker from '../components/AppearancePicker.vue'
import { useGameSettings } from '../composables/useGameSettings'
import { MISTAKE_MODES } from '../constants/settings'

useHead({ title: 'Settings · Tally' })

const router = useRouter()
const { settings, update } = useGameSettings()

// Settings open from the hub and from a game; back goes wherever you came from.
function back(): void {
  if (window.history.state?.back)
    router.back()
  else
    router.push('/')
}
</script>

<template>
  <main class="mx-auto max-w-md lg:max-w-4xl">
    <header class="mb-5 grid grid-cols-[40px_1fr_40px] items-center lg:mb-8 lg:block">
      <NuxtLink to="/" class="grid size-10 place-items-center lg:hidden" aria-label="Back" @click.prevent="back">
        <UIcon name="i-ph-caret-left" class="size-5.5" />
      </NuxtLink>
      <h1 class="text-center text-xl font-medium lg:text-left lg:text-[34px] lg:font-normal lg:tracking-[-0.015em]">
        Settings
      </h1>
    </header>

    <div class="lg:grid lg:grid-cols-2 lg:items-start lg:gap-12">
      <AppearancePicker />

      <div>
        <section class="mt-5 lg:mt-0">
          <h3 class="mx-1 mb-2 text-sm text-muted">
            Show mistakes
          </h3>
          <div role="radiogroup" aria-label="Show mistakes" class="grid grid-cols-3 gap-0.5 rounded-[10px] border border-default bg-surface p-0.75">
            <button
              v-for="mode in MISTAKE_MODES"
              :key="mode.id"
              type="button"
              role="radio"
              :aria-checked="settings.mistakes === mode.id"
              class="h-9.5 rounded-[7px] text-base text-muted aria-checked:bg-page aria-checked:text-default aria-checked:ring aria-checked:ring-default"
              @click="update({ mistakes: mode.id })"
            >
              {{ mode.name }}
            </button>
          </div>
        </section>

        <section class="mt-5">
          <h3 class="mx-1 mb-2 text-sm text-muted">
            While playing
          </h3>
          <div class="divide-y divide-default overflow-hidden rounded-[10px] border border-default bg-surface">
            <label class="flex min-h-12.5 items-center justify-between gap-3 px-3.5 text-[17px]">
              Highlight the same numbers
              <USwitch :model-value="settings.highlightSame" @update:model-value="update({ highlightSame: $event })" />
            </label>
            <label class="flex min-h-12.5 items-center justify-between gap-3 px-3.5 text-[17px]">
              Show the timer
              <USwitch :model-value="settings.showTimer" @update:model-value="update({ showTimer: $event })" />
            </label>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
