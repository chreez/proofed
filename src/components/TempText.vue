<script setup lang="ts">
import { computed } from 'vue'
import { parseTemperatures } from '@/composables/useTemperature'

const props = defineProps<{
  text: string
}>()

const segments = computed(() => parseTemperatures(props.text))
</script>

<template>
  <span class="temp-text">
    <template v-for="(seg, i) in segments" :key="i">
      <span v-if="seg.type === 'text'">{{ seg.content }}</span>
      <span
        v-else
        class="temp-badge"
        :data-celsius="seg.alt"
      >{{ seg.content }}</span>
    </template>
  </span>
</template>

<style scoped>
.temp-badge {
  position: relative;
  cursor: help;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.temp-badge::after {
  content: attr(data-celsius);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: var(--color-ink);
  color: var(--color-stone-100);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.02em;
  padding: 4px 8px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 50;
}

.temp-badge:hover::after {
  opacity: 1;
}
</style>
