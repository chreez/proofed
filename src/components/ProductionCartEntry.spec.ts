import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductionCartEntry from './ProductionCartEntry.vue'
import type { ProductionEntry } from '@/types/production'

function makeEntry(overrides: Partial<ProductionEntry> = {}): ProductionEntry {
  return {
    id: 'entry-1',
    recipeId: 'atk-cinnamon-buns-ultimate',
    quantity: 1,
    unit: 'roll',
    addedBy: 'user',
    addedAt: '2026-05-12T15:00:00Z',
    ...overrides,
  }
}

describe('ProductionCartEntry', () => {
  it('renders recipe name, yields, quantity, unit, and provenance', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry(),
        recipeName: 'ATK Ultimate Cinnamon Buns',
        yields: '8 buns',
      },
    })

    expect(wrapper.text()).toContain('ATK Ultimate Cinnamon Buns')
    expect(wrapper.text()).toContain('makes: 8 buns')
    expect(wrapper.text()).toContain('added by')
    expect(wrapper.text()).toContain('user')

    const qty = wrapper.find('input.cart-entry-qty-input')
    expect(qty.exists()).toBe(true)
    expect((qty.element as HTMLInputElement).value).toBe('1')

    const unit = wrapper.find('input.cart-entry-unit')
    expect(unit.exists()).toBe(true)
    expect((unit.element as HTMLInputElement).value).toBe('roll')
  })

  it('renders the hero thumb when provided', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry(),
        recipeName: 'X',
        heroThumb: '/images/x/y/z-400w.webp',
      },
    })
    const img = wrapper.find('img.cart-entry-thumb')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/x/y/z-400w.webp')
  })

  it('renders initials placeholder when no heroThumb', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'Tartine Baguette' },
    })
    const placeholder = wrapper.find('.cart-entry-thumb-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toBe('TB')
  })

  it('emits update with quantity+1 when + is clicked', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ quantity: 3 }), recipeName: 'X' },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    // 0 = decrement, 1 = increment
    await buttons[1].trigger('click')
    const emitted = wrapper.emitted('update')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([{ quantity: 4 }])
  })

  it('emits update with quantity-1 when − is clicked, clamps to 1', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ quantity: 3 }), recipeName: 'X' },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([{ quantity: 2 }])

    const wrapper2 = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ quantity: 1 }), recipeName: 'X' },
    })
    const buttons2 = wrapper2.findAll('button.cart-entry-qty-btn')
    await buttons2[0].trigger('click')
    // Already at 1; no emit because clamp keeps it at 1
    expect(wrapper2.emitted('update')).toBeUndefined()
  })

  it('emits update with new quantity on direct qty change', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X' },
    })
    const qty = wrapper.find('input.cart-entry-qty-input')
    ;(qty.element as HTMLInputElement).value = '5'
    await qty.trigger('change')
    const emitted = wrapper.emitted('update')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([{ quantity: 5 }])
  })

  it('emits update with new unit on unit input', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X' },
    })
    const unit = wrapper.find('input.cart-entry-unit')
    await unit.setValue('dozen')
    const emitted = wrapper.emitted('update')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([{ unit: 'dozen' }])
  })

  it('emits remove on × click', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X' },
    })
    await wrapper.find('.cart-entry-remove').trigger('click')
    expect(wrapper.emitted('remove')).toBeDefined()
  })

  it('uses /recipe/:id link for the recipe name', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X' },
    })
    const link = wrapper.find('a.cart-entry-name')
    expect(link.attributes('href')).toBe('/recipe/atk-cinnamon-buns-ultimate')
  })

  it('exposes tooltips via title attribute on interactive elements (F43)', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X' },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    expect(buttons[0].attributes('title')).toBeTruthy()
    expect(buttons[1].attributes('title')).toBeTruthy()
    expect(wrapper.find('input.cart-entry-qty-input').attributes('title')).toBeTruthy()
    expect(wrapper.find('input.cart-entry-unit').attributes('title')).toBeTruthy()
    expect(wrapper.find('.cart-entry-remove').attributes('title')).toBeTruthy()
    expect(wrapper.find('a.cart-entry-name').attributes('title')).toBeTruthy()
  })

  it('matches HTML snapshot for a user-added entry', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ addedBy: 'user', quantity: 2, unit: 'loaf' }),
        recipeName: 'Tartine Baguette',
        yields: '2 loaves',
      },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches HTML snapshot for an agent-added entry with hero thumb', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ id: 'entry-2', addedBy: 'agent', quantity: 12, unit: 'cookie' }),
        recipeName: 'Sourdough Chocolate Chip Cookies',
        yields: '22 cookies',
        heroThumb: '/images/sourdough-chocolate-chip-cookies/x/y-400w.webp',
      },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
