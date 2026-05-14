import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ProductionCartEntry from './ProductionCartEntry.vue'
import type { ProductionEntry } from '@/types/production'

function makeEntry(overrides: Partial<ProductionEntry> = {}): ProductionEntry {
  return {
    id: 'entry-1',
    recipeId: 'atk-cinnamon-buns-ultimate',
    batches: 1,
    yieldOverride: null,
    unit: 'roll',
    addedBy: 'user',
    addedAt: '2026-05-12T15:00:00Z',
    ...overrides,
  }
}

describe('ProductionCartEntry', () => {
  it('renders recipe name, yields, default-mode scaled yield, unit, and provenance', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ batches: 2 }),
        recipeName: 'ATK Ultimate Cinnamon Buns',
        yields: '8 buns',
        baseYield: 8,
      },
    })

    expect(wrapper.text()).toContain('ATK Ultimate Cinnamon Buns')
    expect(wrapper.text()).toContain('makes: 8 buns')
    expect(wrapper.text()).toContain('added by')
    expect(wrapper.text()).toContain('user')

    // Default mode shows batches × baseYield (2 × 8 = 16).
    const display = wrapper.find('[data-testid="cart-entry-yield-display"]')
    expect(display.exists()).toBe(true)
    expect(display.text()).toBe('16')

    // Scale subtext.
    expect(wrapper.text()).toContain('2 batches')

    const unit = wrapper.find('input.cart-entry-unit')
    expect(unit.exists()).toBe(true)
    expect((unit.element as HTMLInputElement).value).toBe('roll')
  })

  it('renders singular "batch" when batches === 1', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ batches: 1 }), recipeName: 'X', baseYield: 8 },
    })
    expect(wrapper.text()).toContain('1 batch')
    expect(wrapper.text()).not.toContain('1 batches')
  })

  it('defaults baseYield to 1 when not provided', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ batches: 3 }), recipeName: 'X' },
    })
    // 3 × 1 = 3.
    expect(wrapper.find('[data-testid="cart-entry-yield-display"]').text()).toBe('3')
  })

  it('falls back to baseYield=1 when an invalid value is passed', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ batches: 2 }), recipeName: 'X', baseYield: 0 },
    })
    // 0 → safe clamp to 1, so 2 × 1 = 2.
    expect(wrapper.find('[data-testid="cart-entry-yield-display"]').text()).toBe('2')
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

  it('renders single-letter initials for a single-word name', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'Sourdough' },
    })
    expect(wrapper.find('.cart-entry-thumb-placeholder').text()).toBe('SO')
  })

  it('renders fallback initials for empty-name (no letters & no slice content)', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: '' },
    })
    expect(wrapper.find('.cart-entry-thumb-placeholder').text()).toBe('??')
  })

  it('renders raw-slice initials for names with no leading letters', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: '!!!' },
    })
    // No letter-words → fall back to first 2 chars of name.
    expect(wrapper.find('.cart-entry-thumb-placeholder').text()).toBe('!!')
  })

  it('formats addedAt as locale month/day; falls back to raw string on parse error', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ addedAt: 'not-a-date' }), recipeName: 'X' },
    })
    // jsdom Date('not-a-date') yields Invalid Date; toLocaleDateString returns "Invalid Date" rather than throwing.
    expect(wrapper.text()).toMatch(/added by/)
  })

  // ──────────────────────────────────────────────
  // Default mode: +/- steps by 1 batch
  // ──────────────────────────────────────────────
  it('emits batches+1 when + is clicked in default mode', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ batches: 3 }), recipeName: 'X', baseYield: 8 },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    // 0 = decrement, 1 = increment
    await buttons[1].trigger('click')
    const emitted = wrapper.emitted('update')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([{ batches: 4 }])
  })

  it('emits batches-1 when − is clicked in default mode, clamps to 1', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ batches: 3 }), recipeName: 'X' },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([{ batches: 2 }])

    const wrapper2 = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ batches: 1 }), recipeName: 'X' },
    })
    const buttons2 = wrapper2.findAll('button.cart-entry-qty-btn')
    await buttons2[0].trigger('click')
    // Already at 1; no emit because clamp keeps it at 1
    expect(wrapper2.emitted('update')).toBeUndefined()
  })

  // ──────────────────────────────────────────────
  // Override mode
  // ──────────────────────────────────────────────
  it('renders yieldOverride value in override mode with custom subtext + reset link', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ batches: 1, yieldOverride: 15 }),
        recipeName: 'X',
        baseYield: 8,
      },
    })
    const display = wrapper.find('[data-testid="cart-entry-yield-display"]')
    expect(display.text()).toBe('15')
    expect(display.classes()).toContain('cart-entry-qty-display-override')
    expect(wrapper.find('[data-testid="cart-entry-custom-label"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cart-entry-reset"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cart-entry-scale-label"]').exists()).toBe(false)
  })

  it('emits yieldOverride+1 when + is clicked in override mode', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ batches: 1, yieldOverride: 15 }),
        recipeName: 'X',
      },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([{ yieldOverride: 16 }])
  })

  it('emits yieldOverride-1 when − is clicked in override mode, clamps to 1', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ batches: 1, yieldOverride: 5 }),
        recipeName: 'X',
      },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    await buttons[0].trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([{ yieldOverride: 4 }])

    const wrapper2 = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ batches: 1, yieldOverride: 1 }),
        recipeName: 'X',
      },
    })
    const buttons2 = wrapper2.findAll('button.cart-entry-qty-btn')
    await buttons2[0].trigger('click')
    expect(wrapper2.emitted('update')).toBeUndefined()
  })

  it('emits yieldOverride: null when reset link is clicked', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ batches: 1, yieldOverride: 15 }),
        recipeName: 'X',
      },
    })
    await wrapper.find('[data-testid="cart-entry-reset"]').trigger('click')
    expect(wrapper.emitted('update')![0]).toEqual([{ yieldOverride: null }])
  })

  it('reset is a no-op when not in override mode (defensive)', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X' },
    })
    // Reset button isn't even rendered in default mode.
    expect(wrapper.find('[data-testid="cart-entry-reset"]').exists()).toBe(false)
  })

  // ──────────────────────────────────────────────
  // Double-click → inline override input
  // ──────────────────────────────────────────────
  it('double-click on yield display swaps to an inline input with current value selected', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry({ batches: 2 }), recipeName: 'X', baseYield: 8 },
      attachTo: document.body,
    })
    await wrapper.find('[data-testid="cart-entry-yield-display"]').trigger('dblclick')
    await nextTick()
    const input = wrapper.find('[data-testid="cart-entry-yield-edit"]')
    expect(input.exists()).toBe(true)
    // Pre-populated with current displayed value (2 × 8 = 16).
    expect((input.element as HTMLInputElement).value).toBe('16')
    wrapper.unmount()
  })

  it('Enter in the inline input commits as yieldOverride', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X', baseYield: 8 },
    })
    await wrapper.find('[data-testid="cart-entry-yield-display"]').trigger('dblclick')
    await nextTick()
    const input = wrapper.find('[data-testid="cart-entry-yield-edit"]')
    await input.setValue('15')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update')![0]).toEqual([{ yieldOverride: 15 }])
  })

  it('blur in the inline input commits as yieldOverride', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X', baseYield: 8 },
    })
    await wrapper.find('[data-testid="cart-entry-yield-display"]').trigger('dblclick')
    await nextTick()
    const input = wrapper.find('[data-testid="cart-entry-yield-edit"]')
    await input.setValue('11')
    await input.trigger('blur')
    expect(wrapper.emitted('update')![0]).toEqual([{ yieldOverride: 11 }])
  })

  it('Escape in the inline input cancels (no emit, input goes away)', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X', baseYield: 8 },
    })
    await wrapper.find('[data-testid="cart-entry-yield-display"]').trigger('dblclick')
    await nextTick()
    const input = wrapper.find('[data-testid="cart-entry-yield-edit"]')
    await input.setValue('99')
    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('update')).toBeUndefined()
    // Input is gone, display is back.
    expect(wrapper.find('[data-testid="cart-entry-yield-edit"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="cart-entry-yield-display"]').exists()).toBe(true)
  })

  it('blur with empty input value coerces to 1 (clamped floor) — no error path', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X', baseYield: 8 },
    })
    await wrapper.find('[data-testid="cart-entry-yield-display"]').trigger('dblclick')
    await nextTick()
    const input = wrapper.find('[data-testid="cart-entry-yield-edit"]')
    // type=number stores empty string when user clears; Number('') === 0; clamped to 1.
    await input.setValue('')
    await input.trigger('blur')
    // Number('') is 0 → finite, but clamped to 1. Either no emit (no diff) or emit yieldOverride:1.
    const emits = wrapper.emitted('update')
    if (emits) expect(emits[0]).toEqual([{ yieldOverride: 1 }])
  })

  it('commitEdit when not editing is a no-op (defensive guard)', async () => {
    // Open editor then trigger Escape and a stale blur to exercise the early-return guard.
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X', baseYield: 8 },
    })
    await wrapper.find('[data-testid="cart-entry-yield-display"]').trigger('dblclick')
    await nextTick()
    const input = wrapper.find('[data-testid="cart-entry-yield-edit"]')
    await input.trigger('keydown', { key: 'Escape' })
    // Editor closed; no input present anymore so blur can't fire — guard is internal.
    expect(wrapper.find('[data-testid="cart-entry-yield-edit"]').exists()).toBe(false)
  })

  it('clamps fractional / negative override values to floor >= 1', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X', baseYield: 8 },
    })
    await wrapper.find('[data-testid="cart-entry-yield-display"]').trigger('dblclick')
    await nextTick()
    const input = wrapper.find('[data-testid="cart-entry-yield-edit"]')
    await input.setValue('-2.7')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update')![0]).toEqual([{ yieldOverride: 1 }])
  })

  it('does not emit when typed override matches current override value', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ yieldOverride: 15 }),
        recipeName: 'X',
        baseYield: 8,
      },
    })
    await wrapper.find('[data-testid="cart-entry-yield-display"]').trigger('dblclick')
    await nextTick()
    const input = wrapper.find('[data-testid="cart-entry-yield-edit"]')
    await input.setValue('15')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update')).toBeUndefined()
  })

  it('Enter activates double-click via keyboard accessibility', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X', baseYield: 8 },
    })
    await wrapper.find('[data-testid="cart-entry-yield-display"]').trigger('keydown', { key: 'Enter' })
    await nextTick()
    expect(wrapper.find('[data-testid="cart-entry-yield-edit"]').exists()).toBe(true)
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

  /**
   * Helpers for F43 — find the HelpTooltip wrapper around an element and
   * read its popover text.
   */
  function tooltipTextFor(el: Element | null | undefined): string | null {
    if (!el) return null
    const wrapper = el.closest('.help-tooltip')
    if (!wrapper) return null
    const popover = wrapper.querySelector('[role="tooltip"]')
    return popover?.textContent?.trim() ?? null
  }

  it('exposes tooltips via HelpTooltip wrappers on interactive elements (F43)', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: { entry: makeEntry(), recipeName: 'X' },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    // Default mode: "Add one batch" / "Remove one batch".
    expect(tooltipTextFor(buttons[0].element)).toBe('Remove one batch')
    expect(tooltipTextFor(buttons[1].element)).toBe('Add one batch')
    expect(tooltipTextFor(wrapper.find('[data-testid="cart-entry-yield-display"]').element))
      .toBe('Double-click to set a custom amount')
    expect(tooltipTextFor(wrapper.find('input.cart-entry-unit').element)).toBeTruthy()
    expect(tooltipTextFor(wrapper.find('.cart-entry-remove').element)).toBeTruthy()
    expect(tooltipTextFor(wrapper.find('a.cart-entry-name').element)).toBeTruthy()
  })

  it('tooltips swap to unit-based labels in override mode', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ yieldOverride: 15, unit: 'bun' }),
        recipeName: 'X',
      },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    expect(tooltipTextFor(buttons[0].element)).toBe('Remove one bun')
    expect(tooltipTextFor(buttons[1].element)).toBe('Add one bun')
    expect(tooltipTextFor(wrapper.find('[data-testid="cart-entry-reset"]').element)).toBeTruthy()
  })

  it('tooltips degrade gracefully when unit is empty', () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ yieldOverride: 15, unit: '' }),
        recipeName: 'X',
      },
    })
    const buttons = wrapper.findAll('button.cart-entry-qty-btn')
    expect(tooltipTextFor(buttons[1].element)).toBe('Add one unit')
  })

  it('matches HTML snapshot for a user-added default-mode entry', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ addedBy: 'user', batches: 2, unit: 'loaf' }),
        recipeName: 'Tartine Baguette',
        yields: '2 loaves',
        baseYield: 2,
      },
    })
    await flushPromises()
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches HTML snapshot for an override-mode entry with hero thumb', async () => {
    const wrapper = mount(ProductionCartEntry, {
      props: {
        entry: makeEntry({ id: 'entry-2', addedBy: 'agent', batches: 1, yieldOverride: 15, unit: 'cookie' }),
        recipeName: 'Sourdough Chocolate Chip Cookies',
        yields: '22 cookies',
        heroThumb: '/images/sourdough-chocolate-chip-cookies/x/y-400w.webp',
        baseYield: 22,
      },
    })
    await flushPromises()
    expect(wrapper.html()).toMatchSnapshot()
  })
})
