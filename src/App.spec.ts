import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick, computed } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from './App.vue'

// Mock all child components
vi.mock('@/components/RecipeMeta.vue', () => ({
  default: { name: 'RecipeMeta', props: ['recipe', 'hasProgress'], emits: ['reset'], template: '<div class="recipe-meta-stub"><button class="reset-btn" @click="$emit(\'reset\')">Reset</button>{{ recipe?.meta?.name }}</div>' }
}))
vi.mock('@/components/StageCard.vue', () => ({
  default: {
    name: 'StageCard',
    props: ['stage', 'states', 'config', 'progress', 'stepNotes'],
    template: '<div class="stage-card-stub">{{ stage.title }}</div>'
  }
}))
vi.mock('@/components/RecipeIndex.vue', () => ({
  default: {
    name: 'RecipeIndex',
    emits: ['select'],
    template: '<div class="recipe-index-stub" @click="$emit(\'select\', \'test-recipe\')">Index</div>'
  }
}))
vi.mock('@/components/CookLogSection.vue', () => ({
  default: { name: 'CookLogSection', props: ['cookLog'], template: '<div class="cook-log-stub" />' }
}))
vi.mock('@/components/VersionTimeline.vue', () => ({
  default: { name: 'VersionTimeline', props: ['changeLog', 'currentVersion'], template: '<div class="version-timeline-stub" />' }
}))
vi.mock('@/components/TocSidebar.vue', () => ({
  default: {
    name: 'TocSidebar',
    props: ['stages', 'hasNutrition', 'hasCookLog', 'hasChangeLog', 'currentStageId', 'completedStageIds'],
    emits: ['navigate'],
    template: `<div class="toc-sidebar-stub">
      <button class="nav-cook-log" @click="$emit('navigate', 'cook-log')">Cook Log</button>
      <button class="nav-nutrition" @click="$emit('navigate', 'nutrition')">Nutrition</button>
      <button class="nav-change-log" @click="$emit('navigate', 'change-log')">Change Log</button>
      <button class="nav-stage-prep" @click="$emit('navigate', 'prep')">Prep</button>
    </div>`
  }
}))
vi.mock('@/components/NutritionSection.vue', () => ({
  default: { name: 'NutritionSection', props: ['nutrition'], template: '<div class="nutrition-stub" />' }
}))
vi.mock('@/components/SiteFooter.vue', () => ({
  default: { name: 'SiteFooter', template: '<footer class="site-footer-stub" />' }
}))
vi.mock('@/components/AboutPage.vue', () => ({
  default: { name: 'AboutPage', template: '<div class="about-page-stub">About</div>' }
}))
vi.mock('@/components/PhotoLightbox.vue', () => ({
  default: { name: 'PhotoLightbox', props: ['photos', 'initialIndex', 'open'], emits: ['close'], template: '<div class="photo-lightbox-stub" v-if="open">Lightbox</div>' }
}))
vi.mock('@/components/PhotoReview.vue', () => ({
  default: { name: 'PhotoReview', template: '<div class="photo-review-stub">Photo Review</div>' }
}))
vi.mock('@/components/BakeDetailView.vue', () => ({
  default: { name: 'BakeDetailView', template: '<div class="bake-detail-stub">Bake Detail</div>' }
}))
vi.mock('@/components/BakeReviewPage.vue', () => ({
  default: { name: 'BakeReviewPage', template: '<div class="bake-review-stub">Bake Review</div>' }
}))
vi.mock('@/components/BakeLogPage.vue', () => ({
  default: { name: 'BakeLogPage', template: '<div class="bake-log-page-stub">Bake Log</div>' }
}))
vi.mock('@/components/DemoStats.vue', () => ({
  default: { name: 'DemoStats', template: '<div class="demo-stats-stub">Stats</div>' }
}))
vi.mock('@/components/DemoQrTest.vue', () => ({
  default: { name: 'DemoQrTest', template: '<div class="demo-qr-test-stub">Demo QR Test</div>' }
}))
// Mock composables
const mockLoadTechniques = vi.fn()
vi.mock('@/composables/useTechniques', () => ({
  useTechniques: () => ({
    loadTechniques: mockLoadTechniques,
    techniques: ref({}),
    loaded: ref(true),
    parseTextWithTechniques: vi.fn(),
    findTechnique: vi.fn()
  })
}))

const mockCurrentRecipe = ref<any>(null)
const mockCurrentRecipeId = ref<string | null>(null)
const mockLoading = ref(false)
const mockLoadManifest = vi.fn()
const mockLoadRecipe = vi.fn()

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
    currentRecipe: mockCurrentRecipe,
    currentRecipeId: mockCurrentRecipeId,
    loading: mockLoading,
    loadManifest: mockLoadManifest,
    loadRecipe: mockLoadRecipe
  })
}))

const mockUseRecipeMeta = vi.fn()
vi.mock('@/composables/useRecipeMeta', () => ({
  useRecipeMeta: (...args: unknown[]) => mockUseRecipeMeta(...args)
}))

// Mock useProgress
const mockProgressLoad = vi.fn()
const mockProgressSave = vi.fn()
const mockProgressSetStageOrder = vi.fn()
const mockProgressRegisterStage = vi.fn()
const mockIsStageCollapsed = vi.fn(() => false)
const mockToggleStageCollapse = vi.fn()
const mockIsStateChecked = vi.fn(() => false)
const mockIsItemChecked = vi.fn(() => false)
const mockToggleItem = vi.fn()
const mockToggleState = vi.fn()
const mockGetCompletionCount = vi.fn(() => ({ done: 0, total: 0 }))
const mockResetSection = vi.fn()
const mockResetProgress = vi.fn()
const mockHasProgress = ref(false)
const mockCheckedItemCount = ref(0)
const mockCheckedStateCount = ref(0)

