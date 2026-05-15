import { describe, it, expect } from 'vitest'
import {
  buildCaption,
  computeBakeAggregates,
  computeRecipeAggregates,
  formatCaloriesK,
  formatDollars,
  formatOutcome,
  formatTypeCounts,
  shortenRecipeName,
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
    totalBakes: 38,
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
  it('formats each outcome with emoji prefix and capitalized label', () => {
    expect(formatOutcome('success')).toBe('✅ Success')
    expect(formatOutcome('mid')).toBe('\u{1F610} Mid')
    expect(formatOutcome('meh')).toBe('\u{1F44E} Meh')
    expect(formatOutcome('failure')).toBe('\u{1F4A5} Failure')
  })
  it('returns null for missing outcome', () => {
    expect(formatOutcome(null)).toBeNull()
    expect(formatOutcome(undefined)).toBeNull()
  })
})

describe('buildCaption', () => {
  it('builds full caption with cost + outcome populated', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 2,
      recipeName: 'Sourdough Jalapeno',
      outcome: 'success',
      thisCost: 5.66,
      thisCostPerItem: 2.83,
    })
    const lines = result.split('\n')
    expect(lines).toHaveLength(4)
    expect(lines[0]).toBe('Bake #2 of Sourdough Jalapeno – ✅ Success')
    expect(lines[1]).toBe('Bake cost: \u{1F4B0} $5.66 total ($2.83/item)')
    expect(lines[2]).toBe('47 days baked\t(12% of 392 days since first bake)')
    expect(lines[3]).toBe('38 bakes\t22\u{1F35E} 10\u{1F9C1} 6\u{1F355}\t\u{1F525} 421.0k cals')
  })

  it('omits outcome from L1 when null (skip)', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 4,
      recipeName: 'Sourdough Jalapeno',
      outcome: null,
      thisCost: 9.2,
    })
    const lines = result.split('\n')
    expect(lines[0]).toBe('Bake #4 of Sourdough Jalapeno')
    expect(lines[0]).not.toContain('Success')
    expect(lines[0]).not.toContain('–')
  })

  it('omits cost line entirely when thisCost null', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 1,
      recipeName: 'Test',
      outcome: 'mid',
      thisCost: null,
    })
    const lines = result.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('Bake #1 of Test – \u{1F610} Mid')
    expect(lines[1]).toBe('47 days baked\t(12% of 392 days since first bake)')
  })

  it('omits per-item cost when thisCostPerItem missing', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 1,
      recipeName: 'Test',
      outcome: null,
      thisCost: 9.2,
    })
    const lines = result.split('\n')
    expect(lines[1]).toBe('Bake cost: \u{1F4B0} $9.20 total')
    expect(lines[1]).not.toContain('/item')
  })

  it('drops typeCounts from L4 when no groups have data', () => {
    const result = buildCaption({
      aggregates: makeAggregates({ typeCounts: [], totalBakes: 0 }),
      recipeBakeCount: 4,
      recipeName: 'Test',
      outcome: null,
      thisCost: null,
    })
    const lines = result.split('\n')
    expect(lines[2]).toBe('0 bakes\t\u{1F525} 421.0k cals')
    expect(lines[2]).not.toContain('\t\t')
  })

  it('handles zero calories gracefully', () => {
    const result = buildCaption({
      aggregates: makeAggregates({ totalCalories: 0 }),
      recipeBakeCount: 1,
      recipeName: 'Test',
      outcome: null,
      thisCost: null,
    })
    const lines = result.split('\n')
    expect(lines[2]).toContain('0 cals')
  })

  it('capitalizes all outcome labels', () => {
    const outcomes: Array<[NonNullable<Parameters<typeof buildCaption>[0]['outcome']>, string]> = [
      ['success', '✅ Success'],
      ['mid', '\u{1F610} Mid'],
      ['meh', '\u{1F44E} Meh'],
      ['failure', '\u{1F4A5} Failure'],
    ]
    for (const [outcome, label] of outcomes) {
      const result = buildCaption({
        aggregates: makeAggregates(),
        recipeBakeCount: 1,
        recipeName: 'Test',
        outcome,
        thisCost: null,
      })
      expect(result.split('\n')[0]).toBe(`Bake #1 of Test – ${label}`)
    }
  })

  it('does NOT contain lifetime spend anywhere', () => {
    const result = buildCaption({
      aggregates: makeAggregates(),
      recipeBakeCount: 1,
      recipeName: 'Test',
      outcome: null,
      thisCost: null,
    })
    expect(result).not.toContain('across all bakes')
    expect(result).not.toContain('$284.50')
  })
})

