import { describe, it, expect } from 'vitest'
import {
  matchPreferenceToProduct,
  pickCheapestProductIndex,
  buildPreferenceEntry,
  SIZE_MATCH_TOLERANCE_GRAMS,
} from './useCostPreferences'
import type { CostPreferenceEntry, HebProduct } from '@/types/recipe'

function product(overrides: Partial<HebProduct> = {}): HebProduct {
  return {
    name: 'Test Product',
    brand: 'Test',
    size: '1 lb',
    sizeGrams: 453.592,
    price: 5.0,
    salePrice: null,
    unitPrice: '$5.00/lb',
    inStock: true,
    ...overrides,
  }
}

function pref(overrides: Partial<CostPreferenceEntry> = {}): CostPreferenceEntry {
  return {
    name: 'King Arthur Bread Flour',
    brand: 'King Arthur',
    sizeGrams: 4535.92,
    packagePrice: 10.99,
    packageSize: '10 lb',
    updatedAt: '2026-05-26',
    ...overrides,
  }
}

describe('matchPreferenceToProduct', () => {
  it('matches by brand (case-insensitive) and sizeGrams within tolerance', () => {
    const products = [
      product({ brand: 'H-E-B', sizeGrams: 2268, price: 3.49 }),
      product({ brand: 'King Arthur', sizeGrams: 4535, price: 10.99 }),
      product({ brand: 'Bob\'s Red Mill', sizeGrams: 2268, price: 7.49 }),
    ]
    const match = matchPreferenceToProduct(pref(), products)
    expect(match).toBe(1)
  })

  it('matches case-insensitively on brand', () => {
    const products = [
      product({ brand: 'king arthur', sizeGrams: 4535.92 }),
    ]
    const match = matchPreferenceToProduct(pref({ brand: 'KING ARTHUR' }), products)
    expect(match).toBe(0)
  })

  it('treats exact tolerance boundary as a match', () => {
    const products = [
      product({ brand: 'King Arthur', sizeGrams: 4540.92 }), // delta = 5 exactly
    ]
    const match = matchPreferenceToProduct(pref(), products)
    expect(match).toBe(0)
  })

  it('falls back to brand-only cheapest when no size matches', () => {
    const products = [
      product({ brand: 'H-E-B', sizeGrams: 2268, price: 3.49 }),
      // King Arthur 5lb (2268g) — size differs from pref's 4535.92g by ~2268g (way > tolerance)
      product({ brand: 'King Arthur', sizeGrams: 2268, price: 5.48 }),
      // King Arthur 3lb on sale — cheaper
      product({ brand: 'King Arthur', sizeGrams: 1360, price: 6.99, salePrice: 4.99 }),
    ]
    const match = matchPreferenceToProduct(pref(), products)
    // Should pick the cheapest King Arthur by salePrice ?? price → idx 2 (sale $4.99)
    expect(match).toBe(2)
  })

  it('returns null when brand absent from results', () => {
    const products = [
      product({ brand: 'H-E-B', sizeGrams: 2268 }),
      product({ brand: 'Hill Country Fare', sizeGrams: 2268 }),
    ]
    const match = matchPreferenceToProduct(pref(), products)
    expect(match).toBeNull()
  })

  it('returns null on empty product list', () => {
    expect(matchPreferenceToProduct(pref(), [])).toBeNull()
  })

  it('returns null when preference has no brand', () => {
    const products = [product({ brand: 'King Arthur' })]
    // @ts-expect-error — empty brand on purpose
    expect(matchPreferenceToProduct(pref({ brand: '' }), products)).toBeNull()
  })

  it('exposes the tolerance constant for callers', () => {
    expect(SIZE_MATCH_TOLERANCE_GRAMS).toBe(5)
  })

  it('prefers exact size match over brand-only fallback', () => {
    const products = [
      // King Arthur 3lb on sale — cheaper but wrong size
      product({ brand: 'King Arthur', sizeGrams: 1360, price: 6.99, salePrice: 4.99 }),
      // King Arthur 10lb — exact size match (within tolerance)
      product({ brand: 'King Arthur', sizeGrams: 4535.92, price: 10.99 }),
    ]
    const match = matchPreferenceToProduct(pref(), products)
    // Exact size wins, even though [0] is cheaper.
    expect(match).toBe(1)
  })

  it('picks closest size match when multiple are within tolerance', () => {
    const products = [
      product({ brand: 'King Arthur', sizeGrams: 4533, price: 10.99 }), // delta 2.92
      product({ brand: 'King Arthur', sizeGrams: 4536, price: 10.99 }), // delta 0.08
    ]
    const match = matchPreferenceToProduct(pref(), products)
    expect(match).toBe(1)
  })
})

describe('pickCheapestProductIndex', () => {
  it('returns -1 for empty list', () => {
    expect(pickCheapestProductIndex([])).toBe(-1)
  })

  it('picks cheapest by price when no sales', () => {
    const products = [
      product({ price: 5.99 }),
      product({ price: 3.49 }),
      product({ price: 4.99 }),
    ]
    expect(pickCheapestProductIndex(products)).toBe(1)
  })

  it('honors salePrice over price', () => {
    const products = [
      product({ price: 5.99, salePrice: null }),
      product({ price: 3.49, salePrice: null }),
      product({ price: 4.99, salePrice: 2.99 }), // cheapest after sale
    ]
    expect(pickCheapestProductIndex(products)).toBe(2)
  })

  it('skips products with zero sizeGrams', () => {
    const products = [
      product({ sizeGrams: 0, price: 0.99 }),
      product({ sizeGrams: 454, price: 4.99 }),
    ]
    // The 0-size one is cheaper but skipped → returns 1
    expect(pickCheapestProductIndex(products)).toBe(1)
  })

  it('falls back to index 0 when no sized products', () => {
    const products = [
      product({ sizeGrams: 0 }),
      product({ sizeGrams: 0 }),
    ]
    expect(pickCheapestProductIndex(products)).toBe(0)
  })
})

describe('buildPreferenceEntry', () => {
  it('snapshots brand, name, size, and price', () => {
    const p = product({
      name: 'Unbleached Bread Flour',
      brand: 'King Arthur',
      size: '10 lb',
      sizeGrams: 4535.92,
      price: 10.99,
      salePrice: null,
    })
    const entry = buildPreferenceEntry(p, '2026-05-26')
    expect(entry).toEqual({
      name: 'Unbleached Bread Flour',
      brand: 'King Arthur',
      sizeGrams: 4535.92,
      packagePrice: 10.99,
      packageSize: '10 lb',
      updatedAt: '2026-05-26',
    })
  })

  it('honors salePrice when present', () => {
    const p = product({ price: 5.99, salePrice: 3.99 })
    const entry = buildPreferenceEntry(p, '2026-05-26')
    expect(entry.packagePrice).toBe(3.99)
  })

  it('defaults updatedAt to today in YYYY-MM-DD when omitted', () => {
    const entry = buildPreferenceEntry(product())
    expect(entry.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
