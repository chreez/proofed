<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GatherSection } from '@/types/recipe'
import GatherCategory from '@/components/GatherCategory.vue'

const props = defineProps<{
  gather: GatherSection
  stageId: string
  stageTitle: string
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
}>()

const copied = ref(false)

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
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="bg-stone-50 rounded-none p-4 border-2 border-stone-200">
    <div class="flex items-center justify-between mb-3">
      <h4 class="text-sm font-medium text-stone-500 uppercase tracking-wide">Gather</h4>
      <button
        @click="copyGather"
        class="btn-secondary text-sm"
      >
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
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
