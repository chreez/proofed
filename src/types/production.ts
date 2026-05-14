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

/** One planned bake — a recipe + quantity + unit + provenance. */
export interface ProductionEntry {
  /** Stable opaque id (UUID-ish) used by remove/update. */
  id: string
  /** Recipe id from public/recipes/index.json. */
  recipeId: string
  /** Number of batches/units to bake. >= 1, integer or float allowed. */
  quantity: number
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
