<script setup lang="ts">
import type { Difficulty } from '#shared/sudoku/types'
import { onMounted } from 'vue'
import { definePageMeta, navigateTo, useRoute } from '#imports'
import { DIFFICULTIES } from '#shared/sudoku/constants'
import { nextNumber } from '../../../utils/progress'

definePageMeta({
  validate: route => DIFFICULTIES.includes(route.params.difficulty as Difficulty),
})

const difficulty = useRoute().params.difficulty as Difficulty

// Which puzzle comes next lives in this browser, so the choice happens here rather than on the server.
onMounted(() => navigateTo(`/sudoku/${difficulty}/${nextNumber(difficulty)}`, { replace: true }))
</script>

<template>
  <main>
    <div class="mt-14 aspect-square w-full animate-pulse rounded-[10px] border border-default bg-surface" aria-label="Finding a puzzle" />
  </main>
</template>
