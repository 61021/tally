<script setup lang="ts">
import type { Difficulty } from '#shared/sudoku/types'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { onMounted, ref } from 'vue'
import { NuxtLink } from '#components'
import { useHead } from '#imports'
import { DIFFICULTIES } from '#shared/sudoku/constants'
import TallyWordmark from '../components/TallyWordmark.vue'
import { useAccount } from '../composables/useAccount'
import { DIFFICULTY_NAMES } from '../constants/sudoku'
import { loadProgress, solvedNumbers, unfinished } from '../utils/progress'
import { formatTime } from '../utils/time'

useHead({ title: 'Tally' })

const { user } = useAccount()

interface LevelState {
  playing: string | null
  solved: number
}

// Progress lives in this browser, so the server renders the list plain and it fills in on arrival.
const levels = ref<Partial<Record<Difficulty, LevelState>>>({})

onMounted(() => {
  levels.value = Object.fromEntries(DIFFICULTIES.map((d) => {
    const open = unfinished(d)
    const progress = open ? loadProgress(d, open) : null
    return [d, { playing: progress ? formatTime(progress.elapsedMs) : null, solved: solvedNumbers(d).size }]
  }))
})
</script>

<template>
  <main class="flex min-h-[calc(100dvh-2.5rem)] flex-col">
    <header class="mb-7 flex h-9 items-center justify-between">
      <TallyWordmark />
      <div class="flex items-center gap-1">
        <NuxtLink to="/settings" class="grid size-10 place-items-center" aria-label="Settings">
          <UIcon name="i-ph-gear-six" class="size-5.5" />
        </NuxtLink>
        <NuxtLink v-if="user" to="/account" class="grid size-9 place-items-center rounded-full border border-default bg-surface text-[15px]" :aria-label="`Account: ${user.username}`">
          {{ user.username[0]!.toUpperCase() }}
        </NuxtLink>
        <NuxtLink v-else to="/signin" class="px-2 text-[16px] underline underline-offset-3">
          Sign in
        </NuxtLink>
      </div>
    </header>

    <h1 class="mb-5 text-[32px] leading-tight font-normal tracking-[-0.015em]">
      {{ user ? `What'll it be, ${user.username}?` : 'What\'ll it be?' }}
    </h1>

    <section class="rounded-[10px] border border-default bg-surface p-4.5" aria-labelledby="sudoku-title">
      <div class="mb-2 flex items-baseline justify-between">
        <h2 id="sudoku-title" class="text-[22px] font-semibold">
          Sudoku
        </h2>
        <UIcon name="i-ph-grid-nine" class="size-5.5 text-muted" />
      </div>
      <ul class="grid">
        <li v-for="d in DIFFICULTIES" :key="d">
          <NuxtLink :to="`/sudoku/${d}`" class="grid h-12 grid-cols-[1fr_auto_22px] items-center gap-2.5 text-[17px]">
            <span :class="{ 'font-semibold': levels[d]?.playing }">{{ DIFFICULTY_NAMES[d] }}</span>
            <span v-if="levels[d]?.playing" class="font-mono text-sm">{{ levels[d]!.playing }}</span>
            <span v-else-if="levels[d]?.solved" class="text-sm text-muted">{{ levels[d]!.solved }} solved</span>
            <span v-else class="text-sm text-muted">New</span>
            <UIcon :name="levels[d]?.playing ? 'i-ph-play-circle' : 'i-ph-caret-right'" class="size-4.5 justify-self-end text-user" />
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="!user" class="mt-4 rounded-[10px] border border-default bg-surface p-4.5">
      <p class="text-[16px] leading-snug">
        <b class="font-medium">Make yourself at home.</b>{{ ' ' }}
        <span class="text-muted">Pick a username and Tally will know you next time.</span>
      </p>
      <UButton to="/signin" size="lg" block variant="outline" color="neutral" class="mt-3 font-sans text-[16px]">
        Make an account
      </UButton>
    </section>

    <div class="mt-6 grid grid-cols-[40px_1fr] items-center gap-3 px-0.5 opacity-75">
      <span class="grid size-10 place-items-center rounded-lg border border-default bg-surface">
        <UIcon name="i-ph-hourglass-simple" class="size-5" />
      </span>
      <p class="leading-tight">
        <b class="block text-lg font-medium">More games soon</b>
        <span class="text-sm text-muted">The next one is being built.</span>
      </p>
    </div>

    <footer class="mt-auto grid gap-1.5 px-0.5 pt-10 text-sm text-muted">
      <p>Built for a café table.</p>
      <p>Crafted by <a href="https://vitex.dev" class="text-default underline underline-offset-3">Vitex</a></p>
    </footer>
  </main>
</template>