describe('shortenRecipeName', () => {
  it('strips variant suffix, preserves casing', () => {
    expect(shortenRecipeName('Jalapeño Cheddar Sourdough - 67% Hydration')).toBe('Jalapeño Cheddar Sourdough')
  })
  it('passes through name without variant', () => {
    expect(shortenRecipeName('Sourdough Pizza Dough')).toBe('Sourdough Pizza Dough')
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

// ---------------------------------------------------------------------------
// PF-240 — excludeFromStats filter (5 tests covering AC #11-15)
// ---------------------------------------------------------------------------

describe('computeBakeAggregates — excludeFromStats (PF-240)', () => {
  const fixedToday = new Date(2026, 4, 5) // 2026-05-05

  it('AC #11: same-date entries — daysBaked counts the date once, lifetimeSpend skips excluded', () => {
    // Two entries on the same date for the same recipe: one normal, one
    // excluded. Cadence still counts the date (because the normal entry
    // exists), but lifetimeSpend only sees the non-excluded entry's cost.
    const recipes = [
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaf', servingsPerItem: 10, servingUnit: 'slices' },
        },
        cook_log: [
          { date: '2026-04-01', version: 'v1', notes: [], cost: { total: 5, perServing: 0.5, servings: 10, items: [] } },
          { date: '2026-04-01', version: 'v1', notes: [], excludeFromStats: true, cost: { total: 99, perServing: 9.9, servings: 10, items: [] } },
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    // Cadence: only the non-excluded entry contributes (excluded one is dropped).
    expect(r.daysBaked).toBe(1)
    expect(r.lifetimeSpend).toBe(5)
    expect(r.totalBakes).toBe(1)
  })

  it('AC #12: single excluded entry — every aggregate is zero', () => {
    const recipes = [
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaf', servingsPerItem: 10, servingUnit: 'slices' },
        },
        nutrition: {
          servings: 10,
          calculatedDate: '2026-01-01',
          dataSource: 'usda',
          totals: { calories: 1000, protein: 0, totalFat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, fiber: 0, sodium: 0 },
          perServing: { calories: 100, protein: 0, totalFat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, fiber: 0, sodium: 0 },
          breakdown: [],
        },
        cook_log: [
          { date: '2026-04-01', version: 'v1', notes: [], excludeFromStats: true, cost: { total: 12, perServing: 1.2, servings: 10, items: [] } },
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    expect(r.daysBaked).toBe(0)
    expect(r.lifetimeSpend).toBe(0)
    expect(r.totalBakes).toBe(0)
    expect(r.totalCalories).toBe(0)
    expect(r.typeCounts).toEqual([])
  })

  it('AC #13: aberration=true + excludeFromStats=false — independent flags compose', () => {
    // Aberration filter keeps the entry out of calories + group counts but
    // counts it in cadence + spend. excludeFromStats: false (explicit) means
    // the stats filter does NOT additionally drop it. Confirms flags are
    // independent — neither subsumes the other.
    const recipes = [
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaf', servingsPerItem: 10, servingUnit: 'slices' },
        },
        nutrition: {
          servings: 10,
          calculatedDate: '2026-01-01',
          dataSource: 'usda',
          totals: { calories: 1000, protein: 0, totalFat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, fiber: 0, sodium: 0 },
          perServing: { calories: 100, protein: 0, totalFat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, fiber: 0, sodium: 0 },
          breakdown: [],
        },
        cook_log: [
          { date: '2026-04-01', version: 'v1', notes: [], aberration: true, excludeFromStats: false, cost: { total: 7, perServing: 0.7, servings: 10, items: [] } },
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    // Aberration → no calories, no group count
    expect(r.totalCalories).toBe(0)
    expect(r.typeCounts).toEqual([])
    expect(r.totalBakes).toBe(0)
    // Not stats-excluded → cadence + spend still count it
    expect(r.daysBaked).toBe(1)
    expect(r.lifetimeSpend).toBe(7)
  })

  it('AC #14: aberration=false + excludeFromStats=true — entry is fully out', () => {
    const recipes = [
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaf', servingsPerItem: 10, servingUnit: 'slices' },
        },
        nutrition: {
          servings: 10,
          calculatedDate: '2026-01-01',
          dataSource: 'usda',
          totals: { calories: 1000, protein: 0, totalFat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, fiber: 0, sodium: 0 },
          perServing: { calories: 100, protein: 0, totalFat: 0, saturatedFat: 0, carbohydrates: 0, sugar: 0, fiber: 0, sodium: 0 },
          breakdown: [],
        },
        cook_log: [
          { date: '2026-04-01', version: 'v1', notes: [], aberration: false, excludeFromStats: true, cost: { total: 9, perServing: 0.9, servings: 10, items: [] } },
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    expect(r.daysBaked).toBe(0)
    expect(r.lifetimeSpend).toBe(0)
    expect(r.totalCalories).toBe(0)
    expect(r.typeCounts).toEqual([])
    expect(r.totalBakes).toBe(0)
  })

  it('AC #15: recipe.config.excludeFromStatsDefault=true — entries default to excluded; per-entry false opts in', () => {
    // Recipe-level default excludes everything UNLESS an entry sets
    // excludeFromStats: false explicitly. This is the read-time companion
    // to /bake-log skill writing the default at entry-creation time.
    const recipes = [
      makeRecipe({
        config: {
          early_check_percent: 75,
          stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaf', servingsPerItem: 10, servingUnit: 'slices' },
          excludeFromStatsDefault: true,
        },
        cook_log: [
          // Entry A: no per-entry flag → falls under default → excluded
          { date: '2026-04-01', version: 'v1', notes: [], cost: { total: 5, perServing: 0.5, servings: 10, items: [] } },
          // Entry B: explicit false → overrides default → counted
          { date: '2026-05-01', version: 'v1', notes: [], excludeFromStats: false, cost: { total: 8, perServing: 0.8, servings: 10, items: [] } },
        ],
      }),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    // Only entry B counts
    expect(r.daysBaked).toBe(1)
    expect(r.lifetimeSpend).toBe(8)
    expect(r.totalBakes).toBe(1)
    expect(r.typeCounts[0]?.label).toBe('Sourdough Breads')
    expect(r.typeCounts[0]?.count).toBe(1)
  })
})

describe('computeBakeAggregates — bakingOnly filter (F44)', () => {
  const fixedToday = new Date(2026, 4, 5)

  function bakingRecipe(group: string, dates: string[]): Recipe {
    return makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group, defaultYield: 1, unit: 'loaf', servingsPerItem: 1, servingUnit: 'pieces' },
      },
      cook_log: dates.map((d) => ({ date: d, version: 'v1', notes: [] })),
    })
  }

  function nonBakingRecipe(group: string, dates: string[]): Recipe {
    return makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group, defaultYield: 1, unit: 'jar', servingsPerItem: 1, servingUnit: 'pieces', baking: false },
      },
      cook_log: dates.map((d) => ({ date: d, version: 'v1', notes: [] })),
    })
  }

  it('drops non-baking recipes from every aggregate by default', () => {
    const recipes = [
      bakingRecipe('Sourdough Breads', ['2026-01-01', '2026-02-01']),
      nonBakingRecipe('Sauces & Condiments', ['2026-03-01']),
      nonBakingRecipe('Noodles & Soups', ['2026-04-01']),
    ]
    const r = computeBakeAggregates(recipes, fixedToday)
    expect(r.totalBakes).toBe(2)
    expect(r.typeCounts.map((g) => g.label)).toEqual(['Sourdough Breads'])
    expect(r.daysBaked).toBe(2)
  })

  it('includes non-baking recipes when bakingOnly is false', () => {
    const recipes = [
      bakingRecipe('Sourdough Breads', ['2026-01-01']),
      nonBakingRecipe('Sauces & Condiments', ['2026-03-01']),
      nonBakingRecipe('Noodles & Soups', ['2026-04-01']),
    ]
    const r = computeBakeAggregates(recipes, fixedToday, { bakingOnly: false })
    expect(r.totalBakes).toBe(3)
    expect(r.typeCounts.map((g) => g.label).sort()).toEqual(
      ['Noodles & Soups', 'Sauces & Condiments', 'Sourdough Breads'].sort(),
    )
    expect(r.daysBaked).toBe(3)
  })

  it('treats baking: absent as baking-eligible (default true)', () => {
    const noFlag = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Pizza', defaultYield: 1, unit: 'pizza', servingsPerItem: 1, servingUnit: 'pieces' },
        // no baking field
      },
      cook_log: [{ date: '2026-01-01', version: 'v1', notes: [] }],
    })
    const r = computeBakeAggregates([noFlag], fixedToday)
    expect(r.totalBakes).toBe(1)
    expect(r.typeCounts[0]?.label).toBe('Pizza')
  })
})

