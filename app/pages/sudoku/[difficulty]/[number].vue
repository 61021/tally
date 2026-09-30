<script setup lang="ts">
import type { Difficulty } from '#shared/sudoku/types'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { NuxtLink } from '#components'
import { definePageMeta, useHead, useRoute } from '#imports'
import { boxOf, DIFFICULTIES } from '#shared/sudoku/constants'
import { isGiven, remainingDigits, wrongCells } from '#shared/sudoku/game'
import { findConflicts } from '#shared/sudoku/grid'
import GameTools from '../../../components/sudoku/GameTools.vue'
import HintBar from '../../../components/sudoku/HintBar.vue'
import KeyboardShortcuts from '../../../components/sudoku/KeyboardShortcuts.vue'
import NumberPad from '../../../components/sudoku/NumberPad.vue'
import SudokuBoard from '../../../components/sudoku/SudokuBoard.vue'
import SudokuSolved from '../../../components/sudoku/SudokuSolved.vue'
import { useGameSettings } from '../../../composables/useGameSettings'
import { useSudokuGame } from '../../../composables/useSudokuGame'
import { BANK_SIZE, DIFFICULTY_NAMES } from '../../../constants/sudoku'
import { formatTime } from '../../../utils/time'

definePageMeta({
  key: route => route.fullPath,
  validate: (route) => {
    const n = Number(route.params.number)
    return DIFFICULTIES.includes(route.params.difficulty as Difficulty) && Number.isInteger(n) && n >= 1 && n <= BANK_SIZE
  },
})

const route = useRoute()
const difficulty = route.params.difficulty as Difficulty
const number = Number(route.params.number)
const name = DIFFICULTY_NAMES[difficulty]

useHead({ title: `${name} Sudoku ${number} · Tally` })

const { settings } = useGameSettings()
const { status, game, elapsedMs, hint, place, note, erase, undo, redo, check, askHint, retry } = useSudokuGame(difficulty, number)

const selected = ref<number | null>(null)
const notesMode = ref(false)

const sameDigit = computed(() => {
  if (!settings.value.highlightSame || selected.value === null || !game.value)
    return 0
  return game.value.values[selected.value] ?? 0
})

const errors = computed<Set<number>>(() => {
  const g = game.value
  if (!g || settings.value.mistakes === 'off')
    return new Set()
  const cells = new Set(g.flagged)
  if (settings.value.mistakes === 'instant')
    wrongCells(g).forEach(c => cells.add(c))
  for (const c of findConflicts(Uint8Array.from(g.values))) {
    if (!isGiven(g, c))
      cells.add(c)
  }
  return cells
})

const highlight = computed<Set<number>>(() => {
  const h = hint.value
  if (!h)
    return new Set()
  if (h.level === 1)
    return new Set(Array.from({ length: 81 }, (_, i) => i).filter(i => boxOf(i) === h.box))
  return new Set(h.cells)
})

const remaining = computed(() => (game.value ? remainingDigits(game.value) : []))

function select(cell: number): void {
  selected.value = cell
}

function input(digit: number, asNote = notesMode.value): void {
  if (selected.value === null)
    return
  if (asNote)
    note(selected.value, digit)
  else
    place(selected.value, digit)
}

function eraseSelected(): void {
  if (selected.value !== null)
    erase(selected.value)
}

function hintAndFollow(): void {
  askHint()
  if (hint.value?.target != null)
    selected.value = hint.value.target
}

const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }

function onKey(event: KeyboardEvent): void {
  if (status.value !== 'ready' || event.altKey || (event.target as HTMLElement | null)?.closest('input, textarea, select'))
    return
  const mod = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()
  if (mod && key === 'z') {
    event.preventDefault()
    return event.shiftKey ? redo() : undo()
  }
  if (mod && key === 'y') {
    event.preventDefault()
    return redo()
  }
  if (mod)
    return
  const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)
  if (digit) {
    event.preventDefault()
    return input(Number(digit[1]), notesMode.value !== event.shiftKey)
  }
  const arrow = ARROWS[event.key]
  if (arrow) {
    event.preventDefault()
    const cell = selected.value ?? 40
    const r = (Math.floor(cell / 9) + arrow[0] + 9) % 9
    const c = ((cell % 9) + arrow[1] + 9) % 9
    selected.value = selected.value === null ? 40 : r * 9 + c
    return
  }
  if (['backspace', 'delete', '0'].includes(key))
    return eraseSelected()
  if (key === 'n')
    notesMode.value = !notesMode.value
  else if (key === 'h')
    hintAndFollow()
  else if (key === 'c' && settings.value.mistakes === 'request')
    check()
}

