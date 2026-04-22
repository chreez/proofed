import { describe, it, expect } from 'vitest'
import { deriveAllergens } from './useAllergens'
import type { Recipe } from '@/types/recipe'

function createTestRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    meta: {
      name: 'Test Recipe',
      yields: '8 servings',
      total_time: '2 hours',
      ...overrides.meta,
    },
    config: {
      early_check_percent: 10,
    },
    vessels: [],
    stages: overrides.stages || [],
    states: [],
    version: 'v1.0.0',
    ...overrides,
  }
}

describe('deriveAllergens', () => {
  it('returns empty array when recipe has no ingredients', () => {
    const recipe = createTestRecipe()
    expect(deriveAllergens(recipe)).toEqual([])
  })

  it('derives allergens from ingredients in FDA canonical order', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'flour', name: 'Flour', total: 500, unit: 'g', breakdown: null },
              { id: 'milk', name: 'Milk', total: 250, unit: 'g', breakdown: null },
              { id: 'eggs', name: 'Eggs', total: 100, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    expect(deriveAllergens(recipe)).toEqual(['Milk', 'Eggs', 'Wheat'])
  })

  it('handles multi-allergen ingredients', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'soy_sauce', name: 'Soy Sauce', total: 30, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    expect(deriveAllergens(recipe)).toEqual(['Wheat', 'Soybeans'])
  })

  it('deduplicates allergens from multiple ingredients', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'flour', name: 'Flour', total: 500, unit: 'g', breakdown: null },
              { id: 'bread_flour', name: 'Bread Flour', total: 200, unit: 'g', breakdown: null },
              { id: 'starter', name: 'Sourdough Starter', total: 100, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    expect(deriveAllergens(recipe)).toEqual(['Wheat'])
  })

  it('collects allergens from multiple stages', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Dough',
          gather: {
            ingredients: [
              { id: 'flour', name: 'Flour', total: 500, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
        {
          id: 'stage-2',
          title: 'Filling',
          gather: {
            ingredients: [
              { id: 'butter', name: 'Butter', total: 100, unit: 'g', breakdown: null },
              { id: 'peanut_butter', name: 'Peanut Butter', total: 50, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    expect(deriveAllergens(recipe)).toEqual(['Milk', 'Peanuts', 'Wheat'])
  })

  it('handles allergenOverride field', () => {
    const recipe = createTestRecipe({
      meta: {
        name: 'Test Recipe',
        yields: '8 servings',
        total_time: '2 hours',
        allergenOverride: ['Wheat', 'Milk', 'Eggs'],
      },
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              // These would normally derive allergens, but override takes precedence
              { id: 'flour', name: 'Flour', total: 500, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    // Override should be used, still in canonical order
    expect(deriveAllergens(recipe)).toEqual(['Milk', 'Eggs', 'Wheat'])
  })

  it('handles all FDA Big 9 allergens', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'milk', name: 'Milk', total: 100, unit: 'g', breakdown: null },
              { id: 'eggs', name: 'Eggs', total: 100, unit: 'g', breakdown: null },
              { id: 'worcestershire', name: 'Worcestershire', total: 10, unit: 'g', breakdown: null },
              { id: 'almond_flour', name: 'Almond Flour', total: 100, unit: 'g', breakdown: null },
              { id: 'peanut_butter', name: 'Peanut Butter', total: 50, unit: 'g', breakdown: null },
              { id: 'flour', name: 'Flour', total: 500, unit: 'g', breakdown: null },
              { id: 'miso', name: 'Miso', total: 20, unit: 'g', breakdown: null },
              { id: 'sesame_seeds', name: 'Sesame Seeds', total: 10, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    expect(deriveAllergens(recipe)).toEqual([
      'Milk',
      'Eggs',
      'Fish',
      'Tree Nuts',
      'Peanuts',
      'Wheat',
      'Soybeans',
      'Sesame',
    ])
  })

  it('handles ingredients not in allergen map', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'flour', name: 'Flour', total: 500, unit: 'g', breakdown: null },
              { id: 'unknown_ingredient', name: 'Unknown', total: 100, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    expect(deriveAllergens(recipe)).toEqual(['Wheat'])
  })

  it('returns empty array for recipe with only non-allergen ingredients', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'salt', name: 'Salt', total: 10, unit: 'g', breakdown: null },
              { id: 'water', name: 'Water', total: 500, unit: 'g', breakdown: null },
              { id: 'sugar', name: 'Sugar', total: 50, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    expect(deriveAllergens(recipe)).toEqual([])
  })

  it('handles stages with null gather sections', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: null,
          states: [],
        },
        {
          id: 'stage-2',
          title: 'Bake',
          gather: {
            ingredients: [
              { id: 'flour', name: 'Flour', total: 500, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    expect(deriveAllergens(recipe)).toEqual(['Wheat'])
  })
})
