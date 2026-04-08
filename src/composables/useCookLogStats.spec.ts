import { describe, it, expect } from 'vitest'
import {
  completedBakes,
  sessionCount,
  itemsCreated,
  servingsCreated,
  caloriesCreated,
} from './useCookLogStats'
import type { CookLogEntry, Recipe, RecipeStats } from '@/types/recipe'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeStats(overrides: Partial<RecipeStats> = {}): RecipeStats {
  return {
    group: 'bread',
    defaultYield: 1,
    unit: 'loaves',
    servingsPerItem: 8,
    servingUnit: 'slices',
    ...overrides,
  }
}

function makeEntry(overrides: Partial<CookLogEntry> = {}): CookLogEntry {
  return {
    date: '2026-03-01',
    version: '1.0.0',
    notes: [],
    ...overrides,
  }
}

function makeRecipe(
  stats: RecipeStats | undefined,
  perServingCalories: number | null = null,
): Recipe {
  return {
    meta: {} as Recipe['meta'],
    config: {
      early_check_percent: 90,
      ...(stats ? { stats } : {}),
    },
    vessels: [],
    stages: [],
    states: [],
    version: '1.0.0',
    ...(perServingCalories != null
      ? {
          nutrition: {
            servings: 8,
            calculatedDate: '2026-03-01',
            dataSource: 'test',
            totals: {
              calories: perServingCalories * 8,
              protein: 0,
              totalFat: 0,
              saturatedFat: 0,
              carbohydrates: 0,
              sugar: 0,
              fiber: 0,
              sodium: 0,
            },
            perServing: {
              calories: perServingCalories,
              protein: 0,
              totalFat: 0,
              saturatedFat: 0,
              carbohydrates: 0,
              sugar: 0,
              fiber: 0,
              sodium: 0,
            },
            breakdown: [],
          },
        }
      : {}),
  }
}

// ---------------------------------------------------------------------------
// completedBakes
// ---------------------------------------------------------------------------

