<script setup lang="ts">
import type { Region } from '#shared/atlas/types'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { NuxtLink } from '#components'
import { definePageMeta, useHead, useNuxtApp, useRoute } from '#imports'
import { MAX_POINTS, REGION_NAMES, REGIONS } from '#shared/atlas/constants'
import AtlasMap from '../../components/atlas/AtlasMap.vue'
import AtlasResult from '../../components/atlas/AtlasResult.vue'
import AtlasScore from '../../components/atlas/AtlasScore.vue'
import AtlasShortcuts from '../../components/atlas/AtlasShortcuts.vue'
import { useAtlasGame } from '../../composables/useAtlasGame'
import { formatKm, formatPoints } from '../../utils/atlas-format'
import { loadAtlasMap } from '../../utils/atlas-maps'

definePageMeta({
  layout: 'play',
  key: route => route.fullPath,
  validate: route => REGIONS.includes(route.params.region as Region),
  // From inside the app the map loads before the page changes, so it arrives whole; a failed load shows on the page.
  middleware: async (to) => {
    if (import.meta.client && !useNuxtApp().isHydrating)
      await loadAtlasMap(to.params.region as Region).catch(() => {})
  },
})

const region = useRoute().params.region as Region
const name = REGION_NAMES[region]

useHead({ title: `${name} Atlas · Tally` })

const { status, map, round, phase, country, result, score, best, newBest, pin, next, playAgain, retry } = useAtlasGame(region)

const shortcutsOpen = ref(false)

const position = computed(() => {
  const r = round.value
  if (!r)
    return ''
  if (phase.value === 'done')
    return `${r.targets.length} countries`
  return `Country ${Math.min(r.targets.length, r.pins.length + (phase.value === 'aim' ? 1 : 0))} of ${r.targets.length}`
})

const mapLabel = computed(() => country.value && phase.value === 'aim'
  ? `Map of ${name}. Click where ${country.value.name} is, or move the marker with the arrow keys and press Enter.`
  : `Map of ${name}.`)

const aspect = computed(() => (map.value ? map.value.width / map.value.height : 2))

function onKey(event: KeyboardEvent): void {
  if (status.value !== 'ready' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
    return
  if (event.key === '?') {
    event.preventDefault()
    shortcutsOpen.value = !shortcutsOpen.value
    return
  }
  if (shortcutsOpen.value || (event.target as HTMLElement | null)?.closest('button, a, input'))
    return
  if (phase.value === 'reveal' && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    next()
  }
}

onMounted(() => addEventListener('keydown', onKey))
onUnmounted(() => removeEventListener('keydown', onKey))
</script>

<template>
  <main class="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-md flex-col md:max-w-xl lg:min-h-0 lg:max-w-none">
    <header class="mb-4 grid grid-cols-[40px_1fr_auto_40px] items-center lg:hidden">
      <NuxtLink to="/" class="grid size-10 place-items-center" aria-label="Back to Tally">
        <UIcon name="i-ph-caret-left" class="size-5.5" />
      </NuxtLink>
      <h1 class="text-lg leading-tight font-medium">
        {{ name }}
        <span class="block font-sans text-[13px] font-normal">{{ position }}</span>
      </h1>
      <AtlasScore class="mr-1 text-[15px]" :value="score" />
      <NuxtLink to="/settings" class="grid size-10 place-items-center" aria-label="Settings">
        <UIcon name="i-ph-gear-six" class="size-5.5" />
      </NuxtLink>
    </header>

    <div class="play lg:flex lg:items-start lg:justify-center lg:gap-12" :style="{ '--aspect': aspect }">
      <div class="map-col w-full">
        <div v-if="status === 'ready' && map && round" class="frame cel overflow-hidden rounded-[10px] border border-default bg-surface">
          <AtlasMap :map="map" :round="round" :phase="phase" :label="mapLabel" @pin="pin" />
        </div>
        <div v-else-if="status === 'loading'" class="frame cel w-full animate-pulse rounded-[10px] border border-default bg-surface" aria-label="Loading the map" />
      </div>

      <aside class="cel mt-3 w-full rounded-[10px] border border-default bg-surface p-4 lg:mt-0 lg:w-[392px] lg:shrink-0 lg:px-6.5 lg:pt-6.5 lg:pb-5.5">
        <div class="mb-2 hidden items-end justify-between lg:flex">
          <h1 class="text-[34px] leading-none font-normal tracking-[-0.015em]">
            {{ name }}
            <span class="mt-2 block font-sans text-[15px] tracking-normal text-muted">{{ position }}</span>
          </h1>
          <AtlasScore v-if="phase !== 'done'" class="text-[28px] leading-none font-light" :value="score" />
        </div>

        <template v-if="status === 'ready' && round">
          <AtlasResult v-if="phase === 'done'" :round="round" :score="score" :best="best" :new-best="newBest" @again="playAgain" />
          <template v-else>
            <section class="ask" aria-live="polite">
              <p class="font-serif text-[17px] text-muted">
                Where is
              </p>
              <p class="name">
                {{ country?.name }}
              </p>
            </section>

            <div class="outcome" aria-live="polite">
              <template v-if="result">
                <p class="flex items-baseline justify-between gap-3">
                  <span class="text-[17px]">{{ result.km === 0 ? 'Spot on' : `${formatKm(result.km)} away` }}</span>
                  <span class="font-mono text-[17px]" :class="result.points === MAX_POINTS ? 'text-user' : 'text-muted'">+{{ formatPoints(result.points) }}</span>
                </p>
                <UButton size="xl" block class="mt-4 font-sans text-[17px]" aria-keyshortcuts="Enter" @click="next">
                  {{ round.pins.length === round.targets.length ? 'See the score' : 'Next country' }}
                </UButton>
              </template>
            </div>
            <AtlasShortcuts v-model:open="shortcutsOpen" />
          </template>
        </template>

        <section v-else-if="status === 'error'" class="grid gap-4 pt-8 lg:pt-4">
          <p class="font-serif text-[17px]">
            The map didn't load. Check your connection and try again.
          </p>
          <UButton size="xl" block class="font-sans text-[17px]" @click="retry">
            Try again
          </UButton>
          <UButton to="/" size="xl" block variant="outline" color="neutral" class="font-sans text-[17px]">
            Back to Tally
          </UButton>
        </section>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.frame {
  aspect-ratio: var(--aspect);
}

.frame:has(:focus-visible) {
  outline: 2px solid var(--user);
  outline-offset: 2px;
}

.ask {
  padding-top: 18px;
}

.name {
  margin-top: 2px;
  font-family: var(--font-serif);
  font-size: 34px;
  line-height: 1.15;
  letter-spacing: -0.015em;
  text-wrap: balance;
}

.outcome {
  min-height: 108px;
  padding-top: 18px;
}

/* Beside the rail the map takes the full height, or the width the 64px rail and 392px panel leave (568px with padding and gap). */
@media (min-width: 1024px) {
  .map-col {
    width: clamp(420px, min((100dvh - 4rem) * var(--aspect), 100vw - 568px), 1600px);
    flex: none;
  }
}
</style>
