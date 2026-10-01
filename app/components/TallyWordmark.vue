<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 27 })
</script>

<template>
  <span class="font-serif leading-none font-normal tracking-[-0.01em] italic" :style="{ fontSize: `${size}px` }">Tally</span>
</template>
