<script setup lang="ts">
import { computed } from 'vue'
import { useAppearance } from '../composables/useAppearance'
import { SCENE_WIDTHS } from '../constants/appearance'

const { appearance, scene } = useAppearance()

const srcset = computed(() => SCENE_WIDTHS.map(w => `/scenes/${appearance.value.scene}-${w}.avif ${w}w`).join(', '))
</script>

<template>
  <div v-if="appearance.mode !== 'oled'" class="scene" aria-hidden="true">
    <picture :key="appearance.scene">
      <source type="image/avif" :srcset="srcset" sizes="100vw">
      <img :src="`/scenes/${appearance.scene}-1920.jpg`" alt="" fetchpriority="high" :style="{ objectPosition: scene().focus }">
    </picture>
    <span class="night" />
    <span class="veil" />
  </div>
</template>

<style scoped>
/* Large viewport height, so a phone's collapsing toolbar never re-crops the painting. */
.scene {
  position: fixed;
  inset: 0 0 auto;
  z-index: -1;
  height: 100lvh;
  pointer-events: none;
  isolation: isolate;
}

img,
.night,
.veil {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

img {
  object-fit: cover;
}

/* Day for night: a deep blue multiply, the way films shot night scenes in daylight. */
.night {
  background: rgb(8 16 38 / var(--scene-night));
  mix-blend-mode: multiply;
  opacity: 0;
}

:global(:root[data-mode='dark']) .night {
  opacity: 1;
}

@media (prefers-color-scheme: dark) {
  :global(:root[data-mode='system']) .night {
    opacity: 1;
  }
}

/* Calm bands under the headings and the footer, the only text set on the painting itself. */
.veil {
  background: linear-gradient(
    180deg,
    color-mix(in oklab, var(--bg) 80%, transparent) 0,
    color-mix(in oklab, var(--bg) 58%, transparent) 22%,
    transparent 46%,
    transparent 70%,
    color-mix(in oklab, var(--bg) 82%, transparent) 92%,
    color-mix(in oklab, var(--bg) 88%, transparent) 100%
  );
}
</style>
