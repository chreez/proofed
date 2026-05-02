import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type {
  Recipe,
  ExperimentConfig,
  ExperimentIngredient,
  ExperimentRole,
  WaterContentTable,
  WaterContentItem
} from '@/types/recipe'

/** Result shape for hydration and load calculations. */
export interface HydrationResult {
  percent: number
  grams: number
}

/** Per-inclusion baker's percentage entry. */
export interface InclusionEntry {
  id: string
  name: string
  percent: number
  grams: number
}

/** A freeform ingredient added during experiment (not in recipe). */
export interface FreeformIngredient {
  id: string
  name: string
  amount: number
  role: ExperimentRole
}

/**
 * Resolve water content percentage for an experiment ingredient.
 * Priority: waterContentOverride > waterContentId lookup > id match > alias match > 0
 */
export function resolveWaterPercent(
  expIngredient: ExperimentIngredient,
  table: WaterContentTable
): number {
  // 1. Direct override
  if (expIngredient.waterContentOverride != null) {
    return expIngredient.waterContentOverride
  }

  // 2. Lookup by waterContentId or ingredient id
  const lookupId = expIngredient.waterContentId ?? expIngredient.id
  const item = findWaterContentItem(lookupId, table)
  if (item) return item.waterPercent

  return 0
}

/**
 * Find a water content item by id or alias in the lookup table.
 */
export function findWaterContentItem(
  id: string,
  table: WaterContentTable
): WaterContentItem | undefined {
  for (const category of table.categories) {
    for (const item of category.items) {
      if (item.id === id) return item
      if (item.aliases.includes(id)) return item
    }
  }
  return undefined
}

/**
 * Pure composable for experiment tool calculations.
 * Provides reactive state for ingredient adjustments and computed derived values
 * (base hydration, effective hydration, inclusion load, per-inclusion baker's %).
 *
 * Freeform additions do NOT affect hydration calculations — only recipe-defined
 * ingredients with known water content contribute.
 */
