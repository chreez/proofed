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

// Mock QR rendering — LabelCard mounts these for each card.
vi.mock('@/composables/useQrLabel', () => ({
  renderBrandedQr: vi.fn(() => Promise.resolve(document.createElement('canvas'))),
  generateQrLabelDataUrl: vi.fn(() => 'data:image/png;base64,FAKEQR'),
}))

const useSeoMetaMock = vi.fn()
vi.mock('@unhead/vue', () => ({
  useSeoMeta: (...args: unknown[]) => useSeoMetaMock(...args),
}))

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

import LabelsView from './LabelsView.vue'

function makeFetchMock() {
  return vi.fn((url: string) => {
    const path = String(url)
    const file = path.split('/').pop() ?? ''
    const data = {
      meta: { name: file.replace('.json', ''), yields: '8 rolls', total_time: '1 hour' },
      stages: [
        {
          id: 'mix', title: 'Mix', states: [],
          gather: { ingredients: [{ id: 'flour', name: 'flour', total: 200, unit: 'g', breakdown: null }] },
        },
      ],
      states: [],
      version: 'v1.0.0',
      config: { early_check_percent: 80 },
      vessels: [],
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response)
  })
}

describe('LabelsView', () => {
  beforeEach(() => {
    __ls_store = {}
    vi.clearAllMocks()
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
      { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
    ]
    global.fetch = makeFetchMock()
  })

  it('calls useSeoMeta with the Labels page metadata (F27)', async () => {
    mount(LabelsView)
    await flushPromises()
    expect(useSeoMetaMock).toHaveBeenCalled()
    const arg = useSeoMetaMock.mock.calls[0][0] as Record<string, string>
    expect(arg.title).toContain('Labels')
  })

  it('renders the empty state CTA when no entries are queued', async () => {
    const wrapper = mount(LabelsView)
    await flushPromises()

    expect(wrapper.find('[data-testid="labels-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No bakes queued')
    const cta = wrapper.find('[data-testid="labels-empty-cta"]')
    expect(cta.exists()).toBe(true)
    expect(cta.attributes('href')).toBe('/production')
  })

  it('renders one LabelCard per ProductionPlan entry from localStorage', async () => {
    __ls_store['bake-production-current'] = JSON.stringify({
      updated: '2026-05-12T00:00:00Z',
      entries: [
        {
          id: 'a', recipeId: 'atk-cinnamon-buns-ultimate', batches: 1,
          yieldOverride: null, unit: 'roll', addedBy: 'user',
          addedAt: '2026-05-12T00:00:00Z',
        },
        {
          id: 'b', recipeId: 'tartine-baguette', batches: 2,
          yieldOverride: null, unit: 'loaf', addedBy: 'agent',
          addedAt: '2026-05-12T00:00:00Z',
        },
      ],
    })
    const wrapper = mount(LabelsView)
    await flushPromises()

    const cards = wrapper.findAllComponents({ name: 'LabelCard' })
    expect(cards.length).toBe(2)
    expect(wrapper.find('[data-testid="labels-empty"]').exists()).toBe(false)
  })

  it('shows queued bake count in the subtitle', async () => {
    __ls_store['bake-production-current'] = JSON.stringify({
      updated: '2026-05-12T00:00:00Z',
      entries: [
        {
          id: 'a', recipeId: 'atk-cinnamon-buns-ultimate', batches: 1,
          yieldOverride: null, unit: 'roll', addedBy: 'user',
          addedAt: '2026-05-12T00:00:00Z',
        },
      ],
    })
    const wrapper = mount(LabelsView)
    await flushPromises()
    const subtitle = wrapper.find('[data-testid="labels-subtitle"]')
    expect(subtitle.text()).toContain('1 bake queued')
    expect(subtitle.text()).toContain('click Print')
  })

  it('triggers window.print() when the Print button is clicked', async () => {
    __ls_store['bake-production-current'] = JSON.stringify({
      updated: '2026-05-12T00:00:00Z',
      entries: [
        {
          id: 'a', recipeId: 'atk-cinnamon-buns-ultimate', batches: 1,
          yieldOverride: null, unit: 'roll', addedBy: 'user',
          addedAt: '2026-05-12T00:00:00Z',
        },
      ],
    })
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const wrapper = mount(LabelsView)
    await flushPromises()

    await wrapper.find('[data-testid="labels-print"]').trigger('click')
    expect(printSpy).toHaveBeenCalledTimes(1)
    printSpy.mockRestore()
  })

  it('disables the Print button when no bakes are queued', async () => {
    const wrapper = mount(LabelsView)
    await flushPromises()
    const btn = wrapper.find('[data-testid="labels-print"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('wraps the Print button in HelpTooltip (F43)', async () => {
    const wrapper = mount(LabelsView)
    await flushPromises()
    const btn = wrapper.find('[data-testid="labels-print"]')
    expect(btn.element.closest('.help-tooltip')).not.toBeNull()
  })

  it('falls back to recipe id when manifest entry is missing', async () => {
    __ls_store['bake-production-current'] = JSON.stringify({
      updated: '2026-05-12T00:00:00Z',
      entries: [
        {
          id: 'a', recipeId: 'mystery-recipe', batches: 1,
          yieldOverride: null, unit: 'roll', addedBy: 'user',
          addedAt: '2026-05-12T00:00:00Z',
        },
      ],
    })
    const wrapper = mount(LabelsView)
    await flushPromises()
    // Recipe id used as fallback name when manifest lookup fails.
    const card = wrapper.findComponent({ name: 'LabelCard' })
    expect(card.exists()).toBe(true)
    expect(card.props('recipeName')).toBe('mystery-recipe')
  })
})
