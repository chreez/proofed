import { describe, it, expect } from 'vitest'
import {
  buildCaption,
  computeBakeAggregates,
  computeRecipeAggregates,
  formatCaloriesK,
  formatDollars,
  formatOutcome,
  formatTypeCounts,
  type BakeAggregates,
  type GroupCount,
} from './useBakeAggregates'
import type { Recipe } from '@/types/recipe'

// --- helpers ---

function makeAggregates(overrides: Partial<BakeAggregates> = {}): BakeAggregates {
  return {
    daysBaked: 47,
    totalDays: 392,
    percent: 12,
    totalCalories: 421000,
    typeCounts: [
      { label: 'Sourdough Breads', icon: '\u{1F35E}', count: 22 },
      { label: 'Buns & Rolls', icon: '\u{1F9C1}', count: 10 },
      { label: 'Pizza', icon: '\u{1F355}', count: 6 },
    ],
    lifetimeSpend: 284.5,
    ...overrides,
  }
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    meta: { name: 'Test Recipe', yields: '1 loaf', total_time: '4 hr' },
    config: { early_check_percent: 75 },
    vessels: [],
    stages: [],
    states: [],
    version: 'v1.0.0',
    cook_log: [],
    ...overrides,
  } as Recipe
}

describe('formatCaloriesK', () => {
  it('rounds to integer below 1000', () => {
    expect(formatCaloriesK(0)).toBe('0')
    expect(formatCaloriesK(120)).toBe('120')
    expect(formatCaloriesK(999.7)).toBe('1000')
  })
  it('formats thousands as 1.2k', () => {
    expect(formatCaloriesK(1200)).toBe('1.2k')
    expect(formatCaloriesK(421000)).toBe('421.0k')
  })
  it('formats millions as 1.2M', () => {
    expect(formatCaloriesK(1_200_000)).toBe('1.2M')
  })
})

describe('formatDollars', () => {
  it('formats with two decimals', () => {
    expect(formatDollars(0)).toBe('$0.00')
    expect(formatDollars(9.2)).toBe('$9.20')
    expect(formatDollars(284.5)).toBe('$284.50')
  })
})

describe('formatTypeCounts', () => {
  it('joins {count}{icon} space-separated', () => {
    const groups: GroupCount[] = [
      { label: 'Sourdough Breads', icon: '\u{1F35E}', count: 22 },
      { label: 'Buns & Rolls', icon: '\u{1F9C1}', count: 10 },
      { label: 'Pizza', icon: '\u{1F355}', count: 6 },
    ]
    expect(formatTypeCounts(groups)).toBe('22\u{1F35E} 10\u{1F9C1} 6\u{1F355}')
  })
  it('returns empty string for empty groups', () => {
    expect(formatTypeCounts([])).toBe('')
  })
})

describe('formatOutcome', () => {
  it('formats each outcome with emoji prefix per AC #11', () => {
    expect(formatOutcome('success')).toBe('✅ success')
    expect(formatOutcome('mid')).toBe('\u{1F610} mid')
    expect(formatOutcome('meh')).toBe('\u{1F44E} meh')
    expect(formatOutcome('failure')).toBe('\u{1F4A5} failure')
  })
  it('returns null for missing outcome', () => {
    expect(formatOutcome(null)).toBeNull()
    expect(formatOutcome(undefined)).toBeNull()
  })
})

