/**
 * Pricing profile schema for the /pricing route (PF-255 epic).
 *
 * Separated from `recipe.ts` to keep recipe-data concerns isolated from
 * pricing/business-logic concerns. See `backlog/tasks/pf-255.5-design-notes.md`
 * for the full design rationale.
 */

/**
 * Recipe identifier — string matching `RecipeEntry.id` from
 * `public/recipes/index.json`. Aliased here for self-documentation;
 * the codebase passes recipe ids as bare strings elsewhere.
 */
export type RecipeId = string

/**
 * Per-recipe pricing override. All fields optional — absent fields fall
 * back to `PricingProfile.default` (see `resolveMarkupPct`).
 */
export interface PerRecipePricing {
  /** Markup percentage applied to ingredient cost. Allowed range: 0–500. */
  markupPct?: number
  /**
   * Hard sell-price override in dollars. When present, takes precedence
   * over the computed (cost × markup) price and the pretty-price snap —
   * the user has manually locked this price.
   */
  sellPrice?: number
  /** Free-form user note (e.g. "matches Goodall's $9 retail"). */
  notes?: string
}

/** Profile-wide defaults, shared across recipes that don't have an override. */
export interface PricingProfileDefaults {
  /** Default markup percentage used when a recipe has no override. */
  markupPct: number
  // Reserved for future expansion — keep additive only:
  // laborRatePerHour?: number   // PF-255.3 throughput modeling
  // overheadPerBake?: number    // fixed cost per bake (utilities, etc.)
  // currency?: 'USD' | 'EUR'    // currently USD-only; add when needed
}

/**
 * Top-level pricing profile. Serialized to JSON for export/import and for
 * the committed default at `public/profiles/pricing/default.json`.
 */
export interface PricingProfile {
  /** Display name. Drives the slugified filename on export. */
  name: string
  /** Profile schema version (semver). Independent of recipe versions. */
  version: string
  /** ISO 8601 date of profile creation. Set once, never auto-mutated. */
  created: string
  /** ISO 8601 date of last save/export. Updated on every write. */
  updated: string
  /** Profile-wide defaults — fallback when perRecipe entry is absent. */
  default: PricingProfileDefaults
  /** Per-recipe overrides keyed by recipe id. */
  perRecipe: Record<RecipeId, PerRecipePricing>
}

/** Hardcoded fallback markup percent, used when the profile lacks a default. */
export const FALLBACK_MARKUP_PCT = 65
