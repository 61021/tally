<script setup lang="ts">
defineProps<{ showCheck: boolean }>()
</script>

<template>
  <section aria-labelledby="shortcuts-title">
    <h2 id="shortcuts-title" class="mb-2 text-sm text-muted">
      Keyboard
    </h2>
    <ul class="flex flex-wrap gap-x-4 gap-y-2 text-[14px] text-muted">
      <li><kbd>1</kbd>to<kbd>9</kbd> place</li>
      <li><kbd>Shift</kbd>+ number to pencil</li>
      <li><kbd>N</kbd> notes</li>
      <li><kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> move</li>
      <li><kbd>⌫</kbd> erase</li>
      <li><kbd>Ctrl</kbd><kbd>Z</kbd> undo</li>
      <li><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>Z</kbd> redo</li>
      <li><kbd>H</kbd> hint</li>
      <li v-if="showCheck">
        <kbd>C</kbd> check
      </li>
    </ul>
  </section>
</template>

<style scoped>
li {
  white-space: nowrap;
}

kbd {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  margin: 0 1px;
  padding: 0 5px;
  border: 1px solid var(--line);
  border-bottom-width: 2px;
  border-radius: 5px;
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
}
</style>
