import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import BakeLogPage from './BakeLogPage.vue'

// Mock vue-router
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Mock useRecipe composable
const mockRecipeList = ref([
  { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
  { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
])

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
    recipeList: mockRecipeList
  })
}))

// Helper: make a fetch mock that returns different data per recipe file
function makeFetchMockByFile(fileMap: Record<string, Record<string, unknown>>) {
  return vi.fn((url: string) => {
    const file = String(url).split('/').pop() ?? ''
    const data = fileMap[file] ?? { cook_log: [] }
    return Promise.resolve({
      json: () => Promise.resolve(data)
    } as Response)
  })
}

// Helper: simple fetch mock returning same data for all recipes
function makeFetchMock(overrides: Record<string, unknown> = {}) {
  return vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({
        cook_log: [],
        ...overrides
      })
    } as Response)
  )
}

describe('BakeLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = makeFetchMock()
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
      { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
    ]
  })

  it('shows loading state before data loads', () => {
    mockRecipeList.value = []
    const wrapper = mount(BakeLogPage)

    expect(wrapper.find('.bake-log-loading').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading bake log...')
  })

  it('shows empty state when no bake entries exist', async () => {
    global.fetch = makeFetchMock({ cook_log: [] })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    expect(wrapper.find('.bake-log-empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No bakes recorded yet.')
  })

  it('renders bake entries after data loads', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-02-10', version: 'v1.2.0', summary: 'Cold proof bake', notes: [] }
        ]
      },
      'tartine-baguette.json': {
        cook_log: [
          { date: '2026-01-15', version: 'v1.0.0', summary: 'First baguette attempt', notes: [] }
        ]
      }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    const rows = wrapper.findAll('.bake-log-item')
    expect(rows.length).toBe(2)
    expect(wrapper.text()).toContain('ATK Ultimate Cinnamon Buns')
    expect(wrapper.text()).toContain('Tartine Baguette')
  })

  it('sorts entries newest-first by date', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-01-01', version: 'v1.0.0', summary: 'First bake', notes: [] }
        ]
      },
      'tartine-baguette.json': {
        cook_log: [
          { date: '2026-02-15', version: 'v1.0.0', summary: 'Recent bake', notes: [] }
        ]
      }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    const rows = wrapper.findAll('.bake-log-item')
    expect(rows.length).toBe(2)
    // Tartine (Feb 15) should come before ATK (Jan 1)
    expect(rows[0].text()).toContain('Tartine Baguette')
    expect(rows[1].text()).toContain('ATK Ultimate Cinnamon Buns')
  })

  it('shows date, recipe name, version, and summary per entry', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-02-10', version: 'v1.2.0', summary: 'Cold proof bake with reduced sugar', notes: [] }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    const row = wrapper.find('.bake-log-item')
    expect(row.find('.bake-log-date').text()).toBe('Feb 10')
    expect(row.find('.bake-log-name').text()).toBe('ATK Ultimate Cinnamon Buns')
    expect(row.find('.bake-log-version').text()).toBe('v1.2.0')
    expect(row.find('.bake-log-summary').text()).toBe('Cold proof bake with reduced sugar')
  })

  it('navigates to bake detail page on row click', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-02-10', version: 'v1.2.0', notes: [] }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    await wrapper.find('.bake-log-item').trigger('click')
    expect(mockPush).toHaveBeenCalledWith('/recipe/atk-cinnamon-buns-ultimate/bake/2026-02-10')
  })

  it('handles fetch errors gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    // Should show empty state (no entries loaded) rather than crash
    expect(wrapper.find('.bake-log-empty').exists()).toBe(true)
  })

  it('does not show summary when entry has no summary', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-02-10', version: 'v1.2.0', notes: ['good bake'] }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    expect(wrapper.find('.bake-log-summary').exists()).toBe(false)
  })

  it('renders multiple bake entries from the same recipe', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-02-10', version: 'v1.2.0', summary: 'Second bake', notes: [] },
          { date: '2026-01-20', version: 'v1.0.0', summary: 'First bake', notes: [] }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    const rows = wrapper.findAll('.bake-log-item')
    expect(rows.length).toBe(2)
    // Newest first
    expect(rows[0].text()).toContain('Feb 10')
    expect(rows[1].text()).toContain('Jan 20')
  })
})
