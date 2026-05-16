/**
 * Sales state + persistence for the /sales route (PF-256.6 Slice 6.x).
 *
 * Pure functions over localStorage — caller wires reactivity at the page
 * component level. Mirrors useProductionPlan / usePricing module shape.
 *
 * Storage:
 *   - `bake-sales-active`  — at most one MarketSession (working session).
 *   - `bake-sales-history` — MarketSession[] of closed sessions, capped at
 *                            HISTORY_CAP, sorted newest first by closedAt.
 *
 * Schema migration:
 *   - PF-256.5 wrote `sales: SaleEntry[]` aggregate-per-recipe.
 *   - PF-256.6 writes `initialPlan: PlanSnapshot[]` + `transactions: SalesTransaction[]`.
 *   - Loaders tolerate both shapes; aggregates fall back to `sales[]` when
 *     no transactions are present.
 */

import type {
  MarketSession,
  PlanSnapshot,
  SaleEntry,
  SalesTransaction,
  TransactionItem,
} from '@/types/sales'
import type { RecipeId } from '@/types/pricing'

const LS_ACTIVE = 'bake-sales-active'
const LS_HISTORY = 'bake-sales-history'

/** Maximum number of closed sessions retained in history. */
export const HISTORY_CAP = 50

function nowISO(): string {
  return new Date().toISOString()
}

/** Generate a stable id. Falls back to a random string when crypto is absent. */
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sale-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// ──────────────────────────────────────────────
// Validators
// ──────────────────────────────────────────────

function validateSaleEntry(raw: unknown): SaleEntry | null {
  if (typeof raw !== 'object' || raw === null) return null
  const e = raw as Record<string, unknown>
  if (typeof e.recipeId !== 'string' || !e.recipeId) return null
  if (typeof e.plannedUnits !== 'number' || !Number.isFinite(e.plannedUnits)) return null
  if (typeof e.soldUnits !== 'number' || !Number.isFinite(e.soldUnits)) return null
  if (typeof e.unitPrice !== 'number' || !Number.isFinite(e.unitPrice)) return null
  const entry: SaleEntry = {
    recipeId: e.recipeId,
    plannedUnits: Math.max(0, Math.floor(e.plannedUnits)),
    soldUnits: Math.max(0, Math.floor(e.soldUnits)),
    unitPrice: e.unitPrice,
  }
  if (typeof e.notes === 'string' && e.notes) entry.notes = e.notes
  return entry
}

function validatePlanSnapshot(raw: unknown): PlanSnapshot | null {
  if (typeof raw !== 'object' || raw === null) return null
  const e = raw as Record<string, unknown>
  if (typeof e.recipeId !== 'string' || !e.recipeId) return null
  if (typeof e.plannedUnits !== 'number' || !Number.isFinite(e.plannedUnits)) return null
  if (typeof e.unitPrice !== 'number' || !Number.isFinite(e.unitPrice)) return null
  return {
    recipeId: e.recipeId,
    plannedUnits: Math.max(0, Math.floor(e.plannedUnits)),
    unitPrice: e.unitPrice,
  }
}

function validateTransactionItem(raw: unknown): TransactionItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const e = raw as Record<string, unknown>
  if (typeof e.recipeId !== 'string' || !e.recipeId) return null
  if (typeof e.units !== 'number' || !Number.isFinite(e.units)) return null
  if (typeof e.unitPrice !== 'number' || !Number.isFinite(e.unitPrice)) return null
  const units = Math.max(0, Math.floor(e.units))
  const unitPrice = e.unitPrice
  const lineTotal =
    typeof e.lineTotal === 'number' && Number.isFinite(e.lineTotal) ? e.lineTotal : units * unitPrice
  return { recipeId: e.recipeId, units, unitPrice, lineTotal }
}

function validateTransaction(raw: unknown): SalesTransaction | null {
  if (typeof raw !== 'object' || raw === null) return null
  const e = raw as Record<string, unknown>
  if (typeof e.id !== 'string' || !e.id) return null
  if (typeof e.occurredAt !== 'string' || !e.occurredAt) return null
  if (!Array.isArray(e.items)) return null
  const items: TransactionItem[] = []
  for (const it of e.items) {
    const item = validateTransactionItem(it)
    if (item) items.push(item)
  }
  const totalAsk =
    typeof e.totalAsk === 'number' && Number.isFinite(e.totalAsk)
      ? e.totalAsk
      : items.reduce((acc, i) => acc + i.lineTotal, 0)
  const tx: SalesTransaction = { id: e.id, occurredAt: e.occurredAt, items, totalAsk }
  if (typeof e.notes === 'string' && e.notes) tx.notes = e.notes
  return tx
}

