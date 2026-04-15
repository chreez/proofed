<script setup lang="ts">
import { computed } from 'vue'
import type { Scaling } from '@/types/recipe'
import { formatMultiplier } from '@/composables/useScaling'

const props = defineProps<{
  scaling?: Scaling
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

// Determine available multiplier options
const availableMultipliers = computed(() => {
  if (!props.scaling) return [1]
  const min = props.scaling.tested_range.min
  const max = props.scaling.tested_range.max
  const options: number[] = []
  const step = min < 1 || min % 1 !== 0 ? 0.5 : 1
  for (let i = min; i <= max + 2; i += step) {
    options.push(Math.round(i * 100) / 100)
  }
  return options
})

// Check if current value is outside tested range
const isUntested = computed(() => {
  if (!props.scaling) return false
  return props.modelValue > props.scaling.tested_range.max
    || props.modelValue < props.scaling.tested_range.min
})

function handleSelect(value: number) {
  emit('update:modelValue', value)
}
</script>

<template>
  <!-- Only render if scaling block exists -->
  <div v-if="scaling" class="flex items-center gap-2">
    <span class="text-xs text-stone-500 uppercase tracking-wide">Scale:</span>
    <div class="flex gap-1">
      <button
        v-for="m in availableMultipliers"
        :key="m"
        class="px-2 py-1 text-xs font-mono transition-colors rounded-none border border-stone-300"
        :class="{
          'bg-ink text-stone-100 border-ink': modelValue === m,
          'bg-stone-50 text-ink hover:bg-stone-100': modelValue !== m
        }"
        @click="handleSelect(m)"
      >
        {{ formatMultiplier(m) }}×
      </button>
    </div>
    <span v-if="isUntested" class="text-xs text-warning ml-1">
      Beyond tested range
    </span>
  </div>
</template>
