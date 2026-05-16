import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import NewSaleSheet from './NewSaleSheet.vue'
import type { PlanSnapshot } from '@/types/sales'

const PLAN: PlanSnapshot[] = [
  { recipeId: 'r1', plannedUnits: 8, unitPrice: 5 },
  { recipeId: 'r2', plannedUnits: 4, unitPrice: 10 },
]

const ROWS = [
  { recipeId: 'r1', recipeName: 'ATK Cinnamon Buns', heroThumb: null, unit: 'bun' },
  { recipeId: 'r2', recipeName: 'Tartine Baguette', heroThumb: '/img.webp', unit: 'baguette' },
]

function mountSheet(soldByRecipe: Record<string, number> = {}, open = true) {
  return mount(NewSaleSheet, {
    props: {
      open,
      initialPlan: PLAN,
      rows: ROWS,
      soldByRecipe,
    },
  })
}

describe('NewSaleSheet', () => {
  it('does not render when open=false', () => {
    const wrapper = mountSheet({}, false)
    expect(wrapper.find('[data-testid="new-sale-sheet"]').exists()).toBe(false)
  })

  it('renders one row per plan entry', () => {
    const wrapper = mountSheet()
    const rows = wrapper.findAll('.new-sale-row')
    expect(rows.length).toBe(2)
    expect(wrapper.text()).toContain('ATK Cinnamon Buns')
    expect(wrapper.text()).toContain('Tartine Baguette')
  })

  it('shows available units, subtracting sold-so-far', () => {
    const wrapper = mountSheet({ r1: 3, r2: 0 })
    const html = wrapper.html()
    expect(html).toContain('available: 5 buns')
    expect(html).toContain('available: 4 baguettes')
  })

  it('total starts at $0.00 with an empty cart', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[data-testid="new-sale-total"]').text()).toContain('$0.00')
  })

  it('Complete Sale is disabled with empty cart', () => {
    const wrapper = mountSheet()
    const btn = wrapper.find('[data-testid="new-sale-complete"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('increment updates units and total', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    expect(wrapper.find('[data-testid="new-sale-total"]').text()).toContain('$10.00')
    expect(wrapper.find('[data-testid="new-sale-complete"]').attributes('disabled')).toBeUndefined()
  })

  it('decrement floors at 0 and re-disables decrement at 0', async () => {
    const wrapper = mountSheet()
    const dec = wrapper.find('[data-testid="new-sale-dec-r1"]')
    expect(dec.attributes('disabled')).toBeDefined()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    expect(wrapper.find('[data-testid="new-sale-dec-r1"]').attributes('disabled')).toBeUndefined()
    await wrapper.find('[data-testid="new-sale-dec-r1"]').trigger('click')
    expect(wrapper.find('[data-testid="new-sale-dec-r1"]').attributes('disabled')).toBeDefined()
  })

  it('units input accepts typed values', async () => {
    const wrapper = mountSheet()
    const input = wrapper.find('[data-testid="new-sale-units-r1"]')
    await input.setValue('3')
    expect(wrapper.find('[data-testid="new-sale-linetotal-r1"]').text()).toBe('$15.00')
    expect(wrapper.find('[data-testid="new-sale-total"]').text()).toContain('$15.00')
  })

  it('price override per line is reflected in total', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    const priceInput = wrapper.find('[data-testid="new-sale-price-r1"]')
    await priceInput.setValue('3.50')
    expect(wrapper.find('[data-testid="new-sale-linetotal-r1"]').text()).toBe('$3.50')
    expect(wrapper.find('[data-testid="new-sale-total"]').text()).toContain('$3.50')
  })

  it('mixed cart sums correctly across recipes', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click') // 2 × $5 = $10
    await wrapper.find('[data-testid="new-sale-inc-r2"]').trigger('click') // 1 × $10 = $10
    expect(wrapper.find('[data-testid="new-sale-total"]').text()).toContain('$20.00')
  })

  it('emits complete with line items when Complete Sale clicked', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    await wrapper.find('[data-testid="new-sale-inc-r2"]').trigger('click')
    await wrapper.find('[data-testid="new-sale-complete"]').trigger('click')
    const emitted = wrapper.emitted('complete')
    expect(emitted).toBeDefined()
    const [items, notes] = emitted![0]
    expect(items).toEqual([
      { recipeId: 'r1', units: 2, unitPrice: 5, lineTotal: 10 },
      { recipeId: 'r2', units: 1, unitPrice: 10, lineTotal: 10 },
    ])
    expect(notes).toBe('')
  })

  it('omits zero-unit rows from emitted items', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r2"]').trigger('click')
    await wrapper.find('[data-testid="new-sale-complete"]').trigger('click')
    const items = wrapper.emitted('complete')?.[0][0] as Array<{ recipeId: string }>
    expect(items.length).toBe(1)
    expect(items[0].recipeId).toBe('r2')
  })

  it('emits cancel from Cancel button and × close button', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-cancel-btn"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeDefined()
    expect(wrapper.emitted('cancel')!.length).toBe(1)
    await wrapper.find('[data-testid="new-sale-cancel"]').trigger('click')
    expect(wrapper.emitted('cancel')!.length).toBe(2)
  })

  it('emits cancel on backdrop click', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-backdrop"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeDefined()
  })

  it('does not emit cancel when clicking inside the sheet', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-sheet"]').trigger('click')
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('passes trimmed notes through to complete', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    const notes = wrapper.find('[data-testid="new-sale-notes"]')
    await notes.setValue('  Cash payment  ')
    await wrapper.find('[data-testid="new-sale-complete"]').trigger('click')
    const [, n] = wrapper.emitted('complete')![0]
    expect(n).toBe('Cash payment')
  })

  it('resets cart when re-opened', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    expect(wrapper.find('[data-testid="new-sale-total"]').text()).toContain('$5.00')
    await wrapper.setProps({ open: false })
    await flushPromises()
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(wrapper.find('[data-testid="new-sale-total"]').text()).toContain('$0.00')
  })

  it('renders hero thumb when present, initials placeholder otherwise', () => {
    const wrapper = mountSheet()
    const imgs = wrapper.findAll('img.new-sale-row-thumb')
    expect(imgs.length).toBe(1)
    expect(imgs[0].attributes('src')).toBe('/img.webp')
    const placeholder = wrapper.find('.new-sale-row-thumb-placeholder')
    expect(placeholder.exists()).toBe(true)
    expect(placeholder.text()).toBe('AC')
  })

  it('clears units when input is emptied', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    const input = wrapper.find('[data-testid="new-sale-units-r1"]')
    await input.setValue('')
    expect(wrapper.find('[data-testid="new-sale-linetotal-r1"]').text()).toBe('$0.00')
  })

  it('rejects negative units silently', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    const input = wrapper.find('[data-testid="new-sale-units-r1"]')
    ;(input.element as HTMLInputElement).value = '-5'
    await input.trigger('input')
    // Should remain 1 from earlier increment.
    expect(wrapper.find('[data-testid="new-sale-linetotal-r1"]').text()).toBe('$5.00')
  })

  it('clears unitPrice when price input is emptied', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    const priceInput = wrapper.find('[data-testid="new-sale-price-r1"]')
    await priceInput.setValue('')
    expect(wrapper.find('[data-testid="new-sale-linetotal-r1"]').text()).toBe('$0.00')
  })

  it('rejects negative price silently', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-inc-r1"]').trigger('click')
    const priceInput = wrapper.find('[data-testid="new-sale-price-r1"]')
    ;(priceInput.element as HTMLInputElement).value = '-2'
    await priceInput.trigger('input')
    // Should remain at the snapshot $5.
    expect(wrapper.find('[data-testid="new-sale-linetotal-r1"]').text()).toBe('$5.00')
  })

  it('Escape key on backdrop emits cancel', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-backdrop"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('cancel')).toBeDefined()
  })

  it('non-Escape keydown does not emit cancel', async () => {
    const wrapper = mountSheet()
    await wrapper.find('[data-testid="new-sale-backdrop"]').trigger('keydown', { key: 'a' })
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('Complete with zero-unit cart does nothing (defensive)', async () => {
    const wrapper = mountSheet()
    // Force-click even though disabled — guard inside onComplete should still gate.
    await wrapper.find('[data-testid="new-sale-complete"]').trigger('click')
    expect(wrapper.emitted('complete')).toBeUndefined()
  })

  it('matches snapshot — empty cart (just opened)', () => {
    const wrapper = mountSheet()
    expect(wrapper.html()).toMatchSnapshot()
  })
})
