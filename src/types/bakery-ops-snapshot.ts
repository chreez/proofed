/**
 * Cross-lens snapshot bundle for /sales Export (PF-256.7).
 *
 * One JSON envelope that wraps the three persisted state shapes the
 * Bakery Ops Assistant lenses read from localStorage:
 *
 *   - `productionPlan` — what's planned to bake (`bake-production-current`)
 *   - `pricing`        — per-recipe markup / price overrides (`bake-pricing-current`)
 *   - `activeSession`  — in-flight market session (`bake-sales-active`)
 *   - `history`        — closed market sessions (`bake-sales-history`)
 *
 * The exported JSON is intended for agent ingestion in future sessions — the
 * user downloads a snapshot, then later hands it to the assistant for
 * cross-lens analysis ("what sold best last 5 markets?", "plan next weekend
 * from history").
 *
 * Versioning:
 *   - `version` is a human-readable semver of the export tooling. Bump on any
 *     change to {@link BakeryOpsSnapshot}, even backwards-compatible ones.
 *   - `schema_version` is an integer ratchet — bumped only when the shape
 *     changes in a way that breaks round-trip ingestion. Importers MUST
 *     reject snapshots whose `schema_version` they don't understand.
 */
import type { ProductionPlan } from '@/types/production'
import type { PricingState } from '@/types/pricing'
import type { MarketSession } from '@/types/sales'

/** Human-readable semver of the snapshot tooling. */
export const SNAPSHOT_VERSION = '1.0.0'

/** Integer ratchet — bump only on breaking-shape changes. */
export const SCHEMA_VERSION = 1

export interface BakeryOpsSnapshot {
  /** Tooling semver (matches {@link SNAPSHOT_VERSION} at export time). */
  version: string
  /** Integer schema ratchet (matches {@link SCHEMA_VERSION} at export time). */
  schema_version: number
  /** ISO 8601 timestamp of snapshot creation. */
  generated_at: string
  /** Current production plan (entries + updated stamp). */
  productionPlan: ProductionPlan
  /** Per-recipe pricing overrides + updated stamp. */
  pricing: PricingState
  /** In-flight market session, or `null` when none is active. */
  activeSession: MarketSession | null
  /** Closed market sessions, newest first (matches `loadHistory()` order). */
  history: MarketSession[]
}
