/**
 * Pricing state + math for the /pricing route (PF-256.4 rework).
 *
 * Pure functions — caller wires reactivity at the page-component level.
 * The pricing lens reads ProductionPlan as the source of truth for what's
 * being priced; this module only persists per-recipe markup overrides and
 * provides the cost / sell-price / contribution-profit math.
 *
 * Storage:
 *   - `bake-pricing-current` — working PricingState
 */

import type { PricingPerRecipe, PricingState, RecipeId } from '@/types/pricing'
import { FALLBACK_MARKUP_PCT } from '@/types/pricing'
import type { ProductionEntry } from '@/types/production'
import type { Recipe } from '@/types/recipe'

const LS_CURRENT = 'bake-pricing-current'

function nowISO(): string {
  return new Date().toISOString()
}

/** Fresh empty pricing state. */
export function emptyPricing(): PricingState {
  return { perRecipe: {}, updated: nowISO() }
}

/**
 * Read pricing state from localStorage. Falls back to an empty state when
 * the key is absent or malformed. Defensive: shape mismatches just yield
 * the empty default rather than crashing the page.
 */
export function loadPricing(): PricingState {
  if (typeof localStorage === 'undefined') return emptyPricing()
  const raw = localStorage.getItem(LS_CURRENT)
  if (!raw) return emptyPricing()
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null) return emptyPricing()
    const p = parsed as Record<string, unknown>
    if (typeof p.updated !== 'string') return emptyPricing()
    if (typeof p.perRecipe !== 'object' || p.perRecipe === null) return emptyPricing()
    const out: PricingState['perRecipe'] = {}
    for (const [k, v] of Object.entries(p.perRecipe as Record<string, unknown>)) {
      if (typeof v === 'object' && v !== null) {
        const raw = v as Record<string, unknown>
        const markupPct = raw.markupPct
        if (typeof markupPct === 'number' && Number.isFinite(markupPct)) {
          const entry: PricingPerRecipe = { markupPct }
          const sold = raw.estimatedSoldUnits
          if (typeof sold === 'number' && Number.isFinite(sold) && sold >= 0) {
            entry.estimatedSoldUnits = sold
          }
          const override = raw.sellPriceOverride
          if (typeof override === 'number' && Number.isFinite(override) && override > 0) {
            entry.sellPriceOverride = override
          }
          out[k] = entry
        }
      }
    }
    return { perRecipe: out, updated: p.updated }
  } catch {
    return emptyPricing()
  }
}

/** Persist pricing state to localStorage; bumps `updated`. */
export function savePricing(state: PricingState): PricingState {
  const bumped: PricingState = { ...state, updated: nowISO() }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LS_CURRENT, JSON.stringify(bumped))
  }
  return bumped
}

/**
 * Resolve the markup% for a recipe — override if present, otherwise
 * {@link FALLBACK_MARKUP_PCT}.
 */
export function getMarkupPct(state: PricingState, recipeId: RecipeId): number {
  return state.perRecipe[recipeId]?.markupPct ?? FALLBACK_MARKUP_PCT
}

/**
 * Set the markup% override for a recipe. Pure — returns a new PricingState.
 * Caller is responsible for calling {@link savePricing} if persistence is desired.
 *
 * Preserves any existing `estimatedSoldUnits` override on the same recipe.
 */
export function setMarkupPct(
  state: PricingState,
  recipeId: RecipeId,
  pct: number,
): PricingState {
  const prev = state.perRecipe[recipeId]
  const next: PricingPerRecipe = { ...(prev ?? {}), markupPct: pct }
  return {
    ...state,
    perRecipe: { ...state.perRecipe, [recipeId]: next },
    updated: nowISO(),
  }
}

/**
 * Resolve the estimated sold units for a recipe — override if set, otherwise
 * `defaultUnits` (typically the full bake's `unitsPerBake`).
 */
export function getEstimatedSold(
  state: PricingState,
  recipeId: RecipeId,
  defaultUnits: number,
): number {
  const override = state.perRecipe[recipeId]?.estimatedSoldUnits
  if (typeof override === 'number' && Number.isFinite(override) && override >= 0) {
    return override
  }
  return defaultUnits
}

/**
 * Set the estimated-sold-units override for a recipe. Pure.
 *
 * Pass `null` (or omit) to clear the override and revert to the default
 * (sell-all-units) behavior. Preserves any existing `markupPct` on the recipe.
 */
