import { describe, it, expect, beforeEach } from 'vitest'

// Install a working localStorage mock BEFORE importing the SUT.
let __ls_store: Record<string, string> = {}
const __ls_mock = {
  getItem: (key: string) => __ls_store[key] ?? null,
  setItem: (key: string, value: string) => {
    __ls_store[key] = value
  },
  removeItem: (key: string) => {
    delete __ls_store[key]
  },
  clear: () => {
    __ls_store = {}
  },
  get length() {
    return Object.keys(__ls_store).length
  },
  key: (i: number) => Object.keys(__ls_store)[i] || null,
}
Object.defineProperty(globalThis, 'localStorage', {
  value: __ls_mock,
  writable: true,
  configurable: true,
})

import {
  loadPricing,
  savePricing,
  getMarkupPct,
  setMarkupPct,
  getEstimatedSold,
  setEstimatedSold,
  getSellPriceOverride,
  setSellPriceOverride,
  derivedMarkupPct,
  wholeDollarSnap,
  nearestPretty,
  prettyDelta,
  salesToBreakEven,
  costPerUnit,
  sellPrice,
  cp,
  unitsForEntry,
  emptyPricing,
} from './usePricing'
import { parseBaseYield } from './useProductionPlan'
import { FALLBACK_MARKUP_PCT } from '@/types/pricing'
import type { ProductionEntry } from '@/types/production'
import type { Recipe } from '@/types/recipe'

function makeEntry(overrides: Partial<ProductionEntry> = {}): ProductionEntry {
  return {
    id: 'e1',
    recipeId: 'r1',
    batches: 1,
    yieldOverride: null,
    unit: 'roll',
    addedBy: 'user',
    addedAt: '2026-05-12T00:00:00Z',
    ...overrides,
  }
}

function makeRecipe(opts: Partial<Recipe> & { yields?: string; cookLogTotals?: number[]; estimatedTotal?: number }): Recipe {
  const cookLog = (opts.cookLogTotals ?? []).map((total, idx) => ({
    date: `2026-05-${String(idx + 1).padStart(2, '0')}`,
    version: 'v1.0.0',
    notes: [],
    cost: { total, perServing: total / 8, servings: 8, items: [] },
  }))
  return {
    meta: { name: 'Test', yields: opts.yields ?? '8 rolls', total_time: '1 hour' },
    cook_log: cookLog,
    estimatedCost: opts.estimatedTotal != null
      ? { total: opts.estimatedTotal, perServing: opts.estimatedTotal / 8, servings: 8, estimatedAt: '2026-05-01', items: [] }
      : undefined,
  } as unknown as Recipe
}

describe('emptyPricing', () => {
  it('returns a fresh state with no overrides', () => {
    const s = emptyPricing()
    expect(s.perRecipe).toEqual({})
    expect(typeof s.updated).toBe('string')
  })
})

describe('loadPricing', () => {
  beforeEach(() => {
    __ls_store = {}
  })

  it('returns empty state when localStorage is absent', () => {
    const s = loadPricing()
    expect(s.perRecipe).toEqual({})
  })

  it('reads a valid persisted state', () => {
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({ perRecipe: { 'r1': { markupPct: 200 } }, updated: '2026-05-12T00:00:00Z' }),
    )
    const s = loadPricing()
    expect(s.perRecipe['r1']?.markupPct).toBe(200)
  })

  it('ignores malformed entries', () => {
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({ perRecipe: { 'r1': { markupPct: 'oops' }, 'r2': { markupPct: 175 } }, updated: '2026-05-12T00:00:00Z' }),
    )
    const s = loadPricing()
    expect(s.perRecipe['r1']).toBeUndefined()
    expect(s.perRecipe['r2']?.markupPct).toBe(175)
  })

  it('falls back to empty on JSON parse failure', () => {
    localStorage.setItem('bake-pricing-current', 'not-json')
    expect(loadPricing().perRecipe).toEqual({})
  })

  it('falls back to empty on bad shape', () => {
    localStorage.setItem('bake-pricing-current', JSON.stringify({ updated: 5 }))
    expect(loadPricing().perRecipe).toEqual({})
  })
})

