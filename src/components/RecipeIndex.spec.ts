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

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
    families: mockFamilies,
    recipeList: mockRecipeList
  })
}))

// Mock motion-v to render plain elements
import { h, defineComponent } from 'vue'

vi.mock('motion-v', () => ({
  motion: new Proxy({}, {
    get: (_target, prop) => {
      const tag = String(prop)
      return defineComponent({
        name: `motion-${tag}`,
        inheritAttrs: false,
        setup(_, { slots, attrs }) {
          return () => {
            const { initial, whileInView, inViewOptions, variants, transition, ...rest } = attrs
            void initial; void whileInView; void inViewOptions; void variants; void transition
            return h(tag, rest, slots.default?.())
          }
        }
      })
    }
  })
}))

// Default fetch mock: returns recipe with cook_log and meta.description
function makeFetchMock(overrides: Record<string, unknown> = {}) {
  return vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({
        meta: { description: 'Test description' },
        cook_log: [],
        ...overrides
      })
    } as Response)
  )
}

describe('RecipeIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = makeFetchMock()
    mockFamilies.value = [
      {
        id: 'cinnamon-buns',
        name: 'ATK Cinnamon Buns',
        variants: [
          { id: 'quick', recipeId: 'atk-cinnamon-buns-quick', label: 'Quick (Same Day)' },
          { id: 'overnight', recipeId: 'atk-cinnamon-buns-overnight', label: 'Overnight' }
        ]
      }
    ]
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-quick', name: 'ATK Cinnamon Buns (Quick)', file: 'atk-cinnamon-buns-quick.json' },
      { id: 'atk-cinnamon-buns-overnight', name: 'ATK Cinnamon Buns (Overnight)', file: 'atk-cinnamon-buns-overnight.json' },
      { id: 'standalone-recipe', name: 'Standalone Recipe', file: 'standalone.json' }
    ]
  })

  it('renders family name as timeline item', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.text()).toContain('ATK Cinnamon Buns')
  })

  it('renders standalone recipe as timeline item', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.text()).toContain('Standalone Recipe')
  })

  it('renders category section labels', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const labels = wrapper.findAll('.timeline-section-label')
    expect(labels.length).toBeGreaterThan(0)
  })

  it('emits select when timeline item clicked', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const items = wrapper.findAll('.timeline-item')
    expect(items.length).toBeGreaterThan(0)
    await items[0].trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
  })

  it('emits first variant recipeId for family items', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // Find the family item (ATK Cinnamon Buns)
    const familyItem = wrapper.findAll('.timeline-item').find(el =>
      el.text().includes('ATK Cinnamon Buns')
    )
    expect(familyItem).toBeTruthy()
    await familyItem!.trigger('click')

    expect(wrapper.emitted('select')![0]).toEqual(['atk-cinnamon-buns-quick'])
  })

  it('emits recipe id for standalone items', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const standaloneItem = wrapper.findAll('.timeline-item').find(el =>
      el.text().includes('Standalone')
    )
    expect(standaloneItem).toBeTruthy()
    await standaloneItem!.trigger('click')

    expect(wrapper.emitted('select')![0]).toEqual(['standalone-recipe'])
  })

  it('shows variant count for families', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.text()).toContain('2 variants')
  })

  it('fetches recipe meta for all recipes', async () => {
    mount(RecipeIndex)
    await flushPromises()

    // Should fetch each recipe JSON for meta enrichment (at least once per recipe)
    expect(vi.mocked(global.fetch)).toHaveBeenCalled()
    const calls = vi.mocked(global.fetch).mock.calls
    const recipeUrls = calls.filter(c => String(c[0]).includes('/recipes/'))
    expect(recipeUrls.length).toBeGreaterThanOrEqual(3)
  })

  it('handles fetch error gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // Component should still render without crashing
    expect(wrapper.text()).toContain('ATK Cinnamon Buns')
  })

  it('shows description from meta when available', async () => {
    global.fetch = makeFetchMock({ meta: { description: 'A delicious recipe' } })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.text()).toContain('A delicious recipe')
  })

  it('shows hero image when cook_log has photos', async () => {
    global.fetch = makeFetchMock({
      cook_log: [{
        date: '2026-01-01',
        photos: [
          { src: '/img/hero-800w.webp', thumb: '/img/hero-400w.webp', alt: 'Hero' }
        ]
      }]
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const heroImg = wrapper.find('.timeline-hero')
    expect(heroImg.exists()).toBe(true)
    expect(heroImg.attributes('src')).toBe('/img/hero-400w.webp')
  })

  it('sorts baked recipes before unbaked within category', async () => {
    // Set up two standalone recipes in the same category
    mockFamilies.value = []
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Alpha Recipe', file: 'alpha.json' },
      { id: 'recipe-b', name: 'Beta Recipe', file: 'beta.json' }
    ]

    let callCount = 0
    global.fetch = vi.fn(() => {
      callCount++
      // First recipe has no cook_log, second does
      const hasCookLog = callCount % 2 === 0
      return Promise.resolve({
        json: () => Promise.resolve({
          meta: { description: 'desc' },
          cook_log: hasCookLog ? [{ date: '2026-01-01', photos: [] }] : []
        })
      } as Response)
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const items = wrapper.findAll('.timeline-item')
    expect(items.length).toBe(2)
    // Beta (baked) should appear before Alpha (unbaked)
    expect(items[0].text()).toContain('Beta Recipe')
    expect(items[1].text()).toContain('Alpha Recipe')
  })

  it('shows loading state before meta is fetched', () => {
    // Mock recipeList as empty to prevent immediate loading
    mockRecipeList.value = []
    const wrapper = mount(RecipeIndex)

    expect(wrapper.find('.timeline-loading').exists()).toBe(true)
  })
})
