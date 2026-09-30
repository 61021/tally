<script setup lang="ts">
import UApp from '@nuxt/ui/components/App.vue'
import { useHead } from '#imports'
import { useAppearance } from './composables/useAppearance'

const { appearance, colorSet } = useAppearance()

useHead(() => {
  const { mode } = appearance.value
  const { themeColor } = colorSet()
  return {
    htmlAttrs: { 'lang': 'en', 'data-colors': appearance.value.colors, 'data-mode': mode },
    meta: mode === 'system'
      ? [
          { name: 'theme-color', content: themeColor.light, media: '(prefers-color-scheme: light)' },
          { name: 'theme-color', content: themeColor.dark, media: '(prefers-color-scheme: dark)' },
        ]
      : [{ name: 'theme-color', content: themeColor[mode] }],
  }
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
