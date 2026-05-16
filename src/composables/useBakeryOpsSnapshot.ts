/**
 * Cross-lens snapshot helpers for /sales Export (PF-256.7).
 *
 * Bundles ProductionPlan + PricingState + active MarketSession + history into a
 * single JSON envelope, downloads it as `bakery-ops-{date}.json`, and round-
 * trips back via {@link importBakeryOpsSnapshot} → {@link applyBakeryOpsSnapshot}.
 *
 * Apply is intentionally a separate step so importing is non-destructive by
 * default — the caller can inspect the parsed snapshot before writing it back
 * to localStorage.
 */

import type { BakeryOpsSnapshot } from '@/types/bakery-ops-snapshot'
import { SNAPSHOT_VERSION, SCHEMA_VERSION } from '@/types/bakery-ops-snapshot'
import type { ProductionPlan } from '@/types/production'
import type { PricingState } from '@/types/pricing'
import type { MarketSession } from '@/types/sales'

import { loadPlan } from '@/composables/useProductionPlan'
import { loadPricing } from '@/composables/usePricing'
import { loadActiveSession, loadHistory } from '@/composables/useSales'

// Storage keys — mirror the source modules so applyBakeryOpsSnapshot writes
// back to the same locations the load* helpers read from.
const LS_PRODUCTION = 'bake-production-current'
const LS_PRICING = 'bake-pricing-current'
const LS_SALES_ACTIVE = 'bake-sales-active'
const LS_SALES_HISTORY = 'bake-sales-history'

function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Assemble a snapshot from the currently-persisted state across all four
 * load* helpers. The four reads run synchronously against localStorage —
 * caller is responsible for awaiting anything else (e.g. manifest hydration)
 * if the snapshot needs to reference recipe metadata not in localStorage.
 */
export function exportBakeryOpsSnapshot(): BakeryOpsSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    schema_version: SCHEMA_VERSION,
    generated_at: nowISO(),
    productionPlan: loadPlan(),
    pricing: loadPricing(),
    activeSession: loadActiveSession(),
    history: loadHistory(),
  }
}

/**
 * Format the snapshot date in `YYYY-MM-DD` using the local timezone.
 * Exported for tests; not part of the public surface but kept stable.
 */
export function snapshotDateSlug(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) {
    // Fall back to today if the timestamp is unparseable.
    const today = new Date()
    return formatDateSlug(today)
  }
  return formatDateSlug(d)
}

function formatDateSlug(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Trigger a browser download of the snapshot as `bakery-ops-{YYYY-MM-DD}.json`.
 *
 * Uses the standard Blob + object URL + anchor click pattern. The anchor is
 * created off-DOM, so no visible UI artifact is produced. Cleans up the
 * object URL after the click to avoid leaking.
 *
 * Safe to call from SSR / non-browser environments — bails silently when the
 * required globals are absent.
 */
export function downloadSnapshot(snapshot: BakeryOpsSnapshot): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return
  if (typeof URL.createObjectURL !== 'function') return
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const href = URL.createObjectURL(blob)
  const slug = snapshotDateSlug(snapshot.generated_at)
  const filename = `bakery-ops-${slug}.json`
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.rel = 'noopener'
  // Some environments (Safari) need the anchor in the DOM before click().
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  if (typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(href)
  }
}

// ──────────────────────────────────────────────
// Import (validation only — no localStorage writes)
// ──────────────────────────────────────────────

/**
 * Validate a parsed JSON value against the {@link BakeryOpsSnapshot} shape.
 * Throws `Error` (with a precise reason) when the shape is wrong; returns the
 * typed snapshot on success. Does NOT write to localStorage — call
 * {@link applyBakeryOpsSnapshot} for that.
 *
 * Validation is structural, not deep — we trust the inner load* helpers to
 * re-validate per-entry shapes when the snapshot is applied. The goal here is
 * to reject obvious garbage (wrong schema version, missing top-level fields,
 * wrong array/object kinds) before writing destructively to localStorage.
 */
export function importBakeryOpsSnapshot(json: unknown): BakeryOpsSnapshot {
  if (typeof json !== 'object' || json === null) {
    throw new Error('snapshot must be an object')
  }
  const s = json as Record<string, unknown>

  if (typeof s.version !== 'string' || !s.version) {
    throw new Error('snapshot.version missing')
  }
  if (typeof s.schema_version !== 'number' || !Number.isFinite(s.schema_version)) {
    throw new Error('snapshot.schema_version missing')
  }
  if (s.schema_version !== SCHEMA_VERSION) {
    throw new Error(
      `snapshot.schema_version ${s.schema_version} not supported (expected ${SCHEMA_VERSION})`,
    )
  }
  if (typeof s.generated_at !== 'string' || !s.generated_at) {
    throw new Error('snapshot.generated_at missing')
  }
  if (typeof s.productionPlan !== 'object' || s.productionPlan === null) {
    throw new Error('snapshot.productionPlan missing')
  }
  if (typeof s.pricing !== 'object' || s.pricing === null) {
    throw new Error('snapshot.pricing missing')
  }
  // activeSession is nullable — accept null or object, reject anything else.
  if (s.activeSession !== null && (typeof s.activeSession !== 'object')) {
    throw new Error('snapshot.activeSession must be object or null')
  }
  if (!Array.isArray(s.history)) {
    throw new Error('snapshot.history must be an array')
  }

  return {
    version: s.version,
    schema_version: s.schema_version,
    generated_at: s.generated_at,
    productionPlan: s.productionPlan as ProductionPlan,
    pricing: s.pricing as PricingState,
    activeSession: (s.activeSession as MarketSession | null) ?? null,
    history: s.history as MarketSession[],
  }
}

// ──────────────────────────────────────────────
// Apply (destructive — writes to localStorage)
// ──────────────────────────────────────────────

/**
 * Write each section of the snapshot to its respective localStorage key.
 *
 * Destructive overwrite — caller should confirm with the user before invoking.
 * The four keys touched are the same ones the load* helpers read:
 *   - `bake-production-current`
 *   - `bake-pricing-current`
 *   - `bake-sales-active` (removed when snapshot.activeSession is null)
 *   - `bake-sales-history`
 *
 * Round-trip guarantee: calling `applyBakeryOpsSnapshot(s)` then re-reading
 * via load* helpers returns state equivalent to the snapshot (modulo the
 * per-entry validators' tolerant normalisation).
 */
export function applyBakeryOpsSnapshot(snapshot: BakeryOpsSnapshot): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LS_PRODUCTION, JSON.stringify(snapshot.productionPlan))
  localStorage.setItem(LS_PRICING, JSON.stringify(snapshot.pricing))
  if (snapshot.activeSession) {
    localStorage.setItem(LS_SALES_ACTIVE, JSON.stringify(snapshot.activeSession))
  } else {
    localStorage.removeItem(LS_SALES_ACTIVE)
  }
  localStorage.setItem(LS_SALES_HISTORY, JSON.stringify(snapshot.history))
}
