import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipeSummary from './RecipeSummary.vue'
import type { Recipe, RecipeSummary as RecipeSummaryType } from '@/types/recipe'

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    meta: {
      name: 'NY-Style Pizza Dough',
      source: {
        name: 'Stella Culinary',
        type: 'adapted',
        author: 'Jacob Burton',
      },
      yields: '2 pizzas',
      total_time: '~4 hrs (45 min active)',
      description: 'Classic NY-style pizza dough with a 30-minute autolyse.',
    },
    config: { early_check_percent: 0.8 },
    vessels: [],
    stages: [],
    states: [],
    ...overrides,
  }
}

describe('RecipeSummary', () => {
  it('renders dictated summary with voice-human class', () => {
    const summary: RecipeSummaryType = {
      text: 'This is my personal take on NY pizza dough.',
      mode: 'dictated',
    }
    const wrapper = mount(RecipeSummary, {
      props: { summary, recipe: makeRecipe() },
    })

    expect(wrapper.find('.voice-human').exists()).toBe(true)
    expect(wrapper.find('.voice-agent').exists()).toBe(false)
    expect(wrapper.text()).toContain('This is my personal take on NY pizza dough.')
  })

  it('renders dictated summary with label', () => {
    const summary: RecipeSummaryType = {
      text: 'My notes about this recipe.',
      mode: 'dictated',
    }
    const wrapper = mount(RecipeSummary, {
      props: { summary, recipe: makeRecipe() },
    })

    expect(wrapper.find('.voice-human-label').exists()).toBe(true)
    expect(wrapper.find('.voice-human-label').text()).toContain('About this recipe')
  })

  it('renders auto summary with voice-agent class', () => {
    const summary: RecipeSummaryType = {
      text: 'Auto-generated summary text.',
      mode: 'auto',
    }
    const wrapper = mount(RecipeSummary, {
      props: { summary, recipe: makeRecipe() },
    })

    expect(wrapper.find('.voice-agent').exists()).toBe(true)
    expect(wrapper.find('.voice-human').exists()).toBe(false)
    expect(wrapper.text()).toContain('Auto-generated summary text.')
  })

  it('renders auto summary with label', () => {
    const summary: RecipeSummaryType = {
      text: 'Auto-generated.',
      mode: 'auto',
    }
    const wrapper = mount(RecipeSummary, {
      props: { summary, recipe: makeRecipe() },
    })

    expect(wrapper.find('.voice-agent-label').exists()).toBe(true)
    expect(wrapper.find('.voice-agent-label').text()).toContain('Summary')
  })

  it('auto-generates summary from recipe metadata when no summary provided', () => {
    const wrapper = mount(RecipeSummary, {
      props: { summary: undefined, recipe: makeRecipe() },
    })

    expect(wrapper.find('.voice-agent').exists()).toBe(true)
    expect(wrapper.text()).toContain('NY-Style Pizza Dough')
    expect(wrapper.text()).toContain('Jacob Burton')
    expect(wrapper.text()).toContain('Stella Culinary')
  })

  it('generated text includes yields and total_time', () => {
    const wrapper = mount(RecipeSummary, {
      props: { summary: undefined, recipe: makeRecipe() },
    })

    expect(wrapper.text()).toContain('2 pizzas')
    expect(wrapper.text()).toContain('~4 hrs (45 min active)')
  })

  it('generated text includes description', () => {
    const wrapper = mount(RecipeSummary, {
      props: { summary: undefined, recipe: makeRecipe() },
    })

    expect(wrapper.text()).toContain('30-minute autolyse')
  })

  it('generated text handles recipe without source', () => {
    const recipe = makeRecipe({
      meta: {
        name: 'Simple Bread',
        yields: '1 loaf',
        total_time: '3 hrs',
      },
    })
    const wrapper = mount(RecipeSummary, {
      props: { summary: undefined, recipe },
    })

    expect(wrapper.text()).toContain('Simple Bread')
    expect(wrapper.text()).toContain('1 loaf')
    expect(wrapper.text()).not.toContain('undefined')
  })

  it('generated text handles source without author', () => {
    const recipe = makeRecipe({
      meta: {
        name: 'Test Recipe',
        source: { name: 'Some Book', type: 'original' },
        yields: '4 servings',
        total_time: '1 hr',
      },
    })
    const wrapper = mount(RecipeSummary, {
      props: { summary: undefined, recipe },
    })

    expect(wrapper.text()).toContain('original from Some Book')
    // Should not contain "author / source" pattern since there's no separate author
    expect(wrapper.text()).not.toContain('/ Some Book')
  })

  it('generated text handles recipe without description', () => {
    const recipe = makeRecipe({
      meta: {
        name: 'Basic Dough',
        source: { name: 'Test Source', type: 'adapted' },
        yields: '2 loaves',
        total_time: '2 hrs',
      },
    })
    const wrapper = mount(RecipeSummary, {
      props: { summary: undefined, recipe },
    })

    const text = wrapper.text()
    expect(text).toContain('Basic Dough')
    expect(text).toContain('2 loaves')
    // Should not end with a trailing period from missing description
    expect(text).not.toContain('. .')
  })
})
