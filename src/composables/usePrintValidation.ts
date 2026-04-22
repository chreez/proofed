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
 * Overall print validation result with per-section status and summary.
 */
export interface PrintValidation {
  sections: PrintSectionValidation
  ready: boolean
  summary: string
}

/**
 * Validate each section of the recipe printout.
 * Returns per-section status based on tiered validation model:
 * - CRITICAL (blocks render): ingredients, allergens
 * - RECOMMENDED (placeholder if missing): nutrition, cost
 *
 * @param recipe - Recipe to validate for printing
 * @returns PrintValidation with per-section status and summary
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
      ready: false,
      summary: 'No recipe loaded',
    }
  }

  // Header: Always valid (recipe name always exists)
  const headerValid = true

  // Ingredients: Valid if recipe has ≥1 gather section with ≥1 ingredient
  const ingredientsValid = recipe.stages.some(
    (stage) => stage.gather?.ingredients && stage.gather.ingredients.length > 0
  )

  // Allergens: Valid if allergen derivation produces results
  // (even if result is empty array, derivation is complete)
  let allergensValid = false
  try {
    deriveAllergens(recipe)
    allergensValid = true
  } catch {
    allergensValid = false
  }

  // Nutrition: Valid if recipe has nutrition data with non-zero calories
  const nutritionValid =
    !!recipe.nutrition?.totals?.calories && recipe.nutrition.totals.calories > 0

  // Cost: Valid if most recent cook_log entry has cost data
  const costValid = getMostRecentCost(recipe) !== null

  // Determine readiness and summary
  const criticalValid = ingredientsValid && allergensValid
  const ready = criticalValid

  let summary: string
  if (!criticalValid) {
    const missingCritical: string[] = []
    if (!ingredientsValid) missingCritical.push('ingredients')
    if (!allergensValid) missingCritical.push('allergens')
    summary = `Missing critical data: ${missingCritical.join(', ')}`
  } else {
    const missingOptional: string[] = []
    if (!nutritionValid) missingOptional.push('nutrition')
    if (!costValid) missingOptional.push('cost')

    if (missingOptional.length === 0) {
      summary = 'Ready to print'
    } else {
      summary = `Ready to print (${missingOptional.join(', ')} will show placeholder)`
    }
  }

  return {
    sections: {
      header: headerValid,
      ingredients: ingredientsValid,
      allergens: allergensValid,
      nutrition: nutritionValid,
      cost: costValid,
    },
    ready,
    summary,
  }
}

/**
 * Check if a recipe is ready to print (all critical sections valid).
 *
 * @param recipe - Recipe to check
 * @returns true if critical sections pass validation
 */
export function isPrintReady(recipe: Recipe | null): boolean {
  const validation = validatePrintSections(recipe)
  return validation.ready
}

/**
 * Get a human-readable validation summary for the recipe printout.
 *
 * @param recipe - Recipe to summarize
 * @returns Summary string: "Ready to print" or "X sections incomplete"
 */
export function getValidationSummary(recipe: Recipe | null): string {
  const validation = validatePrintSections(recipe)
  return validation.summary
}
