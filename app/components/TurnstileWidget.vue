<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import { useAppearance } from '../composables/useAppearance'

const model = defineModel<string | null>({ default: null })

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      remove: (id: string) => void
    }
  }
}

const siteKey = useRuntimeConfig().public.turnstileSiteKey
const { appearance } = useAppearance()
const theme = computed(() => ({ system: 'auto', light: 'light', dark: 'dark', oled: 'dark' })[appearance.value.mode])
const container = ref<HTMLElement | null>(null)
let widgetId: string | null = null

function render(): void {
  if (!container.value || !window.turnstile)
    return
  widgetId = window.turnstile.render(container.value, {
    'sitekey': siteKey,
    'theme': theme.value,
    'size': 'flexible',
    'callback': (token: string) => {
      model.value = token
    },
    'expired-callback': () => {
      model.value = null
    },
    'timeout-callback': () => {
      model.value = null
    },
    'error-callback': () => {
      model.value = null
    },
  })
}

/** A token is spent by the one check it's sent with, so each send starts a fresh widget; a reset one can come back blank. */
function reset(): void {
  model.value = null
  if (widgetId && window.turnstile)
    window.turnstile.remove(widgetId)
  widgetId = null
  render()
}

defineExpose({ reset })

onMounted(() => {
  if (!siteKey)
    return
  if (window.turnstile)
    return render()
  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  script.async = true
  script.onload = render
  document.head.appendChild(script)
})

onBeforeUnmount(() => {
  if (widgetId && window.turnstile)
    window.turnstile.remove(widgetId)
})
</script>

<template>
  <div v-if="siteKey" ref="container" class="min-h-[65px]" />
</template>
