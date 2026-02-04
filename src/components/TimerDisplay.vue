<script setup lang="ts">
import { useTimer } from '@/composables/useTimer'

const props = defineProps<{
  durationMin: number
  earlyCheckPercent: number
}>()

const {
  remainingFormatted,
  progressPercent,
  status,
  isEarlyCheck,
  start,
  pause,
  reset
} = useTimer(props.durationMin, props.earlyCheckPercent)
</script>

<template>
  <div class="bg-stone-100 p-4">
    <div class="flex items-center justify-between mb-3">
      <span
        class="text-3xl font-mono tabular-nums"
        :class="{
          'text-stone-700': status === 'idle' || status === 'paused',
          'text-ink': status === 'running' && !isEarlyCheck,
          'text-warning animate-pulse': isEarlyCheck,
          'text-success': status === 'completed'
        }"
      >
        {{ remainingFormatted }}
      </span>

      <div class="flex gap-2">
        <button
          v-if="status === 'idle' || status === 'paused'"
          @click="start"
          class="btn-primary text-sm"
        >
          {{ status === 'idle' ? 'Start' : 'Resume' }}
        </button>
        <button
          v-if="status === 'running'"
          @click="pause"
          class="btn-secondary text-sm"
        >
          Pause
        </button>
        <button
          v-if="status !== 'idle'"
          @click="reset"
          class="btn-secondary text-sm"
        >
          Reset
        </button>
      </div>
    </div>

    <div class="h-2 bg-stone-200 overflow-hidden">
      <div
        class="h-full transition-all duration-1000"
        :class="{
          'bg-ink': !isEarlyCheck && status !== 'completed',
          'bg-warning': isEarlyCheck,
          'bg-success': status === 'completed'
        }"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>

    <p v-if="isEarlyCheck" class="text-warning text-sm mt-2 font-medium">
      Check progress soon!
    </p>
    <p v-if="status === 'completed'" class="text-success text-sm mt-2 font-medium">
      Timer complete!
    </p>
  </div>
</template>
