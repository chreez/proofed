<script setup lang="ts">
import { computed } from 'vue'
import type { RecipeState, RecipeConfig } from '@/types/recipe'
import TimerDisplay from '@/components/TimerDisplay.vue'
import StepNote from '@/components/StepNote.vue'

interface StepNoteData {
  note: string
  date: string
}

const props = defineProps<{
  state: RecipeState
  stageId: string
  config: RecipeConfig
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
  stepNote?: StepNoteData
}>()

const emit = defineEmits<{
  toggled: [stateId: string]
}>()

const isChecked = computed(() => props.progress.isStateChecked(props.state.id))

function toggle() {
  props.progress.toggleState(props.state.id, props.stageId)
  emit('toggled', props.state.id)
}
</script>

<template>
  <div
    :data-state-id="state.id"
    class="bg-surface p-4 border-2 border-stone-200 transition-opacity scroll-mt-16"
    :class="{ 'opacity-50': isChecked }"
  >
    <div class="flex items-start gap-3">
      <button
        @click="toggle"
        class="mt-1 w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors"
        :class="isChecked ? 'bg-ink border-ink text-stone-50' : 'border-ink hover:bg-stone-100'"
      >
        <span v-if="isChecked" class="text-xs">✓</span>
      </button>

      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <h4 class="font-medium text-stone-700" :class="{ 'line-through': isChecked }">
            {{ state.title }}
          </h4>
          <span v-if="state.parallel" class="text-xs bg-stone-200 text-stone-600 px-2 py-0.5">
            parallel
          </span>
          <span v-if="state.duration_min && !state.timer" class="text-xs text-stone-400">
            ~{{ state.duration_min }} min
          </span>
        </div>

        <p class="text-body text-sm mb-3">{{ state.direction }}</p>

        <div v-if="state.components?.length" class="flex flex-wrap gap-2 mb-3">
          <span
            v-for="comp in state.components"
            :key="comp.name"
            class="text-xs bg-stone-100 text-stone-700 px-2 py-1"
          >
            {{ comp.name }}: {{ comp.amount }}
          </span>
        </div>

        <TimerDisplay
          v-if="state.timer && state.duration_min"
          :duration-min="state.duration_min"
          :early-check-percent="config.early_check_percent"
        />

        <div v-if="state.notes?.length" class="mt-3 space-y-2">
          <div
            v-for="(note, i) in state.notes"
            :key="i"
            class="text-sm p-2"
            :class="note.critical ? 'bg-accent-tint text-accent border-l-4 border-accent' : 'bg-stone-100 text-stone-600'"
          >
            <span v-if="note.critical" class="font-medium">⚠ </span>
            {{ note.text }}
          </div>
        </div>

        <p class="text-xs text-stone-400 mt-3 italic">
          Done when: {{ state.exit_condition }}
        </p>

        <StepNote
          v-if="stepNote"
          :note="stepNote.note"
          :date="stepNote.date"
        />
      </div>
    </div>
  </div>
</template>
