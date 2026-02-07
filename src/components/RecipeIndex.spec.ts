import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import RecipeIndex from './RecipeIndex.vue'

// Mock the useRecipe composable
const mockFamilies = ref([
  {
    id: 'cinnamon-buns',
    name: 'ATK Cinnamon Buns',
    variants: [
      { id: 'quick', recipeId: 'atk-cinnamon-buns-quick', label: 'Quick (Same Day)' },
      { id: 'overnight', recipeId: 'atk-cinnamon-buns-overnight', label: 'Overnight' }
    ]
  }
])

const mockRecipeList = ref([
  { id: 'atk-cinnamon-buns-quick', name: 'ATK Cinnamon Buns (Quick)', file: 'atk-cinnamon-buns-quick.json' },
  { id: 'atk-cinnamon-buns-overnight', name: 'ATK Cinnamon Buns (Overnight)', file: 'atk-cinnamon-buns-overnight.json' },
  { id: 'standalone-recipe', name: 'Standalone Recipe', file: 'standalone.json' }
])

const mockCurrentRecipeId = ref('atk-cinnamon-buns-quick')

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
    families: mockFamilies,
    recipeList: mockRecipeList,
    currentRecipeId: mockCurrentRecipeId
  })
}))

// Mock fetch for cook_log checks
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ cook_log: [] })
  } as Response)
)

describe('RecipeIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentRecipeId.value = 'atk-cinnamon-buns-quick'
  })

  it('renders family names', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.text()).toContain('ATK Cinnamon Buns')
  })

  it('renders variant chips for each family', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const buttons = wrapper.findAll('.variant-chip')
    // 2 family variants + 1 standalone recipe = 3 buttons
    expect(buttons.length).toBe(3)
    expect(wrapper.text()).toContain('Quick (Same Day)')
    expect(wrapper.text()).toContain('Overnight')
  })

  it('emits select event when variant clicked', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const buttons = wrapper.findAll('.variant-chip')
    await buttons[1].trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['atk-cinnamon-buns-overnight'])
  })

  it('shows other recipes section for standalone recipes', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.text()).toContain('Other Recipes')
    expect(wrapper.text()).toContain('Standalone Recipe')
  })

  it('highlights active recipe', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const buttons = wrapper.findAll('.variant-chip')
    const activeBtn = buttons.find(b => b.text().includes('Quick (Same Day)'))
    expect(activeBtn?.classes()).toContain('active')

    const inactiveBtn = buttons.find(b => b.text().includes('Overnight'))
    expect(inactiveBtn?.classes()).not.toContain('active')
  })

  it('uses cache hit for cook_log check', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // fetch is called on mount for each recipe - check it was called
    expect(vi.mocked(global.fetch)).toHaveBeenCalled()
  })

  it('handles fetch error in cook_log check', async () => {
    vi.mocked(global.fetch).mockImplementation(() =>
      Promise.reject(new Error('Network error'))
    )

    // Should not throw
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // Component should still render
    expect(wrapper.text()).toContain('ATK Cinnamon Buns')

    // Restore
    vi.mocked(global.fetch).mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ cook_log: [] })
      } as Response)
    )
  })

  it('shows cook_log indicator when recipe has cook_log', async () => {
    vi.mocked(global.fetch).mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ cook_log: [{ date: '2026-01-01', notes: 'test' }] })
      } as Response)
    )

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // Should show the cook_log indicator
    const indicators = wrapper.findAll('.cook-log-indicator')
    expect(indicators.length).toBeGreaterThan(0)
  })

  it('hides other recipes section when no standalone recipes', async () => {
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-quick', name: 'ATK Cinnamon Buns (Quick)', file: 'atk-cinnamon-buns-quick.json' },
      { id: 'atk-cinnamon-buns-overnight', name: 'ATK Cinnamon Buns (Overnight)', file: 'atk-cinnamon-buns-overnight.json' }
    ]

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.text()).not.toContain('Other Recipes')

    // Restore
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-quick', name: 'ATK Cinnamon Buns (Quick)', file: 'atk-cinnamon-buns-quick.json' },
      { id: 'atk-cinnamon-buns-overnight', name: 'ATK Cinnamon Buns (Overnight)', file: 'atk-cinnamon-buns-overnight.json' },
      { id: 'standalone-recipe', name: 'Standalone Recipe', file: 'standalone.json' }
    ]
  })

  it('emits select when standalone recipe clicked', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const standaloneBtn = wrapper.findAll('.variant-chip').find(b => b.text().includes('Standalone'))
    await standaloneBtn!.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['standalone-recipe'])
  })

  it('highlights standalone recipe when active', async () => {
    mockCurrentRecipeId.value = 'standalone-recipe'
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const standaloneBtn = wrapper.findAll('.variant-chip').find(b => b.text().includes('Standalone'))
    expect(standaloneBtn?.classes()).toContain('active')
  })
})
