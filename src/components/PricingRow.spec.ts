import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingRow from './PricingRow.vue'

describe('PricingRow', () => {
  it('renders cost, slider, pretty price, and CP for a typical row', () => {
    const wrapper = mount(PricingRow, {
      props: {
        recipeId: 'test-recipe',
        recipeName: 'Test Recipe',
        cost: 2.5,
        markupPct: 150,
      },
    })

    // Cost row
    expect(wrapper.text()).toContain('$2.50')
    expect(wrapper.text()).toContain('cost')

    // Markup label
    expect(wrapper.text()).toContain('150%')
    expect(wrapper.text()).toContain('markup')

    // Recipe name + id
    expect(wrapper.text()).toContain('Test Recipe')
    expect(wrapper.text()).toContain('test-recipe')

    // Slider exists with min/max/step
    const slider = wrapper.find('input[type="range"]')
    expect(slider.exists()).toBe(true)
    expect(slider.attributes('min')).toBe('50')
    expect(slider.attributes('max')).toBe('300')
    expect(slider.attributes('step')).toBe('1')
    expect(slider.attributes('value')).toBe('150')

    // CP visible (cost 2.50, markup 150 → raw 6.25 → snap 6.50 OR 5.99)
    // Either way CP > 0 and pct visible
    expect(wrapper.text()).toMatch(/\$\d+\.\d{2}/)
    expect(wrapper.text()).toMatch(/\d+\.\d% CP/)
  })

  it('emits update:markupPct on slider input', async () => {
    const wrapper = mount(PricingRow, {
      props: {
        recipeId: 'test-recipe',
        recipeName: 'Test Recipe',
        cost: 2.5,
        markupPct: 150,
      },
    })

    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('200')

    const emitted = wrapper.emitted('update:markupPct')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([200])
  })

  it('shows "no cost data" placeholder when cost is null', () => {
    const wrapper = mount(PricingRow, {
      props: {
        recipeId: 'test-recipe',
        recipeName: 'Test Recipe',
        cost: null,
        markupPct: 150,
      },
    })

    expect(wrapper.text()).toContain('no cost data')
    // No CP shown when cost missing
    expect(wrapper.text()).not.toMatch(/\d+\.\d% CP/)
  })

  it('renders the dirty badge when dirty is true', () => {
    const wrapper = mount(PricingRow, {
      props: {
        recipeId: 'test-recipe',
        recipeName: 'Test Recipe',
        cost: 2.5,
        markupPct: 150,
        dirty: true,
      },
    })

    expect(wrapper.find('.pricing-row-dirty').exists()).toBe(true)
    expect(wrapper.text()).toContain('modified')
  })

  it('does not render the dirty badge when dirty is false', () => {
    const wrapper = mount(PricingRow, {
      props: {
        recipeId: 'test-recipe',
        recipeName: 'Test Recipe',
        cost: 2.5,
        markupPct: 150,
        dirty: false,
      },
    })

    expect(wrapper.find('.pricing-row-dirty').exists()).toBe(false)
  })

  it('matches HTML snapshot for a typical row', () => {
    const wrapper = mount(PricingRow, {
      props: {
        recipeId: 'test-recipe',
        recipeName: 'Test Recipe',
        cost: 2.5,
        markupPct: 150,
      },
    })

    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches HTML snapshot for a dirty row with no cost data', () => {
    const wrapper = mount(PricingRow, {
      props: {
        recipeId: 'test-recipe',
        recipeName: 'Test Recipe',
        cost: null,
        markupPct: 200,
        dirty: true,
      },
    })

    expect(wrapper.html()).toMatchSnapshot()
  })
})