describe('savePricing', () => {
  beforeEach(() => {
    __ls_store = {}
  })

  it('writes to localStorage and bumps updated', async () => {
    const before = emptyPricing()
    await new Promise((r) => setTimeout(r, 5))
    const saved = savePricing(before)
    expect(__ls_store['bake-pricing-current']).toBeDefined()
    expect(saved.updated >= before.updated).toBe(true)
  })
})

describe('getMarkupPct', () => {
  it('returns the override when present', () => {
    const s = { perRecipe: { 'r1': { markupPct: 250 } }, updated: '2026-05-12T00:00:00Z' }
    expect(getMarkupPct(s, 'r1')).toBe(250)
  })

  it('falls back to FALLBACK_MARKUP_PCT when absent', () => {
    expect(getMarkupPct(emptyPricing(), 'unknown')).toBe(FALLBACK_MARKUP_PCT)
  })
})

describe('setMarkupPct', () => {
  it('adds a new override', () => {
    const next = setMarkupPct(emptyPricing(), 'r1', 175)
    expect(next.perRecipe['r1']?.markupPct).toBe(175)
  })

  it('updates an existing override and leaves others untouched', () => {
    const start = setMarkupPct(setMarkupPct(emptyPricing(), 'r1', 100), 'r2', 200)
    const next = setMarkupPct(start, 'r1', 250)
    expect(next.perRecipe['r1']?.markupPct).toBe(250)
    expect(next.perRecipe['r2']?.markupPct).toBe(200)
  })
})

describe('wholeDollarSnap', () => {
  it('rounds 2.4 down to 2', () => {
    expect(wholeDollarSnap(2.4)).toBe(2)
  })
  it('rounds 2.6 up to 3', () => {
    expect(wholeDollarSnap(2.6)).toBe(3)
  })
  it('floors at 1 for 0.5', () => {
    expect(wholeDollarSnap(0.5)).toBe(1)
  })
  it('floors at 1 for 0', () => {
    expect(wholeDollarSnap(0)).toBe(1)
  })
  it('returns 1 for NaN', () => {
    expect(wholeDollarSnap(NaN)).toBe(1)
  })
})

describe('unitsForEntry', () => {
  it('returns batches × baseYield when no override', () => {
    const r = makeRecipe({ yields: '8 rolls' })
    expect(unitsForEntry(r, makeEntry({ batches: 2 }), parseBaseYield)).toBe(16)
  })

  it('respects yieldOverride', () => {
    const r = makeRecipe({ yields: '8 rolls' })
    expect(unitsForEntry(r, makeEntry({ batches: 2, yieldOverride: 15 }), parseBaseYield)).toBe(15)
  })

  it('falls back to baseYield 1 when recipe missing', () => {
    expect(unitsForEntry(null, makeEntry({ batches: 3 }), parseBaseYield)).toBe(3)
  })
})

describe('costPerUnit', () => {
  it('uses most-recent cook_log cost.total', () => {
    const r = makeRecipe({ yields: '8 rolls', cookLogTotals: [4, 8] })
    const v = costPerUnit(r, makeEntry({ batches: 1 }), parseBaseYield)
    expect(v).toBeCloseTo(1, 5) // 8 / 8 units
  })

  it('falls back to estimatedCost.total when cook_log missing', () => {
    const r = makeRecipe({ yields: '8 rolls', estimatedTotal: 16 })
    const v = costPerUnit(r, makeEntry({ batches: 1 }), parseBaseYield)
    expect(v).toBeCloseTo(2, 5)
  })

  it('returns null when both are missing', () => {
    const r = makeRecipe({ yields: '8 rolls' })
    expect(costPerUnit(r, makeEntry(), parseBaseYield)).toBeNull()
  })

  it('returns null when recipe is null', () => {
    expect(costPerUnit(null, makeEntry(), parseBaseYield)).toBeNull()
  })

  it('honors yieldOverride in unit math', () => {
    const r = makeRecipe({ yields: '8 rolls', cookLogTotals: [16] })
    const v = costPerUnit(r, makeEntry({ batches: 1, yieldOverride: 16 }), parseBaseYield)
    expect(v).toBeCloseTo(1, 5) // 16 / 16
  })

  it('scales total spend by batches (constant per-unit cost)', () => {
    const r = makeRecipe({ yields: '8 rolls', cookLogTotals: [4] })
    const v = costPerUnit(r, makeEntry({ batches: 2 }), parseBaseYield)
    // total spend = totalBatchCost × batches = 4 × 2 = 8; units = batches × baseYield = 16
    // → cost per unit = 8 / 16 = 0.5 (same as batches=1: 4/8 = 0.5)
    expect(v).toBeCloseTo(0.5, 5)
  })
})

