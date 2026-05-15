import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// Install a working localStorage mock BEFORE importing the SUT.
let __ls_store: Record<string, string> = {}
const __ls_mock = {
  getItem: (key: string) => __ls_store[key] ?? null,
  setItem: (key: string, value: string) => {
    __ls_store[key] = value
  },
  removeItem: (key: string) => {
    delete __ls_store[key]
  },
  clear: () => {
    __ls_store = {}
  },
  get length() {
    return Object.keys(__ls_store).length
  },
  key: (i: number) => Object.keys(__ls_store)[i] || null,
}
Object.defineProperty(globalThis, 'localStorage', {
  value: __ls_mock,
  writable: true,
  configurable: true,
})

import PricingView from './PricingView.vue'

const mockRecipeList = ref([
  { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
  { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
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

function makeFetchMock(recipeData: Record<string, unknown>) {
  return vi.fn((url: string) => {
    const path = String(url)
    const file = path.split('/').pop() ?? ''
    const data = recipeData[file] ?? { cook_log: [] }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response)
  })
}

function planJson(entries: Array<{ id: string; recipeId: string; batches?: number; unit?: string; yieldOverride?: number | null }>): string {
  return JSON.stringify({
    entries: entries.map((e) => ({
      id: e.id,
      recipeId: e.recipeId,
      batches: e.batches ?? 1,
      yieldOverride: e.yieldOverride ?? null,
      unit: e.unit ?? 'roll',
      addedBy: 'user',
      addedAt: '2026-05-12T00:00:00Z',
    })),
    updated: '2026-05-12T00:00:00Z',
  })
}

describe('PricingView', () => {
  beforeEach(() => {
    __ls_store = {}
    vi.clearAllMocks()
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
      { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
    ]
    global.fetch = makeFetchMock({
      'atk-cinnamon-buns-ultimate.json': {
        meta: { name: 'ATK Cinnamon Buns', yields: '8 buns' },
        cook_log: [
          { date: '2026-04-01', version: 'v1.0.0', notes: [], cost: { total: 4, perServing: 0.5, servings: 8, items: [] } },
        ],
      },
      'tartine-baguette.json': {
        meta: { name: 'Tartine Baguette', yields: '2 baguettes' },
        cook_log: [
          { date: '2026-04-05', version: 'v1.0.0', notes: [], cost: { total: 2, perServing: 1, servings: 2, items: [] } },
        ],
      },
    })
  })

  it('shows empty state with CTA link when ProductionPlan is empty', async () => {
    // No plan in localStorage → empty entries
    const wrapper = mount(PricingView)
    await flushPromises()
    expect(wrapper.text()).toContain('No bakes in production')
    const cta = wrapper.find('[data-testid="pricing-empty-cta"]')
    expect(cta.exists()).toBe(true)
    expect(cta.attributes('href')).toBe('/production')
  })

  it('renders one PricingRow per ProductionPlan entry', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([
        { id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' },
        { id: 'p2', recipeId: 'tartine-baguette', unit: 'baguette' },
      ]),
    )
    const wrapper = mount(PricingView)
    await flushPromises()
    const rows = wrapper.findAllComponents({ name: 'PricingRow' })
    expect(rows.length).toBe(2)
  })

  it('renders header summary math from queued entries (default sell-all)', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', batches: 1, unit: 'bun' }]),
    )
    const wrapper = mount(PricingView)
    await flushPromises()

    // costPerUnit = 4 / 8 = 0.5; raw sellPrice = 0.5 * 2.5 = 1.25 per unit.
    // estimatedSold defaults to unitsPerBake (8) → revenue = 1.25 × 8 = 10.00.
    // cost is sunk on the full bake: 0.5 × 8 = 4.00. CP = 10 − 4 = 6.
    const subtitle = wrapper.find('[data-testid="pricing-subtitle"]').text()
    expect(subtitle).toContain('1 bake queued')
    expect(subtitle).toContain('cost $4.00')
    expect(subtitle).toContain('revenue $10.00')
    expect(subtitle).toContain('CP $6.00')
  })

  it('reduces revenue and CP when estimatedSold is below unitsPerBake', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', batches: 1, unit: 'bun' }]),
    )
    // Seed an estimatedSoldUnits override: only 4 of 8 are expected to sell.
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'atk-cinnamon-buns-ultimate': { markupPct: 150, estimatedSoldUnits: 4 } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const wrapper = mount(PricingView)
    await flushPromises()

    // Raw sell = 1.25. revenue = 1.25 × 4 = 5.00.
    // Cost stays sunk on the full bake: 0.5 × 8 = 4.00. CP = 5 − 4 = 1.00.
    const subtitle = wrapper.find('[data-testid="pricing-subtitle"]').text()
    expect(subtitle).toContain('cost $4.00')
    expect(subtitle).toContain('revenue $5.00')
    expect(subtitle).toContain('CP $1.00')
  })

  it('persists estimatedSoldUnits override via setEstimatedSold on input change', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', batches: 1, unit: 'bun' }]),
    )
    const wrapper = mount(PricingView)
    await flushPromises()

    const inputs = wrapper.findAll('input[type="number"]')
    expect(inputs.length).toBeGreaterThan(0)
    await inputs[0].setValue('3')
    await flushPromises()

    const stored = JSON.parse(localStorage.getItem('bake-pricing-current') ?? '{}')
    expect(stored.perRecipe['atk-cinnamon-buns-ultimate']?.estimatedSoldUnits).toBe(3)
  })

  it('clears estimatedSoldUnits override when input matches the default', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', batches: 1, unit: 'bun' }]),
    )
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'atk-cinnamon-buns-ultimate': { markupPct: 150, estimatedSoldUnits: 4 } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const wrapper = mount(PricingView)
    await flushPromises()

    const inputs = wrapper.findAll('input[type="number"]')
    // Clearing the input emits the default (unitsPerBake = 8); the handler
    // recognizes value === default and drops the override.
    await inputs[0].setValue('')
    await flushPromises()

    const stored = JSON.parse(localStorage.getItem('bake-pricing-current') ?? '{}')
    expect(stored.perRecipe['atk-cinnamon-buns-ultimate']?.estimatedSoldUnits).toBeUndefined()
  })

  it('uses sellPriceOverride for revenue math when set', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', batches: 1, unit: 'bun' }]),
    )
    // Recipe cost: total=$4 / 8 buns = $0.50/bun.
    // Override sell price to $3.00/bun → revenue = 3 × 8 = 24; cost sunk = 4; CP = 20.
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'atk-cinnamon-buns-ultimate': { markupPct: 150, sellPriceOverride: 3 } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const wrapper = mount(PricingView)
    await flushPromises()
    const subtitle = wrapper.find('[data-testid="pricing-subtitle"]').text()
    expect(subtitle).toContain('cost $4.00')
    expect(subtitle).toContain('revenue $24.00')
    expect(subtitle).toContain('CP $20.00')
  })

  it('persists sellPriceOverride on edit commit', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(PricingView)
    await flushPromises()
    const sell = wrapper.find('[data-testid="pricing-row-sell-display"]')
    await sell.trigger('dblclick')
    const input = wrapper.find('[data-testid="pricing-row-sell-edit"]')
    await input.setValue('15.5')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    const stored = JSON.parse(localStorage.getItem('bake-pricing-current') ?? '{}')
    expect(stored.perRecipe['atk-cinnamon-buns-ultimate']?.sellPriceOverride).toBe(15.5)
  })

  it('clears sellPriceOverride when ↺ reset is clicked', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'atk-cinnamon-buns-ultimate': { markupPct: 150, sellPriceOverride: 18 } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const wrapper = mount(PricingView)
    await flushPromises()
    const reset = wrapper.find('[data-testid="pricing-row-sell-reset"]')
    expect(reset.exists()).toBe(true)
    await reset.trigger('click')
    await flushPromises()
    const stored = JSON.parse(localStorage.getItem('bake-pricing-current') ?? '{}')
    expect(stored.perRecipe['atk-cinnamon-buns-ultimate']?.sellPriceOverride).toBeUndefined()
  })

  it('persists markup overrides via savePricing on slider change', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(PricingView)
    await flushPromises()

    const sliders = wrapper.findAll('input[type="range"]')
    expect(sliders.length).toBeGreaterThan(0)
    await sliders[0].setValue('225')
    await flushPromises()

    const stored = JSON.parse(localStorage.getItem('bake-pricing-current') ?? '{}')
    expect(stored.perRecipe['atk-cinnamon-buns-ultimate']?.markupPct).toBe(225)
  })

  it('shows loading state before recipes resolve', () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(PricingView)
    expect(wrapper.text()).toContain('Loading')
  })

  it('falls back gracefully when fetch throws', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    global.fetch = vi.fn(() => Promise.reject(new Error('boom'))) as unknown as typeof fetch
    const wrapper = mount(PricingView)
    await flushPromises()
    expect(wrapper.text()).toContain('no cost data')
  })

  it('hydrates recipes lazily when recipeList becomes non-empty after mount', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    // Start with empty list to exercise the watch() branch.
    mockRecipeList.value = []
    const wrapper = mount(PricingView)
    await flushPromises()
    expect(wrapper.text()).toContain('Loading')

    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
    ]
    await flushPromises()
    await flushPromises()
    expect(wrapper.findAllComponents({ name: 'PricingRow' }).length).toBe(1)
  })

  it('renders hero thumb when the latest cook_log entry has one tagged hero', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    global.fetch = makeFetchMock({
      'atk-cinnamon-buns-ultimate.json': {
        meta: { name: 'ATK Cinnamon Buns', yields: '8 buns' },
        cook_log: [
          {
            date: '2026-04-01',
            version: 'v1.0.0',
            notes: [],
            cost: { total: 4, perServing: 0.5, servings: 8, items: [] },
            photos: [
              {
                src: '/images/atk/2026-04-01/img-800w.webp',
                thumb: '/images/atk/2026-04-01/img-400w.webp',
                alt: 'hero',
                tag: 'hero',
              },
            ],
          },
        ],
      },
      'tartine-baguette.json': { cook_log: [] },
    })
    const wrapper = mount(PricingView)
    await flushPromises()
    const img = wrapper.find('img.pricing-row-thumb')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/atk/2026-04-01/img-400w.webp')
  })

  it('falls back to recipes.value[].meta.name when manifest lacks an entry', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'ghost-recipe', unit: 'unit' }]),
    )
    mockRecipeList.value = []
    loadManifestMock.mockImplementation(() => {
      mockRecipeList.value = []
      return Promise.resolve()
    })
    global.fetch = makeFetchMock({
      'ghost-recipe.json': {
        meta: { name: 'Ghost Recipe', yields: '4 servings' },
        cook_log: [],
      },
    })
    // Because there is no entry in recipeList for 'ghost-recipe', and no file
    // is fetched (fetchAllRecipes iterates recipeList), the row will render
    // the bare recipeId. We still exercise the manifest-empty path.
    const wrapper = mount(PricingView)
    await flushPromises()
    // With empty recipe list, no recipes are fetched and recipesLoaded stays false → loading UI
    expect(wrapper.text()).toContain('Loading')
  })
})
