<script setup lang="ts">
import type { Difficulty } from '#shared/sudoku/types'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { NuxtLink } from '#components'
import { useHead } from '#imports'
import { DIFFICULTIES } from '#shared/sudoku/constants'
import BoardPreview from '../components/sudoku/BoardPreview.vue'
import TallyWordmark from '../components/TallyWordmark.vue'
import { useAccount } from '../composables/useAccount'
import { DIFFICULTY_NAMES, SLOW_OPEN_MS } from '../constants/sudoku'
import { loadProgress, solvedNumbers, unfinished } from '../utils/progress'
import { formatTime } from '../utils/time'

useHead({ title: 'Tally' })

/** A real medium puzzle, drawn small on the Sudoku card. */
const PREVIEW = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

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

// A level's puzzles load before the page changes; if that takes a moment, its row says so.
const opening = ref<Difficulty | null>(null)
let slowOpen: ReturnType<typeof setTimeout> | undefined

function openLevel(event: MouseEvent, difficulty: Difficulty): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return
  clearTimeout(slowOpen)
  opening.value = null
  slowOpen = setTimeout(() => {
    opening.value = difficulty
  }, SLOW_OPEN_MS)
}

onBeforeUnmount(() => clearTimeout(slowOpen))
</script>

<template>
  <main class="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-md flex-col md:max-w-xl lg:min-h-[calc(100dvh-9rem)] lg:max-w-5xl">
    <header class="mb-7 flex h-9 items-center justify-between lg:hidden">
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

    <h1 class="mb-5 text-[32px] leading-tight font-normal tracking-[-0.015em] lg:mt-4 lg:mb-10 lg:text-[52px] lg:tracking-[-0.02em]">
      {{ user ? `What'll it be, ${user.username}?` : 'What\'ll it be?' }}
    </h1>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <section class="cel rounded-[10px] border border-default bg-surface p-4.5 lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8 lg:p-7" aria-labelledby="sudoku-title">
        <div>
          <div class="mb-2 flex items-baseline justify-between lg:mb-4">
            <h2 id="sudoku-title" class="text-[22px] font-semibold lg:text-[28px]">
              Sudoku
            </h2>
            <UIcon name="i-ph-grid-nine" class="size-5.5 text-muted lg:hidden" />
          </div>
          <p class="mb-3 hidden font-serif text-[16px] text-muted lg:block">
            Four levels, 2,500 puzzles each. Hints explain themselves.
          </p>
          <ul class="grid">
            <li v-for="d in DIFFICULTIES" :key="d">
              <NuxtLink :to="`/sudoku/${d}`" class="level grid h-12 grid-cols-[1fr_auto_22px] items-center gap-2.5 rounded-lg text-[17px] lg:-mx-3 lg:h-13 lg:px-3 lg:text-[19px]" :aria-busy="opening === d || undefined" @click="openLevel($event, d)">
                <span :class="{ 'font-semibold': levels[d]?.playing }">{{ DIFFICULTY_NAMES[d] }}</span>
                <span v-if="levels[d]?.playing" class="font-mono text-sm">{{ levels[d]!.playing }}</span>
                <span v-else-if="levels[d]?.solved" class="text-sm text-muted">{{ levels[d]!.solved }} solved</span>
                <span v-else class="text-sm text-muted">New</span>
                <UIcon :name="opening === d ? 'i-ph-spinner-gap' : levels[d]?.playing ? 'i-ph-play-circle' : 'i-ph-caret-right'" class="size-4.5 justify-self-end text-user" :class="{ 'animate-spin': opening === d }" />
              </NuxtLink>
            </li>
          </ul>
        </div>
        <BoardPreview class="hidden self-center lg:grid" :puzzle="PREVIEW" />
      </section>

      <div class="grid content-start gap-4">
        <section v-if="!user" class="cel rounded-[10px] border border-default bg-surface p-4.5 lg:p-6">
          <p class="font-serif text-[16px] leading-snug lg:text-[17px]">
            <b class="font-medium">Make yourself at home.</b>{{ ' ' }}
            <span class="text-muted">Pick a username and Tally will know you next time.</span>
          </p>
          <UButton to="/signin" size="lg" block variant="outline" color="neutral" class="mt-3 font-sans text-[16px] lg:mt-4">
            Make an account
          </UButton>
        </section>
        <NuxtLink v-else to="/account" class="level cel hidden items-center gap-3 rounded-[10px] border border-default bg-surface p-5 lg:flex">
          <span class="grid size-11 place-items-center rounded-full border border-default bg-page text-[18px]">{{ user.username[0]!.toUpperCase() }}</span>
          <span class="leading-tight">
            <b class="block text-[18px] font-medium">{{ user.username }}</b>
            <span class="text-[15px] text-muted">Your account</span>
          </span>
        </NuxtLink>

        <div class="grid grid-cols-[40px_1fr] items-center gap-3 rounded-[10px] border border-dashed border-default bg-surface p-4 lg:p-5">
          <span class="grid size-10 place-items-center rounded-lg border border-default bg-page text-muted">
            <UIcon name="i-ph-hourglass-simple" class="size-5" />
          </span>
          <p class="font-serif leading-tight">
            <b class="block text-lg font-medium">More games soon</b>
            <span class="text-sm text-muted">The next one is being built.</span>
          </p>
        </div>
      </div>
    </div>

    <footer class="mt-auto grid gap-1.5 px-0.5 pt-10 font-serif text-sm lg:flex lg:justify-between">
      <p>Built for a café table.</p>
      <p>Crafted by <a href="https://vitex.dev" class="text-default underline underline-offset-3">Vitex</a></p>
    </footer>
  </main>
</template>

<style scoped>
@media (hover: hover) and (pointer: fine) {
  .level:hover {
    background: var(--peer);
  }
}
</style>
