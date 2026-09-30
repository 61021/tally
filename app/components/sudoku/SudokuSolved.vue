<script setup lang="ts">
import type { Difficulty } from '#shared/sudoku/types'
import UButton from '@nuxt/ui/components/Button.vue'
import { DIFFICULTY_NAMES } from '../../constants/sudoku'
import { formatTime } from '../../utils/time'

defineProps<{
  difficulty: Difficulty
  elapsedMs: number
  checks: number
  hints: number
}>()
</script>

<template>
  <section class="solved" aria-live="polite">
    <h2 class="title">
      Solved.
    </h2>
    <p class="time">
      {{ formatTime(elapsedMs) }}
    </p>
    <dl class="stats">
      <div><dt>Mistake checks</dt><dd>{{ checks }}</dd></div>
      <div><dt>Hints</dt><dd>{{ hints }}</dd></div>
    </dl>
    <div class="actions">
      <UButton :to="`/sudoku/${difficulty}`" size="xl" block class="font-sans text-[17px]">
        Next {{ DIFFICULTY_NAMES[difficulty].toLowerCase() }} puzzle
      </UButton>
      <UButton to="/" size="xl" block variant="outline" color="neutral" class="font-sans text-[17px]">
        Back to Tally
      </UButton>
    </div>
  </section>
</template>

<style scoped>
.solved {
  padding-top: 18px;
}

.title {
  margin: 0;
  font-size: 40px;
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.time {
  margin: 8px 0 20px;
  font-family: var(--font-mono);
  font-size: 48px;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--user);
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  margin: 0 0 20px;
  overflow: hidden;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.stats div {
  padding: 12px 16px;
  background: var(--surface);
}

.stats dt {
  font-size: 14px;
  color: var(--muted);
}

.stats dd {
  margin: 4px 0 0;
  font-family: var(--font-mono);
  font-size: 18px;
}

.actions {
  display: grid;
  gap: 10px;
}
</style>
