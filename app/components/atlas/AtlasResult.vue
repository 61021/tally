<script setup lang="ts">
import type { AtlasRound } from '#shared/atlas/types'
import { computed } from 'vue'
import { MAX_POINTS } from '#shared/atlas/constants'
import { COUNTRY_BY_ID } from '#shared/atlas/countries'
import { formatKm, formatPoints } from '../../utils/atlas-format'

const props = defineProps<{
  round: AtlasRound
  best: number | null
  newBest: boolean
}>()

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
  <section class="result">
    <p class="summary">
      {{ summary }}
    </p>
    <ol class="list">
      <li v-for="row in rows" :key="row.name">
        <span class="name">{{ row.name }}</span>
        <span class="km">{{ row.km === 0 ? 'inside' : formatKm(row.km) }}</span>
        <span class="points" :class="{ full: row.points === MAX_POINTS }">{{ formatPoints(row.points) }}</span>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.result {
  padding: 14px 18px 12px;
}

.summary {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--muted);
}

.list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 15px;
}

.list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 3.25rem;
  gap: 12px;
  align-items: baseline;
  padding: 4px 0;
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

.points.full {
  color: var(--user);
}
</style>
