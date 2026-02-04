<script setup lang="ts">
import { computed } from 'vue'
import type { GatherSection } from '@/types/recipe'
import GatherCategory from '@/components/GatherCategory.vue'

const props = defineProps<{
  gather: GatherSection
  stageId: string
  progress: ReturnType<typeof import('@/composables/useProgress').useProgress>
}>()

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
</script>

<template>
  <div class="bg-stone-50 rounded-lg p-4 border border-stone-200">
    <h4 class="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">Gather</h4>

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
