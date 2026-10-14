<script setup lang="ts">
import { computed } from 'vue'
import { formatPoints } from '../../utils/atlas-format'

const props = defineProps<{ value: number }>()

const parts = computed(() => formatPoints(props.value).split(/(,)/))
</script>

<template>
  <span class="figure">
    <span class="sr-only">{{ formatPoints(value) }}</span>
    <span v-for="(part, i) in parts" :key="i" :class="{ comma: part === ',' }" aria-hidden="true">{{ part }}</span>
  </span>
</template>

<style scoped>
.figure {
  font-family: var(--font-mono);
}

/* A monospaced comma takes a whole digit's width; pull its neighbours in so the number reads as one. */
.comma {
  margin-inline: -0.22em;
}
</style>
