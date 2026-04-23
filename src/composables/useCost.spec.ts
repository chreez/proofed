import { describe, it, expect } from 'vitest'
import { getMostRecentCost, getMostRecentCostWithItems, getMostRecentCostWithItemsDate, getServings, getMostRecentCostDate, getMajorVersion, getVersionAverageCost } from './useCost'
import type { Recipe, CookLogCost } from '@/types/recipe'

describe('useCost', () => {
  describe('getMostRecentCost', () => {
    it('returns null when recipe has no cook_log', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0'
      }

      expect(getMostRecentCost(recipe)).toBeNull()
    })

    it('returns null when cook_log is empty', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0',
        cook_log: []
      }

      expect(getMostRecentCost(recipe)).toBeNull()
    })

    it('returns null when no cook_log entries have cost data', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0',
        cook_log: [
          {
            date: '2026-02-01',
            version: 'v1.0.0',
            notes: ['First bake']
          },
          {
            date: '2026-02-02',
            version: 'v1.0.0',
            notes: ['Second bake']
          }
        ]
      }

      expect(getMostRecentCost(recipe)).toBeNull()
    })

    it('returns the most recent cost data when multiple bakes have costs', () => {
      const olderCost: CookLogCost = {
        total: 5.00,
        perServing: 2.50,
        servings: 2,
        items: []
      }

      const newerCost: CookLogCost = {
        total: 6.00,
        perServing: 3.00,
        servings: 2,
        items: []
      }

      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0',
        cook_log: [
          {
            date: '2026-02-01',
            version: 'v1.0.0',
            notes: ['First bake'],
            cost: olderCost
          },
          {
            date: '2026-02-15',
            version: 'v1.0.0',
            notes: ['Second bake'],
            cost: newerCost
          },
          {
            date: '2026-02-10',
            version: 'v1.0.0',
            notes: ['No cost bake']
          }
        ]
      }

      const result = getMostRecentCost(recipe)
      expect(result).toEqual(newerCost)
      expect(result?.total).toBe(6.00)
    })

    it('returns cost from single bake when only one has cost data', () => {
      const cost: CookLogCost = {
        total: 1.34,
        perServing: 1.34,
        servings: 1,
        items: [
          {
            ingredientId: 'flour',
            name: 'Flour',
            sourceType: 'heb',
            sourceName: 'King Arthur Bread Flour',
            amount: 500,
            unit: 'g',
            cost: 1.23
          }
        ]
      }

      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0',
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake with cost'],
            cost
          }
        ]
      }

      expect(getMostRecentCost(recipe)).toEqual(cost)
    })

    it('ignores entries with cost.total = null', () => {
      const validCost: CookLogCost = {
        total: 2.50,
        perServing: 1.25,
        servings: 2,
        items: []
      }

      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0',
        cook_log: [
          {
            date: '2026-02-01',
            version: 'v1.0.0',
            notes: ['Invalid cost'],
            cost: { total: null as any, perServing: 0, servings: 0, items: [] }
          },
          {
            date: '2026-02-10',
            version: 'v1.0.0',
            notes: ['Valid cost'],
            cost: validCost
          }
        ]
      }

      expect(getMostRecentCost(recipe)).toEqual(validCost)
    })
  })

  describe('getServings', () => {
    it('returns nutrition.servings when present', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0',
        nutrition: {
          servings: 10,
          calculatedDate: '2026-02-01',
          dataSource: 'USDA',
          totals: {
            calories: 2000,
            protein: 50,
            totalFat: 60,
            saturatedFat: 20,
            carbohydrates: 300,
            sugar: 10,
            fiber: 15,
            sodium: 2000
          },
          perServing: {
            calories: 200,
            protein: 5,
            totalFat: 6,
            saturatedFat: 2,
            carbohydrates: 30,
            sugar: 1,
            fiber: 1.5,
            sodium: 200
          },
          breakdown: []
        }
      }

      expect(getServings(recipe)).toBe(10)
    })

    it('returns calculated stats when nutrition.servings is absent', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: {
          early_check_percent: 0.8,
          stats: {
            group: 'Sourdough Breads',
            defaultYield: 2,
            unit: 'loaves',
            servingsPerItem: 10,
            servingUnit: 'slices'
          }
        },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0'
      }

      expect(getServings(recipe)).toBe(20) // 2 loaves × 10 slices
    })

    it('prioritizes nutrition.servings over stats', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: {
          early_check_percent: 0.8,
          stats: {
            group: 'Sourdough Breads',
            defaultYield: 2,
            unit: 'loaves',
            servingsPerItem: 10,
            servingUnit: 'slices'
          }
        },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0',
        nutrition: {
          servings: 10,
          calculatedDate: '2026-02-01',
          dataSource: 'USDA',
          totals: {
            calories: 2000,
            protein: 50,
            totalFat: 60,
            saturatedFat: 20,
            carbohydrates: 300,
            sugar: 10,
            fiber: 15,
            sodium: 2000
          },
          perServing: {
            calories: 200,
            protein: 5,
            totalFat: 6,
            saturatedFat: 2,
            carbohydrates: 30,
            sugar: 1,
            fiber: 1.5,
            sodium: 200
          },
          breakdown: []
        }
      }

      expect(getServings(recipe)).toBe(10) // nutrition takes precedence
    })

    it('returns 1 as fallback when neither nutrition nor stats present', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0'
      }

      expect(getServings(recipe)).toBe(1)
    })
  })

  describe('getMostRecentCostDate', () => {
    it('returns null when recipe has no cook_log', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0'
      }

      expect(getMostRecentCostDate(recipe)).toBeNull()
    })

    it('returns null when no entries have cost data', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0',
        cook_log: [
          {
            date: '2026-02-01',
            version: 'v1.0.0',
            notes: ['No cost']
          }
        ]
      }

      expect(getMostRecentCostDate(recipe)).toBeNull()
    })

    it('returns the date of the most recent bake with cost data', () => {
      const recipe: Recipe = {
        meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
        config: { early_check_percent: 0.8 },
        vessels: [],
        stages: [],
        states: [],
        version: 'v1.0.0',
        cook_log: [
          {
            date: '2026-02-01',
            version: 'v1.0.0',
            notes: ['First'],
            cost: { total: 5.00, perServing: 5.00, servings: 1, items: [] }
          },
          {
            date: '2026-02-15',
            version: 'v1.0.0',
            notes: ['Most recent'],
            cost: { total: 6.00, perServing: 6.00, servings: 1, items: [] }
          },
          {
            date: '2026-02-20',
            version: 'v1.0.0',
            notes: ['No cost']
          }
        ]
      }

      expect(getMostRecentCostDate(recipe)).toBe('2026-02-15')
    })
  })

  describe('getMostRecentCostWithItems', () => {
    const baseRecipe: Recipe = {
      meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
      config: { early_check_percent: 0.8 },
      vessels: [],
      stages: [],
      states: [],
      version: 'v1.0.0',
    }

    it('returns null when no cook_log', () => {
      expect(getMostRecentCostWithItems(baseRecipe)).toBeNull()
    })

    it('returns null when cost entries have empty items', () => {
      const recipe: Recipe = {
        ...baseRecipe,
        cook_log: [
          { date: '2026-02-01', version: 'v1.0.0', notes: ['test'], cost: { total: 5, perServing: 5, servings: 1, items: [] } },
        ],
      }
      expect(getMostRecentCostWithItems(recipe)).toBeNull()
    })

    it('skips entries without items and returns entry with items', () => {
      const costWithItems: CookLogCost = {
        total: 7.94,
        perServing: 0.66,
        servings: 12,
        items: [{ ingredientId: 'flour', name: 'Flour', sourceType: 'heb', sourceName: 'HEB Flour', amount: 420, unit: 'g', cost: 0.50 }],
      }
      const recipe: Recipe = {
        ...baseRecipe,
        cook_log: [
          { date: '2026-04-17', version: 'v1.0.0', notes: ['has items'], cost: costWithItems },
          { date: '2026-04-22', version: 'v1.0.0', notes: ['no items'], cost: { total: 9.31, perServing: 0.93, servings: 10, items: [] } },
        ],
      }
      expect(getMostRecentCostWithItems(recipe)).toEqual(costWithItems)
    })

    it('returns most recent entry with items when multiple have items', () => {
      const older: CookLogCost = {
        total: 5,
        perServing: 5,
        servings: 1,
        items: [{ ingredientId: 'a', name: 'A', sourceType: 'heb', sourceName: 'X', amount: 1, unit: 'g', cost: 5 }],
      }
      const newer: CookLogCost = {
        total: 6,
        perServing: 6,
        servings: 1,
        items: [{ ingredientId: 'b', name: 'B', sourceType: 'heb', sourceName: 'Y', amount: 2, unit: 'g', cost: 6 }],
      }
      const recipe: Recipe = {
        ...baseRecipe,
        cook_log: [
          { date: '2026-01-01', version: 'v1.0.0', notes: ['old'], cost: older },
          { date: '2026-02-01', version: 'v1.0.0', notes: ['new'], cost: newer },
        ],
      }
      expect(getMostRecentCostWithItems(recipe)?.total).toBe(6)
    })
  })

  describe('getMostRecentCostWithItemsDate', () => {
    const baseRecipe: Recipe = {
      meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
      config: { early_check_percent: 0.8 },
      vessels: [],
      stages: [],
      states: [],
      version: 'v1.0.0',
    }

    it('returns null when no cook_log', () => {
      expect(getMostRecentCostWithItemsDate(baseRecipe)).toBeNull()
    })

    it('returns null when no entries have items', () => {
      const recipe: Recipe = {
        ...baseRecipe,
        cook_log: [
          { date: '2026-02-01', version: 'v1.0.0', notes: ['test'], cost: { total: 5, perServing: 5, servings: 1, items: [] } },
        ],
      }
      expect(getMostRecentCostWithItemsDate(recipe)).toBeNull()
    })

    it('returns date of most recent entry with items', () => {
      const recipe: Recipe = {
        ...baseRecipe,
        cook_log: [
          {
            date: '2026-04-17',
            version: 'v1.0.0',
            notes: ['has items'],
            cost: {
              total: 7,
              perServing: 7,
              servings: 1,
              items: [{ ingredientId: 'a', name: 'A', sourceType: 'heb', sourceName: 'X', amount: 1, unit: 'g', cost: 7 }],
            },
          },
          { date: '2026-04-22', version: 'v1.0.0', notes: ['no items'], cost: { total: 9, perServing: 9, servings: 1, items: [] } },
        ],
      }
      expect(getMostRecentCostWithItemsDate(recipe)).toBe('2026-04-17')
    })
  })

  describe('getMajorVersion', () => {
    it('extracts major from "v3.6.0"', () => {
      expect(getMajorVersion('v3.6.0')).toBe(3)
    })

    it('extracts major from "v1.0.0"', () => {
      expect(getMajorVersion('v1.0.0')).toBe(1)
    })

    it('extracts major from "1.0" (no v prefix)', () => {
      expect(getMajorVersion('1.0')).toBe(1)
    })

    it('returns 0 for empty string', () => {
      expect(getMajorVersion('')).toBe(0)
    })
  })

  describe('getVersionAverageCost', () => {
    const baseRecipe: Recipe = {
      meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
      config: { early_check_percent: 0.8 },
      vessels: [],
      stages: [],
      states: [],
      version: 'v3.6.0',
    }

    it('returns null when no cook_log', () => {
      expect(getVersionAverageCost(baseRecipe)).toBeNull()
    })

    it('returns null when no bakes on current major version have cost', () => {
      const recipe: Recipe = {
        ...baseRecipe,
        cook_log: [
          { date: '2026-01-01', version: 'v2.0.0', notes: ['old'], cost: { total: 5, perServing: 2.5, servings: 2, items: [] } },
          { date: '2026-02-01', version: 'v3.0.0', notes: ['no cost'] },
        ],
      }
      expect(getVersionAverageCost(recipe)).toBeNull()
    })

    it('averages cost across bakes on same major version', () => {
      const recipe: Recipe = {
        ...baseRecipe,
        cook_log: [
          { date: '2026-04-13', version: 'v3.6.0', notes: ['a'], cost: { total: 2.65, perServing: 1.32, servings: 2, items: [] } },
          { date: '2026-04-15', version: 'v3.6.0', notes: ['b'], cost: { total: 1.33, perServing: 1.33, servings: 1, items: [] } },
          { date: '2026-04-17', version: 'v3.6.0', notes: ['c'], cost: { total: 1.33, perServing: 0.67, servings: 2, items: [] } },
        ],
      }
      const result = getVersionAverageCost(recipe)!
      expect(result.total).toBeCloseTo(1.77, 2)
      expect(result.perServing).toBeCloseTo(1.11, 2)
    })

    it('filters out bakes from different major versions', () => {
      const recipe: Recipe = {
        ...baseRecipe,
        cook_log: [
          { date: '2026-02-16', version: 'v1.1.0', notes: ['v1'], cost: { total: 1.34, perServing: 1.34, servings: 1, items: [] } },
          { date: '2026-02-20', version: 'v2.0.0', notes: ['v2'], cost: { total: 2.68, perServing: 1.34, servings: 2, items: [] } },
          { date: '2026-04-06', version: 'v3.0.0', notes: ['v3'], cost: { total: 2.65, perServing: 1.32, servings: 2, items: [] } },
        ],
      }
      const result = getVersionAverageCost(recipe)!
      // Only v3.0.0 entry matches major version 3
      expect(result.total).toBe(2.65)
      expect(result.perServing).toBe(1.32)
    })

    it('includes all minor/patch versions within same major', () => {
      const recipe: Recipe = {
        ...baseRecipe,
        version: 'v1.2.0',
        cook_log: [
          { date: '2026-01-01', version: 'v1.0.0', notes: ['a'], cost: { total: 4.00, perServing: 0.50, servings: 8, items: [] } },
          { date: '2026-02-01', version: 'v1.1.0', notes: ['b'], cost: { total: 6.00, perServing: 0.75, servings: 8, items: [] } },
          { date: '2026-03-01', version: 'v1.2.0', notes: ['c'], cost: { total: 8.00, perServing: 1.00, servings: 8, items: [] } },
        ],
      }
      const result = getVersionAverageCost(recipe)!
      expect(result.total).toBe(6.00)
      expect(result.perServing).toBe(0.75)
    })

    it('returns single bake cost when only one matches', () => {
      const recipe: Recipe = {
        ...baseRecipe,
        cook_log: [
          { date: '2026-04-06', version: 'v3.0.0', notes: ['only one'], cost: { total: 2.65, perServing: 1.32, servings: 2, items: [] } },
        ],
      }
      const result = getVersionAverageCost(recipe)!
      expect(result.total).toBe(2.65)
      expect(result.perServing).toBe(1.32)
    })
  })
})
