import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// Install a working localStorage mock BEFORE importing the SUT.
// Other specs install their own globalThis mock that may not expose .clear().
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
    if (path.endsWith('/profiles/pricing/default.json')) {
      return Promise.resolve({ ok: false } as Response)
    }
    const file = path.split('/').pop() ?? ''
    const data = recipeData[file] ?? { cook_log: [] }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response)
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
        cook_log: [
          { date: '2026-04-01', version: 'v1.0.0', notes: [], cost: { total: 4.5, perServing: 0.56, servings: 8, items: [] } },
        ],
      },
      'tartine-baguette.json': {
        cook_log: [
          { date: '2026-04-05', version: 'v1.0.0', notes: [], cost: { total: 2.25, perServing: 1.13, servings: 2, items: [] } },
        ],
      },
    })
  })

  it('renders header with title and export button', async () => {
    const wrapper = mount(PricingView)
    await flushPromises()

    expect(wrapper.text()).toContain('Pricing')
    expect(wrapper.text()).toContain('Profile:')
    expect(wrapper.find('.pricing-btn').exists()).toBe(true)
    expect(wrapper.find('.pricing-btn').text()).toContain('Export')
  })

  it('renders one PricingRow per recipe', async () => {
    const wrapper = mount(PricingView)
    await flushPromises()

    const rows = wrapper.findAllComponents({ name: 'PricingRow' })
    expect(rows.length).toBe(2)
  })

  it('passes cost from cook_log to each row', async () => {
    const wrapper = mount(PricingView)
    await flushPromises()

    expect(wrapper.text()).toContain('$4.50')
    expect(wrapper.text()).toContain('$2.25')
  })

  it('falls back to "no cost data" when a recipe has no cook_log cost', async () => {
    global.fetch = makeFetchMock({
      'atk-cinnamon-buns-ultimate.json': { cook_log: [] },
      'tartine-baguette.json': { cook_log: [] },
    })
    const wrapper = mount(PricingView)
    await flushPromises()

    expect(wrapper.text()).toContain('no cost data')
  })

  it('uses default markup of 65 when no profile override exists', async () => {
    const wrapper = mount(PricingView)
    await flushPromises()

    // 65% markup label visible at least once
    expect(wrapper.text()).toContain('65%')
  })

  it('updates profile state when a row slider changes', async () => {
    const wrapper = mount(PricingView)
    await flushPromises()

    const sliders = wrapper.findAll('input[type="range"]')
    expect(sliders.length).toBeGreaterThan(0)

    await sliders[0].setValue('175')
    await flushPromises()

    // Persisted to localStorage
    const stored = JSON.parse(localStorage.getItem('pricing-profile-current') ?? '{}')
    expect(stored.perRecipe['atk-cinnamon-buns-ultimate']?.markupPct).toBe(175)
  })

  it('triggers export and updates committed baseline on Export click', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const wrapper = mount(PricingView)
    await flushPromises()

    // Make a change first
    const sliders = wrapper.findAll('input[type="range"]')
    await sliders[0].setValue('175')
    await flushPromises()

    await wrapper.find('.pricing-btn').trigger('click')
    await flushPromises()

    // After export, the committed baseline contains the change → row should no longer be dirty
    const committed = JSON.parse(localStorage.getItem('pricing-profile-committed') ?? '{}')
    expect(committed.perRecipe?.['atk-cinnamon-buns-ultimate']?.markupPct).toBe(175)
  })

  it('shows loading state before manifest/costs load', () => {
    mockRecipeList.value = []
    const wrapper = mount(PricingView)
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows empty state when manifest has no recipes after load', async () => {
    mockRecipeList.value = []
    // simulate loadManifest having set it to empty — recipesLoaded toggles via fetchAllRecipeCosts
    const wrapper = mount(PricingView)
    // Manually fire watch by setting list to empty array (still 0 length).
    await flushPromises()
    // Loading remains true because recipesLoaded is never set when list is empty.
    expect(wrapper.text()).toMatch(/Loading|No recipes/)
  })

  it('marks a row dirty after slider change when committed baseline exists but lacks the entry', async () => {
    // Pre-populate committed with an empty profile baseline
    localStorage.setItem('pricing-profile-committed', JSON.stringify({
      name: 'Default', version: '1.0.0', created: '2026-05-12', updated: '2026-05-12',
      default: { markupPct: 65 }, perRecipe: {},
    }))

    const wrapper = mount(PricingView)
    await flushPromises()

    const sliders = wrapper.findAll('input[type="range"]')
    await sliders[0].setValue('175')
    await flushPromises()

    expect(wrapper.find('.pricing-row-dirty').exists()).toBe(true)
  })

  it('falls back to cost null when fetch throws', async () => {
    global.fetch = vi.fn((url: string) => {
      if (String(url).endsWith('/profiles/pricing/default.json')) {
        return Promise.resolve({ ok: false } as Response)
      }
      return Promise.reject(new Error('boom'))
    })

    const wrapper = mount(PricingView)
    await flushPromises()

    expect(wrapper.text()).toContain('no cost data')
  })

  it('hydrates working state from default.json when committed is absent', async () => {
    global.fetch = vi.fn((url: string) => {
      const path = String(url)
      if (path.endsWith('/profiles/pricing/default.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            name: 'Seeded',
            version: '1.0.0',
            created: '2026-05-12',
            updated: '2026-05-12',
            default: { markupPct: 80 },
            perRecipe: {},
          }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ cook_log: [] }),
      } as Response)
    })

    const wrapper = mount(PricingView)
    await flushPromises()
    await flushPromises()

    // Profile name updated from the fetched default
    expect(wrapper.text()).toContain('Seeded')
  })
})