/** Validate raw JSON against the MarketSession shape. Returns null when malformed. */
function validateSession(raw: unknown): MarketSession | null {
  if (typeof raw !== 'object' || raw === null) return null
  const s = raw as Record<string, unknown>
  if (typeof s.id !== 'string' || !s.id) return null
  if (typeof s.openedAt !== 'string' || !s.openedAt) return null

  const session: MarketSession = { id: s.id, openedAt: s.openedAt }

  // New (PF-256.6) shape: initialPlan + transactions
  if (Array.isArray(s.initialPlan)) {
    const initialPlan: PlanSnapshot[] = []
    for (const p of s.initialPlan) {
      const snap = validatePlanSnapshot(p)
      if (snap) initialPlan.push(snap)
    }
    session.initialPlan = initialPlan
  }
  if (Array.isArray(s.transactions)) {
    const transactions: SalesTransaction[] = []
    for (const t of s.transactions) {
      const tx = validateTransaction(t)
      if (tx) transactions.push(tx)
    }
    session.transactions = transactions
  }

  // Legacy (PF-256.5) shape: sales[] aggregate
  if (Array.isArray(s.sales)) {
    const sales: SaleEntry[] = []
    for (const item of s.sales) {
      const entry = validateSaleEntry(item)
      if (entry) sales.push(entry)
    }
    session.sales = sales
  }

  // Reject if neither shape present (no usable session data).
  if (!session.initialPlan && !session.transactions && !session.sales) return null

  if (typeof s.closedAt === 'string' && s.closedAt) session.closedAt = s.closedAt
  if (typeof s.label === 'string' && s.label) session.label = s.label
  return session
}

// ──────────────────────────────────────────────
// Active session
// ──────────────────────────────────────────────

/**
 * Read the active session from localStorage. Returns null when absent or
 * malformed.
 */
export function loadActiveSession(): MarketSession | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(LS_ACTIVE)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return validateSession(parsed)
  } catch {
    return null
  }
}

/** Persist the active session. */
export function saveActiveSession(session: MarketSession): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LS_ACTIVE, JSON.stringify(session))
}

/** Remove the active session from localStorage. */
export function clearActiveSession(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(LS_ACTIVE)
}

// ──────────────────────────────────────────────
// History
// ──────────────────────────────────────────────

/**
 * Read the history list. Returns an empty array when absent or malformed.
 * Result is sorted by closedAt descending (newest first).
 */
export function loadHistory(): MarketSession[] {
  if (typeof localStorage === 'undefined') return []
  const raw = localStorage.getItem(LS_HISTORY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const out: MarketSession[] = []
    for (const item of parsed) {
      const s = validateSession(item)
      if (s && s.closedAt) out.push(s)
    }
    out.sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))
    return out
  } catch {
    return []
  }
}

/**
 * Persist the history list. Caps at HISTORY_CAP entries (newest first by
 * closedAt — older entries past the cap are dropped).
 */
export function saveHistory(list: MarketSession[]): void {
  if (typeof localStorage === 'undefined') return
  const sorted = [...list]
    .filter((s) => !!s.closedAt)
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))
  const capped = sorted.slice(0, HISTORY_CAP)
  localStorage.setItem(LS_HISTORY, JSON.stringify(capped))
}

// ──────────────────────────────────────────────
// Open / record / close
// ──────────────────────────────────────────────

/** Input for opening a session — caller resolves units + prices from /production + /pricing. */
export interface OpenSessionInput {
  /** One row per production-plan entry: recipeId + planned units. */
  planEntries: Array<{ recipeId: RecipeId; unitsPerBake: number }>
  /** Per-recipe sell price snapshot, decimal dollars. */
  recipeSellPrices: Record<RecipeId, number>
  /** Optional human label for the session. */
  label?: string
}

/**
 * Snapshot the current /production plan + /pricing state into a new
 * MarketSession. Each plan entry becomes a PlanSnapshot. Transactions start
 * empty. The legacy `sales` field is NOT written.
 */
export function openSession(input: OpenSessionInput): MarketSession {
  const initialPlan: PlanSnapshot[] = input.planEntries.map((e) => ({
    recipeId: e.recipeId,
    plannedUnits: Math.max(0, Math.floor(e.unitsPerBake)),
    unitPrice: input.recipeSellPrices[e.recipeId] ?? 0,
  }))
  const session: MarketSession = {
    id: newId(),
    openedAt: nowISO(),
    initialPlan,
    transactions: [],
  }
  if (input.label && input.label.trim()) session.label = input.label.trim()
  return session
}

/**
 * Record a transaction (one customer interaction) on the session. Generates
 * id + occurredAt automatically and computes totalAsk from line totals.
 * Returns a new MarketSession (immutable update); caller persists.
 */
export function recordTransaction(
  session: MarketSession,
  items: TransactionItem[],
  notes?: string,
): MarketSession {
  const cleanItems: TransactionItem[] = items.map((it) => {
    const units = Math.max(0, Math.floor(Number.isFinite(it.units) ? it.units : 0))
    const unitPrice = Number.isFinite(it.unitPrice) ? it.unitPrice : 0
    return {
      recipeId: it.recipeId,
      units,
      unitPrice,
      lineTotal: units * unitPrice,
    }
  })
  const totalAsk = cleanItems.reduce((acc, it) => acc + it.lineTotal, 0)
  const tx: SalesTransaction = {
    id: newId(),
    occurredAt: nowISO(),
    items: cleanItems,
    totalAsk,
  }
  if (notes && notes.trim()) tx.notes = notes.trim()
  const transactions = [...(session.transactions ?? []), tx]
  return { ...session, transactions }
}

