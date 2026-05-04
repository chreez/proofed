import { describe, it, expect } from 'vitest'
import { classifyRole, generateExperimentConfig } from './useAutoExperiment'
import type { Recipe, WaterContentTable } from '@/types/recipe'

const waterContentTable: WaterContentTable = {
  version: '1.0.0',
  updatedAt: '2026-05-01',
  description: 'Test',
  sources: ['Test'],
  categories: [
    {
      id: 'flour',
      name: 'Flours',
      items: [
        { id: 'bread-flour', name: 'Bread Flour', waterPercent: 11.8, note: '', aliases: ['strong-flour'] },
        { id: 'all-purpose-flour', name: 'AP Flour', waterPercent: 11.9, note: '', aliases: ['ap-flour'] }
      ]
    },
    {
      id: 'liquids',
      name: 'Liquids',
      items: [
        { id: 'water', name: 'Water', waterPercent: 100, note: '', aliases: [] }
      ]
    },
    {
      id: 'dairy',
      name: 'Dairy',
      items: [
        { id: 'whole-milk', name: 'Whole Milk', waterPercent: 87.7, note: '', aliases: ['milk'] },
        { id: 'butter-unsalted', name: 'Butter', waterPercent: 16, note: '', aliases: ['butter'] }
      ]
    },
    {
      id: 'cheese',
      name: 'Cheese',
      items: [
        { id: 'cheddar', name: 'Cheddar', waterPercent: 36.8, note: '', aliases: [] }
      ]
    }
  ]
}

function makeRecipe(ingredients: { id: string; name: string; total: number; unit: string }[]): Recipe {
  return {
    meta: { name: 'Test', source: { name: 'Test' }, yields: '1 loaf', total_time: '4h' },
    config: { early_check_percent: 0.8 },
    vessels: [],
    stages: [{
      id: 'MIX',
      title: 'Mix',
      gather: {
        ingredients: ingredients.map(i => ({ ...i, breakdown: null }))
      },
      states: []
    }],
    states: [],
    version: 'v1.0.0'
  } as unknown as Recipe
}

describe('classifyRole', () => {
  it('classifies flour-containing names as base_flour', () => {
    expect(classifyRole('Bread Flour')).toBe('base_flour')
    expect(classifyRole('All-Purpose Flour')).toBe('base_flour')
    expect(classifyRole('Whole Wheat Flour')).toBe('base_flour')
    expect(classifyRole('Semolina')).toBe('base_flour')
  })

  it('classifies liquid-containing names as base_liquid', () => {
    expect(classifyRole('Water')).toBe('base_liquid')
    expect(classifyRole('Whole Milk')).toBe('base_liquid')
    expect(classifyRole('Buttermilk')).toBe('base_liquid')
    expect(classifyRole('Lemon Juice')).toBe('base_liquid')
    expect(classifyRole('Heavy Cream')).toBe('base_liquid')
    expect(classifyRole('Sourdough Starter')).toBe('base_liquid')
  })

  it('classifies inclusion-containing names as inclusion', () => {
    expect(classifyRole('Chocolate Chips')).toBe('inclusion')
    expect(classifyRole('Sharp Cheddar Cheese')).toBe('inclusion')
    expect(classifyRole('Fresh Jalapeños')).toBe('inclusion')
    expect(classifyRole('Walnuts')).toBe('inclusion')
    expect(classifyRole('Pepperoni')).toBe('inclusion')
    expect(classifyRole('Kalamata Olives')).toBe('inclusion')
  })

  it('classifies everything else as enrichment', () => {
    expect(classifyRole('Unsalted Butter')).toBe('enrichment')
    expect(classifyRole('Sugar')).toBe('enrichment')
    expect(classifyRole('Salt')).toBe('enrichment')
    expect(classifyRole('Eggs')).toBe('enrichment')
    expect(classifyRole('Olive Oil')).toBe('inclusion') // contains "olive"
    expect(classifyRole('Canola Oil')).toBe('enrichment')
  })
})

