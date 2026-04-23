import type { Recipe } from '@/types/recipe'
import { deriveAllergens } from '@/composables/useAllergens'
import { getMostRecentCost } from '@/composables/useCost'

/**
 * Per-section validation status for recipe printout.
 * Each section has different data requirements and completeness rules.
 */
export interface PrintSectionValidation {
  header: boolean
  ingredients: boolean
  allergens: boolean
  nutrition: boolean
  cost: boolean
}

/**
 * Individual print validation check result (PV1-PV9).
 */
export interface PrintCheck {
  id: string
  label: string
  pass: boolean
  detail: string
}

/**
 * Overall print validation result with per-section status, checks, and summary.
 */
export interface PrintValidation {
  sections: PrintSectionValidation
  checks: PrintCheck[]
  ready: boolean
  summary: string
}

// --- Individual check functions ---

function checkIngredientsExist(recipe: Recipe): PrintCheck {
  const stages = recipe.stages.filter(
    (s) => s.gather?.ingredients && s.gather.ingredients.length > 0
  )
  const totalIngredients = stages.reduce(
    (sum, s) => sum + (s.gather?.ingredients?.length ?? 0),
    0
  )
  return {
    id: 'PV1',
    label: 'Ingredients exist',
    pass: stages.length > 0,
    detail: stages.length > 0
      ? `${totalIngredients} ingredients across ${stages.length} stages`
      : 'No ingredients found in any stage',
  }
}

function checkAllergensDerivable(recipe: Recipe): PrintCheck {
  try {
    deriveAllergens(recipe)
    return {
      id: 'PV2',
      label: 'Allergens derivable',
      pass: true,
      detail: 'Allergen derivation completed',
    }
  } catch {
    return {
      id: 'PV2',
      label: 'Allergens derivable',
      pass: false,
      detail: 'Allergen derivation threw an error',
    }
  }
}

function checkNutritionComplete(recipe: Recipe): PrintCheck {
  const hasTotals = !!recipe.nutrition?.totals?.calories && recipe.nutrition.totals.calories > 0
  const hasPerServing = !!recipe.nutrition?.perServing?.calories && recipe.nutrition.perServing.calories > 0
  const pass = hasTotals && hasPerServing
  let detail: string
  if (pass) {
    detail = `${recipe.nutrition!.totals.calories} cal total, ${recipe.nutrition!.perServing.calories} cal/serving`
  } else if (!recipe.nutrition) {
    detail = 'No nutrition data'
  } else if (!hasTotals) {
    detail = 'Nutrition totals missing or zero calories'
  } else {
    detail = 'Nutrition perServing missing or zero calories'
  }
  return { id: 'PV3', label: 'Nutrition complete', pass, detail }
}

function checkCostNewSchema(recipe: Recipe): PrintCheck {
  if (!recipe.cook_log || recipe.cook_log.length === 0) {
    return { id: 'PV4', label: 'Cost data (new schema)', pass: false, detail: 'No cook_log entries' }
  }
  const withItems = recipe.cook_log.filter(
    (e) => e.cost && Array.isArray(e.cost.items) && e.cost.items.length > 0
  )
  if (withItems.length > 0) {
    return { id: 'PV4', label: 'Cost data (new schema)', pass: true, detail: `${withItems.length} entries with cost.items[]` }
  }
  // Check if old costs[] schema exists (on BakeCostSummary-shaped objects)
  const withAnyCost = recipe.cook_log.filter((e) => e.cost && e.cost.total != null)
  if (withAnyCost.length > 0) {
    return { id: 'PV4', label: 'Cost data (new schema)', pass: false, detail: 'Cost data exists but uses empty items[] — needs cost item details' }
  }
  return { id: 'PV4', label: 'Cost data (new schema)', pass: false, detail: 'No cost data in any cook_log entry' }
}

function checkServingCoherence(recipe: Recipe): PrintCheck {
  const cost = getMostRecentCost(recipe)
  if (!cost || !recipe.nutrition) {
    return { id: 'PV5', label: 'Serving label coherence', pass: true, detail: 'Skipped — cost or nutrition absent' }
  }
  if (cost.servings === recipe.nutrition.servings) {
    return { id: 'PV5', label: 'Serving label coherence', pass: true, detail: `Both use ${cost.servings} servings` }
  }
  // Servings differ — require meta.yields for "per unit" labeling
  const hasYields = !!recipe.meta.yields && recipe.meta.yields.trim().length > 0
  if (hasYields) {
    return { id: 'PV5', label: 'Serving label coherence', pass: true, detail: `Servings differ (cost: ${cost.servings}, nutrition: ${recipe.nutrition.servings}) but meta.yields present` }
  }
  return {
    id: 'PV5',
    label: 'Serving label coherence',
    pass: false,
    detail: `cost.servings (${cost.servings}) !== nutrition.servings (${recipe.nutrition.servings}) and no meta.yields to disambiguate`,
  }
}

