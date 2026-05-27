<script setup lang="ts">
import { computed } from 'vue'
import type { Recipe, CostSourceType } from '@/types/recipe'
import { getMostRecentCost, getMostRecentCostDate } from '@/composables/useCost'
import { inferDefaultUnit, pluralizeUnit } from '@/composables/useProductionPlan'

interface Props {
  recipe: Recipe
}

const props = defineProps<Props>()

const costData = computed(() => getMostRecentCost(props.recipe))
const costDate = computed(() => getMostRecentCostDate(props.recipe))

const hasCost = computed(() => costData.value !== null)

// PF-277: derive unit label from recipe.meta.yields ("2 loaves" → "loaf").
// `inferDefaultUnit` returns "unit" when yields is missing — in that case
// fall back to the original "serving" terminology.
const unitSingular = computed<string>(() => {
  const inferred = inferDefaultUnit(props.recipe)
  return inferred === 'unit' ? 'serving' : inferred
})

const unitCountLabel = computed<string>(() => {
  const servings = costData.value?.servings ?? 1
  return pluralizeUnit(servings, unitSingular.value)
})

// Matches existing "Per serving" casing (capital P, lowercase noun).
const perUnitLabel = computed<string>(() => `Per ${unitSingular.value}`)

const isPartialCost = computed(() => {
  if (!costData.value) return false
  // Check if the number of cost items is less than total ingredients
  // This is a simple heuristic - cost is partial if some ingredients are missing
  const totalIngredients = props.recipe.stages
    .flatMap(s => s.gather?.ingredients ?? [])
    .length
  return costData.value.items.length < totalIngredients
})

function sourceBadgeLabel(sourceType: CostSourceType): string {
  switch (sourceType) {
    case 'heb': return 'HEB'
    case 'rate': return 'RATE'
    case 'pantry': return 'PANTRY'
    case 'manual': return 'MANUAL'
  }
}

function sourceBadgeClass(sourceType: CostSourceType): string {
  switch (sourceType) {
    case 'heb': return 'bg-stone-200 text-stone-600'
    case 'rate': return 'bg-cream text-crust-dark'
    case 'pantry': return 'bg-cream text-crust-dark'
    case 'manual': return 'bg-accent-tint text-accent'
  }
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`
}

function formatDate(dateStr: string): string {
  // Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shift
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <!-- No cost data state -->
  <div v-if="!hasCost" class="card" data-testid="cost-placeholder">
    <div class="card-title">Cost Breakdown</div>
    <p class="text-muted">Cost data not yet calculated</p>
  </div>

  <!-- Cost data available -->
  <div v-else-if="costData" class="card" data-testid="cost-breakdown">
    <div class="flex justify-between items-baseline mb-3">
      <div class="flex flex-col gap-1">
        <h4 class="font-mono text-sm text-heading font-semibold">Cost Breakdown</h4>
        <span class="font-mono text-xs text-stone-400">
          {{ costData.servings }} {{ unitCountLabel }}
        </span>
      </div>
    </div>

    <!-- Partial cost warning -->
    <div v-if="isPartialCost" class="bg-warning-tint border-l-2 border-warning px-3 py-2 mb-3">
      <p class="text-xs text-stone-700">
        Partial cost data — some ingredients not priced
      </p>
    </div>

    <!-- Cost items table -->
    <div class="border-2 border-stone-200 overflow-hidden">
      <div class="divide-y-2 divide-stone-200">
        <div
          v-for="item in costData.items"
          :key="item.ingredientId"
          class="flex items-start gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors"
          data-testid="cost-item"
        >
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-ink">{{ item.name }}</div>
            <div class="text-xs text-stone-500 truncate">{{ item.sourceName }}</div>
            <div class="flex items-center gap-2 mt-1">
              <span
                :class="['font-mono text-[10px] px-1.5 py-0.5 uppercase tracking-wide', sourceBadgeClass(item.sourceType)]"
                data-testid="source-badge"
              >
                {{ sourceBadgeLabel(item.sourceType) }}
              </span>
              <span class="text-xs text-stone-400">{{ item.unit === 'whole' ? `${item.amount}x` : `${item.amount}${item.unit}` }}</span>
            </div>
          </div>
          <div class="font-mono text-sm font-medium text-ink shrink-0" data-testid="item-cost">
            {{ formatCost(item.cost) }}
          </div>
        </div>
      </div>

      <!-- Footer: totals -->
      <div class="border-t-2 border-stone-200 bg-stone-50 px-3 py-3" data-testid="cost-footer">
        <div class="flex justify-between items-baseline mb-2">
          <span class="font-mono text-xs text-stone-500">Total bake cost</span>
          <span class="text-lg font-mono font-medium text-ink">${{ costData.total.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between items-baseline">
          <span class="font-mono text-xs text-stone-500">{{ perUnitLabel }}</span>
          <span class="font-mono text-sm text-accent font-medium">${{ costData.perServing.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Date note -->
    <p class="text-xs text-stone-400 mt-2 italic" data-testid="cost-date-note">
      Based on {{ formatDate(costDate!) }} bake. Prices may vary.
    </p>
  </div>
</template>
