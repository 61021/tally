<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import UTooltip from '@nuxt/ui/components/Tooltip.vue'

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
    <UTooltip :kbds="['meta', 'Z']">
      <button type="button" class="tool" :disabled="!canUndo" aria-keyshortcuts="Control+Z" @click="emit('undo')">
        <UIcon name="i-ph-arrow-counter-clockwise" /> Undo
      </button>
    </UTooltip>
    <UTooltip :kbds="['meta', 'shift', 'Z']">
      <button type="button" class="tool" :disabled="!canRedo" aria-keyshortcuts="Control+Shift+Z" @click="emit('redo')">
        <UIcon name="i-ph-arrow-clockwise" /> Redo
      </button>
    </UTooltip>
    <UTooltip :kbds="['backspace']">
      <button type="button" class="tool" aria-keyshortcuts="Backspace" @click="emit('erase')">
        <UIcon name="i-ph-eraser" /> Erase
      </button>
    </UTooltip>
    <UTooltip :kbds="['N']">
      <button type="button" class="tool" :class="{ on: notesMode }" :aria-pressed="notesMode" aria-keyshortcuts="N" @click="emit('notes')">
        <UIcon :name="notesMode ? 'i-ph-pencil-simple-fill' : 'i-ph-pencil-simple'" /> Notes
      </button>
    </UTooltip>
    <UTooltip v-if="showCheck" :kbds="['C']">
      <button type="button" class="tool" aria-keyshortcuts="C" @click="emit('check')">
        <UIcon name="i-ph-check-circle" /> Check
      </button>
    </UTooltip>
    <UTooltip :kbds="['H']">
      <button type="button" class="tool" aria-keyshortcuts="H" @click="emit('hint')">
        <UIcon name="i-ph-lightbulb" /> Hint
      </button>
    </UTooltip>
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

@media (hover: hover) and (pointer: fine) {
  .tool:not(:disabled):hover {
    background: var(--peer);
    color: var(--ink);
  }
}

@media (min-width: 1024px) {
  .tool {
    padding: 10px 0;
    font-size: 15px;
  }
}
</style>
