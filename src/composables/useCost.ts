import type { Recipe, CookLogCost } from '@/types/recipe'

/**
 * Extract the most recent cost data from a recipe's cook_log entries.
 * Returns null if no bakes have cost data.
 */
export function getMostRecentCost(recipe: Recipe): CookLogCost | null {
  if (!recipe.cook_log || recipe.cook_log.length === 0) {
    return null
  }

  // Filter cook_log entries that have cost data, then sort by date descending
  const entriesWithCost = recipe.cook_log
    .filter(entry => entry.cost && entry.cost.total != null)
    .sort((a, b) => b.date.localeCompare(a.date))

  if (entriesWithCost.length === 0) {
    return null
  }

  return entriesWithCost[0].cost!
}

/**
 * Get servings count for a recipe.
 * Priority: nutrition.servings > config.stats calculation > 1 (fallback)
 */
export function getServings(recipe: Recipe): number {
  // Priority 1: nutrition.servings (explicit, validated)
  if (recipe.nutrition?.servings) {
    return recipe.nutrition.servings
  }

  // Priority 2: config.stats (calculated)
  if (recipe.config.stats) {
    return recipe.config.stats.defaultYield * recipe.config.stats.servingsPerItem
  }

  // Priority 3: fallback to 1 (treat as single serving)
  return 1
}

/**
 * Get the date of the most recent bake with cost data.
 * Returns null if no cost data exists.
 */
export function getMostRecentCostDate(recipe: Recipe): string | null {
  if (!recipe.cook_log || recipe.cook_log.length === 0) {
    return null
  }

  const entriesWithCost = recipe.cook_log
    .filter(entry => entry.cost && entry.cost.total != null)
    .sort((a, b) => b.date.localeCompare(a.date))

  if (entriesWithCost.length === 0) {
    return null
  }

  return entriesWithCost[0].date
}

/**
 * Extract major version number from a version string.
 * "v3.6.0" → 3, "v1.2.0" → 1, "1.0" → 1
 */
export function getMajorVersion(version: string): number {
  const match = version.match(/v?(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

export interface VersionAverageCost {
  total: number
  perServing: number
}

/**
 * Average cost across all bakes on the recipe's current major version.
 * Returns null if no bakes on current major version have cost data.
 */
export function getVersionAverageCost(recipe: Recipe): VersionAverageCost | null {
  if (!recipe.cook_log || recipe.cook_log.length === 0) {
    return null
  }

  const currentMajor = getMajorVersion(recipe.version)

  const matching = recipe.cook_log.filter(
    entry =>
      entry.cost &&
      entry.cost.total != null &&
      getMajorVersion(entry.version) === currentMajor
  )

  if (matching.length === 0) {
    return null
  }

  const totalSum = matching.reduce((sum, e) => sum + e.cost!.total, 0)
  const perServingSum = matching.reduce((sum, e) => sum + e.cost!.perServing, 0)

  return {
    total: Math.round((totalSum / matching.length) * 100) / 100,
    perServing: Math.round((perServingSum / matching.length) * 100) / 100,
  }
}
