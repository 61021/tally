<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import UKbd from '@nuxt/ui/components/Kbd.vue'
import UModal from '@nuxt/ui/components/Modal.vue'
import { computed } from 'vue'

const props = defineProps<{ showCheck: boolean }>()
const open = defineModel<boolean>('open', { required: true })

const groups = computed(() => [
  {
    title: 'Play',
    rows: [
      { label: 'Place a number', keys: ['1-9'] },
      { label: 'Pencil a note', keys: ['shift', '1-9'] },
      { label: 'Switch notes on or off', keys: ['N'] },
      { label: 'Erase', keys: ['backspace'] },
      { label: 'Move', keys: ['arrowleft', 'arrowup', 'arrowright', 'arrowdown'] },
    ],
  },
  {
    title: 'Tools',
    rows: [
      { label: 'Undo', keys: ['meta', 'Z'] },
      { label: 'Redo', keys: ['meta', 'shift', 'Z'] },
      { label: 'Hint', keys: ['H'] },
      ...(props.showCheck ? [{ label: 'Check for mistakes', keys: ['C'] }] : []),
      { label: 'Show this list', keys: ['?'] },
    ],
  },
])
</script>

<template>
  <UModal v-model:open="open" title="Keyboard shortcuts" :ui="{ content: 'max-w-md' }">
    <button type="button" class="trigger mt-5 items-center gap-2 rounded-lg py-1.5 text-[14px] text-muted">
      <UIcon name="i-ph-keyboard" class="size-4.5" />
      Keyboard shortcuts
      <UKbd value="?" />
    </button>

    <template #body>
      <div class="grid gap-6">
        <section v-for="group in groups" :key="group.title">
          <h3 class="mb-2.5 text-sm text-muted">
            {{ group.title }}
          </h3>
          <dl class="grid gap-2.5">
            <div v-for="row in group.rows" :key="row.label" class="flex items-center justify-between gap-4 text-[15px]">
              <dt>{{ row.label }}</dt>
              <dd class="flex gap-1">
                <UKbd v-for="key in row.keys" :key="key" :value="key" />
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.trigger {
  display: none;
}

/* Only offered where there's a real keyboard and room for the side panel. */
@media (min-width: 1024px) and (hover: hover) and (pointer: fine) {
  .trigger {
    display: flex;
  }

  .trigger:hover {
    color: var(--ink);
  }
}

.trigger:focus-visible {
  outline: 2px solid var(--user);
}
</style>
