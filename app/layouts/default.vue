<script setup lang="ts">
import AppTopBar from '../components/AppTopBar.vue'
</script>

<template>
  <div class="min-h-dvh">
    <AppTopBar class="hidden lg:block" />
    <div class="mx-auto w-full max-w-6xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:px-8 lg:pt-10 lg:pb-10">
      <slot />
    </div>
  </div>
</template>
