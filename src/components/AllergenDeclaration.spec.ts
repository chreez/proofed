import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AllergenDeclaration from './AllergenDeclaration.vue'
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

describe('AllergenDeclaration', () => {
  it('does not render when recipe has no allergens', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'salt', name: 'Salt', total: 10, unit: 'g', breakdown: null },
              { id: 'water', name: 'Water', total: 500, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    expect(wrapper.find('.allergen-declaration').exists()).toBe(false)
  })

  it('renders allergen declaration when allergens are present', () => {
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

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    expect(wrapper.find('.allergen-declaration').exists()).toBe(true)
    expect(wrapper.text()).toContain('Contains: Milk, Eggs, Wheat.')
  })

  it('displays allergens in FDA canonical order', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'sesame_seeds', name: 'Sesame Seeds', total: 10, unit: 'g', breakdown: null },
              { id: 'peanut_butter', name: 'Peanut Butter', total: 50, unit: 'g', breakdown: null },
              { id: 'eggs', name: 'Eggs', total: 100, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    // Should be in order: Eggs, Peanuts, Sesame (not insertion order)
    expect(wrapper.text()).toBe('Contains: Eggs, Peanuts, Sesame.')
  })

  it('handles single allergen', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'flour', name: 'Flour', total: 500, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    expect(wrapper.text()).toBe('Contains: Wheat.')
  })

  it('handles all 9 FDA allergens', () => {
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

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    expect(wrapper.text()).toBe('Contains: Milk, Eggs, Fish, Tree Nuts, Peanuts, Wheat, Soybeans, Sesame.')
  })

  it('uses allergenOverride when present', () => {
    const recipe = createTestRecipe({
      meta: {
        name: 'Test Recipe',
        yields: '8 servings',
        total_time: '2 hours',
        allergenOverride: ['Wheat', 'Milk'],
      },
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              // Would normally derive Wheat, Eggs from these, but override takes precedence
              { id: 'flour', name: 'Flour', total: 500, unit: 'g', breakdown: null },
              { id: 'eggs', name: 'Eggs', total: 100, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    // Override specifies only Wheat and Milk (in that order, but will be sorted to canonical)
    expect(wrapper.text()).toBe('Contains: Milk, Wheat.')
  })

  it('handles multi-allergen ingredients', () => {
    const recipe = createTestRecipe({
      stages: [
        {
          id: 'stage-1',
          title: 'Mix',
          gather: {
            ingredients: [
              { id: 'curry_roux', name: 'Curry Roux', total: 100, unit: 'g', breakdown: null },
            ],
          },
          states: [],
        },
      ],
    })

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    expect(wrapper.text()).toBe('Contains: Milk, Peanuts, Wheat, Soybeans.')
  })

  it('deduplicates allergens', () => {
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

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    // All three ingredients contain wheat, should appear only once
    expect(wrapper.text()).toBe('Contains: Wheat.')
  })

  it('does not render when recipe has empty stages', () => {
    const recipe = createTestRecipe({ stages: [] })

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    expect(wrapper.find('.allergen-declaration').exists()).toBe(false)
  })

  it('matches snapshot when rendering allergens', () => {
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

    const wrapper = mount(AllergenDeclaration, {
      props: { recipe },
    })

    expect(wrapper.html()).toMatchSnapshot()
  })
})
