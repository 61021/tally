<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { useHead } from '#imports'
import AppearancePicker from '../components/AppearancePicker.vue'
import TallyWordmark from '../components/TallyWordmark.vue'

useHead({ title: 'Tally' })
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-6 pb-8">
    <header class="mb-7 flex h-9 items-center">
      <TallyWordmark />
    </header>
    <h1 class="mb-2 text-[32px] leading-tight font-normal tracking-[-0.015em]">
      Evening.
    </h1>
    <p class="mb-7 text-[17px] text-muted">
      Sudoku is on its way. Pick your colors while you wait.
    </p>
    <AppearancePicker />
    <UButton size="xl" block class="mt-8 font-sans text-[17px]" disabled>
      Daily Sudoku
    </UButton>
  </main>
</template>
