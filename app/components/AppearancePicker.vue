<script setup lang="ts">
import type { ResolvedMode } from '../types/appearance'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'
import { useAppearance } from '../composables/useAppearance'
import { COLOR_SETS, MODES } from '../constants/appearance'

const { appearance, setColors, setMode } = useAppearance()

// System mode can't be resolved on the server, so it renders both swatch pairs and CSS shows the right one.
const swatchModes = computed<ResolvedMode[]>(() => appearance.value.mode === 'system' ? ['light', 'dark'] : [appearance.value.mode as ResolvedMode])
</script>

<template>
  <div class="grid gap-5">
    <section>
      <h3 class="mx-1 mb-2 text-sm text-muted">
        Colors
      </h3>
      <div role="radiogroup" aria-label="Colors" class="divide-y divide-default overflow-hidden rounded-[10px] border border-default bg-surface">
        <button
          v-for="set in COLOR_SETS"
          :key="set.id"
          type="button"
          role="radio"
          :aria-checked="appearance.colors === set.id"
          class="grid min-h-12.5 w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-3.5 text-left text-[17px]"
          @click="setColors(set.id)"
        >
          <span>
            <span
              v-for="m in swatchModes"
              :key="m"
              class="flex"
              :class="swatchModes.length > 1 && (m === 'light' ? '[@media(prefers-color-scheme:dark)]:hidden' : 'hidden [@media(prefers-color-scheme:dark)]:flex')"
            >
              <span class="size-4.5 rounded-full border border-default" :style="{ background: set.themeColor[m] }" />
              <span class="-ml-1.5 size-4.5 rounded-full border border-default" :style="{ background: set.accent[m] }" />
            </span>
          </span>
          <span>{{ set.name }}</span>
          <UIcon name="i-ph-check" class="size-4.5 text-user" :class="appearance.colors === set.id ? 'opacity-100' : 'opacity-0'" />
        </button>
      </div>
    </section>

    <section>
      <h3 class="mx-1 mb-2 text-sm text-muted">
        Mode
      </h3>
      <div role="radiogroup" aria-label="Mode" class="grid grid-cols-4 gap-0.5 rounded-[10px] border border-default bg-surface p-0.75">
        <button
          v-for="mode in MODES"
          :key="mode.id"
          type="button"
          role="radio"
          :aria-checked="appearance.mode === mode.id"
          class="h-9.5 rounded-[7px] text-base text-muted aria-checked:bg-page aria-checked:text-default aria-checked:ring aria-checked:ring-default"
          @click="setMode(mode.id)"
        >
          {{ mode.name }}
        </button>
      </div>
    </section>
  </div>
</template>
