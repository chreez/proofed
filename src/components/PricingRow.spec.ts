import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingRow from './PricingRow.vue'
import type { ProductionEntry } from '@/types/production'

function makeEntry(overrides: Partial<ProductionEntry> = {}): ProductionEntry {
  return {
    id: 'e1',
    recipeId: 'r1',
    batches: 1,
    yieldOverride: null,
    unit: 'roll',
    addedBy: 'user',
    addedAt: '2026-05-12T00:00:00Z',
    ...overrides,
  }
}

describe('PricingRow', () => {
  it('renders cost-per-unit, slider, raw sell price, CP, and break-even line', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1 }),
        recipeName: 'Test Recipe',
        yields: '8 rolls',
        unitsPerBake: 8,
        costPerUnit: 0.5,
        markupPct: 200,
      },
    })

    expect(wrapper.text()).toContain('Test Recipe')
    expect(wrapper.text()).toContain('1 batch · 8 rolls')
    expect(wrapper.text()).toContain('$0.50')
    expect(wrapper.text()).toContain('/roll')
    expect(wrapper.text()).toContain('200%')
    // 0.5 × (1 + 2) = 1.5 — raw decimal, already on a pretty anchor so no hint.
    expect(wrapper.text()).toContain('$1.50')
    expect(wrapper.text()).toContain('+$1.00')
    // batch cost = 0.5 × 8 = 4; sell = 1.5 → ceil(4 / 1.5) = 3
    expect(wrapper.text()).toContain('break even: sell')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('of 8')
  })

  it('shows a pretty-anchor hint when the raw sell price is off-anchor', () => {
    // 0.42 × 2.5 = 1.05 → display $1.05; nearestPretty → $1.00.
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1 }),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: 0.42,
        markupPct: 150,
      },
    })
    expect(wrapper.text()).toContain('$1.05')
    expect(wrapper.text()).toContain('≈ $1.00')
  })

  it('hides the pretty-anchor hint when the raw is already on an anchor', () => {
    // 0.5 × 2 = 1.00 — exact anchor.
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1 }),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: 0.5,
        markupPct: 100,
      },
    })
    expect(wrapper.text()).toContain('$1.00')
    // The "≈ sell" input label remains, but no pretty-anchor hint element.
    expect(wrapper.find('.pricing-row-sell-hint').exists()).toBe(false)
  })

  it('exposes an estimated-sell input with the bake yield as placeholder', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1 }),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: 0.5,
        markupPct: 200,
      },
    })
    const input = wrapper.find('input[type="number"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('8')
    // Default (estimatedSold === unitsPerBake) leaves the input blank — the
    // placeholder is the source of truth.
    expect(input.attributes('value')).toBe('')
  })

  it('emits update-estimated-sold on input change', async () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1 }),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: 0.5,
        markupPct: 200,
      },
    })
    const input = wrapper.find('input[type="number"]')
    await input.setValue('3')
    const emitted = wrapper.emitted('update-estimated-sold')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([3])
  })

  it('emits the default (unitsPerBake) when the user clears the input', async () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1 }),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: 0.5,
        markupPct: 200,
        estimatedSold: 3,
      },
    })
    const input = wrapper.find('input[type="number"]')
    await input.setValue('')
    const emitted = wrapper.emitted('update-estimated-sold')
    expect(emitted).toBeDefined()
    // Empty input → revert to default sell-all (unitsPerBake = 8).
    expect(emitted![0]).toEqual([8])
  })

  it('renders the estimatedSold value when it differs from unitsPerBake', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1 }),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: 0.5,
        markupPct: 200,
        estimatedSold: 3,
      },
    })
    const input = wrapper.find('input[type="number"]')
    expect((input.element as HTMLInputElement).value).toBe('3')
  })

  it('renders slider with correct min/max/step/value (post-feedback range 50–1500)', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry(),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: 1,
        markupPct: 175,
      },
    })
    const slider = wrapper.find('input[type="range"]')
    expect(slider.exists()).toBe(true)
    expect(slider.attributes('min')).toBe('50')
    expect(slider.attributes('max')).toBe('1500')
    expect(slider.attributes('step')).toBe('1')
    expect(slider.attributes('value')).toBe('175')
  })

  it('accepts a markup value above the legacy 300 cap', async () => {
    // Real-world: $1.27 cost, $15.24 sell ≈ 1100% markup.
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'loaf' }),
        recipeName: 'Sourdough',
        unitsPerBake: 1,
        costPerUnit: 1.27,
        markupPct: 1100,
      },
    })
    // 1.27 × 12 = 15.24
    expect(wrapper.text()).toContain('$15.24')
    expect(wrapper.text()).toContain('1100%')
    // Pretty hint suggests $15.00 (nearest 0.50 anchor).
    expect(wrapper.text()).toContain('≈ $15.00')
  })

  it('shows "no cost data" when costPerUnit is null', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry(),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: null,
        markupPct: 150,
      },
    })
    expect(wrapper.text()).toContain('no cost data')
    expect(wrapper.text()).toContain('—')
  })

  it('emits update-markup on slider input', async () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry(),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: 1,
        markupPct: 150,
      },
    })
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('225')
    const emitted = wrapper.emitted('update-markup')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([225])
  })

  it('renders the hero thumb when provided', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry(),
        recipeName: 'R',
        unitsPerBake: 8,
        costPerUnit: 1,
        markupPct: 150,
        heroThumb: '/images/r/2026-05-01/hero-400w.webp',
      },
    })
    const img = wrapper.find('img.pricing-row-thumb')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/r/2026-05-01/hero-400w.webp')
  })

  it('renders initials placeholder when heroThumb absent', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry(),
        recipeName: 'Tartine Baguette',
        unitsPerBake: 2,
        costPerUnit: 1,
        markupPct: 150,
      },
    })
    const placeholder = wrapper.find('.pricing-row-thumb-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toBe('TB')
  })

  it('pluralizes unit only when units > 1', () => {
    const single = mount(PricingRow, {
      props: {
        entry: makeEntry({ unit: 'loaf' }),
        recipeName: 'R',
        unitsPerBake: 1,
        costPerUnit: 1,
        markupPct: 150,
      },
    })
    expect(single.text()).toContain('1 loaf')

    const multi = mount(PricingRow, {
      props: {
        entry: makeEntry({ unit: 'loaf', batches: 2 }),
        recipeName: 'R',
        unitsPerBake: 4,
        costPerUnit: 1,
        markupPct: 150,
      },
    })
    expect(multi.text()).toContain('2 batches · 4 loafs')
  })

  it('uses sellPriceOverride verbatim when set, ignoring markup math', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'loaf' }),
        recipeName: 'Sourdough',
        unitsPerBake: 1,
        costPerUnit: 1.27,
        markupPct: 150, // ignored
        sellPriceOverride: 18,
      },
    })
    expect(wrapper.text()).toContain('$18.00')
    // Derived markup: (18 - 1.27) / 1.27 * 100 ≈ 1317%
    const markup = wrapper.find('[data-testid="pricing-row-markup"]')
    expect(markup.text()).toContain('derived')
    expect(markup.text()).toContain('1317%')
  })

  it('marks slider read-only and applies override styling when override is set', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'loaf' }),
        recipeName: 'Sourdough',
        unitsPerBake: 1,
        costPerUnit: 1.27,
        markupPct: 150,
        sellPriceOverride: 18,
      },
    })
    const slider = wrapper.find('input[type="range"]')
    expect(slider.attributes('disabled')).toBeDefined()
    const sell = wrapper.find('[data-testid="pricing-row-sell-display"]')
    expect(sell.classes()).toContain('pricing-row-sell--override')
    expect(wrapper.find('[data-testid="pricing-row-sell-custom"]').exists()).toBe(true)
  })

  it('hides the pretty-anchor hint when override is set', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'loaf' }),
        recipeName: 'Sourdough',
        unitsPerBake: 1,
        costPerUnit: 1.27,
        markupPct: 150,
        sellPriceOverride: 17.25, // off-anchor on purpose
      },
    })
    // The custom price is the source of truth — no "round to $17.50" hint.
    expect(wrapper.find('.pricing-row-sell-hint').exists()).toBe(false)
  })

  it('swaps sell price to inline input on double-click and commits on Enter', async () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'loaf' }),
        recipeName: 'Sourdough',
        unitsPerBake: 1,
        costPerUnit: 1.27,
        markupPct: 150,
      },
    })
    const sell = wrapper.find('[data-testid="pricing-row-sell-display"]')
    await sell.trigger('dblclick')
    const input = wrapper.find('[data-testid="pricing-row-sell-edit"]')
    expect(input.exists()).toBe(true)
    await input.setValue('18')
    await input.trigger('keydown', { key: 'Enter' })
    const emitted = wrapper.emitted('update-sell-price-override')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([18])
  })

  it('cancels edit on Escape without emitting', async () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'loaf' }),
        recipeName: 'Sourdough',
        unitsPerBake: 1,
        costPerUnit: 1.27,
        markupPct: 150,
      },
    })
    const sell = wrapper.find('[data-testid="pricing-row-sell-display"]')
    await sell.trigger('dblclick')
    const input = wrapper.find('[data-testid="pricing-row-sell-edit"]')
    await input.setValue('99')
    await input.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('update-sell-price-override')).toBeUndefined()
    // The display swaps back.
    expect(wrapper.find('[data-testid="pricing-row-sell-edit"]').exists()).toBe(false)
  })

  it('commits the override on blur', async () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'loaf' }),
        recipeName: 'Sourdough',
        unitsPerBake: 1,
        costPerUnit: 1.27,
        markupPct: 150,
      },
    })
    const sell = wrapper.find('[data-testid="pricing-row-sell-display"]')
    await sell.trigger('dblclick')
    const input = wrapper.find('[data-testid="pricing-row-sell-edit"]')
    await input.setValue('12.5')
    await input.trigger('blur')
    const emitted = wrapper.emitted('update-sell-price-override')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([12.5])
  })

  it('emits null when ↺ clear is clicked', async () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'loaf' }),
        recipeName: 'Sourdough',
        unitsPerBake: 1,
        costPerUnit: 1.27,
        markupPct: 150,
        sellPriceOverride: 18,
      },
    })
    const reset = wrapper.find('[data-testid="pricing-row-sell-reset"]')
    expect(reset.exists()).toBe(true)
    await reset.trigger('click')
    const emitted = wrapper.emitted('update-sell-price-override')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([null])
  })

  it('rejects non-positive override values silently', async () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'loaf' }),
        recipeName: 'Sourdough',
        unitsPerBake: 1,
        costPerUnit: 1.27,
        markupPct: 150,
      },
    })
    const sell = wrapper.find('[data-testid="pricing-row-sell-display"]')
    await sell.trigger('dblclick')
    const input = wrapper.find('[data-testid="pricing-row-sell-edit"]')
    await input.setValue('0')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update-sell-price-override')).toBeUndefined()
  })

  it('matches HTML snapshot with full pricing data', () => {
    const wrapper = mount(PricingRow, {
      props: {
        entry: makeEntry({ batches: 1, unit: 'bun' }),
        recipeName: 'ATK Cinnamon Buns',
        yields: '8 buns',
        unitsPerBake: 8,
        costPerUnit: 0.5,
        markupPct: 200,
        heroThumb: '/images/atk/2026-05-01/img-400w.webp',
      },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
