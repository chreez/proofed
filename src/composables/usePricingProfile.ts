/**
 * Pricing profile state + persistence for the /pricing route (PF-255 epic).
 *
 * Implements the storage convention, resolution cascade, and export flow
 * specified in `backlog/tasks/pf-255.5-design-notes.md`. Pure functions —
 * caller wires reactivity at the page-component level.
 */

import type { PerRecipePricing, PricingProfile, RecipeId } from '@/types/pricing'
import { FALLBACK_MARKUP_PCT } from '@/types/pricing'

const LS_CURRENT = 'pricing-profile-current'
const LS_COMMITTED = 'pricing-profile-committed'

/** ISO 8601 date string (YYYY-MM-DD) for today, in local time. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Create a fresh empty profile with default markup. */
export function emptyProfile(name = 'Default'): PricingProfile {
  return {
    name,
    version: '1.0.0',
    created: todayISO(),
    updated: todayISO(),
    default: { markupPct: FALLBACK_MARKUP_PCT },
    perRecipe: {},
  }
}

/** Slugify a profile name for use in an export filename. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Validate raw JSON against the PricingProfile shape. Returns the typed
 * profile on success, or `{ error }` for the caller to surface.
 */
export function validateProfile(raw: unknown): PricingProfile | { error: string } {
  if (typeof raw !== 'object' || raw === null) return { error: 'not an object' }
  const p = raw as Record<string, unknown>
  if (typeof p.name !== 'string' || !p.name) return { error: 'name missing' }
  if (typeof p.version !== 'string') return { error: 'version missing' }
  if (typeof p.created !== 'string') return { error: 'created missing' }
  if (typeof p.updated !== 'string') return { error: 'updated missing' }
  if (typeof p.default !== 'object' || p.default === null) return { error: 'default missing' }
  const d = p.default as Record<string, unknown>
  if (typeof d.markupPct !== 'number') return { error: 'default.markupPct missing' }
  if (typeof p.perRecipe !== 'object' || p.perRecipe === null) return { error: 'perRecipe missing' }
  for (const [id, entry] of Object.entries(p.perRecipe as Record<string, unknown>)) {
    if (typeof entry !== 'object' || entry === null) return { error: `perRecipe[${id}] invalid` }
    const e = entry as Record<string, unknown>
    if (e.markupPct !== undefined && typeof e.markupPct !== 'number') return { error: `perRecipe[${id}].markupPct must be number` }
    if (e.sellPrice !== undefined && typeof e.sellPrice !== 'number') return { error: `perRecipe[${id}].sellPrice must be number` }
    if (e.notes !== undefined && typeof e.notes !== 'string') return { error: `perRecipe[${id}].notes must be string` }
  }
  return raw as PricingProfile
}

/**
 * Read the working profile from localStorage. Falls back to an empty profile
 * when the key is absent or malformed.
 */
export function loadProfile(): PricingProfile {
  if (typeof localStorage === 'undefined') return emptyProfile()
  const raw = localStorage.getItem(LS_CURRENT)
  if (!raw) return emptyProfile()
  try {
    const parsed = JSON.parse(raw)
    const validated = validateProfile(parsed)
    if ('error' in validated) {
      console.warn(`[pricing] working profile invalid: ${validated.error}; using empty default`)
      return emptyProfile()
    }
    return validated
  } catch (e) {
    console.warn('[pricing] working profile JSON parse failed; using empty default', e)
    return emptyProfile()
  }
}

/**
 * Read the committed-baseline profile from localStorage. Returns null when
 * no committed baseline exists yet (e.g. first visit, no default.json).
 */
export function loadCommitted(): PricingProfile | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(LS_COMMITTED)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const validated = validateProfile(parsed)
    if ('error' in validated) return null
    return validated
  } catch {
    return null
  }
}

/** Persist the working profile to localStorage. */
export function saveProfile(profile: PricingProfile): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LS_CURRENT, JSON.stringify(profile))
}

/** Persist the committed-baseline profile to localStorage. */
export function saveCommitted(profile: PricingProfile): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LS_COMMITTED, JSON.stringify(profile))
}

/**
 * Resolve markup% via 3-tier cascade:
 *   1. perRecipe[id].markupPct
 *   2. profile.default.markupPct
 *   3. FALLBACK_MARKUP_PCT (65)
 *
 * `0` is a valid intentional value at any tier; only undefined/non-finite
 * values fall through.
 */
export function resolveMarkupPct(recipeId: RecipeId, profile: PricingProfile): number {
  const override = profile.perRecipe[recipeId]?.markupPct
  if (typeof override === 'number' && Number.isFinite(override)) return override
  if (typeof profile.default.markupPct === 'number' && Number.isFinite(profile.default.markupPct)) {
    return profile.default.markupPct
  }
  return FALLBACK_MARKUP_PCT
}

/**
 * Resolve an explicit sell-price override for a recipe. Returns null when
 * no manual lock is set — caller should fall back to the computed
 * (cost × markup) → snap pipeline.
 */
export function resolveSellPrice(recipeId: RecipeId, profile: PricingProfile): number | null {
  const manual = profile.perRecipe[recipeId]?.sellPrice
  if (typeof manual === 'number' && Number.isFinite(manual)) return manual
  return null
}

/**
 * Deep-equal check for a per-recipe entry. Treats `undefined` and missing
 * keys as equivalent. Used by the dirty-state computed for each row.
 */
function entryEquals(a: PerRecipePricing | undefined, b: PerRecipePricing | undefined): boolean {
  const aa = a ?? {}
  const bb = b ?? {}
  return (
    aa.markupPct === bb.markupPct &&
    aa.sellPrice === bb.sellPrice &&
    (aa.notes ?? undefined) === (bb.notes ?? undefined)
  )
}

/**
 * Returns true when the current working profile's per-recipe entry differs
 * from the committed-baseline entry. Treats null `committed` (no baseline
 * yet) as equivalent to an empty entry — only true dirty when current has
 * an override AND no committed baseline exists.
 */
export function isRecipeDirty(
  recipeId: RecipeId,
  current: PricingProfile,
  committed: PricingProfile | null
): boolean {
  const currentEntry = current.perRecipe[recipeId]
  const committedEntry = committed?.perRecipe[recipeId]
  return !entryEquals(currentEntry, committedEntry)
}

/**
 * Trigger a browser download of the profile as JSON. Bumps `updated`,
 * persists the bumped profile back to localStorage, and resets the
 * committed-baseline to the just-exported state.
 */
export function exportProfile(profile: PricingProfile): void {
  if (typeof document === 'undefined') return
  const bumped: PricingProfile = { ...profile, updated: todayISO() }
  saveProfile(bumped)
  saveCommitted(bumped)
  const blob = new Blob([JSON.stringify(bumped, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pricing-profile-${slugify(bumped.name)}-${bumped.updated}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
