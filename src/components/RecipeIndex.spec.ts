import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import RecipeIndex from './RecipeIndex.vue'

// Mock the useRecipe composable
const mockRecipeList = ref([
  { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
  { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
  { id: 'standalone-recipe', name: 'Standalone Recipe', file: 'standalone.json' }
])

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
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
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
      { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
      { id: 'standalone-recipe', name: 'Standalone Recipe', file: 'standalone.json' }
    ]
  })

  it('renders recipe names as timeline items', async () => {
    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.text()).toContain('ATK Ultimate Cinnamon Buns')
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
    expect(wrapper.text()).toContain('ATK Ultimate Cinnamon Buns')
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

  it('shows bake count when cook_log has entries', async () => {
    global.fetch = makeFetchMock({
      cook_log: [
        { date: '2026-01-01', photos: [] },
        { date: '2026-01-15', photos: [] }
      ]
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const badge = wrapper.find('.timeline-bake-count')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('2 bakes')
  })

  it('hides bake count when cook_log is empty', async () => {
    global.fetch = makeFetchMock({ cook_log: [] })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const badges = wrapper.findAll('.timeline-bake-count')
    expect(badges.length).toBe(0)
  })

  it('shows loading state before meta is fetched', () => {
    // Mock recipeList as empty to prevent immediate loading
    mockRecipeList.value = []
    const wrapper = mount(RecipeIndex)

    expect(wrapper.find('.timeline-loading').exists()).toBe(true)
  })
})
