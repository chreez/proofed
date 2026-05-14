import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductionLibraryRow from './ProductionLibraryRow.vue'

describe('ProductionLibraryRow', () => {
  it('renders recipe name, yields, category, and bake count', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: {
        recipeId: 'simple-sourdough',
        recipeName: 'Sourdough Bread - 70% Hydration',
        yields: '2 loaves (~800g)',
        category: 'baking',
        bakeCount: 24,
      },
    })
    expect(wrapper.text()).toContain('Sourdough Bread - 70% Hydration')
    expect(wrapper.text()).toContain('2 loaves (~800g)')
    expect(wrapper.text()).toContain('baking')
    expect(wrapper.text()).toContain('24×')
  })

  it('renders the hero thumb when heroThumb is provided', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: {
        recipeId: 'x',
        recipeName: 'X',
        heroThumb: '/images/x/y-400w.webp',
      },
    })
    const img = wrapper.find('img.library-row-thumb')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/x/y-400w.webp')
    expect(img.attributes('alt')).toContain('X')
  })

  it('renders an initials placeholder when heroThumb is absent', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: {
        recipeId: 'tartine-baguette',
        recipeName: 'Tartine Baguette',
      },
    })
    const placeholder = wrapper.find('.library-row-thumb-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toBe('TB')
  })

  it('renders a zero bake count when bakeCount is omitted', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: { recipeId: 'x', recipeName: 'X' },
    })
    expect(wrapper.find('.library-row-bakes').text()).toBe('0×')
  })

  it('emits add(recipeId) on [+] click and stops propagation', async () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: {
        recipeId: 'sourdough-chocolate-chip-cookies',
        recipeName: 'Sourdough Chocolate Chip Cookies',
      },
    })
    await wrapper.find('button.library-row-plus').trigger('click')
    const emitted = wrapper.emitted('add')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual(['sourdough-chocolate-chip-cookies'])
  })

  it('emits focus(recipeId) on row click', async () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: { recipeId: 'r1', recipeName: 'R1' },
    })
    await wrapper.find('.library-row').trigger('click')
    const emitted = wrapper.emitted('focus')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual(['r1'])
  })

  it('reflects in-queue state via class + data attribute', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: { recipeId: 'x', recipeName: 'X', inQueue: true },
    })
    const row = wrapper.find('.library-row')
    expect(row.classes()).toContain('in-queue')
    expect(row.attributes('data-in-queue')).toBe('true')
  })

  it('reflects keyboard-focused state via class + data attribute', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: { recipeId: 'x', recipeName: 'X', isFocused: true },
    })
    const row = wrapper.find('.library-row')
    expect(row.classes()).toContain('is-focused')
    expect(row.attributes('data-focused')).toBe('true')
  })

  it('renders an empty-category dash when category is absent', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: { recipeId: 'x', recipeName: 'X' },
    })
    const cat = wrapper.find('.library-row-category')
    expect(cat.exists()).toBe(true)
    expect(cat.classes()).toContain('library-row-category-empty')
  })

  it('exposes tooltips on the + button (F43)', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: { recipeId: 'x', recipeName: 'X' },
    })
    const btn = wrapper.find('button.library-row-plus')
    expect(btn.attributes('title')).toBeTruthy()
    expect(btn.attributes('aria-label')).toBeTruthy()
  })

  it('matches HTML snapshot for a row with hero thumb (in queue)', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: {
        recipeId: 'simple-sourdough',
        recipeName: 'Sourdough Bread - 70% Hydration',
        yields: '2 loaves (~800g)',
        heroThumb: '/images/simple-sourdough/2026-04-28/loaf2-ear-closeup-400w.webp',
        category: 'baking',
        bakeCount: 24,
        inQueue: true,
      },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches HTML snapshot for a row without hero thumb (focused, not in queue)', () => {
    const wrapper = mount(ProductionLibraryRow, {
      props: {
        recipeId: 'tartine-baguette',
        recipeName: 'Tartine Baguette',
        yields: '2-3 baguettes',
        category: 'baking',
        bakeCount: 3,
        isFocused: true,
      },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
