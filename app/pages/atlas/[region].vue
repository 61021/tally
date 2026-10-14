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
import { ASPECTS } from '../../constants/atlas'
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

const aspect = computed(() => (map.value ? map.value.width / map.value.height : ASPECTS[region]))

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
  <main class="atlas-play">
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

    <div class="board cel" :style="{ '--aspect': aspect }">
      <div class="strip">
        <h1 class="where hidden lg:block">
          {{ name }}
          <span>{{ position }}</span>
        </h1>

        <div class="ask" aria-live="polite">
          <template v-if="status === 'ready' && round">
            <template v-if="phase === 'done'">
              <p class="title">
                {{ newBest ? 'A new best.' : 'Round over.' }}
              </p>
            </template>
            <template v-else>
              <p class="lead">
                {{ phase === 'aim' ? 'Where is' : result && result.km === 0 ? 'You found' : `${formatKm(result?.km ?? 0)} from` }}
              </p>
              <p class="name">
                {{ country?.name }}
              </p>
            </template>
          </template>
          <p v-else-if="status === 'error'" class="font-serif text-[17px]">
            The map didn't load. Check your connection and try again.
          </p>
        </div>

        <div class="act">
          <template v-if="status === 'ready' && round">
            <span v-if="result" class="gain" :class="{ full: result.points === MAX_POINTS }">+{{ formatPoints(result.points) }}</span>
            <AtlasScore class="total hidden lg:inline" :value="score" />
            <UButton v-if="phase === 'reveal'" size="lg" class="font-sans text-[16px]" aria-keyshortcuts="Enter" @click="next">
              {{ round.pins.length === round.targets.length ? 'See the score' : 'Next country' }}
            </UButton>
            <UButton v-else-if="phase === 'done'" size="lg" class="font-sans text-[16px]" @click="playAgain">
              Play again
            </UButton>
            <AtlasShortcuts v-else v-model:open="shortcutsOpen" />
          </template>
          <UButton v-else-if="status === 'error'" size="lg" class="font-sans text-[16px]" @click="retry">
            Try again
          </UButton>
        </div>
      </div>

      <div class="map">
        <AtlasMap v-if="status === 'ready' && map && round" :map="map" :round="round" :phase="phase" :label="mapLabel" @pin="pin" />
        <div v-else-if="status === 'loading'" class="size-full animate-pulse bg-[var(--peer)]" aria-label="Loading the map" />
      </div>
      <AtlasResult v-if="status === 'ready' && round && phase === 'done'" class="result" :round="round" :best="best" :new-best="newBest" />
    </div>
  </main>
</template>

<style scoped>
.atlas-play {
  display: flex;
  flex-direction: column;
  min-height: calc(100dvh - 2.5rem);
}

@media (min-width: 1024px) {
  .atlas-play {
    min-height: 0;
  }
}

.board {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--ui-border);
  border-radius: 10px;
}

.strip {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  order: 2;
  min-height: 72px;
  padding: 14px 16px;
  border-top: 1px solid var(--line);
}

.where {
  font-size: 22px;
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: -0.01em;
}

.where span {
  display: block;
  margin-top: 4px;
  font-family: var(--font-sans);
  font-size: 13px;
  letter-spacing: 0;
  color: var(--muted);
}

.ask {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
  min-width: 0;
}

.lead {
  font-family: var(--font-serif);
  font-size: 17px;
  color: var(--muted);
}

.name,
.title {
  font-family: var(--font-serif);
  font-size: 26px;
  line-height: 1.15;
  letter-spacing: -0.015em;
}

.title {
  font-style: italic;
}

.act {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}

.gain {
  font-family: var(--font-mono);
  font-size: 17px;
  color: var(--muted);
}

.gain.full {
  color: var(--user);
}

.map {
  position: relative;
  order: 1;
  aspect-ratio: var(--aspect);
}

.map:has(:focus-visible) {
  outline: 2px solid var(--user);
  outline-offset: -2px;
}

.result {
  order: 3;
  border-top: 1px solid var(--line);
}

/* On a laptop the map is the whole window: the question floats over its top and the rail over its left edge. */
@media (min-width: 1024px) {
  .board {
    position: fixed;
    inset: 0;
    z-index: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .map {
    flex: 1;
    min-height: 0;
    aspect-ratio: auto;
  }

  .map:has(:focus-visible) {
    outline-offset: -4px;
  }

  .strip {
    position: absolute;
    z-index: 2;
    top: 16px;
    left: 50%;
    width: min(940px, calc(100vw - 176px));
    grid-template-columns: minmax(140px, 1fr) auto minmax(140px, 1fr);
    gap: 24px;
    min-height: 72px;
    padding: 12px 14px 12px 22px;
    translate: -50% 0;
    background: var(--surface);
    border: 1px solid var(--ui-border);
    border-radius: 12px;
    box-shadow: var(--cel-shadow);
  }

  .ask {
    justify-content: center;
    text-align: center;
  }

  .name,
  .title {
    font-size: 30px;
  }

  .total {
    font-size: 26px;
    font-weight: 300;
    line-height: 1;
  }

  /* The round's results lie over the map's right side, so every pin stays in view beside them. */
  .result {
    position: absolute;
    z-index: 2;
    top: 104px;
    right: 24px;
    max-height: calc(100% - 128px);
    width: 320px;
    overflow-y: auto;
    border: 1px solid var(--ui-border);
    border-radius: 12px;
    box-shadow: var(--cel-shadow);
  }
}
</style>
