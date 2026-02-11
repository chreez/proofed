<script setup lang="ts">
import { computed } from 'vue'
import { Hourglass, Flame } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  durationMin: number
  passive?: boolean
}>(), {
  passive: false
})

const icon = computed(() => props.passive ? Hourglass : Flame)

const formattedDuration = computed(() => {
  const min = props.durationMin
  if (min >= 60) {
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h} hr ${m} min` : `${h} hr`
  }
  return `${min} min`
})
</script>

<template>
  <span class="inline-flex items-center gap-1 text-xs text-stone-400">
    <component :is="icon" class="w-3 h-3" />
    <span class="font-mono">{{ formattedDuration }}</span>
  </span>
</template>
