<script setup lang="ts">
import AppSideBar from '../components/AppSideBar.vue'
</script>

<template>
  <div class="min-h-dvh lg:flex">
    <AppSideBar class="hidden lg:flex" />
    <div class="mx-auto w-full max-w-6xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-center lg:px-8 lg:py-8 lg:max-w-none">
      <slot />
    </div>
  </div>
</template>