describe('buildCaption', () => {
  it('builds 3-line caption with all segments populated', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 4,
      recipeName: 'jalapeno-cheddar-sourdough',
      outcome: 'success',
      thisCost: 9.2,
      servings: 16,
    })
    const lines = result.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('47 days baked\t12% of 392 days since first bake')
    expect(lines[1]).toBe('421.0k cals\t22\u{1F35E} 10\u{1F9C1} 6\u{1F355}\t\u{1F4B0} $284.50 across all bakes')
    expect(lines[2]).toBe('4 bakes of jalapeno-cheddar-sourdough\t✅ success\t\u{1F4B0} $9.20 total\t16 servings')
  })

  it('omits outcome segment when null (skip)', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 4,
      recipeName: 'jalapeno-cheddar-sourdough',
      outcome: null,
      thisCost: 9.2,
      servings: 16,
    })
    const lines = result.split('\n')
    expect(lines[2]).toBe('4 bakes of jalapeno-cheddar-sourdough\t\u{1F4B0} $9.20 total\t16 servings')
    expect(lines[2]).not.toContain('success')
    expect(lines[2]).not.toContain('skip')
  })

  it('omits cost segment when thisCost null', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 4,
      recipeName: 'jalapeno-cheddar-sourdough',
      outcome: null,
      thisCost: null,
      servings: 16,
    })
    const lines = result.split('\n')
    expect(lines[2]).toBe('4 bakes of jalapeno-cheddar-sourdough\t16 servings')
  })

  it('omits servings segment when null', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 4,
      recipeName: 'jalapeno-cheddar-sourdough',
      outcome: 'mid',
      thisCost: 9.2,
      servings: null,
    })
    const lines = result.split('\n')
    expect(lines[2]).toBe('4 bakes of jalapeno-cheddar-sourdough\t\u{1F610} mid\t\u{1F4B0} $9.20 total')
  })

  it('renders per-item cost when thisCostPerItem + costItemUnit provided', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 2,
      recipeName: 'jalapeno-cheddar-sourdough',
      outcome: 'success',
      thisCost: 5.66,
      thisCostPerItem: 2.83,
      costItemUnit: 'loaves',
      servings: null,
    })
    const lines = result.split('\n')
    expect(lines[2]).toBe('2 bakes of jalapeno-cheddar-sourdough\t✅ success\t\u{1F4B0} $5.66 total ($2.83/loaf)')
  })

  it('singularizes pizza unit', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 1,
      recipeName: 'pizza',
      outcome: null,
      thisCost: 4.0,
      thisCostPerItem: 1.0,
      costItemUnit: 'pizzas',
      servings: null,
    })
    const lines = result.split('\n')
    expect(lines[2]).toBe('1 bakes of pizza\t\u{1F4B0} $4.00 total ($1.00/pizza)')
  })

  it('falls back to "item" when costItemUnit null', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 1,
      recipeName: 'thing',
      outcome: null,
      thisCost: 2.0,
      thisCostPerItem: 2.0,
      costItemUnit: null,
      servings: null,
    })
    const lines = result.split('\n')
    expect(lines[2]).toBe('1 bakes of thing\t\u{1F4B0} $2.00 total ($2.00/item)')
  })

  it('omits ALL optional segments — bare recipeBakeCount + name only', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 1,
      recipeName: 'jalapeno-cheddar-sourdough',
      outcome: null,
      thisCost: null,
      servings: null,
    })
    const lines = result.split('\n')
    expect(lines[2]).toBe('1 bakes of jalapeno-cheddar-sourdough')
  })

  it('omits typeCounts segment from L2 when no groups have data', () => {
    const result = buildCaption({
      aggregates: makeAggregates({ typeCounts: [] }),
      recipeBakeCount: 4,
      recipeName: 'test',
      outcome: null,
      thisCost: null,
      servings: null,
    })
    const lines = result.split('\n')
    expect(lines[1]).toBe('421.0k cals\t\u{1F4B0} $284.50 across all bakes')
    expect(lines[1]).not.toContain('\t\t')
  })

  it('handles zero calories gracefully', () => {
    const result = buildCaption({
      aggregates: makeAggregates({ totalCalories: 0 }),
      recipeBakeCount: 1,
      recipeName: 'test',
      outcome: null,
      thisCost: null,
      servings: null,
    })
    const lines = result.split('\n')
    expect(lines[1]).toContain('0 cals')
  })
})

