import { ref, computed, type Ref } from 'vue'
import type { Recipe, Ingredient, NutrientTotals } from '@/types/recipe'

const FRACTION_LABELS: Record<number, string> = {
  0.25: '¼', 0.5: '½', 0.75: '¾',
  1.25: '1¼', 1.5: '1½', 1.75: '1¾',
  2.5: '2½', 3.5: '3½'
}

/** Format a multiplier for display: 0.5 → "½", 2 → "2" */
export function formatMultiplier(value: number): string {
  return FRACTION_LABELS[value] ?? String(value)
}

/**
 * Manages recipe scaling/multiplier state.
 * Tracks multiplier value and provides scaled copies of recipe data.
 */
export function useScaling(recipe: Recipe, externalMultiplier?: Ref<number>) {
  const multiplier = externalMultiplier ?? ref(1)

  // Determine available multiplier options based on scaling block
  const availableMultipliers = computed(() => {
    if (!recipe.scaling) return [1]
    const min = recipe.scaling.tested_range.min
    const max = recipe.scaling.tested_range.max
    const options: number[] = []
    const step = min < 1 || min % 1 !== 0 ? 0.5 : 1
    for (let i = min; i <= max + 2; i += step) {
      options.push(Math.round(i * 100) / 100)
    }
    return options
  })

  // Check if current multiplier is outside tested range (shows warning)
  const isUntested = computed(() => {
    if (!recipe.scaling) return false
    return multiplier.value > recipe.scaling.tested_range.max
      || multiplier.value < recipe.scaling.tested_range.min
  })

  // Scale an ingredient by multiplier
  function scaleIngredient(ingredient: Ingredient): Ingredient {
    if (multiplier.value === 1) return ingredient
    return {
      ...ingredient,
      total: ingredient.total * multiplier.value,
      breakdown: ingredient.breakdown
        ? ingredient.breakdown.map(bd => ({
            ...bd,
            amount: bd.amount * multiplier.value
          }))
        : null
    }
  }

  // Scale all ingredients in all stages
  function getScaledIngredients(): Ingredient[] {
    const all: Ingredient[] = []
    for (const stage of recipe.stages) {
      if (stage.gather?.ingredients) {
        for (const ing of stage.gather.ingredients) {
          all.push(scaleIngredient(ing))
        }
      }
    }
    return all
  }

  // Parse and scale a state component amount string
  // E.g., "413g" → 413 * multiplier, "2 pizzas" → parse number and scale
  function scaleComponentAmount(amount: string): string {
    const match = amount.match(/^([\d.]+)/)
    if (!match) return amount
    const num = parseFloat(match[1])
    const scaled = num * multiplier.value
    const unit = amount.slice(match[1].length)
    return `${scaled}${unit}`
  }

  // Scale nutrition totals by multiplier (perServing stays same)
  function scaleNutrition(totals: NutrientTotals): NutrientTotals {
    if (multiplier.value === 1) return totals
    return {
      calories: totals.calories * multiplier.value,
      protein: totals.protein * multiplier.value,
      totalFat: totals.totalFat * multiplier.value,
      saturatedFat: totals.saturatedFat * multiplier.value,
      carbohydrates: totals.carbohydrates * multiplier.value,
      sugar: totals.sugar * multiplier.value,
      fiber: totals.fiber * multiplier.value,
      sodium: totals.sodium * multiplier.value
    }
  }

  // Parse and scale yields display
  // E.g., "2 pizzas" → "4 pizzas (2×)" or "8 buns" → "4 buns (½×)"
  function getScaledYields(): string {
    const yields = recipe.meta.yields
    const match = yields.match(/^(\d+)/)
    if (!match || multiplier.value === 1) return yields
    const num = parseInt(match[1])
    const scaled = num * multiplier.value
    const unit = yields.slice(match[1].length)
    const label = formatMultiplier(multiplier.value)
    return `${scaled}${unit} (${label}×)`
  }

  // Get process caveats from scaling block (if exists and multiplier > 1)
  const processCaveats = computed(() => {
    if (!recipe.scaling || multiplier.value === 1) return []
    return recipe.scaling.process_caveats
  })

  // Get ingredient behavior notes (for badges next to scaled amounts)
  function getIngredientNote(ingredientId: string): string | undefined {
    if (!recipe.scaling || multiplier.value === 1) return undefined
    const scaling = recipe.scaling.ingredients.find(s => s.id === ingredientId)
    if (!scaling || scaling.behavior === 'linear') return undefined
    return scaling.note
  }

  return {
    multiplier,
    availableMultipliers,
    isUntested,
    scaleIngredient,
    getScaledIngredients,
    scaleComponentAmount,
    scaleNutrition,
    getScaledYields,
    processCaveats,
    getIngredientNote
  }
}
