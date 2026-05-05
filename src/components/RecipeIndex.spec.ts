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

// Mock localStorage for in-progress detection
let localStore: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => localStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStore[key] = value }),
  removeItem: vi.fn((key: string) => { delete localStore[key] }),
  clear: vi.fn(() => { localStore = {} }),
  get length() { return Object.keys(localStore).length },
  key: vi.fn((i: number) => Object.keys(localStore)[i] || null)
}

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

// Default fetch mock: returns recipe with cook_log entry (baked by default so items show)
function makeFetchMock(overrides: Record<string, unknown> = {}) {
  return vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({
        meta: { description: 'Test description' },
        cook_log: [{ date: '2026-01-01', photos: [] }],
        ...overrides
      })
    } as Response)
  )
}

// Per-file fetch mock: returns different data per recipe file
function makeFetchMockByFile(fileMap: Record<string, Record<string, unknown>>) {
  return vi.fn((url: string) => {
    const file = String(url).split('/').pop() ?? ''
    const data = fileMap[file] ?? { meta: { description: 'Test description' }, cook_log: [{ date: '2026-01-01', photos: [] }] }
    return Promise.resolve({
      json: () => Promise.resolve(data)
    } as Response)
  })
}

describe('RecipeIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStore = {}
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

    // Component should still render without crashing — recipes appear in unbaked reveal
    expect(wrapper.text()).toContain('+ 3 more recipes')

    // Click reveal to show them
    await wrapper.find('.timeline-reveal-link').trigger('click')
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

  it('does not show hero image when photos are tagged but none is hero', async () => {
    global.fetch = makeFetchMock({
      cook_log: [{
        date: '2026-01-01',
        photos: [
          { src: '/img/a-800w.webp', thumb: '/img/a-400w.webp', alt: 'A', tag: 'process' }
        ]
      }]
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.find('.timeline-hero').exists()).toBe(false)
  })

  it('shows baked recipes by default and hides unbaked', async () => {
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

    // Only baked recipe visible by default
    const items = wrapper.findAll('.timeline-item')
    expect(items.length).toBe(1)
    expect(items[0].text()).toContain('Beta Recipe')

    // Reveal toggle shows unbaked count
    expect(wrapper.text()).toContain('+ 1 more recipe')

    // Click reveal to show unbaked
    await wrapper.find('.timeline-reveal-link').trigger('click')
    const allItems = wrapper.findAll('.timeline-item')
    expect(allItems.length).toBe(2)
    expect(wrapper.text()).toContain('Alpha Recipe')
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

    // Unbaked recipes are hidden by default — reveal them first
    await wrapper.find('.timeline-reveal-link').trigger('click')

    const badges = wrapper.findAll('.timeline-bake-count')
    expect(badges.length).toBe(0)
  })

  it('shows loading state before meta is fetched', () => {
    // Mock recipeList as empty to prevent immediate loading
    mockRecipeList.value = []
    const wrapper = mount(RecipeIndex)

    expect(wrapper.find('.timeline-loading').exists()).toBe(true)
  })

  it('shows provenance icon for synthesized (original) recipes', async () => {
    mockRecipeList.value = [
      { id: 'coco-curry', name: 'Coco Curry', file: 'coco-curry.json' }
    ]
    global.fetch = makeFetchMockByFile({
      'coco-curry.json': {
        meta: {
          description: 'A curry recipe',
          source: { type: 'original', author: 'proofed. research (9 agents, 60+ sources)' }
        },
        cook_log: [{ date: '2026-01-01', photos: [] }]
      }
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const icon = wrapper.find('.timeline-provenance-icon')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-tooltip')).toBe('AI-synthesized: proofed. research (9 agents, 60+ sources)')
    expect(icon.find('svg').exists()).toBe(true)
  })

  it('does not show provenance icon for adapted recipes', async () => {
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' }
    ]
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        meta: {
          description: 'Cinnamon buns',
          source: { type: 'adapted', author: "America's Test Kitchen" }
        },
        cook_log: [{ date: '2026-01-01', photos: [] }]
      }
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const icon = wrapper.find('.timeline-provenance-icon')
    expect(icon.exists()).toBe(false)
  })

  it('does not show provenance icon when source is missing', async () => {
    global.fetch = makeFetchMock({ meta: { description: 'No source' } })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const icons = wrapper.findAll('.timeline-provenance-icon')
    expect(icons.length).toBe(0)
  })

  it('provenance icon click does not trigger recipe selection', async () => {
    mockRecipeList.value = [
      { id: 'coco-curry', name: 'Coco Curry', file: 'coco-curry.json' }
    ]
    global.fetch = makeFetchMockByFile({
      'coco-curry.json': {
        meta: {
          description: 'A curry recipe',
          source: { type: 'original', author: 'proofed. research' }
        },
        cook_log: [{ date: '2026-01-01', photos: [] }]
      }
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const icon = wrapper.find('.timeline-provenance-icon')
    await icon.trigger('click')

    // The @click.stop should prevent the parent click handler from firing
    expect(wrapper.emitted('select')).toBeFalsy()
  })

  it('shows in-progress section for recipes with active scratchpad', async () => {
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Active Bake', file: 'active.json' },
      { id: 'recipe-b', name: 'Regular Bake', file: 'regular.json' }
    ]

    localStore['scratchpad-recipe-a'] = JSON.stringify({
      entries: { 'step-1': [{ stepId: 'step-1', timestamp: '2026-01-01', type: 'note', value: 'test' }] },
      generalNotes: []
    })

    global.fetch = makeFetchMock()

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // Should have an in-progress section label
    const labels = wrapper.findAll('.timeline-section-label')
    const inProgressLabel = labels.find(l => l.text() === 'in progress')
    expect(inProgressLabel).toBeTruthy()

    // Should show in-progress badge
    expect(wrapper.find('.timeline-in-progress-badge').exists()).toBe(true)

    // Should have pulsing dot
    expect(wrapper.find('.timeline-dot--in-progress').exists()).toBe(true)
  })

  it('in-progress items do not duplicate in baked section', async () => {
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Active Bake', file: 'active.json' }
    ]

    localStore['scratchpad-recipe-a'] = JSON.stringify({
      entries: { 'step-1': [{ stepId: 'step-1', timestamp: '2026-01-01', type: 'note', value: 'test' }] },
      generalNotes: []
    })

    global.fetch = makeFetchMock()

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // Only one timeline-item should exist (in the in-progress section)
    const items = wrapper.findAll('.timeline-item')
    expect(items.length).toBe(1)
    expect(items[0].classes()).toContain('timeline-item--in-progress')
  })

  it('no reveal toggle when all recipes are baked', async () => {
    global.fetch = makeFetchMock()

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.find('.timeline-reveal-link').exists()).toBe(false)
  })

  it('unbaked items have dimmed styling class', async () => {
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Unbaked Recipe', file: 'unbaked.json' }
    ]
    global.fetch = makeFetchMock({ cook_log: [] })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // Click reveal
    await wrapper.find('.timeline-reveal-link').trigger('click')

    const item = wrapper.find('.timeline-item--unbaked')
    expect(item.exists()).toBe(true)

    const dot = wrapper.find('.timeline-dot--unbaked')
    expect(dot.exists()).toBe(true)
  })

  it('reveal toggle hides unbaked on second click', async () => {
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Baked Recipe', file: 'baked.json' },
      { id: 'recipe-b', name: 'Unbaked Recipe', file: 'unbaked.json' }
    ]
    global.fetch = makeFetchMockByFile({
      'baked.json': { meta: { description: 'desc' }, cook_log: [{ date: '2026-01-01', photos: [] }] },
      'unbaked.json': { meta: { description: 'desc' }, cook_log: [] }
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const revealLink = wrapper.find('.timeline-reveal-link')

    // Show unbaked
    await revealLink.trigger('click')
    expect(wrapper.text()).toContain('Unbaked Recipe')
    expect(wrapper.text()).toContain('- hide unbaked recipes')

    // Hide again
    await wrapper.find('.timeline-reveal-link').trigger('click')
    expect(wrapper.text()).not.toContain('Unbaked Recipe')
    expect(wrapper.text()).toContain('+ 1 more recipe')
  })

  it('in-progress with only generalNotes is detected', async () => {
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Notes Bake', file: 'notes.json' }
    ]

    localStore['scratchpad-recipe-a'] = JSON.stringify({
      entries: {},
      generalNotes: [{ stepId: '_general', timestamp: '2026-01-01', type: 'note', value: 'general note' }]
    })

    global.fetch = makeFetchMock()

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.find('.timeline-item--in-progress').exists()).toBe(true)
  })

  it('empty scratchpad does not trigger in-progress', async () => {
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Empty Pad', file: 'empty.json' }
    ]

    localStore['scratchpad-recipe-a'] = JSON.stringify({
      entries: {},
      generalNotes: []
    })

    global.fetch = makeFetchMock()

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    expect(wrapper.find('.timeline-item--in-progress').exists()).toBe(false)
  })

  it('handles invalid JSON in localStorage gracefully', async () => {
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Bad Storage', file: 'bad.json' }
    ]

    localStore['scratchpad-recipe-a'] = 'not valid json {{'

    global.fetch = makeFetchMock()

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // Should not crash — recipe treated as not in-progress
    expect(wrapper.find('.timeline-item--in-progress').exists()).toBe(false)
  })

  it('in-progress items emit select when clicked', async () => {
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Active Bake', file: 'active.json' }
    ]

    localStore['scratchpad-recipe-a'] = JSON.stringify({
      entries: { 'step-1': [{ stepId: 'step-1', timestamp: '2026-01-01', type: 'note', value: 'test' }] },
      generalNotes: []
    })

    global.fetch = makeFetchMock()

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const inProgressItem = wrapper.find('.timeline-item--in-progress')
    await inProgressItem.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['recipe-a'])
  })

  it('in-progress section shows hero and description when available', async () => {
    mockRecipeList.value = [
      { id: 'recipe-a', name: 'Active Bake', file: 'active.json' }
    ]

    localStore['scratchpad-recipe-a'] = JSON.stringify({
      entries: { 'step-1': [{ stepId: 'step-1', timestamp: '2026-01-01', type: 'note', value: 'test' }] },
      generalNotes: []
    })

    global.fetch = makeFetchMock({
      cook_log: [{
        date: '2026-01-01',
        photos: [{ src: '/img/hero-800w.webp', thumb: '/img/hero-400w.webp', alt: 'Hero' }]
      }]
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const inProgressItem = wrapper.find('.timeline-item--in-progress')
    expect(inProgressItem.find('.timeline-hero').exists()).toBe(true)
    expect(inProgressItem.find('.timeline-summary').exists()).toBe(true)
  })

  it('multiple in-progress items sorted alphabetically', async () => {
    mockRecipeList.value = [
      { id: 'recipe-z', name: 'Zucchini Bread', file: 'z.json' },
      { id: 'recipe-a', name: 'Apple Pie', file: 'a.json' }
    ]

    localStore['scratchpad-recipe-z'] = JSON.stringify({
      entries: { 'step-1': [{ stepId: 'step-1', timestamp: '2026-01-01', type: 'note', value: 'test' }] },
      generalNotes: []
    })
    localStore['scratchpad-recipe-a'] = JSON.stringify({
      entries: { 'step-1': [{ stepId: 'step-1', timestamp: '2026-01-01', type: 'note', value: 'test' }] },
      generalNotes: []
    })

    global.fetch = makeFetchMock()

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const inProgressItems = wrapper.findAll('.timeline-item--in-progress')
    expect(inProgressItems.length).toBe(2)
    expect(inProgressItems[0].text()).toContain('Apple Pie')
    expect(inProgressItems[1].text()).toContain('Zucchini Bread')
  })

  it('unbaked provenance icon shows in revealed section', async () => {
    mockRecipeList.value = [
      { id: 'coco-curry', name: 'Coco Curry', file: 'coco-curry.json' }
    ]
    global.fetch = makeFetchMockByFile({
      'coco-curry.json': {
        meta: {
          description: 'A curry recipe',
          source: { type: 'original', author: 'proofed. research' }
        },
        cook_log: []
      }
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    // Reveal unbaked
    await wrapper.find('.timeline-reveal-link').trigger('click')

    const icon = wrapper.find('.timeline-provenance-icon')
    expect(icon.exists()).toBe(true)
  })

  it('hides empty categories in baked section', async () => {
    // All in "baking" category, none in other categories
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Buns', file: 'atk.json' }
    ]
    global.fetch = makeFetchMock()

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const labels = wrapper.findAll('.timeline-section-label')
    // Should only have "baking" label, not other empty categories
    expect(labels.length).toBe(1)
    expect(labels[0].text()).toBe('baking')
  })

  it('renders outdated baked recipes in dedicated outdated group', async () => {
    mockRecipeList.value = [
      { id: 'recipe-fresh', name: 'Fresh Recipe', file: 'fresh.json' },
      { id: 'recipe-old', name: 'Old Recipe', file: 'old.json' }
    ]
    global.fetch = makeFetchMockByFile({
      'fresh.json': { meta: { description: 'fresh' }, cook_log: [{ date: '2026-01-01', photos: [] }] },
      'old.json': { meta: { description: 'old', outdated: { reason: 'Replaced.' } }, cook_log: [{ date: '2026-01-01', photos: [] }] }
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const labels = wrapper.findAll('.timeline-section-label').map(l => l.text())
    expect(labels).toContain('outdated')

    const outdatedItems = wrapper.findAll('.timeline-item--outdated')
    expect(outdatedItems.length).toBe(1)
    expect(outdatedItems[0].text()).toContain('Old Recipe')
  })

  it('emits select for outdated item click', async () => {
    mockRecipeList.value = [
      { id: 'recipe-old', name: 'Old Recipe', file: 'old.json' }
    ]
    global.fetch = makeFetchMockByFile({
      'old.json': { meta: { description: 'old', outdated: { reason: 'Replaced.' } }, cook_log: [{ date: '2026-01-01', photos: [] }] }
    })

    const wrapper = mount(RecipeIndex)
    await flushPromises()

    const outdated = wrapper.find('.timeline-item--outdated')
    await outdated.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['recipe-old'])
  })
})