describe('computeBakeAggregates', () => {
  const fixedToday = new Date(2026, 4, 5) // 2026-05-05

  it('returns zeros for empty input', () => {
    const r = computeBakeAggregates([], fixedToday)
    expect(r.daysBaked).toBe(0)
    expect(r.totalDays).toBe(0)
    expect(r.percent).toBe(0)
    expect(r.totalCalories).toBe(0)
    expect(r.typeCounts).toEqual([])
    expect(r.lifetimeSpend).toBe(0)
  })

  it('sums lifetime spend across all completed entries', () => {
    const recipes = [
      makeRecipe({
        cook_log: [
          { date: '2026-01-01', version: 'v1', notes: [], cost: { total: 5.5, perServing: 1, servings: 5, items: [] } },
          { date: '2026-02-01', version: 'v1', notes: [], cost: { total: 4.5, perServing: 1, servings: 5, items: [] } },
        ],
      }),
      makeRecipe({
        cook_log: [
          { date: '2026-03-01', version: 'v1', notes: [], cost: { total: 10, perServing: 2, servings: 5, items: [] } },
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    expect(r.lifetimeSpend).toBe(20)
  })

  it('skips in_progress entries from all aggregates', () => {
    const recipes = [
      makeRecipe({
        cook_log: [
          { date: '2026-01-01', version: 'v1', notes: [], cost: { total: 5, perServing: 1, servings: 5, items: [] } },
          { date: '2026-04-01', version: 'v1', notes: [], status: 'in_progress', cost: { total: 99, perServing: 1, servings: 5, items: [] } },
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    expect(r.lifetimeSpend).toBe(5)
    expect(r.daysBaked).toBe(1)
  })

  it('counts cadence dates including aberrations', () => {
    const recipes = [
      makeRecipe({
        cook_log: [
          { date: '2026-04-01', version: 'v1', notes: [] },
          { date: '2026-05-05', version: 'v1', notes: [], aberration: true },
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    expect(r.daysBaked).toBe(2)
  })

  it('groups counts by stats.group, sorted DESC, Aberrations excluded', () => {
    const recipes = [
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaf', servingsPerItem: 10, servingUnit: 'slices' },
        },
        cook_log: [
          { date: '2026-01-01', version: 'v1', notes: [] },
          { date: '2026-02-01', version: 'v1', notes: [] },
          { date: '2026-03-01', version: 'v1', notes: [] },
        ],
      }),
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Pizza', defaultYield: 2, unit: 'pizzas', servingsPerItem: 8, servingUnit: 'slices' },
        },
        cook_log: [
          { date: '2026-04-01', version: 'v1', notes: [] },
        ],
      }),
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Aberrations', defaultYield: 1, unit: 'pan', servingsPerItem: 1, servingUnit: 'pieces' },
        },
        cook_log: [{ date: '2026-04-15', version: 'v1', notes: [] }],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    expect(r.typeCounts.map((g) => g.label)).toEqual(['Sourdough Breads', 'Pizza'])
    expect(r.typeCounts[0].count).toBe(3)
    expect(r.typeCounts[1].count).toBe(1)
    expect(r.typeCounts.find((g) => g.label === 'Aberrations')).toBeUndefined()
  })

  it('skips aberration entries from group counts but includes in cadence', () => {
    const recipes = [
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaf', servingsPerItem: 10, servingUnit: 'slices' },
        },
        cook_log: [
          { date: '2026-01-01', version: 'v1', notes: [] },
          { date: '2026-02-01', version: 'v1', notes: [], aberration: true },
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    expect(r.typeCounts[0].count).toBe(1) // only non-aberration
    expect(r.daysBaked).toBe(2) // both dates count for cadence
  })

  it('skips recipes without nutrition from calorie total', () => {
    const recipes = [
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaf', servingsPerItem: 10, servingUnit: 'slices' },
        },
        // no nutrition
        cook_log: [{ date: '2026-01-01', version: 'v1', notes: [] }],
      }),
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Pizza', defaultYield: 2, unit: 'pizzas', servingsPerItem: 8, servingUnit: 'slices' },
        },
        nutrition: {
          servings: 16,
          calculatedDate: '2026-01-01',
          dataSource: 'usda',
          totals: { calories: 1600, protein: 0, totalFat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, fiber: 0, sodium: 0 },
          perServing: { calories: 100, protein: 0, totalFat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, fiber: 0, sodium: 0 },
          breakdown: [],
        },
        cook_log: [{ date: '2026-02-01', version: 'v1', notes: [] }],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    // Pizza: defaultYield 2 * servingsPerItem 8 = 16 servings * 100 cal/serving = 1600
    expect(r.totalCalories).toBe(1600)
  })

  it('computes percent = round(daysBaked / totalDays * 100)', () => {
    const recipes = [
      makeRecipe({
        cook_log: [
          { date: '2026-04-01', version: 'v1', notes: [] }, // today - 34
          { date: '2026-05-05', version: 'v1', notes: [] }, // today
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    // 2 days baked over 35 inclusive (2026-04-01 → 2026-05-05) = 35 days, 2/35 ≈ 5.7% → 6
    expect(r.totalDays).toBe(35)
    expect(r.daysBaked).toBe(2)
    expect(r.percent).toBe(6)
  })
})

describe('computeRecipeAggregates', () => {
  it('returns zero for null/undefined recipe', () => {
    expect(computeRecipeAggregates(null).recipeBakeCount).toBe(0)
    expect(computeRecipeAggregates(undefined).recipeBakeCount).toBe(0)
  })

  it('counts only completed non-aberration entries', () => {
    const recipe = makeRecipe({
      cook_log: [
        { date: '2026-01-01', version: 'v1', notes: [] },
        { date: '2026-02-01', version: 'v1', notes: [], aberration: true },
        { date: '2026-03-01', version: 'v1', notes: [], status: 'in_progress' },
        { date: '2026-04-01', version: 'v1', notes: [] },
      ],
    })
    expect(computeRecipeAggregates(recipe).recipeBakeCount).toBe(2)
  })

  it('returns zero for recipe with empty cook_log', () => {
    const recipe = makeRecipe({ cook_log: [] })
    expect(computeRecipeAggregates(recipe).recipeBakeCount).toBe(0)
  })

  it('handles recipe with no cook_log property', () => {
    const recipe = makeRecipe({ cook_log: undefined })
    expect(computeRecipeAggregates(recipe).recipeBakeCount).toBe(0)
  })
})