describe('completedBakes', () => {
  it('returns empty array when cookLog is undefined', () => {
    expect(completedBakes(undefined)).toEqual([])
  })

  it('returns empty array when cookLog is empty', () => {
    expect(completedBakes([])).toEqual([])
  })

  it('filters out in_progress entries', () => {
    const entries: CookLogEntry[] = [
      makeEntry({ date: '2026-01-01', status: 'complete' }),
      makeEntry({ date: '2026-01-02', status: 'in_progress' }),
      makeEntry({ date: '2026-01-03' }), // no status = complete
    ]
    const result = completedBakes(entries)
    expect(result).toHaveLength(2)
    expect(result.map(e => e.date)).toEqual(['2026-01-01', '2026-01-03'])
  })

  it('includes aberration entries', () => {
    const entries: CookLogEntry[] = [
      makeEntry({ date: '2026-01-01', aberration: true }),
      makeEntry({ date: '2026-01-02' }),
    ]
    expect(completedBakes(entries)).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// sessionCount
// ---------------------------------------------------------------------------

describe('sessionCount', () => {
  it('returns 0 for undefined/empty', () => {
    expect(sessionCount(undefined)).toBe(0)
    expect(sessionCount([])).toBe(0)
  })

  it('counts only completed bakes', () => {
    const entries: CookLogEntry[] = [
      makeEntry({ status: 'complete' }),
      makeEntry({ status: 'in_progress' }),
      makeEntry({}),
    ]
    expect(sessionCount(entries)).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// itemsCreated
// ---------------------------------------------------------------------------

describe('itemsCreated', () => {
  it('returns 0 when recipe is undefined', () => {
    expect(itemsCreated([makeEntry()], undefined)).toBe(0)
  })

  it('returns 0 when recipe has no stats config', () => {
    const recipe = makeRecipe(undefined)
    expect(itemsCreated([makeEntry()], recipe)).toBe(0)
  })

  it('uses defaultYield when actual_yield is absent', () => {
    const recipe = makeRecipe(makeStats({ defaultYield: 1 }))
    const entries = [makeEntry(), makeEntry(), makeEntry()]
    expect(itemsCreated(entries, recipe)).toBe(3)
  })

  it('uses actual_yield.value when present', () => {
    const recipe = makeRecipe(makeStats({ defaultYield: 1 }))
    const entries = [
      makeEntry({ actual_yield: { value: 2, unit: 'loaves' } }),
      makeEntry({ actual_yield: { value: 3, unit: 'loaves' } }),
    ]
    expect(itemsCreated(entries, recipe)).toBe(5)
  })

  it('mixes actual_yield and defaultYield fallback across entries', () => {
    const recipe = makeRecipe(makeStats({ defaultYield: 1 }))
    const entries = [
      makeEntry({ actual_yield: { value: 4, unit: 'loaves' } }),
      makeEntry(), // fallback to defaultYield = 1
    ]
    expect(itemsCreated(entries, recipe)).toBe(5)
  })

  it('ignores in_progress entries', () => {
    const recipe = makeRecipe(makeStats({ defaultYield: 2 }))
    const entries = [
      makeEntry(),
      makeEntry({ status: 'in_progress' }),
    ]
    expect(itemsCreated(entries, recipe)).toBe(2)
  })

  it('returns 0 for empty cookLog', () => {
    const recipe = makeRecipe(makeStats())
    expect(itemsCreated([], recipe)).toBe(0)
    expect(itemsCreated(undefined, recipe)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// servingsCreated
// ---------------------------------------------------------------------------

describe('servingsCreated', () => {
  it('returns 0 when recipe is undefined', () => {
    expect(servingsCreated([makeEntry()], undefined)).toBe(0)
  })

  it('returns 0 when recipe has no stats config', () => {
    const recipe = makeRecipe(undefined)
    expect(servingsCreated([makeEntry()], recipe)).toBe(0)
  })

  it('multiplies items by servingsPerItem', () => {
    const recipe = makeRecipe(makeStats({ defaultYield: 1, servingsPerItem: 8 }))
    const entries = [makeEntry(), makeEntry()]
    expect(servingsCreated(entries, recipe)).toBe(16)
  })

  it('handles servingsPerItem = 1', () => {
    const recipe = makeRecipe(makeStats({ defaultYield: 12, servingsPerItem: 1 }))
    const entries = [makeEntry()]
    expect(servingsCreated(entries, recipe)).toBe(12)
  })
})

// ---------------------------------------------------------------------------
// caloriesCreated
// ---------------------------------------------------------------------------

describe('caloriesCreated', () => {
  it('returns null when recipe is undefined', () => {
    expect(caloriesCreated([makeEntry()], undefined)).toBeNull()
  })

  it('returns null when recipe has no nutrition block', () => {
    const recipe = makeRecipe(makeStats(), null)
    expect(caloriesCreated([makeEntry()], recipe)).toBeNull()
  })

  it('returns null when perServing.calories is undefined', () => {
    const recipe: Recipe = {
      ...makeRecipe(makeStats(), 100),
    }
    // Force perServing.calories to undefined via delete
    if (recipe.nutrition) {
      // @ts-expect-error — test-only mutation
      delete recipe.nutrition.perServing.calories
    }
    expect(caloriesCreated([makeEntry()], recipe)).toBeNull()
  })

  it('computes total calories: servings × perServing.calories', () => {
    const recipe = makeRecipe(
      makeStats({ defaultYield: 1, servingsPerItem: 8 }),
      150,
    )
    const entries = [makeEntry(), makeEntry()] // 2 bakes × 1 item × 8 servings = 16 servings
    expect(caloriesCreated(entries, recipe)).toBe(2400) // 16 × 150
  })

  it('returns 0 calories when no completed bakes', () => {
    const recipe = makeRecipe(makeStats(), 150)
    expect(caloriesCreated([], recipe)).toBe(0)
    expect(caloriesCreated(undefined, recipe)).toBe(0)
  })

  it('uses actual_yield when computing calories', () => {
    const recipe = makeRecipe(
      makeStats({ defaultYield: 1, servingsPerItem: 10 }),
      100,
    )
    const entries = [
      makeEntry({ actual_yield: { value: 3, unit: 'loaves' } }),
    ]
    // 3 items × 10 servings × 100 cal = 3000
    expect(caloriesCreated(entries, recipe)).toBe(3000)
  })
})