describe('SHARE_GROUP_ICONS (F45)', () => {
  it('covers every stats.group present in /public/recipes/*.json', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const { SHARE_GROUP_ICONS } = await import('./useBakeAggregates')
    const dir = resolve(process.cwd(), 'public/recipes')
    const files = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'index.json')
    const groups = new Set<string>()
    for (const f of files) {
      const data = JSON.parse(readFileSync(resolve(dir, f), 'utf-8'))
      const g = data?.config?.stats?.group
      if (typeof g === 'string') groups.add(g)
    }
    const missing = [...groups].filter((g) => !(g in SHARE_GROUP_ICONS))
    expect(missing).toEqual([])
  })
})

describe('computeRecipeAggregates — excludeFromStats (PF-240)', () => {
  it('skips excludeFromStats entries from recipeBakeCount', () => {
    const recipe = makeRecipe({
      cook_log: [
        { date: '2026-01-01', version: 'v1', notes: [] },
        { date: '2026-02-01', version: 'v1', notes: [], excludeFromStats: true },
        { date: '2026-03-01', version: 'v1', notes: [] },
      ],
    })
    expect(computeRecipeAggregates(recipe).recipeBakeCount).toBe(2)
  })

  it('honors recipe.config.excludeFromStatsDefault unless entry overrides', () => {
    const recipe = makeRecipe({
      config: { early_check_percent: 75, excludeFromStatsDefault: true },
      cook_log: [
        { date: '2026-01-01', version: 'v1', notes: [] }, // default → excluded
        { date: '2026-02-01', version: 'v1', notes: [], excludeFromStats: false }, // override → counted
        { date: '2026-03-01', version: 'v1', notes: [], excludeFromStats: true }, // explicit → excluded
      ],
    })
    expect(computeRecipeAggregates(recipe).recipeBakeCount).toBe(1)
  })
})
