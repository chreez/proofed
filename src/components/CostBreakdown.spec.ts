import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CostBreakdown from './CostBreakdown.vue'
import type { Recipe, CookLogCost } from '@/types/recipe'

describe('CostBreakdown', () => {
  function createRecipe(overrides: Partial<Recipe> = {}): Recipe {
    return {
      meta: { name: 'Test', source: { name: 'Test' }, yields: '1', total_time: '1h' },
      config: { early_check_percent: 0.8 },
      vessels: [],
      stages: [],
      states: [],
      version: 'v1.0.0',
      ...overrides
    }
  }

  describe('no cost data state', () => {
    it('shows placeholder when recipe has no cook_log', () => {
      const recipe = createRecipe()
      const wrapper = mount(CostBreakdown, { props: { recipe } })

      expect(wrapper.find('[data-testid="cost-placeholder"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Cost data not yet calculated')
    })

    it('shows placeholder when cook_log entries have no cost', () => {
      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-02-01',
            version: 'v1.0.0',
            notes: ['No cost data']
          }
        ]
      })
      const wrapper = mount(CostBreakdown, { props: { recipe } })

      expect(wrapper.find('[data-testid="cost-placeholder"]').exists()).toBe(true)
    })
  })

  describe('cost data display', () => {
    it('displays cost breakdown when data exists', () => {
      const cost: CookLogCost = {
        total: 1.34,
        perServing: 1.34,
        servings: 1,
        items: [
          {
            ingredientId: 'flour',
            name: 'Bread Flour',
            sourceType: 'heb',
            sourceName: 'King Arthur Bread Flour',
            amount: 500,
            unit: 'g',
            cost: 1.23
          },
          {
            ingredientId: 'water',
            name: 'Water',
            sourceType: 'rate',
            sourceName: 'Filtered water (not yet priced)',
            amount: 350,
            unit: 'g',
            cost: 0.00
          },
          {
            ingredientId: 'salt',
            name: 'Salt',
            sourceType: 'manual',
            sourceName: 'Morton Sea Salt',
            amount: 10,
            unit: 'g',
            cost: 0.11
          }
        ]
      }

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      expect(wrapper.find('[data-testid="cost-breakdown"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="cost-placeholder"]').exists()).toBe(false)
    })

    it('displays servings count', () => {
      const cost: CookLogCost = {
        total: 7.94,
        perServing: 0.79,
        servings: 10,
        items: []
      }

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-04-17',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      expect(wrapper.text()).toContain('10 servings')
    })

    it('displays singular "serving" for 1 serving', () => {
      const cost: CookLogCost = {
        total: 1.34,
        perServing: 1.34,
        servings: 1,
        items: []
      }

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      expect(wrapper.text()).toContain('1 serving')
      expect(wrapper.text()).not.toContain('1 servings')
    })

    it('displays all cost items', () => {
      const cost: CookLogCost = {
        total: 1.34,
        perServing: 1.34,
        servings: 1,
        items: [
          {
            ingredientId: 'flour',
            name: 'Bread Flour',
            sourceType: 'heb',
            sourceName: 'King Arthur Bread Flour',
            amount: 500,
            unit: 'g',
            cost: 1.23
          },
          {
            ingredientId: 'salt',
            name: 'Salt',
            sourceType: 'manual',
            sourceName: 'Morton Sea Salt',
            amount: 10,
            unit: 'g',
            cost: 0.11
          }
        ]
      }

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      const items = wrapper.findAll('[data-testid="cost-item"]')
      expect(items).toHaveLength(2)

      expect(wrapper.text()).toContain('Bread Flour')
      expect(wrapper.text()).toContain('King Arthur Bread Flour')
      expect(wrapper.text()).toContain('Salt')
      expect(wrapper.text()).toContain('Morton Sea Salt')
    })

    it('displays source badges correctly', () => {
      const cost: CookLogCost = {
        total: 1.34,
        perServing: 1.34,
        servings: 1,
        items: [
          {
            ingredientId: 'flour',
            name: 'Bread Flour',
            sourceType: 'heb',
            sourceName: 'King Arthur',
            amount: 500,
            unit: 'g',
            cost: 1.23
          },
          {
            ingredientId: 'water',
            name: 'Water',
            sourceType: 'rate',
            sourceName: 'Tap',
            amount: 350,
            unit: 'g',
            cost: 0.00
          }
        ]
      }

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      const badges = wrapper.findAll('[data-testid="source-badge"]')
      expect(badges).toHaveLength(2)
      expect(badges[0].text()).toBe('HEB')
      expect(badges[1].text()).toBe('RATE')
    })

    it('formats costs correctly', () => {
      const cost: CookLogCost = {
        total: 1.34,
        perServing: 1.34,
        servings: 1,
        items: [
          {
            ingredientId: 'flour',
            name: 'Bread Flour',
            sourceType: 'heb',
            sourceName: 'King Arthur',
            amount: 500,
            unit: 'g',
            cost: 1.23
          }
        ]
      }

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      const itemCosts = wrapper.findAll('[data-testid="item-cost"]')
      expect(itemCosts[0].text()).toBe('$1.23')
    })

    it('shows $0.00 for zero-cost rate items', () => {
      const cost: CookLogCost = {
        total: 1.23,
        perServing: 1.23,
        servings: 1,
        items: [
          {
            ingredientId: 'water',
            name: 'Water',
            sourceType: 'rate',
            sourceName: 'Filtered water (not yet priced)',
            amount: 350,
            unit: 'g',
            cost: 0.00
          }
        ]
      }

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      expect(wrapper.text()).toContain('$0.00')
    })

    it('displays total and per-serving costs', () => {
      const cost: CookLogCost = {
        total: 7.94,
        perServing: 0.79,
        servings: 10,
        items: []
      }

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-04-17',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      const footer = wrapper.find('[data-testid="cost-footer"]')
      expect(footer.text()).toContain('$7.94')
      expect(footer.text()).toContain('$0.79')
    })

    it('displays cost date note', () => {
      const cost: CookLogCost = {
        total: 1.34,
        perServing: 1.34,
        servings: 1,
        items: []
      }

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      const note = wrapper.find('[data-testid="cost-date-note"]')
      expect(note.text()).toContain('Based on')
      expect(note.text()).toContain('2026')
      expect(note.text()).toContain('Prices may vary')
    })
  })

  describe('partial cost warning', () => {
    it('does not show warning when all ingredients are priced', () => {
      const cost: CookLogCost = {
        total: 1.34,
        perServing: 1.34,
        servings: 1,
        items: [
          {
            ingredientId: 'flour',
            name: 'Flour',
            sourceType: 'heb',
            sourceName: 'King Arthur',
            amount: 500,
            unit: 'g',
            cost: 1.23
          },
          {
            ingredientId: 'water',
            name: 'Water',
            sourceType: 'rate',
            sourceName: 'Tap',
            amount: 350,
            unit: 'g',
            cost: 0.00
          }
        ]
      }

      const recipe = createRecipe({
        stages: [
          {
            id: 'PREP',
            title: 'Prep',
            gather: {
              ingredients: [
                {
                  id: 'flour',
                  name: 'Flour',
                  total: 500,
                  unit: 'g',
                  breakdown: null
                },
                {
                  id: 'water',
                  name: 'Water',
                  total: 350,
                  unit: 'g',
                  breakdown: null
                }
              ]
            },
            states: []
          }
        ],
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      expect(wrapper.text()).not.toContain('Partial cost data')
    })

    it('shows warning when some ingredients are missing cost data', () => {
      const cost: CookLogCost = {
        total: 1.23,
        perServing: 1.23,
        servings: 1,
        items: [
          {
            ingredientId: 'flour',
            name: 'Flour',
            sourceType: 'heb',
            sourceName: 'King Arthur',
            amount: 500,
            unit: 'g',
            cost: 1.23
          }
        ]
      }

      const recipe = createRecipe({
        stages: [
          {
            id: 'PREP',
            title: 'Prep',
            gather: {
              ingredients: [
                {
                  id: 'flour',
                  name: 'Flour',
                  total: 500,
                  unit: 'g',
                  breakdown: null
                },
                {
                  id: 'water',
                  name: 'Water',
                  total: 350,
                  unit: 'g',
                  breakdown: null
                },
                {
                  id: 'salt',
                  name: 'Salt',
                  total: 10,
                  unit: 'g',
                  breakdown: null
                }
              ]
            },
            states: []
          }
        ],
        cook_log: [
          {
            date: '2026-02-16',
            version: 'v1.0.0',
            notes: ['Bake'],
            cost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      expect(wrapper.text()).toContain('Partial cost data')
      expect(wrapper.text()).toContain('some ingredients not priced')
    })
  })

  describe('most recent cost selection', () => {
    it('uses the most recent bake when multiple bakes have cost data', () => {
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

      const recipe = createRecipe({
        cook_log: [
          {
            date: '2026-02-01',
            version: 'v1.0.0',
            notes: ['Older bake'],
            cost: olderCost
          },
          {
            date: '2026-02-15',
            version: 'v1.0.0',
            notes: ['Newer bake'],
            cost: newerCost
          }
        ]
      })

      const wrapper = mount(CostBreakdown, { props: { recipe } })

      const footer = wrapper.find('[data-testid="cost-footer"]')
      expect(footer.text()).toContain('$6.00')
      expect(footer.text()).toContain('$3.00')

      const note = wrapper.find('[data-testid="cost-date-note"]')
      expect(note.text()).toContain('Feb')
      expect(note.text()).toContain('14') // Feb 15 UTC -> Feb 14 in local time (CST)
    })
  })
})