describe('sellPrice', () => {
  it('returns raw decimal 0.5 × 200% → 1.5', () => {
    expect(sellPrice(0.5, 200)).toBeCloseTo(1.5, 5)
  })

  it('returns raw decimal 0.42 × 250% → 1.47', () => {
    expect(sellPrice(0.42, 250)).toBeCloseTo(1.47, 5)
  })

  it('returns raw decimal 1 × 150% → 2.5', () => {
    expect(sellPrice(1, 150)).toBeCloseTo(2.5, 5)
  })

  it('returns 0.01 (floor) when cost is 0', () => {
    expect(sellPrice(0, 150)).toBe(0.01)
  })

  it('returns 0.01 (floor) when cost is negative', () => {
    expect(sellPrice(-1, 150)).toBe(0.01)
  })

  it('returns 0.01 when cost is NaN', () => {
    expect(sellPrice(NaN, 150)).toBe(0.01)
  })
})

describe('nearestPretty', () => {
  it('rounds 1.27 to 1.50', () => {
    expect(nearestPretty(1.27)).toBe(1.5)
  })

  it('rounds 1.74 to 1.50', () => {
    expect(nearestPretty(1.74)).toBe(1.5)
  })

  it('rounds 1.80 to 2.00', () => {
    expect(nearestPretty(1.8)).toBe(2)
  })

  it('floors at 0.50 for 0.20', () => {
    expect(nearestPretty(0.2)).toBe(0.5)
  })

  it('floors at 0.50 for 0', () => {
    expect(nearestPretty(0)).toBe(0.5)
  })

  it('floors at 0.50 for NaN', () => {
    expect(nearestPretty(NaN)).toBe(0.5)
  })

  it('returns 0.50 when raw is exactly 0.50', () => {
    expect(nearestPretty(0.5)).toBe(0.5)
  })

  it('returns 2.50 when raw is exactly 2.50', () => {
    expect(nearestPretty(2.5)).toBe(2.5)
  })
})

describe('prettyDelta', () => {
  it('pairs raw with nearest pretty and positive delta when pretty > raw', () => {
    const r = prettyDelta(1.27)
    expect(r.pretty).toBe(1.5)
    expect(r.deltaPct).toBeGreaterThan(0)
  })

  it('pairs raw with negative delta when pretty < raw', () => {
    const r = prettyDelta(1.74)
    expect(r.pretty).toBe(1.5)
    expect(r.deltaPct).toBeLessThan(0)
  })

  it('returns zero delta when raw is already a pretty anchor', () => {
    const r = prettyDelta(2)
    expect(r.pretty).toBe(2)
    expect(r.deltaPct).toBe(0)
  })

  it('returns 0.50 / 0 for non-positive input', () => {
    expect(prettyDelta(0)).toEqual({ pretty: 0.5, deltaPct: 0 })
    expect(prettyDelta(-1)).toEqual({ pretty: 0.5, deltaPct: 0 })
  })
})

describe('salesToBreakEven', () => {
  it('returns ceil(totalBatchCost / sellPricePerUnit)', () => {
    // 4 / 1.5 = 2.66… → ceil = 3
    expect(salesToBreakEven(4, 1.5)).toBe(3)
  })

  it('returns 1 when sell price already covers the batch in a single unit', () => {
    expect(salesToBreakEven(4, 5)).toBe(1)
  })

  it('returns null when totalBatchCost is null', () => {
    expect(salesToBreakEven(null, 1.5)).toBeNull()
  })

  it('returns null when sellPricePerUnit is null', () => {
    expect(salesToBreakEven(4, null)).toBeNull()
  })

  it('returns null when either input is zero', () => {
    expect(salesToBreakEven(0, 1.5)).toBeNull()
    expect(salesToBreakEven(4, 0)).toBeNull()
  })

  it('returns null when either input is non-finite', () => {
    expect(salesToBreakEven(Infinity, 1)).toBeNull()
    expect(salesToBreakEven(4, NaN)).toBeNull()
  })
})

