/**
 * useBakeAggregates — lifetime + per-recipe aggregates for the IG share caption.
 *
 * PF-234. Mirrors StatsPage.vue aggregation: walks every recipe.cook_log[] in
 * the manifest, filters in_progress entries, sums calories/cost, groups counts
 * by recipe.config.stats.group, and reports per-recipe totals against a target
 * recipe id. Recipes without nutrition silently skipped from the cals total
 * (matches StatsPage AC #11). Aberrations excluded from typeCounts and the
 * recipeBakeCount, but counted in the lifetime daysBaked / cadence figure
 * (mirrors StatsPage calendarBakeCount semantics).
 *
 * PF-240: entries with `excludeFromStats === true` (or whose recipe sets
 * `config.excludeFromStatsDefault === true` without an explicit per-entry
 * override) are omitted from EVERY stats surface — cadence, spend, counts,
 * and calories. Independent of the aberration filter; both can apply.
 */
import { ref, type Ref } from 'vue'
import type { Recipe, RecipeManifest, CookLogEntry, RecipeConfig } from '@/types/recipe'

/**
 * PF-240. Returns true if this entry should be EXCLUDED from stats roll-ups
 * (cadence, spend, counts, calories). Resolution order:
 *   1. entry.excludeFromStats === true   → excluded
 *   2. recipeConfig.excludeFromStatsDefault === true AND entry doesn't
 *      explicitly set excludeFromStats: false → excluded
 *   3. otherwise → included (function returns false)
 *
 * Aberration is intentionally NOT consulted here (per AC #3, flags are
 * independent). Callers that also want to filter aberrations compose the
 * predicates: `isExcludedFromStats(e, cfg) || e.aberration`.
 */
export function isExcludedFromStats(
  entry: CookLogEntry,
  recipeConfig?: RecipeConfig | null,
): boolean {
  if (entry.excludeFromStats === true) return true
  if (recipeConfig?.excludeFromStatsDefault === true && entry.excludeFromStats !== false) {
    return true
  }
  return false
}

// Mirrors StatsPage.vue GROUP_ICONS — keep in sync. F45: every stats.group
// present in /public/recipes/*.json must have an entry here. 📦 fallback
// indicates a missing mapping; fix the map.
export const SHARE_GROUP_ICONS: Record<string, string> = {
  'Sourdough Breads': '\u{1F35E}',
  'Pizza': '\u{1F355}',
  'Buns & Rolls': '\u{1F9C1}',
  'Cakes': '\u{1F382}',
  'Tarts & Pies': '\u{1F967}',
  'Cookies & Bars': '\u{1F36A}',
  'Crackers & Snacks': '\u{1F968}',
  'Grain-Free Breads': '\u{1F33E}',
  'Sauces & Condiments': '\u{1F345}',
  'Noodles & Soups': '\u{1F35C}',
  'Drinks': '\u{1F9CB}',
  'Aberrations': '\u{1F525}',
}

const SHARE_GROUP_ORDER = [
  'Sourdough Breads',
  'Pizza',
  'Buns & Rolls',
  'Cakes',
  'Tarts & Pies',
  'Cookies & Bars',
  'Crackers & Snacks',
  'Grain-Free Breads',
  'Sauces & Condiments',
  'Noodles & Soups',
  'Drinks',
]

export interface GroupCount {
  label: string
  icon: string
  count: number
}

export interface BakeAggregates {
  /** Unique ISO dates with >=1 cook_log entry (normal + aberration) */
  daysBaked: number
  /** Days from earliest cook_log date through today, inclusive */
  totalDays: number
  /** round(daysBaked / totalDays * 100) — 0 if totalDays === 0 */
  percent: number
  /** Lifetime non-aberration completed bake count across all recipes */
  totalBakes: number
  /** Total lifetime calories — recipes without nutrition silently skipped */
  totalCalories: number
  /** Group-level counts, sorted DESC by count, Aberrations excluded */
  typeCounts: GroupCount[]
  /** Lifetime spend = sum of cook_log[].cost.total across all recipes */
  lifetimeSpend: number
}

export interface RecipeAggregates {
  /** Total non-aberration completed cook_log entries for this recipe */
  recipeBakeCount: number
}

/** Format calories: 421k, 1.2M, etc. Mirrors StatsPage.formatCaloriesK. */
export function formatCaloriesK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return Math.round(n).toString()
}

/** Format dollars as $X.XX */
export function formatDollars(n: number): string {
  return `$${n.toFixed(2)}`
}

/** Format typeCounts as the V3 abbreviated string: '22🍞 10🧁 6🍕' */
export function formatTypeCounts(groups: GroupCount[]): string {
  return groups.map((g) => `${g.count}${g.icon}`).join(' ')
}