function checkNoStaleTerminology(recipe: Recipe): PrintCheck {
  if (!recipe.cook_log) {
    return { id: 'PV6', label: 'No stale terminology', pass: true, detail: 'No cook_log to check' }
  }
  const staleItems: string[] = []
  for (const entry of recipe.cook_log) {
    if (!entry.cost?.items) continue
    for (const item of entry.cost.items) {
      if (item.sourceName && item.sourceName.toLowerCase().includes('negligible')) {
        staleItems.push(item.name)
      }
    }
  }
  if (staleItems.length === 0) {
    return { id: 'PV6', label: 'No stale terminology', pass: true, detail: 'No "negligible" sourceName found' }
  }
  return {
    id: 'PV6',
    label: 'No stale terminology',
    pass: false,
    detail: `"negligible" found in sourceName for: ${staleItems.join(', ')}`,
  }
}

function checkCostItemsSourced(recipe: Recipe): PrintCheck {
  const cost = getMostRecentCost(recipe)
  if (!cost || !cost.items || cost.items.length === 0) {
    return { id: 'PV7', label: 'Cost items sourced', pass: true, detail: 'Skipped — no cost items to check' }
  }
  const unsourced = cost.items.filter((item) => !item.sourceName || item.sourceName.trim().length === 0)
  if (unsourced.length === 0) {
    return { id: 'PV7', label: 'Cost items sourced', pass: true, detail: `All ${cost.items.length} items have sourceName` }
  }
  return {
    id: 'PV7',
    label: 'Cost items sourced',
    pass: false,
    detail: `${unsourced.length} items missing sourceName: ${unsourced.map((i) => i.name).join(', ')}`,
  }
}

function checkYieldsPresent(recipe: Recipe): PrintCheck {
  const hasYields = !!recipe.meta.yields && recipe.meta.yields.trim().length > 0
  return {
    id: 'PV8',
    label: 'Recipe has yields',
    pass: hasYields,
    detail: hasYields ? `Yields: ${recipe.meta.yields}` : 'meta.yields is missing or empty',
  }
}

function checkEstimationProvenance(recipe: Recipe): PrintCheck {
  const issues: string[] = []

  // Nutrition provenance
  if (recipe.nutrition) {
    if (!recipe.nutrition.dataSource && !recipe.nutrition.calculatedDate) {
      issues.push('Nutrition missing both dataSource and calculatedDate')
    }
  }

  // Cost provenance — most recent cost entry needs a valid date
  if (recipe.cook_log && recipe.cook_log.length > 0) {
    const entriesWithCost = recipe.cook_log
      .filter((e) => e.cost && e.cost.total != null)
      .sort((a, b) => b.date.localeCompare(a.date))
    if (entriesWithCost.length > 0 && !entriesWithCost[0].date) {
      issues.push('Most recent cost entry has no date')
    }
  }

  if (issues.length === 0) {
    return { id: 'PV9', label: 'Estimation provenance', pass: true, detail: 'Provenance data present' }
  }
  return { id: 'PV9', label: 'Estimation provenance', pass: false, detail: issues.join('; ') }
}

// --- Main validation function ---

/**
 * Validate recipe for print page readiness.
 * Runs PV1-PV9 checks. All must pass for ready=true.
 */
export function validatePrintSections(recipe: Recipe | null): PrintValidation {
  if (!recipe) {
    return {
      sections: {
        header: false,
        ingredients: false,
        allergens: false,
        nutrition: false,
        cost: false,
      },
      checks: [],
      ready: false,
      summary: 'No recipe loaded',
    }
  }

  // Run all checks
  const checks: PrintCheck[] = [
    checkIngredientsExist(recipe),
    checkAllergensDerivable(recipe),
    checkNutritionComplete(recipe),
    checkCostNewSchema(recipe),
    checkServingCoherence(recipe),
    checkNoStaleTerminology(recipe),
    checkCostItemsSourced(recipe),
    checkYieldsPresent(recipe),
    checkEstimationProvenance(recipe),
  ]

  // Section-level booleans (for v-if in template)
  const sections: PrintSectionValidation = {
    header: true,
    ingredients: checks[0].pass, // PV1
    allergens: checks[1].pass, // PV2
    nutrition: checks[2].pass, // PV3
    cost: checks[3].pass, // PV4
  }

  // Ready = ALL automated checks pass
  const ready = checks.every((c) => c.pass)
  const failCount = checks.filter((c) => !c.pass).length

  let summary: string
  if (ready) {
    summary = 'Ready to print'
  } else {
    const failedIds = checks.filter((c) => !c.pass).map((c) => c.id)
    summary = `${failCount} check${failCount > 1 ? 's' : ''} failed: ${failedIds.join(', ')}`
  }

  return { sections, checks, ready, summary }
}

/**
 * Check if a recipe is ready to print (all PV1-PV9 checks pass).
 */
export function isPrintReady(recipe: Recipe | null): boolean {
  return validatePrintSections(recipe).ready
}

/**
 * Get a human-readable validation summary for the recipe printout.
 */
export function getValidationSummary(recipe: Recipe | null): string {
  return validatePrintSections(recipe).summary
}