describe('getEstimatedSold', () => {
  it('returns the override when set', () => {
    const s = setEstimatedSold(emptyPricing(), 'r1', 3)
    expect(getEstimatedSold(s, 'r1', 8)).toBe(3)
  })

  it('returns the default when no override exists', () => {
    expect(getEstimatedSold(emptyPricing(), 'r1', 8)).toBe(8)
  })

  it('returns the default when override is undefined despite markupPct set', () => {
    const s = setMarkupPct(emptyPricing(), 'r1', 200)
    expect(getEstimatedSold(s, 'r1', 8)).toBe(8)
  })

  it('accepts zero as a valid override', () => {
    const s = setEstimatedSold(emptyPricing(), 'r1', 0)
    expect(getEstimatedSold(s, 'r1', 8)).toBe(0)
  })
})

describe('setEstimatedSold', () => {
  it('adds a new override and preserves markupPct', () => {
    const start = setMarkupPct(emptyPricing(), 'r1', 200)
    const next = setEstimatedSold(start, 'r1', 4)
    expect(next.perRecipe['r1']?.estimatedSoldUnits).toBe(4)
    expect(next.perRecipe['r1']?.markupPct).toBe(200)
  })

  it('seeds with fallback markupPct when none exists', () => {
    const next = setEstimatedSold(emptyPricing(), 'r1', 4)
    expect(next.perRecipe['r1']?.markupPct).toBe(150)
    expect(next.perRecipe['r1']?.estimatedSoldUnits).toBe(4)
  })

  it('clears the override when passed null', () => {
    const start = setEstimatedSold(setMarkupPct(emptyPricing(), 'r1', 200), 'r1', 4)
    const cleared = setEstimatedSold(start, 'r1', null)
    expect(cleared.perRecipe['r1']?.estimatedSoldUnits).toBeUndefined()
    expect(cleared.perRecipe['r1']?.markupPct).toBe(200)
  })

  it('ignores negative inputs (treats as clear)', () => {
    const next = setEstimatedSold(emptyPricing(), 'r1', -5)
    expect(next.perRecipe['r1']?.estimatedSoldUnits).toBeUndefined()
  })
})

describe('loadPricing — estimatedSoldUnits', () => {
  beforeEach(() => {
    __ls_store = {}
  })

  it('preserves a persisted estimatedSoldUnits value', () => {
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'r1': { markupPct: 200, estimatedSoldUnits: 5 } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const s = loadPricing()
    expect(s.perRecipe['r1']?.estimatedSoldUnits).toBe(5)
  })

  it('drops a malformed estimatedSoldUnits value', () => {
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'r1': { markupPct: 200, estimatedSoldUnits: 'oops' } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const s = loadPricing()
    expect(s.perRecipe['r1']?.markupPct).toBe(200)
    expect(s.perRecipe['r1']?.estimatedSoldUnits).toBeUndefined()
  })
})

describe('getSellPriceOverride', () => {
  it('returns null when no override is set', () => {
    expect(getSellPriceOverride(emptyPricing(), 'r1')).toBeNull()
  })

  it('returns the override when set', () => {
    const s = setSellPriceOverride(emptyPricing(), 'r1', 18)
    expect(getSellPriceOverride(s, 'r1')).toBe(18)
  })

  it('returns null when override is non-positive or non-finite', () => {
    const s = {
      perRecipe: { 'r1': { markupPct: 150, sellPriceOverride: 0 } },
      updated: '2026-05-12T00:00:00Z',
    }
    expect(getSellPriceOverride(s, 'r1')).toBeNull()
  })
})

