import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SalesTransactionRow from './SalesTransactionRow.vue'
import type { SalesTransaction } from '@/types/sales'

function makeTx(overrides: Partial<SalesTransaction> = {}): SalesTransaction {
  return {
    id: 'tx-1',
    occurredAt: '2026-05-12T15:30:00Z',
    items: [
      { recipeId: 'r1', units: 2, unitPrice: 5, lineTotal: 10 },
      { recipeId: 'r2', units: 1, unitPrice: 10, lineTotal: 10 },
    ],
    totalAsk: 20,
    ...overrides,
  }
}

const RECIPE_NAMES = {
  r1: 'ATK Cinnamon Buns',
  r2: 'Tartine Baguette',
}

describe('SalesTransactionRow', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('renders collapsed by default: time, item count, total', () => {
    const wrapper = mount(SalesTransactionRow, {
      props: { transaction: makeTx(), recipeNameByRecipe: RECIPE_NAMES },
    })
    expect(wrapper.find('[data-testid="tx-row-time"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tx-row-count"]').text()).toBe('3 items')
    expect(wrapper.find('[data-testid="tx-row-total"]').text()).toBe('$20.00')
    expect(wrapper.find('[data-testid="tx-row-details"]').exists()).toBe(false)
  })

  it('singular "item" when count is 1', () => {
    const tx = makeTx({ items: [{ recipeId: 'r1', units: 1, unitPrice: 5, lineTotal: 5 }], totalAsk: 5 })
    const wrapper = mount(SalesTransactionRow, {
      props: { transaction: tx, recipeNameByRecipe: RECIPE_NAMES },
    })
    expect(wrapper.find('[data-testid="tx-row-count"]').text()).toBe('1 item')
  })

  it('expands on click and reveals item details', async () => {
    const wrapper = mount(SalesTransactionRow, {
      props: { transaction: makeTx(), recipeNameByRecipe: RECIPE_NAMES },
    })
    await wrapper.find('[data-testid="tx-row-toggle"]').trigger('click')
    const details = wrapper.find('[data-testid="tx-row-details"]')
    expect(details.exists()).toBe(true)
    expect(details.text()).toContain('ATK Cinnamon Buns')
    expect(details.text()).toContain('Tartine Baguette')
    expect(details.text()).toContain('2×')
    expect(details.text()).toContain('@ $5.00')
  })

  it('collapses on second click', async () => {
    const wrapper = mount(SalesTransactionRow, {
      props: { transaction: makeTx(), recipeNameByRecipe: RECIPE_NAMES },
    })
    await wrapper.find('[data-testid="tx-row-toggle"]').trigger('click')
    expect(wrapper.find('[data-testid="tx-row-details"]').exists()).toBe(true)
    await wrapper.find('[data-testid="tx-row-toggle"]').trigger('click')
    expect(wrapper.find('[data-testid="tx-row-details"]').exists()).toBe(false)
  })

  it('renders notes when present (expanded)', async () => {
    const wrapper = mount(SalesTransactionRow, {
      props: {
        transaction: makeTx({ notes: 'Venmo payment' }),
        recipeNameByRecipe: RECIPE_NAMES,
        initiallyExpanded: true,
      },
    })
    expect(wrapper.find('[data-testid="tx-row-notes"]').text()).toContain('Venmo payment')
  })

  it('emits delete with txId on Delete click (after confirm)', async () => {
    const wrapper = mount(SalesTransactionRow, {
      props: {
        transaction: makeTx({ id: 'tx-zap' }),
        recipeNameByRecipe: RECIPE_NAMES,
        initiallyExpanded: true,
      },
    })
    await wrapper.find('[data-testid="tx-row-delete"]').trigger('click')
    expect(wrapper.emitted('delete')).toBeDefined()
    expect(wrapper.emitted('delete')![0]).toEqual(['tx-zap'])
  })

  it('does not emit delete when confirm is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const wrapper = mount(SalesTransactionRow, {
      props: {
        transaction: makeTx({ id: 'tx-zap' }),
        recipeNameByRecipe: RECIPE_NAMES,
        initiallyExpanded: true,
      },
    })
    await wrapper.find('[data-testid="tx-row-delete"]').trigger('click')
    expect(wrapper.emitted('delete')).toBeUndefined()
  })

  it('hides delete button in readonly mode', () => {
    const wrapper = mount(SalesTransactionRow, {
      props: {
        transaction: makeTx(),
        recipeNameByRecipe: RECIPE_NAMES,
        initiallyExpanded: true,
        readonly: true,
      },
    })
    expect(wrapper.find('[data-testid="tx-row-delete"]').exists()).toBe(false)
    expect(wrapper.classes()).toContain('tx-row--readonly')
  })

  it('falls back to recipeId when name map missing entry', async () => {
    const tx = makeTx({ items: [{ recipeId: 'unknown', units: 1, unitPrice: 3, lineTotal: 3 }], totalAsk: 3 })
    const wrapper = mount(SalesTransactionRow, {
      props: { transaction: tx, recipeNameByRecipe: {}, initiallyExpanded: true },
    })
    expect(wrapper.find('[data-testid="tx-row-details"]').text()).toContain('unknown')
  })

  it('matches snapshot — collapsed row', () => {
    const wrapper = mount(SalesTransactionRow, {
      props: { transaction: makeTx(), recipeNameByRecipe: RECIPE_NAMES },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches snapshot — expanded row with notes', () => {
    const wrapper = mount(SalesTransactionRow, {
      props: {
        transaction: makeTx({ notes: 'Cash, regular customer' }),
        recipeNameByRecipe: RECIPE_NAMES,
        initiallyExpanded: true,
      },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
