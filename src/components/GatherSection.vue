<script setup lang="ts">
import { computed, useTemplateRef, inject, ref, type Ref } from 'vue'
import { ClipboardList, Check, RotateCcw } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import type { GatherSection } from '@/types/recipe'
import GatherCategory from '@/components/GatherCategory.vue'
import { copyToClipboard } from '@/composables/useClipboard'
import { SCALING_MULTIPLIER_KEY, SCALING_INGREDIENTS_KEY } from '@/composables/scalingKey'
import type { ScalingIngredient } from '@/types/recipe'

const props = defineProps<{
  gather: GatherSection
  stageId: string
  stageTitle: string
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
}>()

const copyBtn = useTemplateRef<InstanceType<typeof IconButton>>('copyBtn')
const resetBtn = useTemplateRef<InstanceType<typeof IconButton>>('resetBtn')

// Inject multiplier from App.vue (defaults to 1 if not provided)
const multiplier = inject<Ref<number>>(SCALING_MULTIPLIER_KEY, ref(1))
// Inject scaling ingredients for behavior badges (provided as ComputedRef by App.vue)
const scalingIngredients = inject<Ref<ScalingIngredient[]>>(SCALING_INGREDIENTS_KEY, ref([]))

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

const ingredientItems = computed(() => {
  const mult = multiplier.value
  return (props.gather.ingredients || []).map(ing => {
    const scaledTotal = ing.total * mult
    const fmt = (amount: number, unit: string) => unit === 'whole' ? `${amount}x` : `${amount}${unit}`
    const label = `${ing.name} — ${fmt(scaledTotal, ing.unit)}`
    const detail = ing.breakdown
      ? ing.breakdown.map(b => `${fmt(b.amount * mult, ing.unit)} ${b.label}`).join(', ')
      : undefined
    // Show behavior note for non-linear/fixed ingredients when scaled
    let note: string | undefined
    if (mult > 1) {
      const scalingInfo = scalingIngredients.value.find(s => s.id === ing.id)
      if (scalingInfo && scalingInfo.behavior !== 'linear' && scalingInfo.note) {
        note = scalingInfo.note
      }
    }
    return {
      id: `ing-${ing.id}`,
      label,
      detail,
      note
    }
  })
})

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
  await copyToClipboard(text)
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
      :start-collapsed="true"
    />

    <GatherCategory
      v-if="equipmentItems.length"
      title="Equipment"
      :items="equipmentItems"
      :progress="progress"
      :stage-id="stageId"
      :start-collapsed="true"
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