describe('generateExperimentConfig', () => {
  it('returns null for recipe with no gram ingredients', () => {
    const recipe = makeRecipe([
      { id: 'eggs', name: 'Large Eggs', total: 2, unit: 'whole' }
    ])
    expect(generateExperimentConfig(recipe, waterContentTable)).toBeNull()
  })

  it('generates config for a basic bread recipe', () => {
    const recipe = makeRecipe([
      { id: 'bread-flour', name: 'Bread Flour', total: 500, unit: 'g' },
      { id: 'water', name: 'Water', total: 350, unit: 'g' },
      { id: 'salt', name: 'Salt', total: 10, unit: 'g' }
    ])
    const config = generateExperimentConfig(recipe, waterContentTable)
    expect(config).not.toBeNull()
    expect(config!.ingredients).toHaveLength(3)

    const flour = config!.ingredients.find(i => i.id === 'bread-flour')!
    expect(flour.role).toBe('base_flour')
    expect(flour.defaultAmount).toBe(500)
    expect(flour.min).toBe(400) // 80%
    expect(flour.max).toBe(600) // 120%
    expect(flour.step).toBe(25)

    const water = config!.ingredients.find(i => i.id === 'water')!
    expect(water.role).toBe('base_liquid')
    expect(water.defaultAmount).toBe(350)
    expect(water.min).toBe(245) // 70%
    expect(water.max).toBe(455) // 130%

    const salt = config!.ingredients.find(i => i.id === 'salt')!
    expect(salt.role).toBe('enrichment')
    expect(salt.defaultAmount).toBe(10)
    expect(salt.step).toBe(1) // adaptive for small amounts
  })

  it('deduplicates ingredients across stages', () => {
    const recipe = {
      meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
      config: { early_check_percent: 0.8 },
      vessels: [],
      stages: [
        {
          id: 'S1',
          title: 'Stage 1',
          gather: {
            ingredients: [{ id: 'flour', name: 'Bread Flour', total: 500, unit: 'g', breakdown: null }]
          },
          states: []
        },
        {
          id: 'S2',
          title: 'Stage 2',
          gather: {
            ingredients: [{ id: 'flour', name: 'Bread Flour', total: 500, unit: 'g', breakdown: null }]
          },
          states: []
        }
      ],
      states: [],
      version: 'v1.0.0'
    } as unknown as Recipe

    const config = generateExperimentConfig(recipe, waterContentTable)
    expect(config!.ingredients).toHaveLength(1)
  })

  it('resolves water content IDs from the table', () => {
    const recipe = makeRecipe([
      { id: 'bread-flour', name: 'Bread Flour', total: 500, unit: 'g' }
    ])
    const config = generateExperimentConfig(recipe, waterContentTable)
    expect(config!.ingredients[0].waterContentId).toBe('bread-flour')
  })

  it('includes standard derived values', () => {
    const recipe = makeRecipe([
      { id: 'flour', name: 'Flour', total: 500, unit: 'g' }
    ])
    const config = generateExperimentConfig(recipe, waterContentTable)
    expect(config!.derived).toHaveLength(3)
    expect(config!.derived.map(d => d.type)).toContain('effective_hydration')
    expect(config!.derived.map(d => d.type)).toContain('inclusion_load')
    expect(config!.derived.map(d => d.type)).toContain('total_dough_weight')
  })

  it('uses adaptive step for small amounts', () => {
    const recipe = makeRecipe([
      { id: 'salt', name: 'Salt', total: 8, unit: 'g' },
      { id: 'yeast', name: 'Yeast', total: 3, unit: 'g' }
    ])
    const config = generateExperimentConfig(recipe, waterContentTable)
    expect(config!.ingredients[0].step).toBe(1) // 8g → step 1
    expect(config!.ingredients[1].step).toBe(1) // 3g → step 1
  })

  it('sets scaleMode to pre_scaled', () => {
    const recipe = makeRecipe([
      { id: 'flour', name: 'Flour', total: 500, unit: 'g' }
    ])
    const config = generateExperimentConfig(recipe, waterContentTable)
    expect(config!.scaleMode).toBe('pre_scaled')
  })
})
