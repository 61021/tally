<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useAppearance } from '../composables/useAppearance'
import { MODES, SCENES } from '../constants/appearance'

const { appearance, setScene, setMode } = useAppearance()

const painters = [...new Set(SCENES.map(s => s.painting.artist))].join(' and ')
</script>

<template>
  <div class="grid gap-5">
    <section>
      <h3 class="mx-1 mb-2 text-sm text-muted">
        Scene
      </h3>
      <div role="radiogroup" aria-label="Scene" class="divide-y divide-default overflow-hidden rounded-[10px] border border-default bg-surface">
        <button
          v-for="scene in SCENES"
          :key="scene.id"
          type="button"
          role="radio"
          :aria-checked="appearance.scene === scene.id"
          class="grid min-h-14 w-full grid-cols-[56px_1fr_auto] items-center gap-3.5 px-3.5 py-2 text-left text-[17px]"
          @click="setScene(scene.id)"
        >
          <img :src="`/scenes/${scene.id}-thumb.avif`" alt="" width="56" height="36" loading="lazy" class="h-9 w-14 rounded-[5px] object-cover ring ring-default" :style="{ objectPosition: scene.focus }">
          <span>{{ scene.name }}</span>
          <UIcon name="i-ph-check" class="size-4.5 text-user" :class="appearance.scene === scene.id ? 'opacity-100' : 'opacity-0'" />
        </button>
      </div>
      <p class="mx-1 mt-2 font-serif text-sm text-muted">
        Paintings by {{ painters }}.
      </p>
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
