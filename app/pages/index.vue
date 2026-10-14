<script setup lang="ts">
import type { Region } from '#shared/atlas/types'
import type { Difficulty } from '#shared/sudoku/types'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { NuxtLink } from '#components'
import { useHead } from '#imports'
import { REGION_NAMES, REGIONS } from '#shared/atlas/constants'
import { COUNTRIES } from '#shared/atlas/countries'
import { isFinished } from '#shared/atlas/round'
import { DIFFICULTIES } from '#shared/sudoku/constants'
import GlobePreview from '../components/atlas/GlobePreview.vue'
import BoardPreview from '../components/sudoku/BoardPreview.vue'
import TallyWordmark from '../components/TallyWordmark.vue'
import WordWall from '../components/WordWall.vue'
import { useAccount } from '../composables/useAccount'
import { SLOW_OPEN_MS } from '../constants/hub'
import { DIFFICULTY_NAMES } from '../constants/sudoku'
import { formatPoints } from '../utils/atlas-format'
import { bestScore, loadRound } from '../utils/atlas-progress'
import { loadProgress, solvedNumbers, unfinished } from '../utils/progress'
import { formatTime } from '../utils/time'

useHead({ title: 'Tally' })

/** A real medium puzzle, drawn small on the Sudoku card. */
const PREVIEW = '530070000600195000098000060800060003400803001700020006060000280000419005000080079'

/** Every country Atlas asks about, lit up wherever the mouse passes. */
const WALL = COUNTRIES.map(c => c.name)

/** The heading, the top bar's links and the footer keep clear of the wall. */
const CLEAR = ['main h1', 'header nav a', 'main footer p']

const { user } = useAccount()

interface LevelState {
  playing: string | null
  solved: number
}

interface RegionState {
  /** "4 of 10" while a round is open. */
  playing: string | null
  best: number | null
}

// Progress lives in this browser, so the server renders the lists plain and they fill in on arrival.
const levels = ref<Partial<Record<Difficulty, LevelState>>>({})
const regions = ref<Partial<Record<Region, RegionState>>>({})

onMounted(() => {
  levels.value = Object.fromEntries(DIFFICULTIES.map((d) => {
    const open = unfinished(d)
    const progress = open ? loadProgress(d, open) : null
    return [d, { playing: progress ? formatTime(progress.elapsedMs) : null, solved: solvedNumbers(d).size }]
  }))
  regions.value = Object.fromEntries(REGIONS.map((r) => {
    const round = loadRound(r)
    const open = round && round.pins.length > 0 && !isFinished(round)
    return [r, { playing: open ? `${round.pins.length + 1} of ${round.targets.length}` : null, best: bestScore(r) }]
  }))
})

// A game loads before the page changes; if that takes a moment, its row says so.
const opening = ref<string | null>(null)
let slowOpen: ReturnType<typeof setTimeout> | undefined

function open(event: MouseEvent, key: string): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return
  clearTimeout(slowOpen)
  opening.value = null
  slowOpen = setTimeout(() => {
    opening.value = key
  }, SLOW_OPEN_MS)
}

onBeforeUnmount(() => clearTimeout(slowOpen))
</script>

