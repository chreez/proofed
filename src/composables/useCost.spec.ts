import { describe, it, expect } from 'vitest'
import { getMostRecentCost, getServings, getMostRecentCostDate } from './useCost'
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
})
