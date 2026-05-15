/**
 * Pricing state for the /pricing route (PF-256.4 rework).
 *
 * Replaces the original PF-255.1 PricingProfile model. The new pricing lens is
 * a thin layer over `ProductionPlan` — per-recipe markup overrides only.
 * Costs come from recipe JSON (`cook_log[].cost.total` → `estimatedCost.total`)
 * and unit math comes from the active production entry, not from this state.
 */

/**
 * Recipe identifier — string matching `RecipeEntry.id` from
 * `public/recipes/index.json`.
 */
export type RecipeId = string

/**
 * Per-recipe pricing override. `markupPct` is the required field;
 * `estimatedSoldUnits` is optional — when undefined the caller assumes the
 * full bake will sell (defaultUnits === unitsPerBake). When set explicitly,
 * the value is used in revenue math (sell × estimatedSoldUnits) while cost
 * stays sunk on the entire batch (cost × unitsPerBake).
 *
 * `sellPriceOverride` is the "by-feel" escape hatch — when set, the row
 * ignores the markup% math entirely and uses this absolute dollar amount as
 * the per-unit sell price. Lets us price a $1.27/loaf sourdough at $18 the
 * way a real cottage bakery would, without trying to express that as a
 * 1300%+ markup. `null` (or omitted) means "compute from markupPct".
 */
export interface PricingPerRecipe {
  markupPct: number
  /** Override for "how many units will actually sell". Undefined = sell all. */
  estimatedSoldUnits?: number
  /**
   * Absolute per-unit sell price. When set, takes precedence over
   * `markupPct`-derived pricing. `null` or undefined = no override.
   */
  sellPriceOverride?: number | null
}

/**
 * Persisted pricing state. Stored at localStorage key `bake-pricing-current`.
 *
 * `perRecipe` is keyed by recipe id and carries the user-set markup percent
 * for that recipe. Recipes without an override fall back to
 * {@link FALLBACK_MARKUP_PCT}.
 */
export interface PricingState {
  perRecipe: Record<RecipeId, PricingPerRecipe>
  /** ISO 8601 timestamp; bumped on every save. */
  updated: string
}

/**
 * Default markup percent applied when a recipe has no override. 150% lines up
 * with the cottage-bakery rule-of-thumb used elsewhere in the docs and gives
 * a sensible mid-range starting point on the 50–300 slider.
 */
export const FALLBACK_MARKUP_PCT = 150
