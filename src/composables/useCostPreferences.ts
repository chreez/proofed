/**
 * useCostPreferences — pure helpers for matching saved cost preferences to
 * fetched HEB product results (PF-276).
 *
 * These helpers are deliberately pure (no Vue refs, no fetches) so they can
 * be unit-tested in isolation. The composing component (`BakeReviewPage.vue`)
 * is responsible for fetching `/cost-preferences.json`, calling
 * `matchPreferenceToProduct`, and merging the resulting productIndex into
 * its reactive `costSelections` map.
 *
 * Selection priority (driven by `BakeReviewPage`):
 *   pinned > lastUsed > smart default (cheapest HEB > rate > manual)
 */

import type { CostPreferenceEntry, HebProduct } from '@/types/recipe'

/** Tolerance for matching package size in grams — within ±5g counts. */
export const SIZE_MATCH_TOLERANCE_GRAMS = 5

/**
 * Find the cheapest HEB product among those with a non-zero `sizeGrams`.
 * Uses `salePrice ?? price` to honor active discounts. Falls back to
 * `productIndex: 0` when no products have a usable size (so callers always
 * get a valid index for a non-empty list).
 *
 * Returns `-1` when the input list is empty.
 */
export function pickCheapestProductIndex(products: HebProduct[]): number {
  if (products.length === 0) return -1
  let bestIdx = 0
  let bestPrice = Number.POSITIVE_INFINITY
  let foundSized = false
  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    if (!p || p.sizeGrams <= 0) continue
    const price = p.salePrice ?? p.price
    if (price <= 0) continue
    if (!foundSized || price < bestPrice) {
      foundSized = true
      bestIdx = i
      bestPrice = price
    }
  }
  return bestIdx
}

/**
 * Match a saved preference to one of the fetched HEB products and return
 * its index, or `null` when no acceptable match exists.
 *
 * Match strategy (AC #6):
 *   1. Brand match (case-insensitive) AND package size within
 *      ±SIZE_MATCH_TOLERANCE_GRAMS — exact match wins.
 *   2. Brand-only fallback — cheapest in-stock product of that brand by
 *      `salePrice ?? price`. (We don't restrict to in-stock here because
 *      the underlying HEB result already includes everything; the UI
 *      surfaces the `inStock` badge separately.)
 *   3. Brand not present in the list at all → return `null`.
 *
 * Returns the **original index** into the `products` array so the caller
 * can plug it directly into `CostSelection.productIndex`.
 */
export function matchPreferenceToProduct(
  pref: CostPreferenceEntry,
  products: HebProduct[]
): number | null {
  if (!pref || !pref.brand) return null
  if (products.length === 0) return null

  const prefBrand = pref.brand.toLowerCase().trim()
  if (!prefBrand) return null

  // Stage 1: brand + size match within tolerance.
  let bestExactIdx = -1
  let bestExactDelta = Number.POSITIVE_INFINITY
  // Stage 2: brand-only cheapest fallback.
  let bestBrandIdx = -1
  let bestBrandPrice = Number.POSITIVE_INFINITY

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    if (!p) continue
    if (p.brand.toLowerCase().trim() !== prefBrand) continue

    const price = p.salePrice ?? p.price
    if (price > 0 && price < bestBrandPrice) {
      bestBrandPrice = price
      bestBrandIdx = i
    }

    // Size match is only relevant when both sides have a usable size.
    if (pref.sizeGrams > 0 && p.sizeGrams > 0) {
      const delta = Math.abs(p.sizeGrams - pref.sizeGrams)
      if (delta <= SIZE_MATCH_TOLERANCE_GRAMS && delta < bestExactDelta) {
        bestExactDelta = delta
        bestExactIdx = i
      }
    }
  }

  if (bestExactIdx !== -1) return bestExactIdx
  if (bestBrandIdx !== -1) return bestBrandIdx
  return null
}

/**
 * Build a `CostPreferenceEntry` snapshot from a currently-selected HEB
 * product. Pure helper — `BakeReviewPage` uses this to populate both
 * the dirty-preferences buffer (on pin click) and `lastUsed` tracking
 * (on any HEB selection).
 *
 * `updatedAt` defaults to today's local date in YYYY-MM-DD format.
 */
export function buildPreferenceEntry(
  product: HebProduct,
  updatedAt?: string
): CostPreferenceEntry {
  const today = updatedAt ?? new Date().toISOString().split('T')[0]
  return {
    name: product.name,
    brand: product.brand,
    sizeGrams: product.sizeGrams,
    packagePrice: product.salePrice ?? product.price,
    packageSize: product.size,
    updatedAt: today,
  }
}
