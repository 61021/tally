<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

defineProps<{
  notesMode: boolean
  canUndo: boolean
  canRedo: boolean
  showCheck: boolean
}>()

const emit = defineEmits<{ undo: [], redo: [], erase: [], notes: [], check: [], hint: [] }>()
</script>

<template>
  <div class="tools">
    <button type="button" class="tool" :disabled="!canUndo" aria-keyshortcuts="Control+Z" @click="emit('undo')">
      <UIcon name="i-ph-arrow-counter-clockwise" /> Undo
    </button>
    <button type="button" class="tool" :disabled="!canRedo" aria-keyshortcuts="Control+Shift+Z" @click="emit('redo')">
      <UIcon name="i-ph-arrow-clockwise" /> Redo
    </button>
    <button type="button" class="tool" aria-keyshortcuts="Backspace" @click="emit('erase')">
      <UIcon name="i-ph-eraser" /> Erase
    </button>
    <button type="button" class="tool" :class="{ on: notesMode }" :aria-pressed="notesMode" aria-keyshortcuts="N" @click="emit('notes')">
      <UIcon :name="notesMode ? 'i-ph-pencil-simple-fill' : 'i-ph-pencil-simple'" /> Notes
    </button>
    <button v-if="showCheck" type="button" class="tool" aria-keyshortcuts="C" @click="emit('check')">
      <UIcon name="i-ph-check-circle" /> Check
    </button>
    <button type="button" class="tool" aria-keyshortcuts="H" @click="emit('hint')">
      <UIcon name="i-ph-lightbulb" /> Hint
    </button>
  </div>
</template>

<style scoped>
.tools {
  display: grid;
  grid-auto-columns: 1fr;
  grid-auto-flow: column;
}

.tool {
  display: grid;
  justify-items: center;
  gap: 3px;
  padding: 6px 0;
  border-radius: 8px;
  font-size: 14px;
  color: var(--muted);
}

.tool :deep(svg),
.tool > span:first-child {
  width: 23px;
  height: 23px;
  color: var(--ink);
}

.tool.on,
.tool.on :deep(svg),
.tool.on > span:first-child {
  color: var(--user);
}

.tool:disabled {
  opacity: 0.35;
}

.tool:not(:disabled):active {
  transform: scale(0.96);
}

.tool:focus-visible {
  outline: 2px solid var(--user);
}
</style>
