<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { BOXES, columnOf, PEER_SETS, rowOf } from '#shared/sudoku/constants'
import { bit } from '#shared/sudoku/grid'

const props = defineProps<{
  values: readonly number[]
  puzzle: string
  notes: readonly number[]
  selected: number | null
  sameDigit: number
  errors: ReadonlySet<number>
  highlight: ReadonlySet<number>
  target: number | null
  solved: boolean
}>()

const emit = defineEmits<{ select: [cell: number] }>()

const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const peers = computed(() => (props.selected === null ? null : PEER_SETS[props.selected]!))

// A puzzle that was already solved on arrival shows the finished board without replaying the moonrise.
const settled = ref(false)
onMounted(() => {
  settled.value = true
})
const staticFinish = ref(props.solved)

// Focus follows the selection, so arrow keys and Tab land on the same cell and the ring is the only indicator.
const board = ref<HTMLElement | null>(null)
watch(() => props.selected, async (cell) => {
  if (cell === null || !board.value?.contains(document.activeElement))
    return
  await nextTick()
  board.value.querySelector<HTMLElement>(`[data-cell="${cell}"]`)?.focus()
})

// A mouse press selects at once; touch waits for the tap so a scroll over the board doesn't move the selection.
function onPress(event: PointerEvent, cell: number): void {
  if (event.pointerType === 'mouse')
    emit('select', cell)
}

function label(cell: number): string {
  const v = props.values[cell]
  const where = `Row ${rowOf(cell) + 1}, column ${columnOf(cell) + 1}`
  if (v)
    return `${where}, ${props.puzzle[cell] !== '0' ? 'given ' : ''}${v}`
  const notes = NOTE_DIGITS.filter(d => props.notes[cell]! & bit(d))
  return notes.length ? `${where}, empty, notes ${notes.join(' ')}` : `${where}, empty`
}
</script>

<template>
  <div class="board-wrap" :class="{ solved, 'no-motion': staticFinish || !settled }">
    <div class="moon" aria-hidden="true" />
    <div ref="board" class="board" role="group" aria-label="Sudoku board">
      <div v-for="box in BOXES" :key="box.index" class="box">
        <button
          v-for="cell in box.cells"
          :key="cell"
          type="button"
          class="cell"
          :class="{
            given: puzzle[cell] !== '0',
            user: puzzle[cell] === '0' && values[cell],
            sel: !solved && cell === selected,
            peer: !solved && peers?.has(cell),
            same: !solved && sameDigit > 0 && values[cell] === sameDigit && cell !== selected,
            err: errors.has(cell),
            lit: highlight.has(cell),
            target: cell === target,
          }"
          :style="{ '--rise': 8 - Math.floor(cell / 9) }"
          :aria-label="label(cell)"
          :aria-pressed="cell === selected"
          :data-cell="cell"
          @pointerdown="onPress($event, cell)"
          @click="emit('select', cell)"
          @focus="emit('select', cell)"
        >
          <span v-if="values[cell]" class="d">{{ values[cell] }}</span>
          <span v-else-if="notes[cell]" class="notes" aria-hidden="true">
            <span v-for="d in NOTE_DIGITS" :key="d">{{ notes[cell]! & bit(d) ? d : '' }}</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-wrap {
  position: relative;
  isolation: isolate;
  container-type: inline-size;
}

.moon {
  position: absolute;
  z-index: -1;
  left: 50%;
  top: 50%;
  width: 76%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0;
  transform: translate(-50%, 45%);
  pointer-events: none;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 1px;
  width: 100%;
  aspect-ratio: 1;
  background: var(--box-line);
  border: 1px solid var(--box-line);
  border-radius: 10px;
  overflow: hidden;
  user-select: none;
}

.box {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--cell-line);
}

.cell {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-mono);
  /* Sized from the board's own width, so digits grow with it on a laptop and stay put on a phone. */
  font-size: clamp(17px, 5cqw, 34px);
  line-height: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 90ms ease-out,
    color 90ms ease-out;
}

.cell:focus-visible {
  outline: none;
}

.d {
  position: relative;
  z-index: 1;
  font-weight: 300;
  transition: color 90ms ease-out;
}

.given .d {
  font-weight: 400;
}

.user .d {
  color: var(--user);
}

.peer {
  background: var(--peer-band);
}

.same {
  background: var(--same-digit);
}

.lit {
  background: var(--soft);
}

@media (hover: hover) and (pointer: fine) {
  .cell:not(.sel, .same):hover {
    background: var(--cell-hover);
  }
}

.sel {
  background: var(--ink);
  color: var(--surface);
}

.sel.err {
  background: var(--error);
}

.err .d {
  color: var(--error);
  text-decoration: underline wavy 1px;
  text-underline-offset: 4px;
}

.sel .d,
.sel .notes {
  color: var(--surface);
}

.target::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 0 2px var(--user);
}

.sel.target::after {
  box-shadow: inset 0 0 0 2px var(--surface);
}

.notes {
  position: absolute;
  inset: 3px;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  font-size: clamp(8px, 1.9cqw, 13px);
  color: var(--muted);
  transition: color 90ms ease-out;
}

.notes span {
  display: grid;
  place-items: center;
}

/* The finish: the board thins out and a moon rises behind it, the digits brightening from the bottom row up. */
.solved .board,
.solved .box {
  background: transparent;
  transition: background-color 1.6s ease-out 0.3s;
}

.solved .cell {
  background: color-mix(in srgb, var(--surface) 40%, transparent);
  transition: background-color 1.6s ease-out 0.3s;
}

.solved .d {
  animation: brighten 0.9s ease-out backwards;
  animation-delay: calc(0.7s + var(--rise) * 90ms);
}

.solved .moon {
  opacity: 0.4;
  transform: translate(-50%, -50%);
  transition:
    transform 2.6s cubic-bezier(0.2, 0.7, 0.2, 1),
    opacity 2.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}

:root[data-mode='light'] .solved .moon {
  opacity: 0.5;
}

@keyframes brighten {
  from {
    opacity: 0.25;
  }
}

.no-motion .moon,
.no-motion .board,
.no-motion .box,
.no-motion .cell {
  transition: none;
}

.no-motion .d {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .board-wrap * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