<template>
  <main class="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-md flex-col md:max-w-xl lg:min-h-[calc(100dvh-9rem)] lg:max-w-5xl">
    <WordWall :words="WALL" :clear="CLEAR" />

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

    <div class="mb-5 lg:mt-4 lg:mb-10 lg:flex lg:items-end lg:justify-between lg:gap-8">
      <h1 class="text-[32px] leading-tight font-normal tracking-[-0.015em] lg:text-[52px] lg:tracking-[-0.02em]">
        {{ user ? `What'll it be, ${user.username}?` : 'What\'ll it be?' }}
      </h1>
      <section v-if="!user" class="cel hidden items-center gap-5 rounded-[10px] border border-default bg-surface py-3 pr-3 pl-5 lg:flex">
        <p class="font-serif text-[16px] leading-snug">
          <b class="block font-medium">Make yourself at home.</b>
          <span class="text-muted">Pick a username and Tally will know you next time.</span>
        </p>
        <UButton to="/signin" size="lg" variant="outline" color="neutral" class="shrink-0 font-sans text-[16px]">
          Make an account
        </UButton>
      </section>
    </div>

    <div class="grid gap-4 lg:grid-cols-2 lg:gap-8">
      <section class="game cel" aria-labelledby="sudoku-title">
        <div>
          <div class="mb-2 flex items-baseline justify-between lg:mb-3">
            <h2 id="sudoku-title" class="text-[22px] font-semibold lg:text-[28px]">
              Sudoku
            </h2>
            <UIcon name="i-ph-grid-nine" class="size-5.5 text-muted lg:hidden" />
          </div>
          <p class="mb-2 hidden font-serif text-[16px] text-muted lg:block">
            Four levels, 2,500 puzzles each. Hints explain themselves.
          </p>
          <ul class="grid">
            <li v-for="d in DIFFICULTIES" :key="d">
              <NuxtLink :to="`/sudoku/${d}`" class="row" :aria-busy="opening === d || undefined" @click="open($event, d)">
                <span :class="{ 'font-semibold': levels[d]?.playing }">{{ DIFFICULTY_NAMES[d] }}</span>
                <span v-if="levels[d]?.playing" class="font-mono text-sm">{{ levels[d]!.playing }}</span>
                <span v-else-if="levels[d]?.solved" class="text-sm text-muted">{{ levels[d]!.solved }} solved</span>
                <span v-else class="text-sm text-muted">New</span>
                <UIcon :name="opening === d ? 'i-ph-spinner-gap' : levels[d]?.playing ? 'i-ph-play-circle' : 'i-ph-caret-right'" class="size-4.5 justify-self-end text-user" :class="{ 'animate-spin': opening === d }" />
              </NuxtLink>
            </li>
          </ul>
        </div>
        <!-- The preview's scoped display: grid would beat a hidden class on its own root. -->
        <div class="hidden self-center lg:block">
          <BoardPreview :puzzle="PREVIEW" />
        </div>
      </section>

      <section class="game cel" aria-labelledby="atlas-title">
        <div>
          <div class="mb-2 flex items-baseline justify-between lg:mb-3">
            <h2 id="atlas-title" class="text-[22px] font-semibold lg:text-[28px]">
              Atlas
            </h2>
            <UIcon name="i-ph-globe-hemisphere-east" class="size-5.5 text-muted lg:hidden" />
          </div>
          <p class="mb-2 hidden font-serif text-[16px] text-muted lg:block">
            Ten countries a round. Pin each on a blank map.
          </p>
          <ul class="grid">
            <li v-for="r in REGIONS" :key="r">
              <NuxtLink :to="`/atlas/${r}`" class="row" :aria-busy="opening === r || undefined" @click="open($event, r)">
                <span :class="{ 'font-semibold': regions[r]?.playing }">{{ REGION_NAMES[r] }}</span>
                <span v-if="regions[r]?.playing" class="font-mono text-sm">{{ regions[r]!.playing }}</span>
                <span v-else-if="regions[r]?.best !== null && regions[r]?.best !== undefined" class="text-sm text-muted">Best {{ formatPoints(regions[r]!.best!) }}</span>
                <span v-else class="text-sm text-muted">New</span>
                <UIcon :name="opening === r ? 'i-ph-spinner-gap' : regions[r]?.playing ? 'i-ph-play-circle' : 'i-ph-caret-right'" class="size-4.5 justify-self-end text-user" :class="{ 'animate-spin': opening === r }" />
              </NuxtLink>
            </li>
          </ul>
        </div>
        <div class="hidden self-center lg:block">
          <GlobePreview />
        </div>
      </section>

      <section v-if="!user" class="cel rounded-[10px] border border-default bg-surface p-4.5 lg:hidden">
        <p class="font-serif text-[16px] leading-snug">
          <b class="font-medium">Make yourself at home.</b>{{ ' ' }}
          <span class="text-muted">Pick a username and Tally will know you next time.</span>
        </p>
        <UButton to="/signin" size="lg" block variant="outline" color="neutral" class="mt-3 font-sans text-[16px]">
          Make an account
        </UButton>
      </section>
    </div>

    <footer class="mt-auto grid gap-1.5 px-0.5 pt-10 font-serif text-sm lg:flex lg:justify-between">
      <p data-batch="041640964002">
        Built for a café table.
      </p>
      <p>Crafted by <a href="https://vitex.dev" class="text-default underline underline-offset-3">Vitex</a></p>
    </footer>
  </main>
</template>

<style scoped>
.game {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: var(--surface);
  padding: 18px;
}

.row {
  display: grid;
  grid-template-columns: 1fr auto 22px;
  align-items: center;
  gap: 10px;
  height: 48px;
  border-radius: 8px;
  font-size: 17px;
}

@media (min-width: 1024px) {
  .game {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 150px;
    align-items: start;
    gap: 24px;
    padding: 24px 26px;
  }

  .row {
    height: 46px;
    margin-inline: -12px;
    padding-inline: 12px;
    font-size: 18px;
  }
}

@media (hover: hover) and (pointer: fine) {
  .row:hover {
    background: var(--peer);
  }
}
</style>