describe('setSellPriceOverride', () => {
  it('adds a new override and preserves markupPct', () => {
    const start = setMarkupPct(emptyPricing(), 'r1', 200)
    const next = setSellPriceOverride(start, 'r1', 12.5)
    expect(next.perRecipe['r1']?.sellPriceOverride).toBe(12.5)
    expect(next.perRecipe['r1']?.markupPct).toBe(200)
  })

  it('seeds with fallback markupPct when none exists', () => {
    const next = setSellPriceOverride(emptyPricing(), 'r1', 12.5)
    expect(next.perRecipe['r1']?.markupPct).toBe(150)
    expect(next.perRecipe['r1']?.sellPriceOverride).toBe(12.5)
  })

  it('preserves estimatedSoldUnits when set', () => {
    const start = setEstimatedSold(emptyPricing(), 'r1', 4)
    const next = setSellPriceOverride(start, 'r1', 12)
    expect(next.perRecipe['r1']?.estimatedSoldUnits).toBe(4)
    expect(next.perRecipe['r1']?.sellPriceOverride).toBe(12)
  })

  it('clears the override when passed null', () => {
    const start = setSellPriceOverride(setMarkupPct(emptyPricing(), 'r1', 200), 'r1', 18)
    const cleared = setSellPriceOverride(start, 'r1', null)
    expect(cleared.perRecipe['r1']?.sellPriceOverride).toBeUndefined()
    expect(cleared.perRecipe['r1']?.markupPct).toBe(200)
  })

  it('treats non-positive values as clear', () => {
    const start = setSellPriceOverride(emptyPricing(), 'r1', 18)
    const cleared = setSellPriceOverride(start, 'r1', 0)
    expect(cleared.perRecipe['r1']?.sellPriceOverride).toBeUndefined()
  })

  it('treats negative values as clear', () => {
    const next = setSellPriceOverride(emptyPricing(), 'r1', -5)
    expect(next.perRecipe['r1']?.sellPriceOverride).toBeUndefined()
  })
})

describe('loadPricing — sellPriceOverride', () => {
  beforeEach(() => {
    __ls_store = {}
  })

  it('preserves a persisted sellPriceOverride value', () => {
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'r1': { markupPct: 200, sellPriceOverride: 18 } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const s = loadPricing()
    expect(s.perRecipe['r1']?.sellPriceOverride).toBe(18)
  })

  it('drops a malformed sellPriceOverride value', () => {
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'r1': { markupPct: 200, sellPriceOverride: 'oops' } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const s = loadPricing()
    expect(s.perRecipe['r1']?.markupPct).toBe(200)
    expect(s.perRecipe['r1']?.sellPriceOverride).toBeUndefined()
  })

  it('drops a non-positive sellPriceOverride value', () => {
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'r1': { markupPct: 200, sellPriceOverride: 0 } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const s = loadPricing()
    expect(s.perRecipe['r1']?.sellPriceOverride).toBeUndefined()
  })
})

describe('derivedMarkupPct', () => {
  it('reverse-engineers markup% from sell + cost', () => {
    // $1.27 cost, $18 sell → (18 - 1.27) / 1.27 * 100 ≈ 1317%
    const v = derivedMarkupPct(18, 1.27)
    expect(v).not.toBeNull()
    expect(Math.round(v as number)).toBe(1317)
  })

  it('returns 0 when sell equals cost', () => {
    expect(derivedMarkupPct(1, 1)).toBe(0)
  })

  it('returns null when cost is non-positive', () => {
    expect(derivedMarkupPct(10, 0)).toBeNull()
    expect(derivedMarkupPct(10, -1)).toBeNull()
  })

  it('returns null when inputs are non-finite', () => {
    expect(derivedMarkupPct(NaN, 1)).toBeNull()
    expect(derivedMarkupPct(10, Infinity)).toBeNull()
  })
})

describe('cp', () => {
  it('decomposes sell vs cost', () => {
    const r = cp(3, 0.42)
    expect(r.cp).toBeCloseTo(2.58, 5)
    expect(r.cpPct).toBeCloseTo(2.58 / 3, 5)
  })

  it('returns 0% when sell price is 0', () => {
    const r = cp(0, 0)
    expect(r.cp).toBe(0)
    expect(r.cpPct).toBe(0)
  })
})
