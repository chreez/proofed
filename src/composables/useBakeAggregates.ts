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
 */
import { ref, type Ref } from 'vue'
import type { Recipe, RecipeManifest, CookLogEntry } from '@/types/recipe'

// Mirrors StatsPage.vue lines 69-78 — keep in sync.
export const SHARE_GROUP_ICONS: Record<string, string> = {
  'Sourdough Breads': '\u{1F35E}',
  'Pizza': '\u{1F355}',
  'Buns & Rolls': '\u{1F9C1}',
  'Cakes': '\u{1F382}',
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

/** Compute lifetime aggregates from a list of loaded recipes. Pure. */
export function computeBakeAggregates(recipes: Recipe[], today: Date = new Date()): BakeAggregates {
  const allDates = new Set<string>()
  let totalCalories = 0
  let lifetimeSpend = 0
  const groupCounts = new Map<string, number>()

  for (const recipe of recipes) {
    const cookLog = recipe.cook_log ?? []
    const completed = cookLog.filter((e) => e.status !== 'in_progress')

    // Lifetime cadence — ALL completed dates, including aberrations
    for (const e of completed) {
      allDates.add(e.date)
    }

    // Lifetime spend — every completed entry's cost.total
    for (const e of completed) {
      if (e.cost) lifetimeSpend += e.cost.total
    }

    // Calories — recipes without nutrition silently skipped
    const stats = recipe.config?.stats
    const caloriesPerServing = recipe.nutrition?.perServing?.calories ?? null
    if (stats && caloriesPerServing != null) {
      const normal = completed.filter((e) => !e.aberration)
      for (const e of normal) {
        const items = e.actual_yield?.value ?? stats.defaultYield
        const servings = items * stats.servingsPerItem
        totalCalories += servings * caloriesPerServing
      }
    }

    // Group counts — Aberrations excluded entirely (skip group)
    if (stats && stats.group !== 'Aberrations') {
      const normal = completed.filter((e) => !e.aberration)
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

/** Recipe-specific aggregates (count of non-aberration completed bakes) */
export function computeRecipeAggregates(recipe: Recipe | null | undefined): RecipeAggregates {
  if (!recipe) return { recipeBakeCount: 0 }
  const cookLog = recipe.cook_log ?? []
  const recipeBakeCount = cookLog.filter(
    (e) => e.status !== 'in_progress' && !e.aberration,
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
