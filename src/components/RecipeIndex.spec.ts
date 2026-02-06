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
})