/**
 * Outcome → emoji + label (caption segment).
 * Per AC #11: '✅ success' | '😐 mid' | '👎 meh' | '💥 failure'.
 */
const OUTCOME_LABELS: Record<NonNullable<CookLogEntry['outcome']>, string> = {
  success: '✅ Success',
  mid: '\u{1F610} Mid',
  meh: '\u{1F44E} Meh',
  failure: '\u{1F4A5} Failure',
}

export function formatOutcome(outcome: CookLogEntry['outcome'] | null | undefined): string | null {
  if (!outcome) return null
  return OUTCOME_LABELS[outcome] ?? null
}

// ---------------------------------------------------------------------------
// Caption builder — pure function, easy to unit-test
// ---------------------------------------------------------------------------

export interface CaptionInput {
  /** Lifetime aggregates (across all recipes) */
  aggregates: BakeAggregates
  /** Total non-aberration bakes for the current recipe */
  recipeBakeCount: number
  /** Display name for the current recipe (already shortened by caller) */
  recipeName: string
  /** User-rated outcome — null if skipped/missing */
  outcome: CookLogEntry['outcome'] | null
  /** Total cost of THIS bake — null/undefined to omit cost line */
  thisCost: number | null
  /** Per-item cost — rendered alongside thisCost when present */
  thisCostPerItem?: number | null
}

/**
 * Strip variant suffix from recipe display name. Preserves original casing.
 * "Jalapeño Cheddar Sourdough - 67% Hydration" → "Jalapeño Cheddar Sourdough"
 */
export function shortenRecipeName(name: string): string {
  return name.split(' - ')[0]
}

/**
 * Build the IG story caption per PF-234 ACs.
 *
 * Top block = bake-specific (one logical item per line, no tabs):
 *   L1: 'Bake #{N} of {shortName}{ – emoji + Outcome}'
 *   L2: 'Bake cost: 💰 ${total} total (${perItem}/item)'  [omitted if no cost]
 *
 * Bottom block = lifetime context (tab-separated within each line):
 *   L3: '{daysBaked} days baked\t({percent}% of {totalDays} days since first bake)'
 *   L4: '{totalBakes} bakes\t{typeCounts}\t🔥 {cals} cals'
 */
