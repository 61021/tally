<script setup lang="ts">
import type { AtlasMap } from '#shared/atlas/types'

// Apart from the marks on top, so zooming (which resizes the marks) never re-renders a country.
defineProps<{
  map: AtlasMap
  asked: ReadonlySet<string>
}>()
</script>

<template>
  <g>
    <path class="grid" :d="map.graticule" />
    <path class="land" :d="map.land" />
    <path v-for="c in map.countries" :key="c.id" class="land" :class="{ asked: asked.has(c.id) }" :d="c.d" :data-country="c.id" />
  </g>
</template>

<style scoped>
path {
  vector-effect: non-scaling-stroke;
  stroke-linejoin: round;
}

.grid {
  fill: none;
  stroke: var(--cell-line);
  stroke-width: 1px;
}

.land {
  fill: var(--land);
  stroke: var(--border);
  stroke-width: 0.75px;
  transition: fill 200ms ease-out;
}

.land.asked {
  fill: var(--asked);
}
</style>
