import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// Install a working localStorage mock BEFORE importing the SUT.
let __ls_store: Record<string, string> = {}
const __ls_mock = {
  getItem: (key: string) => __ls_store[key] ?? null,
  setItem: (key: string, value: string) => { __ls_store[key] = value },
  removeItem: (key: string) => { delete __ls_store[key] },
  clear: () => { __ls_store = {} },
  get length() { return Object.keys(__ls_store).length },
  key: (i: number) => Object.keys(__ls_store)[i] || null,
}
Object.defineProperty(globalThis, 'localStorage', { value: __ls_mock, writable: true, configurable: true })

import ProductionView from './ProductionView.vue'

const mockRecipeList = ref([
  { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
  { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
  { id: 'ny-style-pizza', name: 'NY Style Pizza', file: 'ny-style-pizza.json' },
])

const loadManifestMock = vi.fn(() => Promise.resolve())

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
    recipeList: mockRecipeList,
    loadManifest: loadManifestMock,
  }),
}))

vi.mock('@unhead/vue', () => ({
  useSeoMeta: vi.fn(),
}))

interface FakeRecipe {
  meta: { name: string; yields: string; total_time: string }
  cook_log?: Array<{ date: string; photos?: Array<{ src: string; thumb: string; alt: string; tag?: string }>; aberration?: boolean }>
}

function makeFetchMock(recipesByFile: Record<string, FakeRecipe>) {
  return vi.fn((url: string) => {
    const path = String(url)
    const file = path.split('/').pop() ?? ''
    const data = recipesByFile[file] ?? {
      meta: { name: 'X', yields: '8 rolls', total_time: '1 hour' },
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response)
  })
}

