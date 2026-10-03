<script setup lang="ts">
import UApp from '@nuxt/ui/components/App.vue'
import { useHead } from '#imports'
import SceneBackdrop from './components/SceneBackdrop.vue'
import { useAppearance } from './composables/useAppearance'

const { appearance, scene } = useAppearance()

useHead(() => {
  const { mode } = appearance.value
  const { themeColor } = scene()
  return {
    titleTemplate: title => title || 'Tally',
    htmlAttrs: { 'lang': 'en', 'data-scene': appearance.value.scene, 'data-mode': mode },
    meta: [
      { name: 'description', content: 'Fun, brain-nourishing games in one place, starting with Sudoku.' },
      ...(mode === 'system'
        ? [
            { name: 'theme-color', content: themeColor.light, media: '(prefers-color-scheme: light)' },
            { name: 'theme-color', content: themeColor.dark, media: '(prefers-color-scheme: dark)' },
          ]
        : [{ name: 'theme-color', content: themeColor[mode] }]),
    ],
  }
})
</script>

<template>
  <UApp>
    <SceneBackdrop />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