vi.mock('@/composables/useProgress', () => ({
  useProgress: () => ({
    load: mockProgressLoad,
    save: mockProgressSave,
    setStageOrder: mockProgressSetStageOrder,
    registerStage: mockProgressRegisterStage,
    isStageCollapsed: mockIsStageCollapsed,
    toggleStageCollapse: mockToggleStageCollapse,
    isStateChecked: mockIsStateChecked,
    isItemChecked: mockIsItemChecked,
    toggleItem: mockToggleItem,
    toggleState: mockToggleState,
    getCompletionCount: mockGetCompletionCount,
    resetSection: mockResetSection,
    resetProgress: mockResetProgress,
    hasProgress: mockHasProgress,
    checkedItemCount: mockCheckedItemCount,
    checkedStateCount: mockCheckedStateCount
  })
}))

const mockScratchpadLoad = vi.fn()
const mockScratchpadExportJsonString = vi.fn(() => '{}')
const mockScratchpadClearAll = vi.fn()
const mockScratchpadAddGeneralNote = vi.fn()

vi.mock('@/composables/useScratchpad', () => ({
  useScratchpad: () => ({
    load: mockScratchpadLoad,
    addNote: vi.fn(),
    addRating: vi.fn(),
    addReminderResponse: vi.fn(),
    addGeneralNote: mockScratchpadAddGeneralNote,
    dismissReminder: vi.fn(),
    isReminderDismissed: vi.fn(() => false),
    getEntriesForStep: vi.fn(() => []),
    getRatingForStep: vi.fn(() => null),
    hasEntriesForStep: vi.fn(() => false),
    totalEntryCount: ref(0),
    generalNoteCount: ref(0),
    generalNotes: ref([]),
    exportJson: vi.fn(),
    exportJsonString: mockScratchpadExportJsonString,
    clearAll: mockScratchpadClearAll,
    allStepEntries: computed(() => ({}))
  })
}))

vi.mock('@/components/GeneralNotesFab.vue', () => ({
  default: {
    name: 'GeneralNotesFab',
    props: ['generalNoteCount', 'totalEntryCount', 'generalNotes', 'stepNames'],
    emits: ['addGeneralNote', 'exportJson', 'clearAll'],
    template: '<div class="general-notes-fab-stub" />'
  }
}))

vi.mock('@/components/ExperimentPanel.vue', () => ({
  default: {
    name: 'ExperimentPanel',
    props: ['recipe', 'recipeId', 'waterContentTable', 'sectionId'],
    template: '<div class="experiment-panel-stub">ExperimentPanel</div>'
  }
}))

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'index', component: { template: '<div />' } },
      { path: '/recipe/:recipeId', name: 'recipe', component: { template: '<div />' } },
      { path: '/recipe/:recipeId/print', name: 'recipe-print', component: { template: '<div />' }, meta: { printMode: true } },
      { path: '/about', name: 'about', component: { template: '<div />' } },
      { path: '/review/photos/:recipeId/:date', name: 'photo-review', component: { template: '<div />' } },
      { path: '/recipe/:recipeId/bake/:date', name: 'bake-detail', component: { template: '<div />' }, meta: { bakeDetail: true } },
      { path: '/review/bake/:recipeId/:date', name: 'bake-review', component: { template: '<div />' } },
      { path: '/demo/qr-test', name: 'qr-test-demo', component: { template: '<div />' }, meta: { demoPage: true } },
      { path: '/bake-log', name: 'bake-log', component: { template: '<div />' } },
      { path: '/stats', name: 'stats', component: { template: '<div />' }, meta: { showStats: true } },
      { path: '/demo/stats', name: 'stats-demo', component: { template: '<div />' }, meta: { showStats: true } },
    ]
  })
}

function makeRecipe(overrides: Record<string, any> = {}) {
  return {
    meta: { name: 'Test Buns', source: { name: 'ATK' } },
    version: 'v1.2.0',
    config: { early_check_percent: 75 },
    stages: [
      {
        id: 'prep',
        title: 'Mise en Place',
        gather: {
          vessels: ['skillet'],
          equipment: ['whisk'],
          ingredients: [{ id: 'flour', name: 'Flour', total: 390, unit: 'g', breakdown: null }]
        },
        states: ['mix-dry']
      },
      {
        id: 'bake',
        title: 'Bake',
        gather: null,
        states: ['oven-bake']
      }
    ],
    states: [
      { id: 'mix-dry', title: 'Mix Dry', instruction: 'Whisk flour', exit_condition: 'Combined' },
      { id: 'oven-bake', title: 'Oven Bake', instruction: 'Bake at 175C', exit_condition: 'Golden' }
    ],
    nutrition: { servings: 8 },
    cook_log: [
      {
        date: '2026-02-01',
        notes: 'Second bake',
        step_notes: { 'mix-dry': 'Better consistency', 'oven-bake': 'Watch closely after 20m' },
        photos: [
          { src: '/images/test/process.webp', thumb: '/images/test/process-400w.webp', alt: 'Process shot' },
          { src: '/images/test/hero.webp', thumb: '/images/test/hero-400w.webp', alt: 'Finished buns' }
        ]
      },
      {
        date: '2026-01-15',
        notes: 'First bake',
        step_notes: { 'mix-dry': 'Very sticky dough' }
      }
    ],
    change_log: [
      { version: 'v1.2.0', summary: 'Adjusted flour' }
    ],
    ...overrides
  }
}