onMounted(() => addEventListener('keydown', onKey))
onUnmounted(() => removeEventListener('keydown', onKey))
</script>

<template>
  <main class="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-md flex-col md:max-w-xl lg:min-h-0 lg:max-w-none">
    <header class="mb-4 grid grid-cols-[40px_1fr_auto_40px] items-center lg:hidden">
      <NuxtLink to="/" class="grid size-10 place-items-center" aria-label="Back to Tally">
        <UIcon name="i-ph-caret-left" class="size-5.5" />
      </NuxtLink>
      <h1 class="text-lg leading-tight font-medium">
        {{ name }}
        <span class="block text-[13px] font-normal text-muted">Puzzle {{ number }}</span>
      </h1>
      <span v-if="settings.showTimer" class="mr-1 font-mono text-[15px] text-muted" aria-label="Time">{{ formatTime(elapsedMs) }}</span>
      <span v-else />
      <NuxtLink to="/settings" class="grid size-10 place-items-center" aria-label="Settings">
        <UIcon name="i-ph-gear-six" class="size-5.5" />
      </NuxtLink>
    </header>

    <div class="play lg:flex lg:items-start lg:justify-center lg:gap-12">
      <div class="board-col w-full">
        <SudokuBoard
          v-if="status === 'ready' && game"
          :values="game.values"
          :puzzle="game.puzzle"
          :notes="game.notes"
          :selected="selected"
          :same-digit="sameDigit"
          :errors="errors"
          :highlight="highlight"
          :target="hint && hint.level > 1 ? hint.target : null"
          :solved="game.completed"
          @select="select"
        />
        <div v-else-if="status === 'loading'" class="aspect-square w-full animate-pulse rounded-[10px] border border-default bg-surface" aria-label="Loading the puzzle" />
      </div>

      <aside class="w-full lg:w-[340px] lg:shrink-0">
        <div class="mb-2 hidden items-end justify-between lg:flex">
          <h1 class="text-[34px] leading-none font-normal tracking-[-0.015em]">
            {{ name }}
            <span class="mt-2 block text-[15px] tracking-normal text-muted">Puzzle {{ number }}</span>
          </h1>
          <span v-if="settings.showTimer && !game?.completed" class="font-mono text-[28px] leading-none font-light" aria-label="Time">{{ formatTime(elapsedMs) }}</span>
        </div>

        <template v-if="status === 'ready' && game">
          <SudokuSolved v-if="game.completed" :difficulty="difficulty" :elapsed-ms="elapsedMs" :checks="game.checks" :hints="game.hints" />
          <template v-else>
            <HintBar :text="hint?.text ?? null" />
            <GameTools
              class="mt-1 mb-3.5"
              :notes-mode="notesMode"
              :can-undo="game.past.length > 0"
              :can-redo="game.future.length > 0"
              :show-check="settings.mistakes === 'request'"
              @undo="undo"
              @redo="redo"
              @erase="eraseSelected"
              @notes="notesMode = !notesMode"
              @check="check"
              @hint="hintAndFollow"
            />
            <NumberPad :remaining="remaining" :notes-mode="notesMode" :disabled="selected === null" @digit="input" />
            <KeyboardShortcuts class="mt-6 hidden lg:block" :show-check="settings.mistakes === 'request'" />
          </template>
        </template>

        <section v-else-if="status !== 'loading'" class="grid gap-4 pt-8 lg:pt-4">
          <p class="text-[17px]">
            {{ status === 'missing' ? `There's no ${name.toLowerCase()} puzzle ${number}.` : 'The puzzle didn\'t load. Check your connection and try again.' }}
          </p>
          <UButton v-if="status === 'error'" size="xl" block class="font-sans text-[17px]" @click="retry">
            Try again
          </UButton>
          <UButton to="/" size="xl" block variant="outline" color="neutral" class="font-sans text-[17px]">
            Back to Tally
          </UButton>
        </section>
      </aside>
    </div>
  </main>
</template>

<style scoped>
/* On a laptop the board fills the height left under the top bar, up to 760px. */
@media (min-width: 1024px) {
  .board-col {
    width: clamp(420px, calc(100dvh - 9rem), 760px);
    flex: none;
  }
}
</style>
