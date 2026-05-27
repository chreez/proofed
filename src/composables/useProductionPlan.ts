/**
 * Production plan state + persistence for the /production route (PF-256.1).
 *
 * Foundation for every other lens in the PF-256 Bakery Ops Assistant epic.
 * Pure functions — caller wires reactivity at the page-component level.
 *
 * Storage convention:
 *   - LS_CURRENT (`bake-production-current`) — working ProductionPlan
 */

import type { ProductionEntry, ProductionPlan, Provenance } from '@/types/production'
import type { Recipe } from '@/types/recipe'

const LS_CURRENT = 'bake-production-current'

/** ISO 8601 timestamp for now. */
function nowISO(): string {
  return new Date().toISOString()
}

/** Generate a stable id. Falls back to a random string when crypto is absent. */
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Deterministic fallback: timestamp + random chunk.
  return `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Create a fresh empty plan. */
export function emptyPlan(): ProductionPlan {
  return {
    entries: [],
    updated: nowISO(),
  }
}

/**
 * Validate raw JSON against the ProductionPlan shape. Returns the typed
 * plan on success, or `{ error }` for the caller to surface.
 *
 * Migration: legacy plans carried `quantity` instead of `batches`. We accept
 * either field name, normalise to `batches`, and default `yieldOverride` to
 * `null` when missing so existing localStorage state doesn't get nuked on
 * load.
 */
export function validatePlan(raw: unknown): ProductionPlan | { error: string } {
  if (typeof raw !== 'object' || raw === null) return { error: 'not an object' }
  const p = raw as Record<string, unknown>
  if (typeof p.updated !== 'string') return { error: 'updated missing' }
  if (!Array.isArray(p.entries)) return { error: 'entries missing' }
  const normalised: ProductionEntry[] = []
  for (const [idx, entry] of (p.entries as unknown[]).entries()) {
    if (typeof entry !== 'object' || entry === null) return { error: `entries[${idx}] invalid` }
    const e = entry as Record<string, unknown>
    if (typeof e.id !== 'string' || !e.id) return { error: `entries[${idx}].id missing` }
    if (typeof e.recipeId !== 'string' || !e.recipeId) return { error: `entries[${idx}].recipeId missing` }
    // Accept new `batches` or legacy `quantity`.
    const rawBatches = typeof e.batches === 'number' ? e.batches : (typeof e.quantity === 'number' ? e.quantity : NaN)
    if (!Number.isFinite(rawBatches)) return { error: `entries[${idx}].batches invalid` }
    if (typeof e.unit !== 'string') return { error: `entries[${idx}].unit invalid` }
    if (e.addedBy !== 'user' && e.addedBy !== 'agent') return { error: `entries[${idx}].addedBy invalid` }
    if (typeof e.addedAt !== 'string') return { error: `entries[${idx}].addedAt invalid` }
    let yieldOverride: number | null = null
    if (e.yieldOverride === null || e.yieldOverride === undefined) {
      yieldOverride = null
    } else if (typeof e.yieldOverride === 'number' && Number.isFinite(e.yieldOverride)) {
      yieldOverride = e.yieldOverride
    } else {
      return { error: `entries[${idx}].yieldOverride invalid` }
    }
    normalised.push({
      id: e.id,
      recipeId: e.recipeId,
      batches: Math.max(1, Math.floor(rawBatches)),
      yieldOverride,
      unit: e.unit,
      addedBy: e.addedBy,
      addedAt: e.addedAt,
    })
  }
  return { entries: normalised, updated: p.updated }
}

/**
 * Read the working plan from localStorage. Falls back to an empty plan
 * when the key is absent or malformed.
 */
export function loadPlan(): ProductionPlan {
  if (typeof localStorage === 'undefined') return emptyPlan()
  const raw = localStorage.getItem(LS_CURRENT)
  if (!raw) return emptyPlan()
  try {
    const parsed = JSON.parse(raw)
    const validated = validatePlan(parsed)
    if ('error' in validated) {
      console.warn(`[production] working plan invalid: ${validated.error}; using empty default`)
      return emptyPlan()
    }
    return validated
  } catch (e) {
    console.warn('[production] working plan JSON parse failed; using empty default', e)
    return emptyPlan()
  }
}

/** Persist the working plan to localStorage; bumps `updated`. */
export function savePlan(plan: ProductionPlan): ProductionPlan {
  const bumped: ProductionPlan = { ...plan, updated: nowISO() }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LS_CURRENT, JSON.stringify(bumped))
  }
  return bumped
}

interface AddEntryInput {
  recipeId: string
  /** Whole batches to bake. Defaults to 1. */
  batches?: number
  unit: string
  addedBy: Provenance
}

/**
 * Append a new entry to the plan, or bump batches on an existing entry with
 * the same recipeId (shopping-cart-style merge). Pure — returns a new
 * ProductionPlan. Caller is responsible for calling `savePlan` if persistence
 * is desired.
 *
 * Merge semantics:
 *  - If an entry with input.recipeId already exists, its `batches` is
 *    increased by `input.batches` (default 1). The unit, addedBy, and
 *    addedAt fields are left alone (provenance is set when the entry was
 *    first added).
 *  - `yieldOverride` is **cleared on merge-add**. Rationale: hitting [+] in
 *    the library means "add a fresh batch", which is a batch-scale action.
 *    If the user had a custom override (e.g. 15 buns), bumping by a batch
 *    snaps back to batch math so the new total is meaningful (otherwise
 *    "15 + 1 batch" has no clear semantic).
 *  - Otherwise a new entry is appended with `yieldOverride: null`.
 */
export function addEntry(plan: ProductionPlan, input: AddEntryInput): ProductionPlan {
  const batches = Math.max(1, Math.floor(input.batches ?? 1))
  const existingIdx = plan.entries.findIndex(e => e.recipeId === input.recipeId)
  if (existingIdx >= 0) {
    const next = plan.entries.slice()
    const existing = next[existingIdx]
    next[existingIdx] = {
      ...existing,
      batches: existing.batches + batches,
      // Clear override on merge — bumping is a batch-scale action.
      yieldOverride: null,
    }
    return { entries: next, updated: nowISO() }
  }
  const entry: ProductionEntry = {
    id: newId(),
    recipeId: input.recipeId,
    batches,
    yieldOverride: null,
    unit: input.unit,
    addedBy: input.addedBy,
    addedAt: nowISO(),
  }
  return {
    entries: [...plan.entries, entry],
    updated: nowISO(),
  }
}

/** Remove an entry by id. Pure — returns a new ProductionPlan. */
export function removeEntry(plan: ProductionPlan, entryId: string): ProductionPlan {
  return {
    entries: plan.entries.filter(e => e.id !== entryId),
    updated: nowISO(),
  }
}

/** Patch fields on an entry (batches / yieldOverride / unit). Pure — returns a new plan. */
export function updateEntry(
  plan: ProductionPlan,
  entryId: string,
  patch: Partial<Pick<ProductionEntry, 'batches' | 'yieldOverride' | 'unit'>>
): ProductionPlan {
  return {
    entries: plan.entries.map(e => (e.id === entryId ? { ...e, ...patch } : e)),
    updated: nowISO(),
  }
}

// ---------- Yield parsing ----------

/**
 * Extract the leading integer from a yields string. Used to compute the
 * effective scaled yield ("8 buns" × 2 batches → 16 buns).
 *
 * Strategy: find the first run of digits anywhere in the string and parse
 * it. Handles:
 *   - "8 cinnamon rolls" → 8
 *   - "2 loaves (~800g each)" → 2
 *   - "12-16 slices" → 12 (first integer wins, conservative)
 *   - "" or "loaves" → 1 (safe default — yields = 1 batch when unknown)
 *
 * Note: returns `1` (not `0`) when no integer is parseable so downstream
 * scaling math (`batches × baseYield`) stays meaningful.
 */
export function parseBaseYield(yieldsString: string | undefined | null): number {
  if (!yieldsString || typeof yieldsString !== 'string') return 1
  const match = yieldsString.match(/\d+/)
  if (!match) return 1
  const n = parseInt(match[0], 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return n
}

// ---------- Unit inference ----------

/**
 * Naive singularize: strip trailing 's' if the word ends in 's' and isn't
 * already a known singular ending in 'ss' (e.g. "loaves" → "loave" is wrong,
 * so we special-case a few endings). Conservative: only strips when safe.
 */
function singularize(word: string): string {
  const w = word.toLowerCase().trim()
  if (!w) return w
  // Irregulars common to baking yields.
  const irregulars: Record<string, string> = {
    loaves: 'loaf',
    biscuits: 'biscuit',
    cookies: 'cookie',
    rolls: 'roll',
    buns: 'bun',
    pizzas: 'pizza',
    tarts: 'tart',
    tartlets: 'tartlet',
    baguettes: 'baguette',
    pieces: 'piece',
    servings: 'serving',
    slices: 'slice',
    bagels: 'bagel',
    muffins: 'muffin',
    crackers: 'cracker',
    rugelach: 'rugelach',
  }
  if (irregulars[w]) return irregulars[w]
  // Avoid stripping "ss".
  if (w.endsWith('ss')) return w
  if (w.endsWith('s') && w.length > 2) return w.slice(0, -1)
  return w
}

/**
 * Pluralize a singular noun for display purposes.
 *
 * Used together with `inferDefaultUnit` to render count labels in cost
 * breakdowns (e.g. "2 loaves", "16 cookies", "1 loaf"). PF-277.
 *
 * Rules (applied in order):
 *  1. `count === 1` → return `singular` unchanged.
 *  2. Ends in "fe" → replace "fe" with "ves" (`knife` → `knives`).
 *  3. Ends in "f" → replace "f" with "ves" (`loaf` → `loaves`).
 *  4. Ends in "y" preceded by a consonant → replace "y" with "ies"
 *     (`berry` → `berries`, but NOT `day` → `days`).
 *  5. Otherwise append "s" (`cookie` → `cookies`, `tart` → `tarts`).
 *
 * Known wart: invariant plurals like `rugelach` round-trip to `rugelachs`
 * for count > 1 since rule 5 always adds an "s". The existing
 * `singularize` map already treats `rugelach` as invariant, so display
 * label is consistent for `count === 1`.
 */
export function pluralizeUnit(count: number, singular: string): string {
  const word = singular ?? ''
  if (count === 1) return word
  if (!word) return word

  // 2. -fe → -ves
  if (word.length >= 3 && word.endsWith('fe')) {
    return word.slice(0, -2) + 'ves'
  }
  // 3. -f → -ves
  if (word.length >= 2 && word.endsWith('f')) {
    return word.slice(0, -1) + 'ves'
  }
  // 4. consonant + y → -ies
  if (word.length >= 2 && word.endsWith('y')) {
    const prevChar = word.charAt(word.length - 2).toLowerCase()
    const isVowel = prevChar === 'a' || prevChar === 'e' || prevChar === 'i' || prevChar === 'o' || prevChar === 'u'
    if (!isVowel) {
      return word.slice(0, -1) + 'ies'
    }
  }
  // 5. default: append s
  return word + 's'
}

/**
 * Best-effort default unit from a recipe's meta.yields string.
 *
 * Strategy:
 *  1. Match a number then a noun (e.g. "8 rolls" → "roll", "2 loaves" → "loaf").
 *  2. Match a noun without a number (e.g. "rolls" → "roll").
 *  3. Fall back to "unit".
 *
 * Drops parenthetical detail and trailing qualifiers (e.g. "8 rolls (cast-iron)"
 * → "roll", "12 cookies, 30g each" → "cookie").
 *
 * Tolerates approximation markers (`~22-24 cookies`) by stripping leading `~`.
 */
export function inferDefaultUnit(recipe: Recipe | null | undefined): string {
  const yields = recipe?.meta?.yields
  if (!yields || typeof yields !== 'string') return 'unit'

  // Strip parentheticals and clauses after commas.
  // Also strip leading approximation markers (e.g. "~22-24 cookies").
  const cleaned = yields.replace(/\([^)]*\)/g, '').split(',')[0].trim().replace(/^~+\s*/, '')
  if (!cleaned) return 'unit'

  // Pattern A: "<number><frac?> <noun>" — capture first word group after a number.
  const numNoun = cleaned.match(/^[\d.\/\s-]+\s*([a-zA-Z][a-zA-Z-]*)/)
  if (numNoun?.[1]) {
    return singularize(numNoun[1])
  }

  // Pattern B: leading noun without a number.
  const noun = cleaned.match(/^([a-zA-Z][a-zA-Z-]*)/)
  if (noun?.[1]) {
    return singularize(noun[1])
  }

  return 'unit'
}