export function buildCaption(input: CaptionInput): string {
  const { aggregates, recipeBakeCount, recipeName, outcome, thisCost, thisCostPerItem } = input

  const outcomeSeg = formatOutcome(outcome)
  const l1 = outcomeSeg
    ? `Bake #${recipeBakeCount} of ${recipeName} – ${outcomeSeg}`
    : `Bake #${recipeBakeCount} of ${recipeName}`

  const lines = [l1]

  if (thisCost != null) {
    const costStr = thisCostPerItem != null
      ? `\u{1F4B0} ${formatDollars(thisCost)} total (${formatDollars(thisCostPerItem)}/item)`
      : `\u{1F4B0} ${formatDollars(thisCost)} total`
    lines.push(`Bake cost: ${costStr}`)
  }

  const l3 = `${aggregates.daysBaked} days baked\t(${aggregates.percent}% of ${aggregates.totalDays} days since first bake)`
  lines.push(l3)

  const totalBakesStr = `${aggregates.totalBakes} bakes`
  const calsStr = `\u{1F525} ${formatCaloriesK(aggregates.totalCalories)} cals`
  const typeCountsStr = formatTypeCounts(aggregates.typeCounts)
  const l4Parts: string[] = [totalBakesStr]
  if (typeCountsStr) l4Parts.push(typeCountsStr)
  l4Parts.push(calsStr)
  lines.push(l4Parts.join('\t'))

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Aggregation logic — pure (takes raw recipes, returns aggregates)
// ---------------------------------------------------------------------------

export interface ComputeAggregatesOptions {
  /**
   * When true (default), recipes with `config.stats.baking === false`
   * are dropped from every aggregate. The IG caption + StatsPage default
   * to baking-only; StatsPage's "Show all recipes" toggle flips this off.
   * Recipes with `baking` absent default to baking-eligible. (F44)
   */
  bakingOnly?: boolean
}

/** Compute lifetime aggregates from a list of loaded recipes. Pure. */
export function computeBakeAggregates(
  recipes: Recipe[],
  today: Date = new Date(),
  options: ComputeAggregatesOptions = {},
): BakeAggregates {
  const { bakingOnly = true } = options
  const allDates = new Set<string>()
  let totalCalories = 0
  let lifetimeSpend = 0
  const groupCounts = new Map<string, number>()

  const filteredRecipes = bakingOnly
    ? recipes.filter((r) => r.config?.stats?.baking !== false)
    : recipes

  for (const recipe of filteredRecipes) {
    const cookLog = recipe.cook_log ?? []
    // PF-240: drop entries flagged excludeFromStats (or recipe-default-excluded)
    // BEFORE every aggregate. The flag is independent of `aberration` — both
    // filters compose at the calorie + group-count sites below.
    const countable = cookLog.filter(
      (e) => e.status !== 'in_progress' && !isExcludedFromStats(e, recipe.config),
    )

    // Lifetime cadence — every countable date (still includes aberrations)
    for (const e of countable) {
      allDates.add(e.date)
    }

    // Lifetime spend — every countable entry's cost.total
    for (const e of countable) {
      if (e.cost) lifetimeSpend += e.cost.total
    }

    // Calories — recipes without nutrition silently skipped; aberrations
    // also excluded here (independent filter, layered on top of stats-exclude)
    const stats = recipe.config?.stats
    const caloriesPerServing = recipe.nutrition?.perServing?.calories ?? null
    if (stats && caloriesPerServing != null) {
      const normal = countable.filter((e) => !e.aberration)
      for (const e of normal) {
        const items = e.actual_yield?.value ?? stats.defaultYield
        const servings = items * stats.servingsPerItem
        totalCalories += servings * caloriesPerServing
      }
    }

    // Group counts — Aberrations excluded entirely (skip group)
    if (stats && stats.group !== 'Aberrations') {
      const normal = countable.filter((e) => !e.aberration)
      if (normal.length > 0) {
        groupCounts.set(stats.group, (groupCounts.get(stats.group) ?? 0) + normal.length)
      }
    }
  }

  // Build typeCounts sorted by count DESC, GROUP_ORDER as tiebreaker
  const typeCounts: GroupCount[] = []
  for (const [label, count] of groupCounts.entries()) {
    typeCounts.push({
      label,
      icon: SHARE_GROUP_ICONS[label] ?? '\u{1F4E6}',
      count,
    })
  }
  typeCounts.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    const ai = SHARE_GROUP_ORDER.indexOf(a.label)
    const bi = SHARE_GROUP_ORDER.indexOf(b.label)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  // Cadence: total days from earliest cook_log date through today inclusive
  let daysBaked = 0
  let totalDays = 0
  let percent = 0
  if (allDates.size > 0) {
    daysBaked = allDates.size
    const sorted = Array.from(allDates).sort()
    const earliest = sorted[0]
    const [ey, em, ed] = earliest.split('-').map(Number)
    const earliestDate = new Date(ey, em - 1, ed)
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const msPerDay = 24 * 60 * 60 * 1000
    const diff = Math.floor((todayMidnight.getTime() - earliestDate.getTime()) / msPerDay)
    totalDays = Math.max(1, diff + 1) // inclusive of both endpoints
    percent = Math.round((daysBaked / totalDays) * 100)
  }

  // Lifetime non-aberration bake count = sum of group counts (Aberrations excluded)
  let totalBakes = 0
  for (const c of typeCounts) totalBakes += c.count

  return {
    daysBaked,
    totalDays,
    percent,
    totalBakes,
    totalCalories,
    typeCounts,
    lifetimeSpend,
  }
}

/** Recipe-specific aggregates (count of non-aberration completed bakes).
 *  PF-240: also skips entries marked `excludeFromStats` (or recipe-default-excluded). */
export function computeRecipeAggregates(recipe: Recipe | null | undefined): RecipeAggregates {
  if (!recipe) return { recipeBakeCount: 0 }
  const cookLog = recipe.cook_log ?? []
  const recipeBakeCount = cookLog.filter(
    (e) =>
      e.status !== 'in_progress' &&
      !e.aberration &&
      !isExcludedFromStats(e, recipe.config),
  ).length
  return { recipeBakeCount }
}

// ---------------------------------------------------------------------------
// Reactive composable — loads manifest, fetches all recipes, returns aggregates
// ---------------------------------------------------------------------------

export interface UseBakeAggregatesReturn {
  isLoading: Ref<boolean>
  aggregates: Ref<BakeAggregates | null>
  load: () => Promise<void>
}

export function useBakeAggregates(): UseBakeAggregatesReturn {
  const isLoading = ref(true)
  const aggregates = ref<BakeAggregates | null>(null)

  async function load(): Promise<void> {
    isLoading.value = true
    try {
      const manifestRes = await fetch('/recipes/index.json')
      const manifest: RecipeManifest = await manifestRes.json()
      const manifestRecipes = manifest?.recipes ?? []

      const recipePromises = manifestRecipes.map(async (entry) => {
        const res = await fetch(`/recipes/${entry.file}`)
        const recipe: Recipe = await res.json()
        return recipe
      })
      const recipes = await Promise.all(recipePromises)
      aggregates.value = computeBakeAggregates(recipes)
    } catch (err) {
      console.error('Failed to load bake aggregates:', err)
      aggregates.value = null
    } finally {
      isLoading.value = false
    }
  }

  return { isLoading, aggregates, load }
}
