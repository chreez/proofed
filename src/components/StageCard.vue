<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { RotateCcw, Link2, Check } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { Stage, RecipeState, RecipeConfig } from '@/types/recipe'
import type { useScratchpad } from '@/composables/useScratchpad'
import GatherSection from '@/components/GatherSection.vue'
import StateStep from '@/components/StateStep.vue'
import { scrollToNextItem } from '@/composables/useScrollToNext'
import { copyToClipboard } from '@/composables/useClipboard'

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
  sectionId: string
  scratchpad?: ReturnType<typeof useScratchpad>
}>()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

async function copyPermalink(event: MouseEvent): Promise<void> {
  event.stopPropagation()
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}

const isCollapsed = computed(() => props.progress.isStageCollapsed(props.stage.id))

const hasStageProgress = computed(() => {
  const hasItemProgress = props.stage.gather
    ? [
        ...(props.stage.gather.vessels || []).map(v => `vessel-${v}`),
        ...(props.stage.gather.equipment || []).map(e => `equip-${e}`),
        ...(props.stage.gather.ingredients || []).map(i => `ing-${i.id}`)
      ].some(id => props.progress.isItemChecked(id))
    : false
  const hasStateProgress = props.states.some(s => props.progress.isStateChecked(s.id))
  return hasItemProgress || hasStateProgress
})

function toggle() {
  // Don't collapse if user is selecting text
  const selection = window.getSelection()
  if (selection && selection.toString().length > 0) return
  props.progress.toggleStageCollapse(props.stage.id)
}

function handleReset(event: MouseEvent): void {
  event.stopPropagation()
  props.progress.resetSection(props.stage.id)
}

function handleStateToggled(stateId: string) {
  if (props.progress.isStateChecked(stateId)) {
    const idx = props.states.findIndex(s => s.id === stateId)
    const nextUnchecked = props.states.slice(idx + 1).find(
      s => !props.progress.isStateChecked(s.id)
    )
    if (nextUnchecked) {
      scrollToNextItem(`[data-state-id="${nextUnchecked.id}"]`)
    }
  }
}

const stateCount = computed(() => {
  const done = props.states.filter(s => props.progress.isStateChecked(s.id)).length
  return { done, total: props.states.length }
})

// Active step: first unchecked step in this stage (for reminder banners)
const activeStepId = computed(() => {
  if (isCollapsed.value) return null
  const first = props.states.find(s => !props.progress.isStateChecked(s.id))
  return first?.id ?? null
})

// Ingredient name→{id, total} map for experiment delta display in StateStep
const ingredientNameMap = computed(() => {
  const map: Record<string, { id: string; total: number }> = {}
  if (!props.stage.gather?.ingredients) return map
  for (const ing of props.stage.gather.ingredients) {
    map[ing.name.toLowerCase()] = { id: ing.id, total: ing.total }
  }
  return map
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
      <div class="flex items-center gap-1">
        <h3 class="card-title">{{ stage.title }}</h3>
        <IconButton
          ref="linkBtn"
          tooltip="Copy link"
          size="sm"
          tooltip-align="center"
          class="text-stone-300"
          @click="copyPermalink"
        >
          <Link2 />
          <template #feedback>
            <Check />
          </template>
        </IconButton>
      </div>
      <div class="flex items-center gap-3">
        <IconButton
          v-if="hasStageProgress"
          tooltip="Reset Section"
          size="sm"
          @click="handleReset"
        >
          <RotateCcw />
        </IconButton>
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
            :scratchpad="scratchpad"
            :is-active-step="state.id === activeStepId"
            :ingredient-name-map="ingredientNameMap"
            @toggled="handleStateToggled"
          />
        </div>
        </div>
      </div>
    </div>
  </div>
</template>
