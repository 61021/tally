<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

defineProps<{ text: string | null }>()
</script>

<template>
  <p class="hint" aria-live="polite">
    <template v-if="text">
      <UIcon name="i-ph-lightbulb" class="icon" />
      <span>{{ text }}</span>
    </template>
  </p>
</template>

<style scoped>
.hint {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 52px;
  margin: 0;
  padding: 12px 2px 0;
  font-size: 16px;
  line-height: 1.35;
  color: var(--muted);
}

.icon {
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  color: var(--user);
}
</style>