/**
 * Remove a transaction by id. Basic undo for accidental sales. Returns a
 * new MarketSession; caller persists.
 */
export function deleteTransaction(session: MarketSession, txId: string): MarketSession {
  const current = session.transactions ?? []
  const transactions = current.filter((t) => t.id !== txId)
  return { ...session, transactions }
}

/**
 * Legacy aggregate-update helper — kept for migrations / tests that still
 * exercise old-shape sessions. New code should use recordTransaction.
 */
export function recordSale(
  session: MarketSession,
  recipeId: RecipeId,
  soldUnits: number,
): MarketSession {
  const next = Math.max(0, Math.floor(Number.isFinite(soldUnits) ? soldUnits : 0))
  const sales = (session.sales ?? []).map((s) =>
    s.recipeId === recipeId ? { ...s, soldUnits: next } : s,
  )
  return { ...session, sales }
}

/**
 * Set or update the user-facing label on a session. Pass `''` (or undefined)
 * to clear the label. Returns a new MarketSession; caller persists.
 */
export function setSessionLabel(
  session: MarketSession,
  label: string | undefined,
): MarketSession {
  const trimmed = (label ?? '').trim()
  if (!trimmed) {
    const { label: _omit, ...rest } = session
    void _omit
    return rest
  }
  return { ...session, label: trimmed }
}

/**
 * Mark a session closed by stamping `closedAt`. Returns a new MarketSession;
 * caller is responsible for persisting it (push to history + clear active).
 */
export function closeSession(session: MarketSession): MarketSession {
  return { ...session, closedAt: nowISO() }
}

/**
 * Append a closed session to the persisted history list (capped). Returns
 * the new history array (newest first).
 */
export function appendToHistory(session: MarketSession): MarketSession[] {
  if (!session.closedAt) return loadHistory()
  const current = loadHistory()
  const next = [session, ...current.filter((s) => s.id !== session.id)]
  saveHistory(next)
  return loadHistory()
}

// ──────────────────────────────────────────────
// Aggregates / summary math
// ──────────────────────────────────────────────

/**
 * Sum of units sold across all transactions for a recipe.
 *
 * Falls back to the legacy `sales[recipeId].soldUnits` field when no
 * transactions are present (e.g. closed PF-256.5 sessions).
 */
export function aggregateSold(session: MarketSession, recipeId: RecipeId): number {
  const txs = session.transactions ?? []
  if (txs.length > 0) {
    let sum = 0
    for (const tx of txs) {
      for (const item of tx.items) {
        if (item.recipeId === recipeId) sum += item.units
      }
    }
    return sum
  }
  // Legacy fallback.
  const row = (session.sales ?? []).find((s) => s.recipeId === recipeId)
  return row ? row.soldUnits : 0
}

/**
 * Sum of revenue across all transactions for a recipe (units × unitPrice
 * per line). Useful for the by-recipe aggregate view.
 */
export function aggregateRevenue(session: MarketSession, recipeId: RecipeId): number {
  const txs = session.transactions ?? []
  if (txs.length > 0) {
    let sum = 0
    for (const tx of txs) {
      for (const item of tx.items) {
        if (item.recipeId === recipeId) sum += item.lineTotal
      }
    }
    return sum
  }
  const row = (session.sales ?? []).find((s) => s.recipeId === recipeId)
  return row ? row.soldUnits * row.unitPrice : 0
}

export interface SessionTotals {
  /** Count of transactions recorded in this session. */
  transactionCount: number
  /** Total units sold across all transactions / legacy rows. */
  itemsSold: number
  /** Total revenue (sum of all line totals / legacy soldUnits × unitPrice). */
  revenue: number
  /** Aggregate planned units across the initial plan (or legacy sales rows). */
  totalPlanned: number
}

/**
 * Aggregate totals for a session (active or closed). Reads transactions when
 * present, falls back to legacy `sales[]` aggregate otherwise.
 */
export function sessionTotals(session: MarketSession): SessionTotals {
  const txs = session.transactions ?? []
  let totalPlanned = 0
  if (session.initialPlan) {
    for (const p of session.initialPlan) totalPlanned += p.plannedUnits
  } else if (session.sales) {
    for (const s of session.sales) totalPlanned += s.plannedUnits
  }

  if (txs.length > 0 || session.initialPlan) {
    let itemsSold = 0
    let revenue = 0
    for (const tx of txs) {
      for (const item of tx.items) {
        itemsSold += item.units
        revenue += item.lineTotal
      }
    }
    return {
      transactionCount: txs.length,
      itemsSold,
      revenue,
      totalPlanned,
    }
  }

  // Pure-legacy session: derive from sales[].
  let itemsSold = 0
  let revenue = 0
  for (const s of session.sales ?? []) {
    itemsSold += s.soldUnits
    revenue += s.soldUnits * s.unitPrice
  }
  return { transactionCount: 0, itemsSold, revenue, totalPlanned }
}
