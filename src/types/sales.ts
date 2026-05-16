/**
 * Sales lens types — Slice 6.x of PF-256 Bakery Ops Assistant.
 *
 * Closes the farmers-market loop: bake → price → label → sell → record. A
 * MarketSession is a single market-day snapshot of the production plan plus
 * the per-recipe sell prices that were active when the session opened.
 *
 * PF-256.6 reshapes the session from aggregate-per-recipe (`sales: SaleEntry[]`)
 * to per-transaction tracking (`transactions: SalesTransaction[]`). Each
 * customer interaction is one transaction with line items. Aggregate sold-units
 * per recipe is derived from the transactions, not stored.
 *
 * `initialPlan` and `transactions[].items[].unitPrice` are frozen at session
 * open / transaction record time — historical sessions always render with the
 * snapshot they used, not the current /production or /pricing state.
 */
import type { RecipeId } from '@/types/pricing'

/**
 * Legacy aggregate sale row — kept for backwards compatibility on closed
 * sessions written before PF-256.6. New sessions do not write this field.
 */
export interface SaleEntry {
  recipeId: RecipeId
  /** Snapshot of units this entry was planned to produce at session open. */
  plannedUnits: number
  /** User-edited sold count. Can exceed plannedUnits if the user restocked. */
  soldUnits: number
  /** Snapshot of sellPrice (decimal $) at session open. */
  unitPrice: number
  /** Optional per-row notes. */
  notes?: string
}

/**
 * Snapshot of the production plan + sell-price state at session open.
 * Drives the "available" line in the New Sale sheet and the
 * by-recipe aggregate view.
 */
export interface PlanSnapshot {
  recipeId: RecipeId
  plannedUnits: number
  unitPrice: number
}

/**
 * A single line in a sales transaction: which recipe, how many units, at
 * what unit price (snapshot from session pricing, user-editable per-line),
 * and the computed line total (units × unitPrice).
 */
export interface TransactionItem {
  recipeId: RecipeId
  units: number
  /** Snapshot at sale time; editable per-line (discount, override). */
  unitPrice: number
  /** Computed: units × unitPrice. Stored so historical totals don't drift. */
  lineTotal: number
}

/**
 * One customer interaction. Generated when the user completes a New Sale
 * sheet; deletable as a unit (basic undo).
 */
export interface SalesTransaction {
  /** Stable opaque id (crypto.randomUUID()). */
  id: string
  /** ISO 8601 timestamp when the sale was recorded. */
  occurredAt: string
  items: TransactionItem[]
  /** Sum of items[].lineTotal. */
  totalAsk: number
  notes?: string
}

export interface MarketSession {
  /** Stable opaque id (crypto.randomUUID()). */
  id: string
  /** ISO 8601 timestamp at session open. */
  openedAt: string
  /** ISO 8601 timestamp at session close. Absent while active. */
  closedAt?: string
  /** Optional human label (e.g. "Saturday Market 5/17"). */
  label?: string
  /**
   * Plan + pricing snapshot taken at session open. Drives the New Sale sheet
   * (recipe list with available units) and the by-recipe aggregate view.
   * Absent on legacy (pre-PF-256.6) sessions.
   */
  initialPlan?: PlanSnapshot[]
  /**
   * Per-customer transactions, append-only during the session. Absent on
   * legacy sessions; an empty array means the session has no recorded sales
   * yet.
   */
  transactions?: SalesTransaction[]
  /**
   * Legacy aggregate-per-recipe view. Kept for read-only rendering of
   * closed sessions written before PF-256.6. New sessions omit this field.
   */
  sales?: SaleEntry[]
}
