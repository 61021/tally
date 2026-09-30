<script setup lang="ts">
defineProps<{
  /** Indexed 1-9: how many of each digit are still to place. */
  remaining: readonly number[]
  notesMode: boolean
  disabled: boolean
}>()

const emit = defineEmits<{ digit: [digit: number] }>()

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
</script>

<template>
  <div class="pad" :class="{ notes: notesMode }">
    <button
      v-for="d in DIGITS"
      :key="d"
      type="button"
      class="key"
      :class="{ used: remaining[d]! <= 0 }"
      :disabled="disabled"
      :aria-label="notesMode ? `Note ${d}` : `Place ${d}`"
      @click="emit('digit', d)"
    >
      {{ d }}
      <small aria-hidden="true">{{ remaining[d]! > 0 ? remaining[d] : '' }}</small>
    </button>
  </div>
</template>

<style scoped>
.pad {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
}

.key {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 3px;
  height: 58px;
  min-width: 0;
  background: var(--surface);
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 23px;
  font-weight: 300;
  line-height: 1;
  color: var(--ink);
  transition:
    transform 0.1s ease-out,
    opacity 0.2s;
}

.key small {
  font-size: 10px;
  color: var(--muted);
}

.key:active {
  transform: scale(0.94);
}

.key.used {
  opacity: 0.3;
}

.notes .key {
  color: var(--muted);
}

@media (hover: hover) and (pointer: fine) {
  .key:not(:disabled):hover {
    background: var(--peer);
  }
}

/* On a laptop the pad sits beside the board as a 3 by 3 keypad, like a calculator. */
@media (min-width: 1024px) {
  .pad {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .key {
    height: 62px;
    font-size: 28px;
    border-radius: 10px;
  }

  .key small {
    font-size: 11px;
  }
}

.key:focus-visible {
  outline: 2px solid var(--user);
  outline-offset: 1px;
}
</style>
