import type { CookLogEntry, Recipe } from '@/types/recipe'

/**
 * Cook log aggregate stats helpers — shared between CookLogSection (per-recipe
 * header row) and StatsPage (dashboard calories aggregate).
 *
 * Rules (must mirror StatsPage.vue counting logic):
 * - Completed bakes filter: status !== 'in_progress'. Aberration entries count.
 * - itemsCreated: sum of (entry.actual_yield?.value ?? stats.defaultYield)
 * - servingsCreated: items × stats.servingsPerItem
 * - caloriesCreated: servings × nutrition.perServing.calories, or null when the
 *   recipe has no nutrition block. Callers decide whether to render '—' or to
 *   silently skip the recipe in an aggregate.
 *
 * Version breakdown intentionally omitted — rejected by user during the PF-41.2
 * demo review on 2026-04-08 ("i don't like that as a feature actually").
 */

export function completedBakes(cookLog: CookLogEntry[] | undefined): CookLogEntry[] {
  if (!cookLog?.length) return []
  return cookLog.filter(e => e.status !== 'in_progress')
}

export function sessionCount(cookLog: CookLogEntry[] | undefined): number {
  return completedBakes(cookLog).length
}

export function itemsCreated(
  cookLog: CookLogEntry[] | undefined,
  recipe: Pick<Recipe, 'config'> | undefined,
): number {
  const stats = recipe?.config?.stats
  if (!stats) return 0
  return completedBakes(cookLog).reduce((sum, entry) => {
    const items = entry.actual_yield?.value ?? stats.defaultYield
    return sum + items
  }, 0)
}

export function servingsCreated(
  cookLog: CookLogEntry[] | undefined,
  recipe: Pick<Recipe, 'config'> | undefined,
): number {
  const stats = recipe?.config?.stats
  if (!stats) return 0
  return itemsCreated(cookLog, recipe) * stats.servingsPerItem
}

/**
 * Returns total calories created across all completed bakes for the given
 * recipe, or null when the recipe has no nutrition block.
 */
export function caloriesCreated(
  cookLog: CookLogEntry[] | undefined,
  recipe: Pick<Recipe, 'config' | 'nutrition'> | undefined,
): number | null {
  const perServing = recipe?.nutrition?.perServing?.calories
  if (perServing == null) return null
  return servingsCreated(cookLog, recipe) * perServing
}
