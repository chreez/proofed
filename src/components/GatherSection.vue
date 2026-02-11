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

const allItemsChecked = computed(() =>
  allItemIds.value.length > 0 && allItemIds.value.every(id => props.progress.isItemChecked(id))
)

function formatGatherForCopy(): string {
  const lines: string[] = []

  lines.push(`Mise en Place - ${props.stageTitle}`)
  lines.push('')

  const uncheckedVessels = vesselItems.value.filter(v => !props.progress.isItemChecked(v.id))
  const uncheckedEquipment = equipmentItems.value.filter(e => !props.progress.isItemChecked(e.id))
  const uncheckedIngredients = ingredientItems.value.filter(i => !props.progress.isItemChecked(i.id))

  if (uncheckedVessels.length) {
    lines.push('Vessels:')
    for (const v of uncheckedVessels) {
      lines.push(`- ${v.label}`)
    }
    lines.push('')
  }

  if (uncheckedEquipment.length) {
    lines.push('Equipment:')
    for (const e of uncheckedEquipment) {
      lines.push(`- ${e.label}`)
    }
    lines.push('')
  }

  if (uncheckedIngredients.length) {
    lines.push('Ingredients:')
    for (const ing of uncheckedIngredients) {
      lines.push(`- ${ing.label}`)
    }
  }

  return lines.join('\n').trim()
}

async function copyGather(): Promise<void> {
  if (allItemsChecked.value) {
    copyBtn.value?.flashCopied('Everything gathered!')
    return
  }
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
