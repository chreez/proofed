<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { ClipboardList, Check, RotateCcw } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { GatherSection } from '@/types/recipe'
import GatherCategory from '@/components/GatherCategory.vue'

const props = defineProps<{
  gather: GatherSection
  stageId: string
  stageTitle: string
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
}>()

const copyBtn = useTemplateRef<InstanceType<typeof IconButton>>('copyBtn')
const resetBtn = useTemplateRef<InstanceType<typeof IconButton>>('resetBtn')

const vesselItems = computed(() =>
  (props.gather.vessels || []).map(v => ({
    id: `vessel-${v}`,
    label: v
  }))
)

const equipmentItems = computed(() =>
  (props.gather.equipment || []).map(e => ({
    id: `equip-${e}`,
    label: e
  }))
)

const ingredientItems = computed(() =>
  (props.gather.ingredients || []).map(ing => ({
    id: `ing-${ing.id}`,
    label: `${ing.name} — ${ing.total}${ing.unit}`,
    detail: ing.breakdown
      ? ing.breakdown.map(b => `${b.amount}${ing.unit} ${b.label}`).join(', ')
      : undefined
  }))
)

const allItemIds = computed(() => [
  ...vesselItems.value.map(v => v.id),
  ...equipmentItems.value.map(e => e.id),
  ...ingredientItems.value.map(i => i.id)
])

const hasAnyProgress = computed(() =>
  allItemIds.value.some(id => props.progress.isItemChecked(id))
)

function formatGatherForCopy(): string {
  const lines: string[] = []

  lines.push(`Mise en Place - ${props.stageTitle}`)
  lines.push('')

  if (vesselItems.value.length) {
    lines.push('Vessels:')
    for (const v of vesselItems.value) {
      lines.push(`- ${v.label}`)
    }
    lines.push('')
  }

  if (equipmentItems.value.length) {
    lines.push('Equipment:')
    for (const e of equipmentItems.value) {
      lines.push(`- ${e.label}`)
    }
    lines.push('')
  }

  if (ingredientItems.value.length) {
    lines.push('Ingredients:')
    for (const ing of ingredientItems.value) {
      lines.push(`- ${ing.label}`)
    }
  }

  return lines.join('\n').trim()
}

async function copyGather(): Promise<void> {
  const text = formatGatherForCopy()
  await navigator.clipboard.writeText(text)
  copyBtn.value?.flashCopied()
}

function handleReset(): void {
  resetBtn.value?.flashSpin()
  props.progress.resetSection(props.stageId)
}
</script>

<template>
  <div class="bg-stone-50 rounded-none p-4 border-2 border-stone-200">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-stone-500 uppercase tracking-wide">Gather</h4>
      <div class="flex gap-0.5">
        <IconButton
          v-if="hasAnyProgress"
          ref="resetBtn"
          tooltip="Reset Section"
          size="sm"
          @click="handleReset"
        >
          <RotateCcw />
        </IconButton>
        <IconButton
          ref="copyBtn"
          tooltip="Copy Mise en Place"
          size="sm"
          @click="copyGather"
        >
          <ClipboardList />
          <template #feedback>
            <Check />
          </template>
        </IconButton>
      </div>
    </div>

    <GatherCategory
      v-if="vesselItems.length"
      title="Vessels"
      :items="vesselItems"
      :progress="progress"
      :stage-id="stageId"
    />

    <GatherCategory
      v-if="equipmentItems.length"
      title="Equipment"
      :items="equipmentItems"
      :progress="progress"
      :stage-id="stageId"
    />

    <GatherCategory
      v-if="ingredientItems.length"
      title="Ingredients"
      :items="ingredientItems"
      :progress="progress"
      :stage-id="stageId"
    />
  </div>
</template>