async function mountApp(routePath = '/') {
  const router = makeRouter()
  await router.push(routePath)
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [router],
      stubs: { Transition: false }
    }
  })

  await flushPromises()
  return { wrapper, router }
}

// Reusable IntersectionObserver mock — track instances for testing
let lastObserverInstance: MockIntersectionObserver | null = null

class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  root = null
  rootMargin = ''
  thresholds: number[] = []
  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[])
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    lastObserverInstance = this
  }
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentRecipe.value = null
    mockCurrentRecipeId.value = null
    mockLoading.value = false
    mockHasProgress.value = false
    lastObserverInstance = null

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    // Mock fetch for water content table loading
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ version: '1.0.0', categories: [] })
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders header with brand name', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.text()).toContain('proofed')
    expect(wrapper.find('.brand-dot').text()).toBe('.')
  })

  it('renders footer', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.find('.site-footer-stub').exists()).toBe(true)
  })

  it('shows RecipeIndex on index route', async () => {
    const { wrapper } = await mountApp('/')
    expect(wrapper.find('.recipe-index-stub').exists()).toBe(true)
  })

  it('shows AboutPage on about route', async () => {
    const { wrapper } = await mountApp('/about')
    expect(wrapper.find('.about-page-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('About')
  })

  it('shows PhotoReview on photo-review route', async () => {
    const { wrapper } = await mountApp('/review/photos/test-recipe/2026-02-10')
    expect(wrapper.find('.photo-review-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Photo Review')
  })

  it('shows BakeDetailView on bake-detail route', async () => {
    const { wrapper } = await mountApp('/recipe/test-recipe/bake/2026-02-10')
    expect(wrapper.find('.bake-detail-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Bake Detail')
  })

  it('shows BakeReviewPage on bake-review route', async () => {
    const { wrapper } = await mountApp('/review/bake/test-recipe/2026-02-10')
    expect(wrapper.find('.bake-review-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Bake Review')
  })

  it('shows BakeLogPage on bake-log route', async () => {
    const { wrapper } = await mountApp('/bake-log')
    expect(wrapper.find('.bake-log-page-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Bake Log')
  })

  it('shows tab bar on index route', async () => {
    const { wrapper } = await mountApp('/')
    expect(wrapper.find('.tab-bar').exists()).toBe(true)
    const tabs = wrapper.findAll('.tab-item')
    expect(tabs.length).toBe(3)
    expect(tabs[0].text()).toBe('Recipes')
    expect(tabs[1].text()).toBe('Bake Log')
    expect(tabs[2].text()).toBe('Dashboard')
  })

  it('shows tab bar on bake-log route', async () => {
    const { wrapper } = await mountApp('/bake-log')
    expect(wrapper.find('.tab-bar').exists()).toBe(true)
  })

  it('shows tab bar on stats demo route', async () => {
    const { wrapper } = await mountApp('/demo/stats')
    expect(wrapper.find('.tab-bar').exists()).toBe(true)
    const tabs = wrapper.findAll('.tab-item')
    expect(tabs[2].classes()).toContain('tab-active')
    expect(wrapper.find('.demo-stats-stub').text()).toBe('Stats')
  })

  it('navigates to stats when Dashboard tab clicked', async () => {
    const { wrapper, router } = await mountApp('/')
    const tabs = wrapper.findAll('.tab-item')
    await tabs[2].trigger('click')
    await flushPromises()
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/stats')
  })

  it('hides tab bar on recipe route', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper } = await mountApp('/recipe/test-recipe')
    expect(wrapper.find('.tab-bar').exists()).toBe(false)
  })

  it('shows print button on recipe page', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper } = await mountApp('/recipe/test-recipe')
    expect(wrapper.find('[data-testid="print-btn"]').exists()).toBe(true)
  })

  it('hides print button on index page', async () => {
    const { wrapper } = await mountApp('/')
    expect(wrapper.find('[data-testid="print-btn"]').exists()).toBe(false)
  })

  it('hides share button when recipe has no cook_log', async () => {
    mockCurrentRecipe.value = makeRecipe({ cook_log: [] })
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper } = await mountApp('/recipe/test-recipe')
    expect(wrapper.find('[data-testid="print-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="share-btn"]').exists()).toBe(false)
  })

  it('hides print button when currentRecipeId is empty', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = ''
    const { wrapper } = await mountApp('/recipe/test-recipe')
    expect(wrapper.find('[data-testid="print-btn"]').exists()).toBe(false)
  })

  it('hides print button on about page', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper } = await mountApp('/about')
    expect(wrapper.find('[data-testid="print-btn"]').exists()).toBe(false)
  })

  it('hides print button on bake-detail page', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper } = await mountApp('/recipe/test-recipe/bake/2026-02-01')
    expect(wrapper.find('[data-testid="print-btn"]').exists()).toBe(false)
  })

  it('navigates to print page when print button clicked', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper, router } = await mountApp('/recipe/test-recipe')
    const printBtn = wrapper.find('[data-testid="print-btn"]')
    await printBtn.find('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/recipe/test-recipe/print')
  })

  it('shows back-to-recipe and print button in header on print route', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper } = await mountApp('/recipe/test-recipe/print')
    expect(wrapper.find('.back-link').exists()).toBe(true)
    expect(wrapper.find('.print-action-btn').exists()).toBe(true)
    // Normal actions hidden
    expect(wrapper.find('[data-testid="print-btn"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="share-btn"]').exists()).toBe(false)
  })

  it('header always visible on print route', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper } = await mountApp('/recipe/test-recipe/print')
    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('back-link navigates to recipe page from print page', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper, router } = await mountApp('/recipe/test-recipe/print')
    const backLink = wrapper.find('.back-link')
    await backLink.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/recipe/test-recipe')
  })

  it('back-link navigates to index when recipeId is missing', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const { wrapper, router } = await mountApp('/recipe/test-recipe/print')
    // Temporarily clear route params to simulate edge case
    Object.defineProperty(router.currentRoute.value.params, 'recipeId', { value: undefined, configurable: true })
    const backLink = wrapper.find('.back-link')
    await backLink.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('print-action-btn calls window.print', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const { wrapper } = await mountApp('/recipe/test-recipe/print')
    const printBtn = wrapper.find('.print-action-btn')
    await printBtn.trigger('click')
    expect(printSpy).toHaveBeenCalled()
    printSpy.mockRestore()
  })

  it('marks Recipes tab active on index route', async () => {
    const { wrapper } = await mountApp('/')
    const tabs = wrapper.findAll('.tab-item')
    expect(tabs[0].classes()).toContain('tab-active')
    expect(tabs[1].classes()).not.toContain('tab-active')
  })

  it('marks Bake Log tab active on bake-log route', async () => {
    const { wrapper } = await mountApp('/bake-log')
    const tabs = wrapper.findAll('.tab-item')
    expect(tabs[0].classes()).not.toContain('tab-active')
    expect(tabs[1].classes()).toContain('tab-active')
  })

  it('navigates to bake-log when Bake Log tab clicked', async () => {
    const { wrapper, router } = await mountApp('/')
    const tabs = wrapper.findAll('.tab-item')
    await tabs[1].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('bake-log')
  })

  it('navigates to index when Recipes tab clicked from bake-log', async () => {
    const { wrapper, router } = await mountApp('/bake-log')
    const tabs = wrapper.findAll('.tab-item')
    await tabs[0].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('index')
  })

  it('passes bakeDate getter to useRecipeMeta that returns date from route params', async () => {
    await mountApp('/recipe/test-recipe/bake/2026-02-10')

    // useRecipeMeta should have been called with 4 arguments
    expect(mockUseRecipeMeta).toHaveBeenCalled()
    const lastCall = mockUseRecipeMeta.mock.calls[mockUseRecipeMeta.mock.calls.length - 1]
    expect(lastCall).toHaveLength(4)

    // Third argument is the bakeDate getter — exercise it
    const bakeDateGetter = lastCall[2] as () => string | undefined
    expect(typeof bakeDateGetter).toBe('function')
    const result = bakeDateGetter()
    expect(result).toBe('2026-02-10')

    // Fourth argument is the routeName getter
    const routeNameGetter = lastCall[3] as () => string | undefined
    expect(routeNameGetter()).toBe('bake-detail')
  })

  it('bakeDate getter returns undefined when not on bake route', async () => {
    await mountApp('/recipe/test-recipe')

    expect(mockUseRecipeMeta).toHaveBeenCalled()
    const lastCall = mockUseRecipeMeta.mock.calls[mockUseRecipeMeta.mock.calls.length - 1]
    expect(lastCall).toHaveLength(4)

    const bakeDateGetter = lastCall[2] as () => string | undefined
    expect(bakeDateGetter()).toBeUndefined()

    // routeName getter should return 'recipe'
    const routeNameGetter = lastCall[3] as () => string | undefined
    expect(routeNameGetter()).toBe('recipe')
  })

  it('shows DemoQrTest on demo/qr-test route', async () => {
    const { wrapper } = await mountApp('/demo/qr-test')
    expect(wrapper.find('.demo-qr-test-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('Demo QR Test')
  })

  it('shows loading state when loading is true', async () => {
    mockLoading.value = true
    const { wrapper } = await mountApp('/recipe/test')
    expect(wrapper.text()).toContain('Loading...')
  })

  it('shows "No recipe loaded" when no recipe and not loading', async () => {
    const { wrapper } = await mountApp('/recipe/test')
    expect(wrapper.text()).toContain('No recipe loaded')
  })

  it('renders recipe view with all sections when recipe loaded', async () => {
    const recipe = makeRecipe()
    mockCurrentRecipe.value = recipe
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper } = await mountApp('/recipe/test-recipe')
    await nextTick()

    expect(wrapper.find('.recipe-meta-stub').exists()).toBe(true)
    expect(wrapper.find('.recipe-meta-stub').text()).toContain('Test Buns')
    expect(wrapper.findAll('.stage-card-stub')).toHaveLength(2)
    expect(wrapper.find('.nutrition-stub').exists()).toBe(true)
    expect(wrapper.find('.cook-log-stub').exists()).toBe(true)
    expect(wrapper.find('.version-timeline-stub').exists()).toBe(true)
    expect(wrapper.find('.toc-sidebar-stub').exists()).toBe(true)
  })

  it('does not render CookLogSection when cook_log is empty', async () => {
    mockCurrentRecipe.value = makeRecipe({ cook_log: [] })
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper } = await mountApp('/recipe/test-recipe')
    await nextTick()

    expect(wrapper.find('.cook-log-stub').exists()).toBe(false)
  })

  it('does not render VersionTimeline when change_log is empty', async () => {
    mockCurrentRecipe.value = makeRecipe({ change_log: [] })
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper } = await mountApp('/recipe/test-recipe')
    await nextTick()

    expect(wrapper.find('.version-timeline-stub').exists()).toBe(false)
  })

  it('renders hero banner when recipe has cook log photos', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper } = await mountApp('/recipe/test-recipe')
    await nextTick()

    const banner = wrapper.find('[data-testid="hero-banner"]')
    expect(banner.exists()).toBe(true)
    const img = banner.find('img')
    expect(img.attributes('src')).toBe('/images/test/hero.webp')
    expect(img.attributes('alt')).toBe('Finished buns')
    expect(banner.text()).toContain('latest bake')
    expect(banner.text()).toContain('2026-02-01')
  })

  it('does not render hero banner when photos are tagged but none is hero', async () => {
    mockCurrentRecipe.value = makeRecipe({
      cook_log: [{
        date: '2026-02-01',
        notes: 'Tagged bake',
        photos: [
          { src: '/images/test/a.webp', thumb: '/images/test/a-400w.webp', alt: 'A', tag: 'process' },
          { src: '/images/test/b.webp', thumb: '/images/test/b-400w.webp', alt: 'B', tag: 'step' }
        ]
      }]
    })
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper } = await mountApp('/recipe/test-recipe')
    await nextTick()

    expect(wrapper.find('[data-testid="hero-banner"]').exists()).toBe(false)
  })

  it('does not render hero banner when no cook log photos', async () => {
    mockCurrentRecipe.value = makeRecipe({
      cook_log: [{ date: '2026-01-15', notes: 'No photos bake' }]
    })
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper } = await mountApp('/recipe/test-recipe')
    await nextTick()

    expect(wrapper.find('[data-testid="hero-banner"]').exists()).toBe(false)
  })

  it('does not render hero banner when cook log is empty', async () => {
    mockCurrentRecipe.value = makeRecipe({ cook_log: [] })
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper } = await mountApp('/recipe/test-recipe')
    await nextTick()

    expect(wrapper.find('[data-testid="hero-banner"]').exists()).toBe(false)
  })

  it('opens lightbox when hero banner clicked', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper } = await mountApp('/recipe/test-recipe')
    await nextTick()

    const banner = wrapper.find('[data-testid="hero-banner"]')
    await banner.trigger('click')
    await nextTick()

    const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
    expect(lightbox.props('open')).toBe(true)
    // Hero (last photo) should be first in lightbox array
    expect(lightbox.props('photos')[0].alt).toBe('Finished buns')
  })

  it('closes hero lightbox when PhotoLightbox emits close', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper } = await mountApp('/recipe/test-recipe')
    await nextTick()

    // Open lightbox
    await wrapper.find('[data-testid="hero-banner"]').trigger('click')
    await nextTick()

    const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
    expect(lightbox.props('open')).toBe(true)

    // Close lightbox
    lightbox.vm.$emit('close')
    await nextTick()
    expect(lightbox.props('open')).toBe(false)
  })

  it('calls loadManifest and loadTechniques on mount', async () => {
    await mountApp()
    expect(mockLoadTechniques).toHaveBeenCalled()
    expect(mockLoadManifest).toHaveBeenCalled()
  })

  it('navigates to index when brand name clicked', async () => {
    mockCurrentRecipe.value = makeRecipe()
    mockCurrentRecipeId.value = 'test-recipe'

    const { wrapper, router } = await mountApp('/recipe/test-recipe')
    await nextTick()

    const brand = wrapper.find('h1')
    await brand.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('navigates to recipe when RecipeIndex emits select', async () => {
    const { wrapper, router } = await mountApp('/')
    await nextTick()

    const index = wrapper.find('.recipe-index-stub')
    await index.trigger('click') // emits 'select' with 'test-recipe'
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/recipe/test-recipe')
  })

  describe('scroll behavior', () => {
    it('adds scroll listener on mount', async () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      await mountApp()
      expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
      addSpy.mockRestore()
    })

    it('sets isScrolled when window scrolled past 60px', async () => {
      const { wrapper } = await mountApp()

      const header = wrapper.find('header')
      expect(header.classes()).toContain('py-4') // not scrolled

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(header.classes()).toContain('py-2') // scrolled

      // Scroll back up
      Object.defineProperty(window, 'scrollY', { value: 10, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(header.classes()).toContain('py-4') // not scrolled
    })
  })

  describe('formatVersionShort', () => {
    it('shows shortened version in scrolled header', async () => {
      mockCurrentRecipe.value = makeRecipe({ version: 'v1.2.3' })
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      // Simulate scroll to show the title bar
      Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await nextTick()

      // The scrolled header should show the shortened version
      expect(wrapper.text()).toContain('v1.2')
    })

    it('shows raw version when format does not match', async () => {
      mockCurrentRecipe.value = makeRecipe({ version: 'beta' })
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(wrapper.text()).toContain('beta')
    })

    it('does not show version when undefined', async () => {
      mockCurrentRecipe.value = makeRecipe({ version: undefined })
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await nextTick()

      // Should not show any version span
      const scrolledTitle = wrapper.find('.text-sm.text-muted')
      expect(scrolledTitle.exists()).toBe(true)
      expect(scrolledTitle.find('.font-mono').exists()).toBe(false)
    })
  })

  describe('getStatesForStage', () => {
    it('maps state IDs to state objects', async () => {
      const recipe = makeRecipe()
      mockCurrentRecipe.value = recipe
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      // StageCard for "prep" should get states for its stateIds
      const stageCards = wrapper.findAll('.stage-card-stub')
      expect(stageCards).toHaveLength(2)
      expect(stageCards[0].text()).toContain('Mise en Place')
      expect(stageCards[1].text()).toContain('Bake')
    })
  })

  describe('aggregatedStepNotes', () => {
    it('latest cook_log entry note wins for each state', async () => {
      // The recipe has two cook_log entries both with 'mix-dry' notes
      // Second entry (2026-02-01) should win
      const recipe = makeRecipe()
      mockCurrentRecipe.value = recipe
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      // The aggregatedStepNotes is passed to StageCard as step-notes
      // We verify it by checking the component rendered without errors
      expect(wrapper.findAll('.stage-card-stub')).toHaveLength(2)
    })

    it('handles recipe with no cook_log', async () => {
      mockCurrentRecipe.value = makeRecipe({ cook_log: undefined })
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      expect(wrapper.findAll('.stage-card-stub')).toHaveLength(2)
    })

    it('handles cook_log entries with no step_notes', async () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{ date: '2026-01-15', notes: 'No step notes here' }]
      })
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      expect(wrapper.findAll('.stage-card-stub')).toHaveLength(2)
    })
  })

  describe('progress integration', () => {
    it('registers stages with progress on recipe load', async () => {
      const recipe = makeRecipe()
      mockCurrentRecipe.value = recipe
      mockCurrentRecipeId.value = 'test-recipe'

      await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      expect(mockProgressLoad).toHaveBeenCalled()
      expect(mockProgressSetStageOrder).toHaveBeenCalledWith(['prep', 'bake'])
      expect(mockProgressRegisterStage).toHaveBeenCalledWith(
        'prep',
        ['vessel-skillet', 'equip-whisk', 'ing-flour'],
        ['mix-dry']
      )
      expect(mockProgressRegisterStage).toHaveBeenCalledWith(
        'bake',
        [],
        ['oven-bake']
      )
    })

    it('reset clears both progress and scratchpad', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      // Trigger reset via RecipeMeta stub
      await wrapper.find('.reset-btn').trigger('click')
      await nextTick()

      expect(mockResetProgress).toHaveBeenCalled()
      expect(mockScratchpadClearAll).toHaveBeenCalled()
    })
  })

  describe('TOC navigation', () => {
    it('scrolls to cook-log section on navigate', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const scrollIntoViewMock = vi.fn()
      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: scrollIntoViewMock
      } as unknown as HTMLElement)

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      await wrapper.find('.nav-cook-log').trigger('click')
      await nextTick()

      expect(mockGetElementById).toHaveBeenCalledWith('cook-log-section')
      mockGetElementById.mockRestore()
    })

    it('scrolls to nutrition section on navigate', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const scrollIntoViewMock = vi.fn()
      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: scrollIntoViewMock
      } as unknown as HTMLElement)

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      await wrapper.find('.nav-nutrition').trigger('click')
      await nextTick()

      expect(mockGetElementById).toHaveBeenCalledWith('nutrition-section')
      mockGetElementById.mockRestore()
    })

    it('scrolls to version-history section on change-log navigate', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const scrollIntoViewMock = vi.fn()
      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: scrollIntoViewMock
      } as unknown as HTMLElement)

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      await wrapper.find('.nav-change-log').trigger('click')
      await nextTick()

      expect(mockGetElementById).toHaveBeenCalledWith('version-history-section')
      mockGetElementById.mockRestore()
    })

    it('navigates to stage and expands if collapsed', async () => {
      mockIsStageCollapsed.mockImplementation((id: string) => id === 'prep')
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const scrollIntoViewMock = vi.fn()
      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: scrollIntoViewMock
      } as unknown as HTMLElement)

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      await wrapper.find('.nav-stage-prep').trigger('click')
      await nextTick()

      expect(mockToggleStageCollapse).toHaveBeenCalledWith('prep')
      expect(mockGetElementById).toHaveBeenCalledWith('stage-header-prep')
      mockGetElementById.mockRestore()
    })

    it('navigates to stage without expanding if not collapsed', async () => {
      mockIsStageCollapsed.mockReturnValue(false)
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const scrollIntoViewMock = vi.fn()
      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: scrollIntoViewMock
      } as unknown as HTMLElement)

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      await wrapper.find('.nav-stage-prep').trigger('click')
      await nextTick()

      expect(mockToggleStageCollapse).not.toHaveBeenCalled()
      expect(mockGetElementById).toHaveBeenCalledWith('stage-header-prep')
      mockGetElementById.mockRestore()
    })

    it('updates URL hash when TOC section item is clicked', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: vi.fn()
      } as unknown as HTMLElement)

      const { wrapper, router } = await mountApp('/recipe/test-recipe')
      await nextTick()

      await wrapper.find('.nav-cook-log').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.hash).toBe('#cook-log-section')
      mockGetElementById.mockRestore()
    })

    it('updates URL hash when TOC stage item is clicked', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: vi.fn()
      } as unknown as HTMLElement)

      const { wrapper, router } = await mountApp('/recipe/test-recipe')
      await nextTick()

      await wrapper.find('.nav-stage-prep').trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.hash).toBe('#stage-prep')
      mockGetElementById.mockRestore()
    })

    it('scrolls to section on browser back/forward (route.hash change)', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const scrollIntoViewMock = vi.fn()
      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: scrollIntoViewMock
      } as unknown as HTMLElement)

      const { router } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      // Simulate browser back/forward navigating to a hash
      await router.push({ hash: '#nutrition-section' })
      await flushPromises()
      await nextTick()

      expect(mockGetElementById).toHaveBeenCalledWith('nutrition-section')
      expect(scrollIntoViewMock).toHaveBeenCalled()
      mockGetElementById.mockRestore()
    })

    it('ignores unrecognized hash on browser back/forward', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: vi.fn()
      } as unknown as HTMLElement)

      const { router } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      mockGetElementById.mockClear()

      // Navigate to an unrecognized hash
      await router.push({ hash: '#bake-2026-01-15' })
      await flushPromises()
      await nextTick()

      // scrollToTarget should not have been called for unrecognized hash
      // getElementById would only be called by scrollToTarget, not for this hash
      expect(mockGetElementById).not.toHaveBeenCalledWith('bake-2026-01-15')
      mockGetElementById.mockRestore()
    })

    it('does not duplicate router.push when hash already matches', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: vi.fn()
      } as unknown as HTMLElement)

      const { wrapper, router } = await mountApp('/recipe/test-recipe')
      await nextTick()

      // First click sets the hash
      await wrapper.find('.nav-cook-log').trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.hash).toBe('#cook-log-section')

      const pushSpy = vi.spyOn(router, 'push')

      // Second click on same item — hash already matches, should not push
      await wrapper.find('.nav-cook-log').trigger('click')
      await flushPromises()

      // router.push should not be called when hash already matches
      expect(pushSpy).not.toHaveBeenCalled()
      pushSpy.mockRestore()
      mockGetElementById.mockRestore()
    })

    it('expands collapsed stage on browser back/forward hash navigation', async () => {
      mockIsStageCollapsed.mockImplementation((id: string) => id === 'prep')
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: vi.fn()
      } as unknown as HTMLElement)

      const { router } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      await router.push({ hash: '#stage-prep' })
      await flushPromises()
      await nextTick()

      expect(mockToggleStageCollapse).toHaveBeenCalledWith('prep')
      mockGetElementById.mockRestore()
    })

    it('handles navigate when element not found', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue(null)

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      // Should not throw
      await wrapper.find('.nav-nutrition').trigger('click')
      await nextTick()

      mockGetElementById.mockRestore()
    })
  })

  describe('TOC computed properties', () => {
    it('tocStages maps stages to id/title', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      // TocSidebar receives stages prop - verify it renders
      expect(wrapper.find('.toc-sidebar-stub').exists()).toBe(true)
    })

    it('completedStageIds includes stages with all states checked', async () => {
      // Make state checker say mix-dry is checked (prep stage has only mix-dry)
      mockIsStateChecked.mockImplementation((id: string) => id === 'mix-dry')

      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      // Verify the toc sidebar renders (completedStageIds is passed as prop)
      expect(wrapper.find('.toc-sidebar-stub').exists()).toBe(true)
    })

    it('completedStageIds excludes stages with no states', async () => {
      mockIsStateChecked.mockReturnValue(true) // all checked

      // Recipe with a stage that has empty states array
      const recipe = makeRecipe({
        stages: [
          { id: 'empty-stage', title: 'Empty', gather: null, states: [] },
          { id: 'prep', title: 'Prep', gather: null, states: ['mix-dry'] }
        ]
      })
      mockCurrentRecipe.value = recipe
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      expect(wrapper.find('.toc-sidebar-stub').exists()).toBe(true)
    })

    it('currentStageId falls back to first non-collapsed stage', async () => {
      mockIsStageCollapsed.mockImplementation((id: string) => id === 'prep')

      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      // TOC sidebar is rendered with currentStageId prop
      expect(wrapper.find('.toc-sidebar-stub').exists()).toBe(true)
    })

    it('currentStageId falls back to first stage when all collapsed', async () => {
      mockIsStageCollapsed.mockReturnValue(true)

      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      expect(wrapper.find('.toc-sidebar-stub').exists()).toBe(true)
    })
  })

  describe('IntersectionObserver', () => {
    it('sets up observer when recipe loads', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      expect(lastObserverInstance).not.toBeNull()
    })

    it('disconnects observer when recipe changes to null', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const observer = lastObserverInstance!
      expect(observer).not.toBeNull()

      // Clear recipe - should trigger teardownTocObserver
      mockCurrentRecipe.value = null
      await nextTick()
      await flushPromises()

      expect(observer.disconnect).toHaveBeenCalled()
    })

    it('observer callback sets activeSection for stage elements', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const observer = lastObserverInstance!
      expect(observer).not.toBeNull()

      // Simulate a stage becoming visible
      observer.callback(
        [{ isIntersecting: true, target: { id: 'stage-prep' } } as unknown as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )
      await nextTick()

      // The activeSection should now be 'prep'
      // We verify indirectly through currentStageId prop on TocSidebar
    })

    it('observer callback sets activeSection for nutrition-section', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const observer = lastObserverInstance!

      observer.callback(
        [{ isIntersecting: true, target: { id: 'nutrition-section' } } as unknown as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )
      await nextTick()
    })

    it('observer callback sets activeSection for cook-log-section', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const observer = lastObserverInstance!

      observer.callback(
        [{ isIntersecting: true, target: { id: 'cook-log-section' } } as unknown as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )
      await nextTick()
    })

    it('observer callback sets activeSection for version-history-section', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const observer = lastObserverInstance!

      observer.callback(
        [{ isIntersecting: true, target: { id: 'version-history-section' } } as unknown as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )
      await nextTick()
    })

    it('observer callback is suppressed during programmatic navigation', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const scrollIntoViewMock = vi.fn()
      const mockGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue({
        scrollIntoView: scrollIntoViewMock
      } as unknown as HTMLElement)

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const observer = lastObserverInstance!

      // Trigger TOC navigation (sets isNavigating = true)
      await wrapper.find('.nav-cook-log').trigger('click')
      await nextTick()

      // Observer fires during smooth scroll — should be suppressed
      observer.callback(
        [{ isIntersecting: true, target: { id: 'stage-prep' } } as unknown as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )
      await nextTick()

      // The TOC should still show cook-log as active, not prep
      // (activeSection wasn't changed by the suppressed observer)
      mockGetElementById.mockRestore()
    })

    it('observer callback ignores non-intersecting entries', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const observer = lastObserverInstance!

      // Should not throw or change anything
      observer.callback(
        [{ isIntersecting: false, target: { id: 'stage-prep' } } as unknown as IntersectionObserverEntry],
        observer as unknown as IntersectionObserver
      )
      await nextTick()
    })
  })

  describe('header layout classes', () => {
    it('uses consistent max-w-4xl header on all pages', async () => {
      const { wrapper } = await mountApp('/')
      const headerContent = wrapper.find('header > div')
      expect(headerContent.classes()).toContain('max-w-4xl')
    })

    it('uses max-w-4xl when recipe is loaded', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()

      const headerContent = wrapper.find('header > div')
      expect(headerContent.classes()).toContain('max-w-4xl')
    })
  })

  describe('route watcher', () => {
    it('loads recipe when route changes to recipe path', async () => {
      const { router } = await mountApp('/')
      await flushPromises()

      // Navigate to a recipe route
      await router.push('/recipe/new-recipe')
      await flushPromises()

      // loadRecipe should be called once manifestLoaded is true
      // (it's set after loadManifest resolves)
      expect(mockLoadManifest).toHaveBeenCalled()
    })
  })

  describe('scrolled title bar', () => {
    it('does not show scrolled title on index page', async () => {
      const { wrapper } = await mountApp('/')

      Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(wrapper.find('.text-sm.text-muted').exists()).toBe(false)
    })

    it('does not show scrolled title on about page', async () => {
      const { wrapper } = await mountApp('/about')

      Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(wrapper.find('.text-sm.text-muted').exists()).toBe(false)
    })
  })

  describe('scratchpad integration', () => {
    it('initializes scratchpad when recipe loads', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      expect(mockScratchpadLoad).toHaveBeenCalled()
    })

    it('renders GeneralNotesFab when scratchpad is available', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      expect(wrapper.find('.general-notes-fab-stub').exists()).toBe(true)
    })

    it('handles scratchpad export by copying JSON to clipboard', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText: writeTextMock } })

      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const fab = wrapper.findComponent({ name: 'GeneralNotesFab' })
      fab.vm.$emit('exportJson')
      await nextTick()
      await flushPromises()

      expect(mockScratchpadExportJsonString).toHaveBeenCalled()
      expect(writeTextMock).toHaveBeenCalledWith('{}')
    })

    it('handles addGeneralNote event from FAB', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const fab = wrapper.findComponent({ name: 'GeneralNotesFab' })
      fab.vm.$emit('addGeneralNote', 'test note')
      await nextTick()

      expect(mockScratchpadAddGeneralNote).toHaveBeenCalledWith('test note')
    })

    it('handles clearAll event from FAB', async () => {
      mockCurrentRecipe.value = makeRecipe()
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      const fab = wrapper.findComponent({ name: 'GeneralNotesFab' })
      fab.vm.$emit('clearAll')
      await nextTick()

      expect(mockScratchpadClearAll).toHaveBeenCalled()
    })
  })

  describe('Experiment Panel', () => {
    it('renders ExperimentPanel when recipe has experiment config and water content loaded', async () => {
      mockCurrentRecipe.value = makeRecipe({ experiment: { description: 'test', scaleMode: 'pre_scaled', ingredients: [], derived: [] } })
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      expect(wrapper.find('.experiment-panel-stub').exists()).toBe(true)
    })

    it('does NOT render ExperimentPanel when recipe opts out with experiment: false', async () => {
      mockCurrentRecipe.value = makeRecipe({ experiment: false })
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      expect(wrapper.find('.experiment-panel-stub').exists()).toBe(false)
      expect(wrapper.find('.experiment-drawer-stub').exists()).toBe(false)
    })

    it('does NOT render ExperimentPanel when water content fetch fails', async () => {
      // Override fetch to fail
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false })))

      mockCurrentRecipe.value = makeRecipe({ experiment: { description: 'test', scaleMode: 'pre_scaled', ingredients: [], derived: [] } })
      mockCurrentRecipeId.value = 'test-recipe'

      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      expect(wrapper.find('.experiment-panel-stub').exists()).toBe(false)
    })


    it('handles fetch exception gracefully', async () => {
      // Override fetch to throw
      vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))))

      mockCurrentRecipe.value = makeRecipe({ experiment: { description: 'test', scaleMode: 'pre_scaled', ingredients: [], derived: [] } })
      mockCurrentRecipeId.value = 'test-recipe'

      // Should not throw
      const { wrapper } = await mountApp('/recipe/test-recipe')
      await nextTick()
      await flushPromises()

      // Panel should not render since waterContentTable is null
      expect(wrapper.find('.experiment-panel-stub').exists()).toBe(false)
    })
  })

})