export function useExperiment(recipe: Recipe, waterContentTable: WaterContentTable) {
  const config = recipe.experiment as ExperimentConfig

  // Reactive state: ingredient adjustments (id → adjusted grams)
  const adjustments: Ref<Map<string, number>> = ref(new Map())

  // Reactive state: freeform ingredients added during experiment
  const freeformIngredients: Ref<FreeformIngredient[]> = ref([])

  /** Get the current amount for an experiment ingredient (adjusted or default). */
  function getAmount(ingredient: ExperimentIngredient): number {
    const adjusted = adjustments.value.get(ingredient.id)
    return adjusted != null ? adjusted : ingredient.defaultAmount
  }

  /** Get all experiment ingredients filtered by role. */
  function byRole(role: ExperimentRole): ExperimentIngredient[] {
    return config.ingredients.filter(i => i.role === role)
  }

  /** Resolve the water content fraction (0-1) for an experiment ingredient. */
  function waterFraction(ingredient: ExperimentIngredient): number {
    return resolveWaterPercent(ingredient, waterContentTable) / 100
  }

  // --- Derived values (computed, reactive) ---

  /** Total flour grams (sum of all base_flour role ingredients). */
  const totalFlourGrams: ComputedRef<number> = computed(() => {
    return byRole('base_flour').reduce((sum, ing) => sum + getAmount(ing), 0)
  })

  /**
   * Base hydration: (base_liquid grams) / (base_flour grams) * 100
   * Only direct liquid role ingredients count — no moisture from enrichments/inclusions.
   */
  const baseHydration: ComputedRef<HydrationResult> = computed(() => {
    const liquidGrams = byRole('base_liquid').reduce((sum, ing) => sum + getAmount(ing), 0)
    const flourGrams = totalFlourGrams.value
    if (flourGrams === 0) return { percent: 0, grams: 0 }
    return {
      percent: roundTo((liquidGrams / flourGrams) * 100, 1),
      grams: roundTo(liquidGrams, 1)
    }
  })

  /**
   * Effective hydration: (all water contributions from recipe-defined ingredients) / (flour grams) * 100
   * Includes water content from ALL recipe-defined ingredients using the lookup table.
   * Freeform additions are excluded.
   */
  const effectiveHydration: ComputedRef<HydrationResult> = computed(() => {
    const flourGrams = totalFlourGrams.value
    if (flourGrams === 0) return { percent: 0, grams: 0 }

    let totalWater = 0
    for (const ing of config.ingredients) {
      const amount = getAmount(ing)
      const wf = waterFraction(ing)
      totalWater += amount * wf
    }

    return {
      percent: roundTo((totalWater / flourGrams) * 100, 1),
      grams: roundTo(totalWater, 1)
    }
  })

  /**
   * Inclusion load: (total inclusion grams) / (total flour grams) * 100
   * Only ingredients with role === 'inclusion' count.
   */
  const inclusionLoad: ComputedRef<HydrationResult> = computed(() => {
    const flourGrams = totalFlourGrams.value
    if (flourGrams === 0) return { percent: 0, grams: 0 }

    const inclusionGrams = byRole('inclusion').reduce((sum, ing) => sum + getAmount(ing), 0)
    // Also add freeform inclusions
    const freeformInclusionGrams = freeformIngredients.value
      .filter(f => f.role === 'inclusion')
      .reduce((sum, f) => sum + f.amount, 0)

    const total = inclusionGrams + freeformInclusionGrams
    return {
      percent: roundTo((total / flourGrams) * 100, 1),
      grams: roundTo(total, 1)
    }
  })

  /**
   * Per-inclusion baker's percentage: (individual inclusion grams) / (total flour grams) * 100
   * One entry per inclusion ingredient (both recipe-defined and freeform).
   */
  const perInclusionBakers: ComputedRef<InclusionEntry[]> = computed(() => {
    const flourGrams = totalFlourGrams.value
    if (flourGrams === 0) return []

    const entries: InclusionEntry[] = []

    // Recipe-defined inclusions
    for (const ing of byRole('inclusion')) {
      const grams = getAmount(ing)
      entries.push({
        id: ing.id,
        name: getIngredientName(ing.id),
        percent: roundTo((grams / flourGrams) * 100, 1),
        grams: roundTo(grams, 1)
      })
    }

    // Freeform inclusions
    for (const f of freeformIngredients.value.filter(fi => fi.role === 'inclusion')) {
      entries.push({
        id: f.id,
        name: f.name,
        percent: roundTo((f.amount / flourGrams) * 100, 1),
        grams: roundTo(f.amount, 1)
      })
    }

    return entries
  })

  /**
   * Total dough weight: sum of all ingredient amounts (recipe-defined + freeform).
   */
  const totalDoughWeight: ComputedRef<number> = computed(() => {
    let total = 0
    for (const ing of config.ingredients) {
      total += getAmount(ing)
    }
    for (const f of freeformIngredients.value) {
      total += f.amount
    }
    return roundTo(total, 1)
  })

  // --- Actions ---

  /** Adjust an ingredient to a specific amount (grams). */
  function adjustIngredient(id: string, amount: number): void {
    const newMap = new Map(adjustments.value)
    newMap.set(id, amount)
    adjustments.value = newMap
  }

  /** Reset a single ingredient to its default amount. */
  function resetIngredient(id: string): void {
    const newMap = new Map(adjustments.value)
    newMap.delete(id)
    adjustments.value = newMap
  }

  /** Reset all adjustments and freeform ingredients. */
  function resetAll(): void {
    adjustments.value = new Map()
    freeformIngredients.value = []
  }

  /** Add a freeform ingredient. */
  function addFreeform(ingredient: FreeformIngredient): void {
    freeformIngredients.value = [...freeformIngredients.value, ingredient]
  }

  /** Remove a freeform ingredient by id. */
  function removeFreeform(id: string): void {
    freeformIngredients.value = freeformIngredients.value.filter(f => f.id !== id)
  }

  // --- Helpers ---

  /** Look up ingredient display name from recipe stages. */
  function getIngredientName(id: string): string {
    for (const stage of recipe.stages) {
      if (stage.gather?.ingredients) {
        const found = stage.gather.ingredients.find(i => i.id === id)
        if (found) return found.name
      }
    }
    // Fallback: use the id
    return id
  }

  return {
    // State
    adjustments,
    freeformIngredients,

    // Derived
    baseHydration,
    effectiveHydration,
    inclusionLoad,
    perInclusionBakers,
    totalDoughWeight,
    totalFlourGrams,

    // Actions
    adjustIngredient,
    resetIngredient,
    resetAll,
    addFreeform,
    removeFreeform,

    // Utilities
    getAmount,
    resolveWaterPercent: (ing: ExperimentIngredient) => resolveWaterPercent(ing, waterContentTable)
  }
}

/** Round a number to n decimal places. */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