export function setEstimatedSold(
  state: PricingState,
  recipeId: RecipeId,
  units: number | null,
): PricingState {
  const prev = state.perRecipe[recipeId]
  const base: PricingPerRecipe = {
    markupPct: prev?.markupPct ?? FALLBACK_MARKUP_PCT,
  }
  if (units != null && Number.isFinite(units) && units >= 0) {
    base.estimatedSoldUnits = units
  }
  return {
    ...state,
    perRecipe: { ...state.perRecipe, [recipeId]: base },
    updated: nowISO(),
  }
}

/**
 * Resolve the absolute sell-price override for a recipe.
 *
 * Returns the override dollar amount when set (must be > 0 and finite),
 * otherwise `null`. Callers use the null sentinel to fall back to
 * markup-derived pricing.
 */
export function getSellPriceOverride(
  state: PricingState,
  recipeId: RecipeId,
): number | null {
  const v = state.perRecipe[recipeId]?.sellPriceOverride
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v
  return null
}

/**
 * Set or clear the absolute sell-price override for a recipe.
 *
 * Pass `null` (or any non-positive / non-finite value) to clear and revert
 * to markup-derived pricing. Preserves existing `markupPct` and
 * `estimatedSoldUnits` on the recipe.
 */
export function setSellPriceOverride(
  state: PricingState,
  recipeId: RecipeId,
  value: number | null,
): PricingState {
  const prev = state.perRecipe[recipeId]
  const next: PricingPerRecipe = {
    markupPct: prev?.markupPct ?? FALLBACK_MARKUP_PCT,
  }
  if (prev?.estimatedSoldUnits != null) next.estimatedSoldUnits = prev.estimatedSoldUnits
  if (value != null && Number.isFinite(value) && value > 0) {
    next.sellPriceOverride = value
  }
  return {
    ...state,
    perRecipe: { ...state.perRecipe, [recipeId]: next },
    updated: nowISO(),
  }
}

/**
 * Whole-dollar snap. Rounds to the nearest dollar, with a floor of $1 so
 * we never advertise "$0" sell prices when the markup math underwhelms.
 * Replaces PF-255.1's pretty-pricing breakpoints — user feedback was that
 * .99/.95 endings felt gimmicky for a personal bakery.
 */
export function wholeDollarSnap(price: number): number {
  if (!Number.isFinite(price)) return 1
  return Math.max(1, Math.round(price))
}

/**
 * Effective units for a production entry — `yieldOverride` wins when set,
 * otherwise `batches × baseYield` (parsed from `meta.yields`).
 */
export function unitsForEntry(
  recipe: Recipe | null | undefined,
  entry: ProductionEntry,
  parseBaseYield: (s: string | undefined | null) => number,
): number {
  if (typeof entry.yieldOverride === 'number' && entry.yieldOverride > 0) {
    return entry.yieldOverride
  }
  const base = parseBaseYield(recipe?.meta?.yields)
  return Math.max(1, entry.batches) * base
}

/**
 * Cost-per-unit resolution.
 *
 * 1. Prefer most-recent `cook_log[].cost.total` (real bake spend).
 * 2. Fall back to `recipe.estimatedCost.total` (recipe-card estimate).
 * 3. Return `null` when neither is available so the row can render a
 *    "no cost data" sentinel rather than blocking.
 *
 * Per-unit math: `totalBatchCost / units`, where units accounts for any
 * yieldOverride on the production entry.
 */
export function costPerUnit(
  recipe: Recipe | null | undefined,
  entry: ProductionEntry,
  parseBaseYield: (s: string | undefined | null) => number,
): number | null {
  if (!recipe) return null
  const cookLog = Array.isArray(recipe.cook_log) ? recipe.cook_log : []
  // Walk back from the end — cook_log is appended in chronological order.
  let totalBatchCost: number | null = null
  for (let i = cookLog.length - 1; i >= 0; i -= 1) {
    const c = cookLog[i]?.cost
    if (c && typeof c.total === 'number' && Number.isFinite(c.total) && c.total > 0) {
      totalBatchCost = c.total
      break
    }
  }
  if (totalBatchCost == null) {
    const est = recipe.estimatedCost?.total
    if (typeof est === 'number' && Number.isFinite(est) && est > 0) {
      totalBatchCost = est
    }
  }
  if (totalBatchCost == null) return null
  const units = unitsForEntry(recipe, entry, parseBaseYield)
  if (units <= 0) return null
  const batches = Math.max(1, entry.batches)
  // Total ingredient spend scales with batches; cost per unit is the total
  // spend across all batches divided by total units produced.
  return (totalBatchCost * batches) / units
}

