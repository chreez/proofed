<script setup lang="ts">
import { computed } from 'vue'
import type { Stage, RecipeState, RecipeConfig } from '@/types/recipe'
import GatherSection from '@/components/GatherSection.vue'
import StateStep from '@/components/StateStep.vue'

interface StepNoteData {
  note: string
  date: string
}

const props = defineProps<{
  stage: Stage
  states: RecipeState[]
  config: RecipeConfig
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
  stepNotes?: Record<string, StepNoteData>
}>()

const isCollapsed = computed(() => props.progress.isStageCollapsed(props.stage.id))

function toggle() {
  // Don't collapse if user is selecting text
  const selection = window.getSelection()
  if (selection && selection.toString().length > 0) return
  props.progress.toggleStageCollapse(props.stage.id)
}

const stateCount = computed(() => {
  const done = props.states.filter(s => props.progress.isStateChecked(s.id)).length
  return { done, total: props.states.length }
})
</script>

<template>
  <div class="card">
    <div
      :id="`stage-header-${stage.id}`"
      @click="toggle"
      class="w-full flex items-center justify-between scroll-mt-16 cursor-pointer select-text"
      role="button"
    >
      <h3 class="card-title">{{ stage.title }}</h3>
      <div class="flex items-center gap-3">
        <span v-if="states.length" class="text-muted text-sm">
          {{ stateCount.done }}/{{ stateCount.total }}
        </span>
        <span
          class="text-stone-400 transition-transform duration-200"
          :class="{ 'rotate-180': !isCollapsed }"
        >▼</span>
      </div>
    </div>

    <div
      class="grid transition-[grid-template-rows] duration-300 ease-out"
      :class="isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'"
    >
      <div class="overflow-hidden">
        <div class="mt-4 space-y-4">
        <GatherSection
          v-if="stage.gather"
          :gather="stage.gather"
          :stage-id="stage.id"
          :stage-title="stage.title"
          :progress="progress"
        />

        <div v-if="states.length" class="space-y-3">
          <StateStep
            v-for="state in states"
            :key="state.id"
            :state="state"
            :stage-id="stage.id"
            :config="config"
            :progress="progress"
            :step-note="stepNotes?.[state.id]"
          />
        </div>
        </div>
      </div>
    </div>
  </div>
</template>
