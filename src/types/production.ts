/**
 * Production plan types — Slice 0 of PF-256 Bakery Ops Assistant epic.
 *
 * Shared state for the /production route. Every downstream lens (price,
 * labels, schedule, sell, financials, data health) reads from this shape.
 *
 * Provenance: `addedBy` mirrors the `StateNote.source` convention in
 * `recipe.ts` — `'user'` for human input, `'agent'` for agent-skill writes.
 */

/** Where the entry originated. Mirrors StateNote.source. */
export type Provenance = 'user' | 'agent'

/**
 * One planned bake — a recipe + batch count + optional yield override + unit
 * + provenance.
 *
 * Yield resolution:
 *  - `yieldOverride === null`  → effective yield = batches × baseYield (scaled)
 *  - `yieldOverride === N`     → effective yield = N (absolute override)
 *
 * `batches` always reflects whole-recipe multiples (>= 1, integer). The
 * override exists so users can ask for arbitrary counts (e.g. "15 buns from
 * an 8-bun recipe") without lying about batch math.
 */
export interface ProductionEntry {
  /** Stable opaque id (UUID-ish) used by remove/update. */
  id: string
  /** Recipe id from public/recipes/index.json. */
  recipeId: string
  /** Number of whole batches to bake. Integer, >= 1. Default 1. */
  batches: number
  /**
   * Absolute yield override (e.g. 15 buns). `null` means "use batches ×
   * baseYield". Integer, >= 1 when set.
   */
  yieldOverride: number | null
  /** Free-form per-recipe label (e.g. "roll", "loaf", "cookie"). */
  unit: string
  /** Provenance flag — who/what added this entry. */
  addedBy: Provenance
  /** ISO 8601 timestamp at entry creation. */
  addedAt: string
}

/** The full production plan — list of entries + last-updated stamp. */
export interface ProductionPlan {
  entries: ProductionEntry[]
  /** ISO 8601 timestamp; bumped on every save. */
  updated: string
}