/**
 * Sell price per unit = raw decimal `costPerUnit × (1 + markupPct/100)`.
 *
 * Returns the unrounded value; presentation rounds to 2 decimals. A floor of
 * $0.01 keeps downstream math non-zero when the markup math underwhelms.
 * Use {@link nearestPretty} for the "human-friendly" hint anchor.
 */
export function sellPrice(costPerUnitValue: number, markupPct: number): number {
  if (!Number.isFinite(costPerUnitValue) || costPerUnitValue <= 0) return 0.01
  const raw = costPerUnitValue * (1 + markupPct / 100)
  if (!Number.isFinite(raw) || raw <= 0) return 0.01
  return raw
}

/**
 * Reverse-engineer markup% from an absolute sell price and cost.
 *
 *   markup% = (sell − cost) / cost × 100
 *
 * Returns `null` when inputs are non-positive or non-finite — keeps the
 * "derived: N%" UI affordance from rendering garbage. Used by PricingRow
 * when a sellPriceOverride is active so the markup slider can show the
 * implied percent even though it's read-only.
 */
export function derivedMarkupPct(
  sellPriceValue: number,
  costPerUnitValue: number,
): number | null {
  if (!Number.isFinite(sellPriceValue) || !Number.isFinite(costPerUnitValue)) return null
  if (costPerUnitValue <= 0) return null
  return ((sellPriceValue - costPerUnitValue) / costPerUnitValue) * 100
}

/**
 * Nearest human-friendly anchor — rounds to the nearest multiple of 0.50,
 * floored at 0.50. So $1.27 → $1.50, $1.74 → $1.50, $1.80 → $2.00, $0.20 → $0.50.
 *
 * Used to surface a "≈ $X.50" hint alongside the raw decimal sell price.
 */
export function nearestPretty(price: number): number {
  if (!Number.isFinite(price)) return 0.5
  const snapped = Math.round(price * 2) / 2
  return Math.max(0.5, snapped)
}

/**
 * Pair the raw price with its nearest pretty anchor and the percent delta
 * between them. `deltaPct` is signed: positive means the pretty value is
 * above the raw, negative means below.
 *
 * When raw is non-positive (or invalid) returns a zero-delta default at 0.50.
 */
export function prettyDelta(price: number): { pretty: number; deltaPct: number } {
  if (!Number.isFinite(price) || price <= 0) {
    return { pretty: 0.5, deltaPct: 0 }
  }
  const pretty = nearestPretty(price)
  const deltaPct = ((pretty - price) / price) * 100
  return { pretty, deltaPct }
}

/**
 * Sales needed to recover the full batch ingredient cost.
 *
 * Returns `ceil(totalBatchCost / sellPricePerUnit)`, or `null` when either
 * input is missing, non-positive, or non-finite. Useful for the "break even:
 * sell N of M" hint in the row.
 */
export function salesToBreakEven(
  totalBatchCost: number | null | undefined,
  sellPricePerUnit: number | null | undefined,
): number | null {
  if (totalBatchCost == null || sellPricePerUnit == null) return null
  if (!Number.isFinite(totalBatchCost) || !Number.isFinite(sellPricePerUnit)) return null
  if (totalBatchCost <= 0 || sellPricePerUnit <= 0) return null
  return Math.ceil(totalBatchCost / sellPricePerUnit)
}

/**
 * Contribution-profit decomposition for a single unit.
 *
 * `cp` is sell-minus-cost in dollars; `cpPct` is the share of sell price that
 * is profit (0–1). When sell price is 0 the percentage falls back to 0 to
 * avoid NaN propagation in the header summary.
 */
export function cp(sellPriceValue: number, costPerUnitValue: number): {
  cp: number
  cpPct: number
} {
  const dollar = sellPriceValue - costPerUnitValue
  const pct = sellPriceValue > 0 ? dollar / sellPriceValue : 0
  return { cp: dollar, cpPct: pct }
}
