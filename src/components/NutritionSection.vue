<script setup lang="ts">
import { ref, computed, useTemplateRef, onMounted, inject, type Ref } from 'vue'
import { Link2, Check } from 'lucide-vue-next'
import IconButton from '@/components/IconButton.vue'
import { copyToClipboard } from '@/composables/useClipboard'
import { SCALING_MULTIPLIER_KEY } from '@/composables/scalingKey'
import type { RecipeNutrition, NutrientTotals } from '@/types/recipe'

interface FdaDvConfig {
  label: string
  source: string
  values: Partial<Record<keyof NutrientTotals, number>>
}

const props = defineProps<{
  nutrition?: RecipeNutrition
  sectionId: string
}>()

const linkBtn = useTemplateRef<InstanceType<typeof IconButton>>('linkBtn')

// Inject multiplier from App.vue (defaults to 1 if not provided)
const multiplier = inject<Ref<number>>(SCALING_MULTIPLIER_KEY, ref(1))

async function copyPermalink(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}#${props.sectionId}`
  await copyToClipboard(url)
  linkBtn.value?.flashCopied('Copied!')
}

const showFull = ref(false)
const fdaDv = ref<FdaDvConfig | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/config/fda-dv.json')
    if (res.ok) {
      fdaDv.value = await res.json() as FdaDvConfig
    }
  } catch {
    // FDA DV data unavailable — % DV column simply won't render
  }
})

const showDvColumn = computed<boolean>(() => {
  return !showFull.value && fdaDv.value !== null
})

const activeData = computed<NutrientTotals | null>(() => {
  if (!props.nutrition) return null
  const data = showFull.value ? props.nutrition.totals : props.nutrition.perServing
  if (multiplier.value === 1) return data
  // Scale totals by multiplier; perServing stays same
  if (showFull.value) {
    return {
      calories: data.calories * multiplier.value,
      protein: data.protein * multiplier.value,
      totalFat: data.totalFat * multiplier.value,
      saturatedFat: data.saturatedFat * multiplier.value,
      carbohydrates: data.carbohydrates * multiplier.value,
      sugar: data.sugar * multiplier.value,
      fiber: data.fiber * multiplier.value,
      sodium: data.sodium * multiplier.value
    }
  }
  return data
})

const servingLabel = computed<string>(() => {
  if (!props.nutrition) return ''
  if (showFull.value) {
    const scaledServings = props.nutrition.servings * multiplier.value
    return `Full recipe (${scaledServings} servings)`
  }
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
  const breakdown = [...props.nutrition.breakdown]
    .filter(b => b.calories > 0)
    .sort((a, b) => b.calories - a.calories)

  // Scale amounts and calories if multiplied
  if (multiplier.value === 1) return breakdown
  return breakdown.map(item => ({
    ...item,
    amount: item.amount * multiplier.value,
    calories: item.calories * multiplier.value
  }))
})

function formatValue(value: number, unit: string): string {
  if (unit === 'mg') return `${Math.round(value)} mg`
  if (unit === 'kcal') return `${Math.round(value)}`
  return `${value} g`
}

function getDvPercent(key: keyof NutrientTotals): string {
  if (!fdaDv.value || !activeData.value) return '\u2014'
  const ref = fdaDv.value.values[key]
  if (ref === undefined) return '\u2014'
  return `${Math.round((activeData.value[key] / ref) * 100)}%`
}
</script>

<template>
  <section>
    <div class="flex items-center gap-1 mb-4 pb-2 border-b-2 border-stone-200">
      <h3 class="card-title">Nutrition</h3>
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

    <div v-if="!nutrition" class="text-muted pl-3">
      Not yet calculated
    </div>

    <div v-else class="voice-agent">
      <!-- Agent label + tag -->
      <div class="flex items-center gap-2 mb-3">
        <span class="voice-agent-label">Nutrition Facts</span>
        <span class="voice-agent-tag">calculated</span>
      </div>

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
        <thead v-if="showDvColumn">
          <tr class="border-b border-stone-300">
            <th class="text-left py-1 font-medium"></th>
            <th class="text-right py-1 font-medium"></th>
            <th class="text-right py-1 font-medium text-xs text-stone-500">% DV*</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in nutrientRows"
            :key="row.key"
            class="[background-image:linear-gradient(to_right,transparent,rgba(212,205,193,0.4)_15%,rgba(212,205,193,0.4)_85%,transparent)] [background-size:100%_1px] [background-position:bottom] [background-repeat:no-repeat]"
            :class="row.key === 'calories' ? 'font-semibold' : ''"
          >
            <td class="py-1.5" :class="row.indent ? 'pl-4 text-stone-600' : ''">
              {{ row.label }}
            </td>
            <td class="py-1.5 text-right font-mono text-xs">
              {{ formatValue(activeData[row.key], row.unit) }}
            </td>
            <td v-if="showDvColumn" class="py-1.5 text-right font-mono text-xs text-stone-500 pl-3">
              {{ getDvPercent(row.key) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- DV footnote -->
      <p v-if="showDvColumn" class="text-xs text-stone-400 mt-2">
        *Based on 2,000 kcal/day
      </p>

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
