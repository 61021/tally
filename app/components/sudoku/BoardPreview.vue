<script setup lang="ts">
import { BOXES } from '#shared/sudoku/constants'

defineProps<{ puzzle: string }>()
</script>

<template>
  <div class="preview" aria-hidden="true" data-ink="lines">
    <div v-for="box in BOXES" :key="box.index" class="box" data-ink="lines">
      <span v-for="cell in box.cells" :key="cell" data-ink="cell">{{ puzzle[cell] !== '0' ? puzzle[cell] : '' }}</span>
    </div>
  </div>
</template>

<style scoped>
.preview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--box-line);
  border: 1px solid var(--box-line);
  border-radius: 8px;
  container-type: inline-size;
}

.box {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--cell-line);
}

span {
  display: grid;
  place-items: center;
  background: var(--bg);
  font-family: var(--font-mono);
  font-size: 5cqw;
  font-weight: 300;
  color: var(--muted);
}
</style>
