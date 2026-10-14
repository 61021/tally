<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import UKbd from '@nuxt/ui/components/Kbd.vue'
import UModal from '@nuxt/ui/components/Modal.vue'

const open = defineModel<boolean>('open', { required: true })

const ROWS = [
  { label: 'Move the marker', keys: ['arrowleft', 'arrowup', 'arrowright', 'arrowdown'] },
  { label: 'Move it further', keys: ['shift', 'arrowright'] },
  { label: 'Drop the pin', keys: ['enter'] },
  { label: 'Next country', keys: ['enter'] },
  { label: 'Show this list', keys: ['?'] },
]
</script>

<template>
  <UModal v-model:open="open" title="Keyboard shortcuts" :ui="{ content: 'max-w-md' }">
    <button type="button" class="trigger mt-5 items-center gap-2 rounded-lg py-1.5 text-[14px] text-muted">
      <UIcon name="i-ph-keyboard" class="size-4.5" />
      Keyboard shortcuts
      <UKbd value="?" />
    </button>

    <template #body>
      <p class="mb-4 font-serif text-[15px] text-muted">
        Tab to the map first, then aim with the arrows.
      </p>
      <dl class="grid gap-2.5">
        <div v-for="row in ROWS" :key="row.label" class="flex items-center justify-between gap-4 text-[15px]">
          <dt>{{ row.label }}</dt>
          <dd class="flex gap-1">
            <UKbd v-for="key in row.keys" :key="key" :value="key" />
          </dd>
        </div>
      </dl>
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
