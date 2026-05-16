import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SalesRow from './SalesRow.vue'
import type { SaleEntry } from '@/types/sales'

function makeEntry(overrides: Partial<SaleEntry> = {}): SaleEntry {
  return {
    recipeId: 'r1',
    plannedUnits: 8,
    soldUnits: 0,
    unitPrice: 5,
    ...overrides,
  }
}

describe('SalesRow', () => {
  it('renders recipe name, planned units, and revenue ($0.00 initially)', () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry(),
        recipeName: 'ATK Cinnamon Buns',
        unit: 'bun',
      },
    })
    expect(wrapper.text()).toContain('ATK Cinnamon Buns')
    expect(wrapper.text()).toContain('planned: 8 buns')
    expect(wrapper.find('[data-testid="sales-row-revenue"]').text()).toBe('$0.00')
    expect(wrapper.find('[data-testid="sales-row-leftover"]').text()).toBe('8 buns left')
  })

  it('computes revenue as sold × unitPrice', () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 3, unitPrice: 4.5 }),
        recipeName: 'R',
        unit: 'roll',
      },
    })
    // 3 × 4.50 = 13.50
    expect(wrapper.find('[data-testid="sales-row-revenue"]').text()).toBe('$13.50')
    expect(wrapper.find('[data-testid="sales-row-leftover"]').text()).toBe('5 rolls left')
  })

  it('emits update-sold on plus stepper click', async () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 2 }),
        recipeName: 'R',
        unit: 'bun',
      },
    })
    await wrapper.find('[data-testid="sales-row-inc"]').trigger('click')
    const emitted = wrapper.emitted('update-sold')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([3])
  })

  it('emits update-sold on minus stepper click', async () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 2 }),
        recipeName: 'R',
        unit: 'bun',
      },
    })
    await wrapper.find('[data-testid="sales-row-dec"]').trigger('click')
    const emitted = wrapper.emitted('update-sold')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([1])
  })

  it('disables minus when sold is 0', () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 0 }),
        recipeName: 'R',
        unit: 'bun',
      },
    })
    const dec = wrapper.find('[data-testid="sales-row-dec"]')
    expect(dec.attributes('disabled')).toBeDefined()
  })

  it('emits update-sold on free-type input change', async () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry(),
        recipeName: 'R',
        unit: 'bun',
      },
    })
    const input = wrapper.find('[data-testid="sales-row-count"]')
    await input.setValue('5')
    const emitted = wrapper.emitted('update-sold')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([5])
  })

  it('emits 0 when input is cleared', async () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 3 }),
        recipeName: 'R',
        unit: 'bun',
      },
    })
    const input = wrapper.find('[data-testid="sales-row-count"]')
    await input.setValue('')
    const emitted = wrapper.emitted('update-sold')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([0])
  })

  it('shows overshoot styling and "+N over plan" when sold > planned', () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 10, plannedUnits: 8 }),
        recipeName: 'R',
        unit: 'bun',
      },
    })
    expect(wrapper.classes()).toContain('sales-row--overshoot')
    expect(wrapper.find('[data-testid="sales-row-leftover"]').text()).toBe('+2 over plan')
    const input = wrapper.find('[data-testid="sales-row-count"]')
    expect(input.classes()).toContain('sales-row-count-input--overshoot')
  })

  it('accepts overshoot via input without clamping', async () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ plannedUnits: 8 }),
        recipeName: 'R',
        unit: 'bun',
      },
    })
    const input = wrapper.find('[data-testid="sales-row-count"]')
    await input.setValue('12')
    const emitted = wrapper.emitted('update-sold')
    expect(emitted).toBeDefined()
    expect(emitted![0]).toEqual([12])
  })

  it('respects readonly: input is read-only, buttons disabled, no emits on click', async () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 4 }),
        recipeName: 'R',
        unit: 'bun',
        readonly: true,
      },
    })
    expect(wrapper.classes()).toContain('sales-row--readonly')
    const input = wrapper.find('[data-testid="sales-row-count"]')
    expect(input.attributes('readonly')).toBeDefined()
    const inc = wrapper.find('[data-testid="sales-row-inc"]')
    expect(inc.attributes('disabled')).toBeDefined()
    await inc.trigger('click')
    expect(wrapper.emitted('update-sold')).toBeUndefined()
  })

  it('renders hero thumb when provided', () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry(),
        recipeName: 'R',
        unit: 'bun',
        heroThumb: '/images/r/2026-05-01/img-400w.webp',
      },
    })
    const img = wrapper.find('img.sales-row-thumb')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/r/2026-05-01/img-400w.webp')
  })

  it('falls back to initials placeholder when no hero thumb', () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry(),
        recipeName: 'Tartine Baguette',
        unit: 'baguette',
      },
    })
    const placeholder = wrapper.find('.sales-row-thumb-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toBe('TB')
  })

  it('singular vs plural leftover labels', () => {
    const single = mount(SalesRow, {
      props: {
        entry: makeEntry({ plannedUnits: 1, soldUnits: 0 }),
        recipeName: 'R',
        unit: 'loaf',
      },
    })
    expect(single.find('[data-testid="sales-row-leftover"]').text()).toBe('1 loaf left')
    const multi = mount(SalesRow, {
      props: {
        entry: makeEntry({ plannedUnits: 4, soldUnits: 0 }),
        recipeName: 'R',
        unit: 'loaf',
      },
    })
    expect(multi.find('[data-testid="sales-row-leftover"]').text()).toBe('4 loafs left')
  })

  it('rejects non-numeric input silently', async () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 3 }),
        recipeName: 'R',
        unit: 'bun',
      },
    })
    const input = wrapper.find('[data-testid="sales-row-count"]')
    // Force a non-numeric value via DOM (number inputs filter, but we exercise the guard)
    ;(input.element as HTMLInputElement).value = 'abc'
    await input.trigger('input')
    // Either no emit OR a 0-emit (depending on how the browser parses). Both
    // are acceptable — what we're guarding against is an NaN propagation.
    const emitted = wrapper.emitted('update-sold')
    if (emitted) {
      for (const [v] of emitted) {
        expect(Number.isFinite(v as number)).toBe(true)
      }
    }
  })

  it('matches snapshot — active session row', () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 3, plannedUnits: 8, unitPrice: 5 }),
        recipeName: 'ATK Cinnamon Buns',
        unit: 'bun',
        heroThumb: '/images/atk/2026-05-01/img-400w.webp',
      },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches snapshot — readonly history row', () => {
    const wrapper = mount(SalesRow, {
      props: {
        entry: makeEntry({ soldUnits: 8, plannedUnits: 8, unitPrice: 5 }),
        recipeName: 'ATK Cinnamon Buns',
        unit: 'bun',
        heroThumb: '/images/atk/2026-05-01/img-400w.webp',
        readonly: true,
      },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