function dispatchKey(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

describe('ProductionView (Cart pattern, dense list library)', () => {
  beforeEach(() => {
    __ls_store = {}
    vi.clearAllMocks()
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
      { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
      { id: 'ny-style-pizza', name: 'NY Style Pizza', file: 'ny-style-pizza.json' },
    ]
    global.fetch = makeFetchMock({
      'atk-cinnamon-buns-ultimate.json': {
        meta: { name: 'ATK', yields: '8 rolls', total_time: '1 hour' },
        cook_log: [
          { date: '2026-04-26', photos: [{ src: 'x.webp', thumb: '/images/atk/x-400w.webp', alt: 'atk' }] },
          { date: '2026-04-12' },
          { date: '2026-03-30' },
        ],
      },
      'tartine-baguette.json': {
        meta: { name: 'TB', yields: '2 loaves', total_time: '2 hours' },
        cook_log: [{ date: '2026-05-01' }],
      },
      'ny-style-pizza.json': {
        meta: { name: 'Pizza', yields: '2 pizzas', total_time: '3 hours' },
        // no cook_log
      },
    })
  })

  it('renders header with title and helper subtitle', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()
    expect(wrapper.text()).toContain('production')
    expect(wrapper.text()).toContain('Click')
  })

  it('renders the library as one row per recipe in the manifest', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()
    const rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    expect(rows.length).toBe(3)
    expect(wrapper.text()).toContain('ATK Ultimate Cinnamon Buns')
    expect(wrapper.text()).toContain('Tartine Baguette')
    expect(wrapper.text()).toContain('NY Style Pizza')
  })

  it('renders bake count from cook_log.length', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()
    const rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    // Default sort = most baked. ATK (3 entries) should be first.
    expect(rows[0].props('recipeId')).toBe('atk-cinnamon-buns-ultimate')
    expect(rows[0].props('bakeCount')).toBe(3)
    // Tartine = 1 entry
    const tartineRow = rows.find(r => r.props('recipeId') === 'tartine-baguette')!
    expect(tartineRow.props('bakeCount')).toBe(1)
    // Pizza = no cook_log → 0
    const pizzaRow = rows.find(r => r.props('recipeId') === 'ny-style-pizza')!
    expect(pizzaRow.props('bakeCount')).toBe(0)
  })

  it('renders the empty cart state when no entries', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()
    expect(wrapper.find('[data-testid="cart-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Click')
    expect(wrapper.text()).toContain('add it to your queue')
  })

  it('adds an entry to the cart when a library row [+] is clicked', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    const row = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()

    const entries = wrapper.findAllComponents({ name: 'ProductionCartEntry' })
    expect(entries.length).toBe(1)

    const stored = JSON.parse(localStorage.getItem('bake-production-current') ?? '{}')
    expect(stored.entries).toHaveLength(1)
    expect(stored.entries[0].recipeId).toBe('atk-cinnamon-buns-ultimate')
    expect(stored.entries[0].addedBy).toBe('user')
    expect(stored.entries[0].batches).toBe(1)
    expect(stored.entries[0].yieldOverride).toBe(null)
    // inferDefaultUnit on "8 rolls" → "roll"
    expect(stored.entries[0].unit).toBe('roll')
  })

  it('marks a row as in-queue after adding to cart', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    const row = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()

    const updated = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    expect(updated.props('inQueue')).toBe(true)
  })

  it('bumps batches when the same library row [+] is clicked twice', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    const row = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()

    const entries = wrapper.findAllComponents({ name: 'ProductionCartEntry' })
    expect(entries.length).toBe(1)

    const stored = JSON.parse(localStorage.getItem('bake-production-current') ?? '{}')
    expect(stored.entries).toHaveLength(1)
    expect(stored.entries[0].batches).toBe(2)
  })

  it('removes an entry when confirm returns true', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = mount(ProductionView)
    await flushPromises()

    const row = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()
    expect(wrapper.findAllComponents({ name: 'ProductionCartEntry' })).toHaveLength(1)

    await wrapper.find('.cart-entry-remove').trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper.findAllComponents({ name: 'ProductionCartEntry' })).toHaveLength(0)

    const stored = JSON.parse(localStorage.getItem('bake-production-current') ?? '{}')
    expect(stored.entries).toHaveLength(0)
    confirmSpy.mockRestore()
  })

  it('does NOT remove when confirm returns false', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const wrapper = mount(ProductionView)
    await flushPromises()

    const row = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()
    await wrapper.find('.cart-entry-remove').trigger('click')
    await flushPromises()

    expect(wrapper.findAllComponents({ name: 'ProductionCartEntry' })).toHaveLength(1)
    confirmSpy.mockRestore()
  })

  it('updates an entry when batch stepper increments', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    const row = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()

    const qtyButtons = wrapper.findAll('button.cart-entry-qty-btn')
    // [0] = −, [1] = +
    await qtyButtons[1].trigger('click')
    await flushPromises()

    const stored = JSON.parse(localStorage.getItem('bake-production-current') ?? '{}')
    expect(stored.entries[0].batches).toBe(2)
  })

  it('passes baseYield (parsed from recipe.meta.yields) to ProductionCartEntry', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    const row = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()

    const entry = wrapper.findComponent({ name: 'ProductionCartEntry' })
    expect(entry.exists()).toBe(true)
    // "8 rolls" → 8
    expect(entry.props('baseYield')).toBe(8)
    // Default-mode display: 1 × 8 = 8.
    expect(entry.find('[data-testid="cart-entry-yield-display"]').text()).toBe('8')
  })

  it('persists a yieldOverride emitted from the cart entry', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    const row = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()

    const entry = wrapper.findComponent({ name: 'ProductionCartEntry' })
    entry.vm.$emit('update', { yieldOverride: 15 })
    await flushPromises()

    const stored = JSON.parse(localStorage.getItem('bake-production-current') ?? '{}')
    expect(stored.entries[0].yieldOverride).toBe(15)
  })

  it('updates an entry when unit input changes', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    const row = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
      .find(r => r.props('recipeId') === 'atk-cinnamon-buns-ultimate')!
    await row.find('button.library-row-plus').trigger('click')
    await flushPromises()

    const unitInput = wrapper.find('input.cart-entry-unit')
    await unitInput.setValue('dozen')
    await flushPromises()

    const stored = JSON.parse(localStorage.getItem('bake-production-current') ?? '{}')
    expect(stored.entries[0].unit).toBe('dozen')
  })

  it('hydrates existing entries from localStorage on mount', async () => {
    __ls_store['bake-production-current'] = JSON.stringify({
      updated: '2026-05-12T00:00:00Z',
      entries: [
        { id: 'preload', recipeId: 'tartine-baguette', batches: 2, yieldOverride: null, unit: 'loaf', addedBy: 'agent', addedAt: '2026-05-12T00:00:00Z' },
      ],
    })

    const wrapper = mount(ProductionView)
    await flushPromises()

    const entries = wrapper.findAllComponents({ name: 'ProductionCartEntry' })
    expect(entries.length).toBe(1)
    expect(wrapper.text()).toContain('Tartine Baguette')
    expect(wrapper.text()).toContain('agent')
  })

  it('hydrates a legacy plan (with quantity, no batches/yieldOverride) and migrates the field', async () => {
    __ls_store['bake-production-current'] = JSON.stringify({
      updated: '2026-05-12T00:00:00Z',
      entries: [
        { id: 'legacy', recipeId: 'tartine-baguette', quantity: 3, unit: 'loaf', addedBy: 'user', addedAt: '2026-05-12T00:00:00Z' },
      ],
    })

    const wrapper = mount(ProductionView)
    await flushPromises()

    const entry = wrapper.findComponent({ name: 'ProductionCartEntry' })
    expect(entry.exists()).toBe(true)
    expect(entry.props('entry').batches).toBe(3)
    expect(entry.props('entry').yieldOverride).toBe(null)
  })

  it('collapses and expands the cart sidebar', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    expect(wrapper.find('[data-testid="cart-collapse"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cart-expand"]').exists()).toBe(false)

    await wrapper.find('[data-testid="cart-collapse"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="cart-collapse"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="cart-expand"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="production-layout"]').classes()).toContain('production-layout-collapsed')

    await wrapper.find('[data-testid="cart-expand"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="cart-collapse"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="production-layout"]').classes()).not.toContain('production-layout-collapsed')
  })

  it('exposes tooltips on toolbar + cart elements (F43)', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()
    expect(wrapper.find('[data-testid="cart-collapse"]').attributes('title')).toBeTruthy()
    expect(wrapper.find('[data-testid="library-search"]').attributes('title')).toBeTruthy()
    expect(wrapper.find('[data-testid="library-sort"]').attributes('title')).toBeTruthy()
  })

  // ────────────────────────────────────────────────
  // F7a: search + sort
  // ────────────────────────────────────────────────

  it('filters library rows live by search query (case-insensitive)', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    const search = wrapper.find('input[data-testid="library-search"]')
    await search.setValue('TARTINE')
    await flushPromises()

    const rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    expect(rows.length).toBe(1)
    expect(rows[0].props('recipeId')).toBe('tartine-baguette')
  })

  it('shows an empty state when search has no matches', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    await wrapper.find('input[data-testid="library-search"]').setValue('zzz-no-match')
    await flushPromises()

    expect(wrapper.findAllComponents({ name: 'ProductionLibraryRow' }).length).toBe(0)
    expect(wrapper.find('[data-testid="library-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('zzz-no-match')
  })

  it('default sort = Most baked (highest cook_log.length first)', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    const rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    expect(rows[0].props('recipeId')).toBe('atk-cinnamon-buns-ultimate') // 3
    expect(rows[1].props('recipeId')).toBe('tartine-baguette')           // 1
    expect(rows[2].props('recipeId')).toBe('ny-style-pizza')             // 0
  })

  it('sort = Alphabetical re-orders by name', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    await wrapper.find('select[data-testid="library-sort"]').setValue('alphabetical')
    await flushPromises()

    const rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    expect(rows.map(r => r.props('recipeName'))).toEqual([
      'ATK Ultimate Cinnamon Buns',
      'NY Style Pizza',
      'Tartine Baguette',
    ])
  })

  it('sort = Recently used puts most recent cook_log.date first; no-cook-log to bottom', async () => {
    const wrapper = mount(ProductionView)
    await flushPromises()

    await wrapper.find('select[data-testid="library-sort"]').setValue('recently_used')
    await flushPromises()

    const rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    // Tartine = 2026-05-01 (most recent), ATK = 2026-04-26, Pizza = none
    expect(rows[0].props('recipeId')).toBe('tartine-baguette')
    expect(rows[1].props('recipeId')).toBe('atk-cinnamon-buns-ultimate')
    expect(rows[2].props('recipeId')).toBe('ny-style-pizza')
  })

  // ────────────────────────────────────────────────
  // F7b: keyboard nav
  // ────────────────────────────────────────────────

  it('ArrowDown moves focus to first row, then second; Enter adds focused row to cart', async () => {
    const wrapper = mount(ProductionView, { attachTo: document.body })
    await flushPromises()

    // No row focused initially.
    let rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    expect(rows.every(r => r.props('isFocused') === false)).toBe(true)

    dispatchKey('ArrowDown')
    await flushPromises()
    rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    expect(rows[0].props('isFocused')).toBe(true)

    dispatchKey('ArrowDown')
    await flushPromises()
    rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    expect(rows[1].props('isFocused')).toBe(true)

    dispatchKey('Enter')
    await flushPromises()
    const stored = JSON.parse(localStorage.getItem('bake-production-current') ?? '{}')
    expect(stored.entries).toHaveLength(1)
    expect(stored.entries[0].recipeId).toBe(rows[1].props('recipeId'))

    wrapper.unmount()
  })

  it('j / k move focus down / up like ArrowDown / ArrowUp', async () => {
    const wrapper = mount(ProductionView, { attachTo: document.body })
    await flushPromises()

    dispatchKey('j')
    dispatchKey('j')
    await flushPromises()
    let rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    expect(rows[1].props('isFocused')).toBe(true)

    dispatchKey('k')
    await flushPromises()
    rows = wrapper.findAllComponents({ name: 'ProductionLibraryRow' })
    expect(rows[0].props('isFocused')).toBe(true)

    wrapper.unmount()
  })

  it('/ focuses the search input', async () => {
    const wrapper = mount(ProductionView, { attachTo: document.body })
    await flushPromises()

    dispatchKey('/')
    await flushPromises()
    const search = wrapper.find('input[data-testid="library-search"]').element as HTMLInputElement
    expect(document.activeElement).toBe(search)

    wrapper.unmount()
  })
})
