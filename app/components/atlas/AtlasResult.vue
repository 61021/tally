<script setup lang="ts">
import type { AtlasRound } from '#shared/atlas/types'
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'
import { MAX_POINTS } from '#shared/atlas/constants'
import { COUNTRY_BY_ID } from '#shared/atlas/countries'
import { formatKm, formatPoints } from '../../utils/atlas-format'
import AtlasScore from './AtlasScore.vue'

const props = defineProps<{
  round: AtlasRound
  score: number
  best: number | null
  newBest: boolean
}>()

const emit = defineEmits<{ again: [] }>()

const rows = computed(() => props.round.pins.map((pin, i) => ({
  name: COUNTRY_BY_ID.get(props.round.targets[i]!)?.name ?? '',
  km: pin.km,
  points: pin.points,
})))

const summary = computed(() => {
  const spotOn = props.round.pins.filter(p => p.points === MAX_POINTS).length
  const line = `${spotOn} of ${props.round.pins.length} spot on`
  return !props.newBest && props.best !== null ? `${line} · best ${formatPoints(props.best)}` : line
})
</script>

<template>
  <section class="result" aria-live="polite">
    <h2 class="title">
      {{ newBest ? 'A new best.' : 'Round over.' }}
    </h2>
    <p class="score">
      <AtlasScore :value="score" />
    </p>
    <p class="summary">
      {{ summary }}
    </p>
    <ol class="list">
      <li v-for="row in rows" :key="row.name">
        <span class="name">{{ row.name }}</span>
        <span class="km">{{ row.km === 0 ? 'inside' : formatKm(row.km) }}</span>
        <span class="points">{{ formatPoints(row.points) }}</span>
      </li>
    </ol>
    <div class="actions">
      <UButton size="xl" block class="font-sans text-[17px]" @click="emit('again')">
        Play again
      </UButton>
      <UButton to="/" size="xl" block variant="outline" color="neutral" class="font-sans text-[17px]">
        Back to Tally
      </UButton>
    </div>
  </section>
</template>

<style scoped>
.result {
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

.score {
  margin: 8px 0 10px;
  font-family: var(--font-mono);
  font-size: 48px;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--user);
}

.summary {
  margin: 0 0 14px;
  font-size: 15px;
  color: var(--muted);
}

.list {
  display: grid;
  margin: 0 0 20px;
  padding: 0;
  list-style: none;
  font-size: 14px;
}

.list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 3.25rem;
  gap: 12px;
  align-items: baseline;
  padding: 3px 0;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.km,
.points {
  font-family: var(--font-mono);
  font-size: 13px;
  text-align: right;
}

.km {
  color: var(--muted);
}

.actions {
  display: grid;
  gap: 10px;
}
</style>
