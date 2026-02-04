<script setup lang="ts">
import { computed } from 'vue'
import type { Stage, RecipeState, RecipeConfig } from '@/types/recipe'
import GatherSection from '@/components/GatherSection.vue'
import StateStep from '@/components/StateStep.vue'

const props = defineProps<{
  stage: Stage
  states: RecipeState[]
  config: RecipeConfig
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
}>()

const isCollapsed = computed(() => props.progress.isStageCollapsed(props.stage.id))

function toggle() {
  props.progress.toggleStageCollapse(props.stage.id)
}

const stateCount = computed(() => {
  const done = props.states.filter(s => props.progress.isStateChecked(s.id)).length
  return { done, total: props.states.length }
})
</script>

<template>
  <div class="card">
    <button
      @click="toggle"
      class="w-full flex items-center justify-between text-left"
    >
      <h3 class="text-lg text-heading">{{ stage.title }}</h3>
      <div class="flex items-center gap-3">
        <span v-if="states.length" class="text-muted text-sm">
          {{ stateCount.done }}/{{ stateCount.total }}
        </span>
        <span
          class="text-stone-400 transition-transform duration-200"
          :class="{ 'rotate-180': !isCollapsed }"
        >▼</span>
      </div>
    </button>

    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-screen"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 max-h-screen"
      leave-to-class="opacity-0 max-h-0"
    >
      <div v-show="!isCollapsed" class="mt-4 space-y-4 overflow-hidden">
        <GatherSection
          v-if="stage.gather"
          :gather="stage.gather"
          :stage-id="stage.id"
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
          />
        </div>
      </div>
    </Transition>
  </div>
</template>
