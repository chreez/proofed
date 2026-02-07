<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RecipeNutrition, NutrientTotals } from '@/types/recipe'

const props = defineProps<{
  nutrition?: RecipeNutrition
}>()

const showFull = ref(false)

const activeData = computed<NutrientTotals | null>(() => {
  if (!props.nutrition) return null
  return showFull.value ? props.nutrition.totals : props.nutrition.perServing
})

const servingLabel = computed<string>(() => {
  if (!props.nutrition) return ''
  if (showFull.value) return `Full recipe (${props.nutrition.servings} servings)`
  return props.nutrition.servingSize ?? `1 of ${props.nutrition.servings}`
})

interface NutrientRow {
  label: string
  key: keyof NutrientTotals
  unit: string
  indent?: boolean
}

const nutrientRows: NutrientRow[] = [
  { label: 'Calories', key: 'calories', unit: 'kcal' },
  { label: 'Protein', key: 'protein', unit: 'g' },
  { label: 'Total Fat', key: 'totalFat', unit: 'g' },
  { label: 'Saturated Fat', key: 'saturatedFat', unit: 'g', indent: true },
  { label: 'Carbohydrates', key: 'carbohydrates', unit: 'g' },
  { label: 'Sugar', key: 'sugar', unit: 'g', indent: true },
  { label: 'Fiber', key: 'fiber', unit: 'g', indent: true },
  { label: 'Sodium', key: 'sodium', unit: 'mg' },
]

const sortedBreakdown = computed(() => {
  if (!props.nutrition) return []
  return [...props.nutrition.breakdown]
    .filter(b => b.calories > 0)
    .sort((a, b) => b.calories - a.calories)
})

function formatValue(value: number, unit: string): string {
  if (unit === 'mg') return `${Math.round(value)} mg`
  if (unit === 'kcal') return `${Math.round(value)}`
  return `${value} g`
}
</script>

<template>
  <section id="nutrition-section" class="scroll-mt-16">
    <h3 class="card-title mb-4 pb-2 border-b border-stone-200">Nutrition</h3>

    <div v-if="!nutrition" class="text-muted">
      Not yet calculated
    </div>

    <div v-else>
      <!-- Toggle -->
      <div class="flex gap-2 mb-4">
        <button
          class="btn-secondary text-xs"
          :class="{ 'bg-stone-300': !showFull }"
          @click="showFull = false"
        >
          Per Serving
        </button>
        <button
          class="btn-secondary text-xs"
          :class="{ 'bg-stone-300': showFull }"
          @click="showFull = true"
        >
          Full Recipe
        </button>
      </div>

      <!-- Serving info -->
      <p class="text-muted mb-3">{{ servingLabel }}</p>

      <!-- Nutrient table -->
      <table class="w-full text-sm border-collapse" v-if="activeData">
        <tbody>
          <tr
            v-for="row in nutrientRows"
            :key="row.key"
            class="border-b border-stone-200"
            :class="row.key === 'calories' ? 'font-semibold' : ''"
          >
            <td class="py-1.5" :class="row.indent ? 'pl-4 text-stone-600' : ''">
              {{ row.label }}
            </td>
            <td class="py-1.5 text-right font-mono text-xs">
              {{ formatValue(activeData[row.key], row.unit) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Ingredient breakdown -->
      <details v-if="sortedBreakdown.length" class="mt-4">
        <summary class="text-xs text-stone-500 cursor-pointer hover:text-ink">
          Ingredient breakdown
        </summary>
        <table class="w-full text-xs mt-2 border-collapse">
          <thead>
            <tr class="border-b border-stone-300 text-stone-500">
              <th class="text-left py-1 font-medium">Ingredient</th>
              <th class="text-right py-1 font-medium">Amount</th>
              <th class="text-right py-1 font-medium">Calories</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in sortedBreakdown"
              :key="item.ingredientId"
              class="border-b border-stone-100"
            >
              <td class="py-1">{{ item.ingredientName }}</td>
              <td class="py-1 text-right font-mono">{{ item.amount }}g</td>
              <td class="py-1 text-right font-mono">{{ Math.round(item.calories) }}</td>
            </tr>
          </tbody>
        </table>
      </details>

      <!-- Footer -->
      <div class="mt-4 text-xs text-stone-400">
        <p>Source: {{ nutrition.dataSource }} &middot; Calculated {{ nutrition.calculatedDate }}</p>
        <p class="mt-1">Estimates only. Actual values may vary.</p>
      </div>
    </div>
  </section>
</template>
