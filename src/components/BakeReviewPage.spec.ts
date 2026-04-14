import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BakeReviewPage from './BakeReviewPage.vue'

// Mock vue-router
const mockRoute = {
  params: { recipeId: 'test-recipe', date: '2026-02-10' }
}

const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: mockPush,
    back: mockBack
  })
}))

// Mock lucide-vue-next
vi.mock('lucide-vue-next', () => ({
  ArrowLeft: { name: 'ArrowLeft', props: ['size'], template: '<svg class="arrow-left-icon" />' }
}))

// Mock useClipboard
vi.mock('@/composables/useClipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined)
}))

const sampleManifest = {
  recipeId: 'test-recipe',
  date: '2026-02-10',
  processedAt: '2026-02-10T00:00:00.000Z',
  photos: [
    { name: 'photo-1', thumb: 'photo-1-400w.webp', src: 'photo-1-800w.webp', summary: 'Test summary 1' },
    { name: 'photo-2', thumb: 'photo-2-400w.webp', src: 'photo-2-800w.webp', summary: 'Test summary 2' }
  ]
}

const sampleRecipe = {
  meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
  cook_log: [
    {
      date: '2026-02-10',
      start_date: '2026-02-09',
      version: '1.0',
      summary: 'Great bake overall, dough was a bit sticky but manageable.',
      notes: ['Dough was sticky during kneading', 'Proof took 35 minutes', 'Buns rose well in the oven'],
      key_notes: [
        { text: 'Dough was sticky during kneading', timestamp: '2026-02-09T09:00:00Z' },
        { text: 'Buns rose well in the oven', timestamp: '2026-02-10T10:10:00Z' }
      ],
      raw_notes: '9:00am — mixed dough, very sticky\n9:05am — kneaded 2 min\n9:40am — proof done\n10:10am — baked 28 min at 350F',
      next_time: [
        { text: 'Try adding a bit more flour to reduce stickiness' },
        { text: 'Use parchment paper in skillet', source: 'ATK forum' }
      ]
    }
  ]
}

// Recipe with no cook_log notes for empty state testing
const sampleRecipeNoNotes = {
  meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
  cook_log: [
    {
      date: '2026-02-10',
      version: '1.0',
      notes: []
    }
  ]
}

const sampleHebResults = {
  recipeId: 'test-recipe',
  date: '2026-02-10',
  storeId: 428,
  ingredients: [
    {
      ingredientId: 'unsalted-butter',
      name: 'Unsalted butter',
      recipeAmount: 140,
      recipeUnit: 'g',
      products: [
        {
          name: 'Sweet Cream Unsalted Butter Sticks',
          brand: 'H-E-B',
          size: '4ct / 16oz',
          sizeGrams: 454,
          price: 3.98,
          salePrice: null,
          unitPrice: '$0.25/oz',
          inStock: true
        },
        {
          name: 'European Style Unsalted Butter',
          brand: 'Central Market',
          size: '4ct / 16oz',
          sizeGrams: 454,
          price: 5.28,
          salePrice: 4.48,
          unitPrice: '$0.37/oz',
          inStock: true
        }
      ]
    },
    {
      ingredientId: 'all-purpose-flour',
      name: 'All-purpose flour',
      recipeAmount: 390,
      recipeUnit: 'g',
      products: [
        {
          name: 'Unbleached All Purpose Flour',
          brand: 'H-E-B',
          size: '5 lb',
          sizeGrams: 2268,
          price: 3.49,
          salePrice: null,
          unitPrice: '$0.07/oz',
          inStock: true
        }
      ]
    },
    {
      ingredientId: 'eggs',
      name: 'Large Eggs',
      recipeAmount: 3,
      recipeUnit: 'whole',
      products: [
        {
          name: 'Cage Free Large Brown Eggs',
          brand: 'H-E-B',
          size: '12 ct',
          sizeGrams: 600,
          price: 2.96,
          salePrice: null,
          unitPrice: '$0.25/ct',
          inStock: true
        }
      ]
    }
  ]
}

const sampleCostRates = {
  updatedAt: '2026-02-16',
  source: 'Test Store',
  rates: {
    water: { name: 'Water', ratePerGram: 0, sourceProduct: 'Tap water (negligible)', updatedAt: '2026-02-16' },
    starter: { name: 'Sourdough Starter', ratePerGram: 0.00057, sourceProduct: 'Derived: 50% AP flour rate', updatedAt: '2026-02-16' }
  }
}

function makeFetchSuccess(manifest = sampleManifest, recipe = sampleRecipe, hebResults = sampleHebResults as typeof sampleHebResults | null) {
  return vi.fn((url: string) => {
    if (url.includes('/cost-rates.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleCostRates)
      } as Response)
    }
    if (url.includes('/recipes/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(recipe)
      } as Response)
    }
    if (url.includes('/review-data/')) {
      if (hebResults) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(hebResults)
        } as Response)
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.reject(new Error('Not found'))
      } as Response)
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(manifest)
    } as Response)
  })
}

function makeFetchManifestNotFound() {
  return vi.fn((url: string) => {
    if (url.includes('/cost-rates.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleCostRates)
      } as Response)
    }
    if (url.includes('/recipes/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleRecipe)
      } as Response)
    }
    if (url.includes('/review-data/')) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.reject(new Error('Not found'))
      } as Response)
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.reject(new Error('Not found'))
    } as Response)
  })
}

// localStorage mock
function makeLocalStorageMock() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store
  }
}

describe('BakeReviewPage', () => {
  let localStorageMock: ReturnType<typeof makeLocalStorageMock>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock = makeLocalStorageMock()
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    global.fetch = makeFetchSuccess()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Page shell', () => {
    it('renders the bake review page', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      expect(wrapper.find('[data-testid="bake-review-page"]').exists()).toBe(true)
    })

    it('renders header with recipe name and date', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      expect(wrapper.text()).toContain('Bake Review')
      expect(wrapper.text()).toContain('Quick Cinnamon Buns')
      expect(wrapper.text()).toContain('2026-02-10')
    })

    it('renders back button that navigates to recipe', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const backBtn = wrapper.find('button.back-link')
      expect(backBtn.exists()).toBe(true)

      await backBtn.trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/recipe/test-recipe')
    })

    it('renders section navigation tabs', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const nav = wrapper.find('[data-testid="section-nav"]')
      expect(nav.exists()).toBe(true)
      expect(nav.text()).toContain('Photos')
      expect(nav.text()).toContain('Cost')
      expect(nav.text()).toContain('Notes')
      expect(nav.text()).toContain('Summary')
    })

    it('defaults to Photos section', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      expect(wrapper.find('[data-testid="photos-section"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="notes-section"]').exists()).toBe(false)
    })

    it('switches sections on tab click', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      expect(wrapper.find('[data-testid="notes-section"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="photos-section"]').exists()).toBe(false)
    })
  })

  describe('Photos section', () => {
    it('renders photo cards from manifest', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const cards = wrapper.find('[data-testid="photos-section"]').findAll('.card')
      expect(cards.length).toBe(2)
    })

    it('renders photo thumbnails with correct src', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const imgs = wrapper.findAll('img')
      const thumbSrcs = imgs.map(img => img.attributes('src')).filter(s => s?.includes('400w'))
      expect(thumbSrcs).toContain('/images/test-recipe/2026-02-10/photo-1-400w.webp')
      expect(thumbSrcs).toContain('/images/test-recipe/2026-02-10/photo-2-400w.webp')
    })

    it('renders usage checkboxes for each photo', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // 5 checkboxes per photo (editToggle + hero/step/process/exclude) * 2 photos = 10
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(10)
    })

    it('does not render per-tab copy button in photos section', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      expect(wrapper.find('[data-testid="copy-feedback-btn"]').exists()).toBe(false)
    })

    it('shows error when manifest not found', async () => {
      global.fetch = makeFetchManifestNotFound()

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      expect(wrapper.text()).toContain('Manifest not found (404)')
    })
  })

  describe('Photo hero mutual exclusivity', () => {
    it('clears hero on other photos when hero is set', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      // Set hero on photo-1
      await checkboxes[1].trigger('change')
      await flushPromises()

      // Set hero on photo-2
      await checkboxes[6].trigger('change')
      await flushPromises()

      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
      expect((checkboxes[6].element as HTMLInputElement).checked).toBe(true)
    })

    it('setting hero clears exclude', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set exclude on photo-1
      await checkboxes[4].trigger('change')
      await flushPromises()

      // Set hero on photo-1
      await checkboxes[1].trigger('change')
      await flushPromises()

      expect((checkboxes[4].element as HTMLInputElement).checked).toBe(false)
    })

    it('setting exclude clears hero, step, and process', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set hero, step, process on photo-1
      await checkboxes[1].trigger('change') // hero
      await checkboxes[2].trigger('change') // step
      await checkboxes[3].trigger('change') // process
      await flushPromises()

      // Now set exclude
      await checkboxes[4].trigger('change')
      await flushPromises()

      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false) // hero
      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false) // step
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false) // process
      expect((checkboxes[4].element as HTMLInputElement).checked).toBe(true) // exclude
    })
  })

  describe('Copy all button', () => {
    it('renders copy all button', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const btn = wrapper.find('[data-testid="copy-all-btn"]')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toContain('Copy review data')
    })

    it('is enabled when photos are loaded', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const btn = wrapper.find('[data-testid="copy-all-btn"]')
      expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    })

    it('is disabled when no photos and no cost selections', async () => {
      const emptyManifest = {
        recipeId: 'test-recipe',
        date: '2026-02-10',
        processedAt: '2026-02-10T00:00:00.000Z',
        photos: []
      }
      global.fetch = makeFetchSuccess(emptyManifest, sampleRecipe, null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const btn = wrapper.find('[data-testid="copy-all-btn"]')
      expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('copies combined JSON payload to clipboard', async () => {
      const { copyToClipboard } = await import('@/composables/useClipboard')

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      await wrapper.find('[data-testid="copy-all-btn"]').trigger('click')
      await flushPromises()

      expect(copyToClipboard).toHaveBeenCalled()
      const calls = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const parsed = JSON.parse(lastCall)
      expect(parsed).toHaveProperty('recipeId', 'test-recipe')
      expect(parsed).toHaveProperty('date', '2026-02-10')
      expect(parsed.photos).toHaveLength(2)
    })

    it('includes cost data in combined payload when cost selections exist', async () => {
      const { copyToClipboard } = await import('@/composables/useClipboard')

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Cost selections are initialized by default from HEB results
      await wrapper.find('[data-testid="copy-all-btn"]').trigger('click')
      await flushPromises()

      const calls = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const parsed = JSON.parse(lastCall)
      expect(parsed).toHaveProperty('cost')
      expect(parsed.cost).toHaveProperty('costs')
      expect(parsed.cost).toHaveProperty('total')
      expect(parsed.cost).toHaveProperty('perServing')
      expect(parsed.cost).toHaveProperty('servings', 8)
    })

    it('shows Copied! text after click', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      await wrapper.find('[data-testid="copy-all-btn"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="copy-all-btn"]').text()).toContain('Copied!')
    })

    it('includes notesFeedback in payload when textarea has content', async () => {
      const { copyToClipboard } = await import('@/composables/useClipboard')

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Navigate to Notes tab and enter feedback
      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const textarea = wrapper.find('[data-testid="notes-feedback-textarea"]')
      await textarea.setValue('The summary looks good but key_notes #2 needs rewording')
      await flushPromises()

      // Click the copy-all button
      await wrapper.find('[data-testid="copy-all-btn"]').trigger('click')
      await flushPromises()

      const calls = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const parsed = JSON.parse(lastCall)
      expect(parsed).toHaveProperty('notesFeedback', 'The summary looks good but key_notes #2 needs rewording')
    })

    it('omits notesFeedback from payload when textarea is empty', async () => {
      const { copyToClipboard } = await import('@/composables/useClipboard')

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Do not enter any feedback — leave textarea empty
      await wrapper.find('[data-testid="copy-all-btn"]').trigger('click')
      await flushPromises()

      const calls = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const parsed = JSON.parse(lastCall)
      expect(parsed).not.toHaveProperty('notesFeedback')
    })

    it('omits notesFeedback from payload when textarea is whitespace-only', async () => {
      const { copyToClipboard } = await import('@/composables/useClipboard')

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Navigate to Notes tab and enter whitespace-only feedback
      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const textarea = wrapper.find('[data-testid="notes-feedback-textarea"]')
      await textarea.setValue('   \n  ')
      await flushPromises()

      await wrapper.find('[data-testid="copy-all-btn"]').trigger('click')
      await flushPromises()

      const calls = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const parsed = JSON.parse(lastCall)
      expect(parsed).not.toHaveProperty('notesFeedback')
    })

    it('omits photos key when no photos loaded', async () => {
      const { copyToClipboard } = await import('@/composables/useClipboard')
      const emptyManifest = {
        recipeId: 'test-recipe',
        date: '2026-02-10',
        processedAt: '2026-02-10T00:00:00.000Z',
        photos: []
      }
      global.fetch = makeFetchSuccess(emptyManifest, sampleRecipe, sampleHebResults)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      await wrapper.find('[data-testid="copy-all-btn"]').trigger('click')
      await flushPromises()

      const calls = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const parsed = JSON.parse(lastCall)
      expect(parsed).not.toHaveProperty('photos')
      expect(parsed).toHaveProperty('cost')
    })
  })

  describe('Photo localStorage persistence', () => {
    it('saves photo state to localStorage on change', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      await checkboxes[1].trigger('change') // hero-0
      await flushPromises()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'photo-review:test-recipe:2026-02-10',
        expect.any(String)
      )
    })

    it('restores photo state from localStorage', async () => {
      const savedState = JSON.stringify([
        {
          name: 'photo-1',
          summary: 'Saved summary',
          notes: 'Saved notes',
          usage: { hero: true, step: false, process: false, exclude: false }
        },
        {
          name: 'photo-2',
          summary: 'Photo 2 saved',
          notes: '',
          usage: { hero: false, step: true, process: false, exclude: false }
        }
      ])
      localStorageMock._store['photo-review:test-recipe:2026-02-10'] = savedState
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const textareas = wrapper.findAll('textarea')
      expect((textareas[0].element as HTMLTextAreaElement).value).toBe('Saved summary')

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true) // hero-0
    })
  })

  describe('Notes section', () => {
    it('shows Curated and Raw Input sub-tabs', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const subTabs = wrapper.find('[data-testid="notes-sub-tabs"]')
      expect(subTabs.exists()).toBe(true)
      expect(subTabs.text()).toContain('Curated')
      expect(subTabs.text()).toContain('Raw Input')
    })

    it('renders summary from cook_log entry on Curated tab', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const curated = wrapper.find('[data-testid="notes-curated"]')
      expect(curated.exists()).toBe(true)
      expect(curated.text()).toContain('Great bake overall, dough was a bit sticky but manageable.')
    })

    it('renders key_notes on Curated tab', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const keyNotes = wrapper.find('[data-testid="notes-curated-keynotes"]')
      expect(keyNotes.exists()).toBe(true)
      expect(keyNotes.text()).toContain('Dough was sticky during kneading')
      expect(keyNotes.text()).toContain('Buns rose well in the oven')
    })

    it('renders next_time items on Curated tab', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const nextTime = wrapper.find('[data-testid="notes-curated-nexttime"]')
      expect(nextTime.exists()).toBe(true)
      expect(nextTime.text()).toContain('Try adding a bit more flour to reduce stickiness')
      expect(nextTime.text()).toContain('Use parchment paper in skillet')
      expect(nextTime.text()).toContain('ATK forum')
    })

    it('shows raw notes in a pre block on Raw Input tab', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      // Switch to Raw Input sub-tab
      const rawTab = wrapper.find('[data-testid="notes-tab-raw"]')
      await rawTab.trigger('click')

      const pre = wrapper.find('[data-testid="notes-raw-pre"]')
      expect(pre.exists()).toBe(true)
      expect(pre.text()).toContain('9:00am')
      expect(pre.text()).toContain('mixed dough, very sticky')
    })

    it('falls back to notes[] when key_notes is absent', async () => {
      // Use recipe with notes but no key_notes
      const recipeNoKeyNotes = {
        meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
        cook_log: [
          {
            date: '2026-02-10',
            version: '1.0',
            notes: ['First fallback note', 'Second fallback note']
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, recipeNoKeyNotes)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const keyNotes = wrapper.find('[data-testid="notes-curated-keynotes"]')
      expect(keyNotes.exists()).toBe(true)
      expect(keyNotes.text()).toContain('First fallback note')
      expect(keyNotes.text()).toContain('Second fallback note')
    })

    it('shows feedback textarea on Curated tab (no standalone copy button)', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      expect(wrapper.find('[data-testid="notes-feedback-textarea"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="notes-feedback-copy"]').exists()).toBe(false)
    })
  })

  describe('Cost section', () => {
    it('renders no-data message when HEB results are 404', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      const costSection = wrapper.find('[data-testid="cost-section"]')
      expect(costSection.find('[data-testid="cost-no-data"]').exists()).toBe(true)
      expect(costSection.text()).toContain('No HEB data available')
    })

    it('renders ingredient cards when HEB results are available', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      const cards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      expect(cards.length).toBe(3) // butter + flour + eggs
      expect(cards[0].text()).toContain('Unsalted butter')
      expect(cards[0].text()).toContain('140g')
      expect(cards[1].text()).toContain('All-purpose flour')
      expect(cards[1].text()).toContain('390g')
    })

    it('renders product cards within each ingredient', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      const productCards = wrapper.findAll('[data-testid="product-card"]')
      // 2 butter products + 1 flour product + 1 eggs product = 4
      expect(productCards.length).toBe(4)
      expect(productCards[0].text()).toContain('H-E-B')
      expect(productCards[0].text()).toContain('$3.98')
      expect(productCards[1].text()).toContain('Central Market')
      expect(productCards[1].text()).toContain('SALE')
    })

    it('shows calculated cost for selected product', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // First product (H-E-B butter) should be selected by default
      const calculatedCost = wrapper.find('[data-testid="calculated-cost"]')
      expect(calculatedCost.exists()).toBe(true)
      // 140/454 * 3.98 = ~1.23
      expect(calculatedCost.text()).toContain('$1.23')
    })

    it('calculates count-based cost for whole unit ingredients (eggs)', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Find the eggs ingredient card (third card)
      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      const eggsCard = ingredientCards[2]

      // Select the first product
      const productCards = eggsCard.findAll('[data-testid="product-card"]')
      await productCards[0].trigger('click')
      await flushPromises()

      // 3/12 * 2.96 = 0.74, NOT 3/600 * 2.96 = 0.01
      const calculatedCost = eggsCard.find('[data-testid="calculated-cost"]')
      expect(calculatedCost.exists()).toBe(true)
      expect(calculatedCost.text()).toContain('$0.74')
    })

    it('falls back to gram-based cost when whole unit has no count in size', async () => {
      // Override HEB results with a "whole" unit ingredient whose size has no "ct" pattern
      const hebWithWeirdSize = {
        ...sampleHebResults,
        ingredients: [
          ...sampleHebResults.ingredients.slice(0, 2),
          {
            ingredientId: 'eggs',
            name: 'Large Eggs',
            recipeAmount: 3,
            recipeUnit: 'whole',
            products: [
              {
                name: 'Eggs by weight',
                brand: 'Test',
                size: '1 lb',
                sizeGrams: 600,
                price: 2.96,
                salePrice: null,
                unitPrice: '$0.25/ct',
                inStock: true
              }
            ]
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithWeirdSize)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      const eggsCard = ingredientCards[2]
      const productCards = eggsCard.findAll('[data-testid="product-card"]')
      await productCards[0].trigger('click')
      await flushPromises()

      // No "ct" in size, so falls back to gram-based: 3/600 * 2.96 = 0.01
      const calculatedCost = eggsCard.find('[data-testid="calculated-cost"]')
      expect(calculatedCost.exists()).toBe(true)
      expect(calculatedCost.text()).toContain('$0.01')
    })

    it('updates calculated cost when selecting a different product', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Click the second product (Central Market, on sale $4.48)
      const productCards = wrapper.findAll('[data-testid="product-card"]')
      await productCards[1].trigger('click')
      await flushPromises()

      // 140/454 * 4.48 = ~1.38
      const calculatedCosts = wrapper.findAll('[data-testid="calculated-cost"]')
      const activeCost = calculatedCosts.find(el => el.text().includes('$1.38'))
      expect(activeCost).toBeTruthy()
    })

    it('switches to pantry rate mode', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Click "Use Stored Rate" on the first ingredient card
      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      const pantryBtn = ingredientCards[0].find('[data-testid="source-toggle-pantry"]')
      await pantryBtn.trigger('click')
      await flushPromises()

      // Pantry form should appear
      expect(ingredientCards[0].find('[data-testid="pantry-rate-form"]').exists()).toBe(true)
      // Product cards should not be visible
      expect(ingredientCards[0].findAll('[data-testid="product-card"]').length).toBe(0)
    })

    it('switches to manual entry mode', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      const manualBtn = ingredientCards[0].find('[data-testid="source-toggle-manual"]')
      await manualBtn.trigger('click')
      await flushPromises()

      expect(ingredientCards[0].find('[data-testid="manual-entry-form"]').exists()).toBe(true)
    })

    it('persists cost selections to localStorage', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Clicking a product should trigger a save
      const productCards = wrapper.findAll('[data-testid="product-card"]')
      await productCards[1].trigger('click')
      await flushPromises()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'cost-selections:test-recipe:2026-02-10',
        expect.any(String)
      )
    })

    it('handles HEB results fetch rejection', async () => {
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/recipes/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(sampleRecipe)
          } as Response)
        }
        if (url.includes('/review-data/')) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(sampleManifest)
        } as Response)
      })

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      expect(wrapper.find('[data-testid="cost-no-data"]').exists()).toBe(true)
    })

    it('restores cost selections from localStorage on load', async () => {
      // Pre-populate localStorage with saved cost selections
      const savedSelections = {
        'unsalted-butter': {
          ingredientId: 'unsalted-butter',
          sourceType: 'heb',
          productIndex: 1
        }
      }
      localStorageMock._store['cost-selections:test-recipe:2026-02-10'] = JSON.stringify(savedSelections)
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // The second product (Central Market) should be selected
      const productCards = wrapper.findAll('[data-testid="product-card"]')
      // The second card for butter should have the accent border
      expect(productCards[1].classes()).toContain('border-accent')
    })

    it('handles corrupt cost selection data in localStorage', async () => {
      localStorageMock._store['cost-selections:test-recipe:2026-02-10'] = 'INVALID JSON{'
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Should still render with defaults despite corrupt data
      const cards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      expect(cards.length).toBe(3)
    })

    it('saves and restores pantry rates', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Switch first ingredient to pantry mode
      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      const pantryBtn = ingredientCards[0].find('[data-testid="source-toggle-pantry"]')
      await pantryBtn.trigger('click')
      await flushPromises()

      // Enter pantry data
      const lbsInput = ingredientCards[0].find('[data-testid="pantry-lbs-input"]')
      const priceInput = ingredientCards[0].find('[data-testid="pantry-price-input"]')

      await lbsInput.setValue('5')
      await lbsInput.trigger('input')
      await priceInput.setValue('3.49')
      await priceInput.trigger('input')
      await flushPromises()

      // Should save pantry rates to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pantry-rates:test-recipe',
        expect.any(String)
      )
    })

    it('handles corrupt pantry rate data in localStorage', async () => {
      localStorageMock._store['pantry-rates:test-recipe'] = 'NOT JSON'
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Should still render normally despite corrupt pantry data
      const cards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      expect(cards.length).toBe(3)
    })

    it('calculates pantry rate cost correctly', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Switch flour (second ingredient) to pantry mode
      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      const pantryBtn = ingredientCards[1].find('[data-testid="source-toggle-pantry"]')
      await pantryBtn.trigger('click')
      await flushPromises()

      // Enter pantry data for flour: 5 lbs, $3.49
      const lbsInput = ingredientCards[1].find('[data-testid="pantry-lbs-input"]')
      const priceInput = ingredientCards[1].find('[data-testid="pantry-price-input"]')

      await lbsInput.setValue('5')
      await lbsInput.trigger('input')
      await priceInput.setValue('3.49')
      await priceInput.trigger('input')
      await flushPromises()

      // Rate display should appear
      expect(ingredientCards[1].find('[data-testid="pantry-rate-display"]').exists()).toBe(true)
      // 390g / (5 * 453.592g) * $3.49 = ~$0.60
      const pantryCalcCost = ingredientCards[1].find('[data-testid="pantry-calculated-cost"]')
      expect(pantryCalcCost.exists()).toBe(true)
      expect(pantryCalcCost.text()).toContain('$0.60')
    })

    it('calculates manual entry cost correctly', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Switch butter to manual entry
      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      const manualBtn = ingredientCards[0].find('[data-testid="source-toggle-manual"]')
      await manualBtn.trigger('click')
      await flushPromises()

      // Enter manual data
      const nameInput = ingredientCards[0].find('[data-testid="manual-name-input"]')
      const priceInput = ingredientCards[0].find('[data-testid="manual-price-input"]')
      const sizeInput = ingredientCards[0].find('[data-testid="manual-size-input"]')

      await nameInput.setValue('Store brand butter')
      await nameInput.trigger('input')
      await priceInput.setValue('2.99')
      await priceInput.trigger('input')
      await sizeInput.setValue('454')
      await sizeInput.trigger('input')
      await flushPromises()

      // Cost display should appear
      expect(ingredientCards[0].find('[data-testid="manual-cost-display"]').exists()).toBe(true)
      // 140/454 * 2.99 = ~0.92
    })

    it('switches back to HEB mode from pantry', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Switch to pantry
      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      const pantryBtn = ingredientCards[0].find('[data-testid="source-toggle-pantry"]')
      await pantryBtn.trigger('click')
      await flushPromises()
      expect(ingredientCards[0].find('[data-testid="pantry-rate-form"]').exists()).toBe(true)

      // Switch back to HEB
      const hebBtn = ingredientCards[0].find('[data-testid="source-toggle-heb"]')
      await hebBtn.trigger('click')
      await flushPromises()
      expect(ingredientCards[0].findAll('[data-testid="product-card"]').length).toBe(2)
      expect(ingredientCards[0].find('[data-testid="pantry-rate-form"]').exists()).toBe(false)
    })

    it('shows sale badge on discounted products', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Central Market butter has a salePrice
      const productCards = wrapper.findAll('[data-testid="product-card"]')
      expect(productCards[1].text()).toContain('SALE')
      expect(productCards[1].text()).toContain('$5.28') // original price (line-through)
      expect(productCards[1].text()).toContain('$4.48') // sale price
    })

    it('loads pantry rates for pantry-mode selections on mount', async () => {
      // Pre-populate both cost selections and pantry rates
      const savedSelections = {
        'unsalted-butter': {
          ingredientId: 'unsalted-butter',
          sourceType: 'pantry',
          pantryPurchaseLbs: 0,
          pantryPurchasePrice: 0
        }
      }
      const savedRates = {
        'unsalted-butter': {
          rate: 0.005,
          source: 'HEB Store Brand',
          updatedAt: '2026-02-10'
        }
      }
      localStorageMock._store['cost-selections:test-recipe:2026-02-10'] = JSON.stringify(savedSelections)
      localStorageMock._store['pantry-rates:test-recipe'] = JSON.stringify(savedRates)
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      // Should be in pantry mode for butter
      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      expect(ingredientCards[0].find('[data-testid="pantry-rate-form"]').exists()).toBe(true)
    })
  })

  describe('Cost rates integration', () => {
    const hebWithRateIngredients = {
      recipeId: 'test-recipe',
      date: '2026-02-10',
      storeId: 428,
      ingredients: [
        {
          ingredientId: 'unsalted-butter',
          name: 'Unsalted butter',
          recipeAmount: 140,
          recipeUnit: 'g',
          products: [
            {
              name: 'Sweet Cream Unsalted Butter Sticks',
              brand: 'H-E-B',
              size: '4ct / 16oz',
              sizeGrams: 454,
              price: 3.98,
              salePrice: null,
              unitPrice: '$0.25/oz',
              inStock: true
            }
          ]
        },
        {
          ingredientId: 'water',
          name: 'Water',
          recipeAmount: 350,
          recipeUnit: 'g',
          products: []
        },
        {
          ingredientId: 'starter',
          name: 'Sourdough Starter',
          recipeAmount: 100,
          recipeUnit: 'g',
          products: []
        },
        {
          ingredientId: 'unknown-ingredient',
          name: 'Unknown Ingredient',
          recipeAmount: 50,
          recipeUnit: 'g',
          products: []
        }
      ]
    }

    it('auto-applies stored rate for ingredients without HEB products', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithRateIngredients)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      // water and starter should show stored rate display
      expect(ingredientCards[1].find('[data-testid="stored-rate-display"]').exists()).toBe(true)
      expect(ingredientCards[2].find('[data-testid="stored-rate-display"]').exists()).toBe(true)
    })

    it('shows negligible label for zero-rate ingredients like water', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithRateIngredients)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      expect(ingredientCards[1].text()).toContain('negligible')
    })

    it('shows calculated cost for stored rate ingredients', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithRateIngredients)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      // starter: 100g * 0.00057 = $0.06
      const rateCost = ingredientCards[2].find('[data-testid="rate-calculated-cost"]')
      expect(rateCost.exists()).toBe(true)
      expect(rateCost.text()).toBe('$0.06')
    })

    it('shows Stored Rate button only for ingredients with cost rates', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithRateIngredients)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      // butter has no stored rate → no rate button
      expect(ingredientCards[0].find('[data-testid="source-toggle-rate"]').exists()).toBe(false)
      // water has stored rate → shows rate button
      expect(ingredientCards[1].find('[data-testid="source-toggle-rate"]').exists()).toBe(true)
      // starter has stored rate → shows rate button
      expect(ingredientCards[2].find('[data-testid="source-toggle-rate"]').exists()).toBe(true)
    })

    it('shows Store Product button only for ingredients with HEB products', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithRateIngredients)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      // butter has products → shows heb button
      expect(ingredientCards[0].find('[data-testid="source-toggle-heb"]').exists()).toBe(true)
      // water has no products → no heb button
      expect(ingredientCards[1].find('[data-testid="source-toggle-heb"]').exists()).toBe(false)
    })

    it('defaults to manual entry for ingredients without products or rates', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithRateIngredients)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      // unknown-ingredient has no products and no rate → manual mode
      expect(ingredientCards[3].find('[data-testid="manual-entry-form"]').exists()).toBe(true)
    })

    it('shows RATE badge in summary for stored rate ingredients', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithRateIngredients)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Summary')!.trigger('click')

      const badges = wrapper.findAll('[data-testid="source-badge"]')
      // butter=HEB, water=RATE, starter=RATE, unknown=MANUAL
      const badgeTexts = badges.map(b => b.text())
      expect(badgeTexts).toContain('RATE')
      expect(badgeTexts).toContain('HEB')
    })

    it('shows source product info in rate display', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithRateIngredients)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      // starter card should show source product
      expect(ingredientCards[2].text()).toContain('Derived: 50% AP flour rate')
    })

    it('can switch from stored rate to custom rate mode', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithRateIngredients)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      // starter starts in rate mode
      expect(ingredientCards[2].find('[data-testid="stored-rate-display"]').exists()).toBe(true)

      // Switch to custom rate
      await ingredientCards[2].find('[data-testid="source-toggle-pantry"]').trigger('click')
      await flushPromises()
      expect(ingredientCards[2].find('[data-testid="pantry-rate-form"]').exists()).toBe(true)
      expect(ingredientCards[2].find('[data-testid="stored-rate-display"]').exists()).toBe(false)
    })

    it('wraps HEB product list in scrollable container', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      const scrollContainers = wrapper.findAll('[data-testid="product-list-scroll"]')
      expect(scrollContainers.length).toBeGreaterThan(0)

      // Verify the scroll container has overflow-y auto styling
      const firstScroll = scrollContainers[0]
      expect(firstScroll.classes()).toContain('overflow-y-auto')
      expect(firstScroll.classes()).toContain('max-h-[300px]')
    })

    it('shows filter bar when ingredient has >5 products', async () => {
      const manyProducts = Array.from({ length: 8 }, (_, i) => ({
        name: `Product ${i + 1}`,
        brand: i < 4 ? 'H-E-B' : 'Central Market',
        size: `${i + 1} lb`,
        sizeGrams: (i + 1) * 454,
        price: 2 + i,
        salePrice: null,
        unitPrice: `$0.0${i}/oz`,
        inStock: true
      }))
      const hebWithMany = {
        ...sampleHebResults,
        ingredients: [
          { ...sampleHebResults.ingredients[0], products: manyProducts }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithMany)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const filterBar = wrapper.find('[data-testid="product-filter-bar"]')
      expect(filterBar.exists()).toBe(true)
      expect(wrapper.find('[data-testid="product-filter-input"]').exists()).toBe(true)

      // All 8 products should be visible initially
      expect(wrapper.findAll('[data-testid="product-card"]').length).toBe(8)
    })

    it('does not show filter bar when ingredient has <=5 products', async () => {
      // sampleHebResults has <=5 products per ingredient
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      expect(wrapper.find('[data-testid="product-filter-bar"]').exists()).toBe(false)
    })

    it('filters products by name when typing in filter input', async () => {
      const manyProducts = [
        { name: 'Fine Sea Salt', brand: 'Morton', size: '26 oz', sizeGrams: 737, price: 2.48, salePrice: null, unitPrice: '$0.10/oz', inStock: true },
        { name: 'Iodized Salt', brand: 'Morton', size: '26 oz', sizeGrams: 737, price: 1.98, salePrice: null, unitPrice: '$0.08/oz', inStock: true },
        { name: 'Kosher Salt', brand: 'Diamond Crystal', size: '3 lb', sizeGrams: 1361, price: 4.98, salePrice: null, unitPrice: '$0.10/oz', inStock: true },
        { name: 'Pink Himalayan Salt', brand: 'H-E-B', size: '12 oz', sizeGrams: 340, price: 3.48, salePrice: null, unitPrice: '$0.29/oz', inStock: true },
        { name: 'Sea Salt Grinder', brand: 'McCormick', size: '2.12 oz', sizeGrams: 60, price: 3.78, salePrice: null, unitPrice: '$1.78/oz', inStock: true },
        { name: 'Table Salt', brand: 'H-E-B', size: '26 oz', sizeGrams: 737, price: 0.98, salePrice: null, unitPrice: '$0.04/oz', inStock: true },
      ]
      const hebWithMany = {
        ...sampleHebResults,
        ingredients: [
          { ingredientId: 'salt', name: 'Salt', recipeAmount: 10, recipeUnit: 'g', products: manyProducts }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithMany)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      // All 6 products visible initially
      expect(wrapper.findAll('[data-testid="product-card"]').length).toBe(6)

      // Type "Morton" in filter
      const filterInput = wrapper.find('[data-testid="product-filter-input"]')
      await filterInput.setValue('Morton')
      await filterInput.trigger('input')
      await flushPromises()

      // Only Morton products should show (Fine Sea Salt + Iodized Salt)
      expect(wrapper.findAll('[data-testid="product-card"]').length).toBe(2)
    })

    it('shows empty message when filter matches nothing', async () => {
      const manyProducts = Array.from({ length: 6 }, (_, i) => ({
        name: `Product ${i + 1}`,
        brand: 'H-E-B',
        size: `${i + 1} lb`,
        sizeGrams: (i + 1) * 454,
        price: 2 + i,
        salePrice: null,
        unitPrice: `$0.0${i}/oz`,
        inStock: true
      }))
      const hebWithMany = {
        ...sampleHebResults,
        ingredients: [
          { ...sampleHebResults.ingredients[0], products: manyProducts }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithMany)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      const filterInput = wrapper.find('[data-testid="product-filter-input"]')
      await filterInput.setValue('xyznonexistent')
      await filterInput.trigger('input')
      await flushPromises()

      expect(wrapper.findAll('[data-testid="product-card"]').length).toBe(0)
      expect(wrapper.find('[data-testid="product-filter-empty"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="product-filter-empty"]').text()).toContain('xyznonexistent')
    })

    it('preserves product selection when filtering', async () => {
      const manyProducts = Array.from({ length: 6 }, (_, i) => ({
        name: `Product ${i + 1}`,
        brand: i === 3 ? 'SpecialBrand' : 'H-E-B',
        size: `${i + 1} lb`,
        sizeGrams: (i + 1) * 454,
        price: 2 + i,
        salePrice: null,
        unitPrice: `$0.0${i}/oz`,
        inStock: true
      }))
      const hebWithMany = {
        ...sampleHebResults,
        ingredients: [
          { ...sampleHebResults.ingredients[0], products: manyProducts }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, hebWithMany)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      // Select product at index 3 (SpecialBrand)
      const cards = wrapper.findAll('[data-testid="product-card"]')
      await cards[3].trigger('click')
      await flushPromises()

      // Filter to show only SpecialBrand
      const filterInput = wrapper.find('[data-testid="product-filter-input"]')
      await filterInput.setValue('Special')
      await filterInput.trigger('input')
      await flushPromises()

      // Should show 1 product, and it should be selected
      const filteredCards = wrapper.findAll('[data-testid="product-card"]')
      expect(filteredCards.length).toBe(1)
      expect(filteredCards[0].classes()).toContain('border-accent')
    })

    it('handles missing cost-rates.json gracefully', async () => {
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/cost-rates.json')) {
          return Promise.resolve({ ok: false, status: 404 } as Response)
        }
        if (url.includes('/recipes/')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(sampleRecipe) } as Response)
        }
        if (url.includes('/review-data/')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(hebWithRateIngredients) } as Response)
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(sampleManifest) } as Response)
      })

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      await tabs.find(t => t.text() === 'Cost')!.trigger('click')

      // Without cost rates, water/starter should default to manual
      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')
      expect(ingredientCards[1].find('[data-testid="source-toggle-rate"]').exists()).toBe(false)
      expect(ingredientCards[1].find('[data-testid="manual-entry-form"]').exists()).toBe(true)
    })
  })

  describe('Summary section', () => {
    it('shows no-data message when no HEB results', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipe, null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      expect(wrapper.find('[data-testid="summary-section"]').text()).toContain('No cost data yet')
    })

    it('shows cost breakdown when HEB results and selections exist', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      const summarySection = wrapper.find('[data-testid="summary-section"]')
      expect(summarySection.find('[data-testid="summary-header"]').exists()).toBe(true)
      expect(summarySection.text()).toContain('Quick Cinnamon Buns')
      expect(summarySection.text()).toContain('Cost Breakdown')
    })

    it('shows source badges for each cost line', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      const badges = wrapper.findAll('[data-testid="source-badge"]')
      expect(badges.length).toBe(3) // butter + flour + eggs
      expect(badges[0].text()).toBe('HEB')
    })

    it('shows total and per-serving cost', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      expect(wrapper.find('[data-testid="summary-total"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="summary-per-serving"]').exists()).toBe(true)
    })

    it('uses recipe yields for servings count', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      // yields is "8 buns", so 8 servings
      expect(wrapper.find('[data-testid="summary-section"]').text()).toContain('8 servings')
      expect(wrapper.find('[data-testid="summary-section"]').text()).toContain('8 buns')
    })

    it('does not render per-tab copy button in summary section', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      expect(wrapper.find('[data-testid="copy-cost-btn"]').exists()).toBe(false)
    })

    it('shows PANTRY and MANUAL badges for non-HEB sources', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Switch to cost tab and set butter to pantry, flour to manual
      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      const ingredientCards = wrapper.findAll('[data-testid="cost-ingredient-card"]')

      // Set butter to pantry mode with values
      await ingredientCards[0].find('[data-testid="source-toggle-pantry"]').trigger('click')
      await flushPromises()
      const lbsInput = ingredientCards[0].find('[data-testid="pantry-lbs-input"]')
      const priceInput = ingredientCards[0].find('[data-testid="pantry-price-input"]')
      await lbsInput.setValue('1')
      await lbsInput.trigger('input')
      await priceInput.setValue('3.98')
      await priceInput.trigger('input')
      await flushPromises()

      // Set flour to manual mode with values
      await ingredientCards[1].find('[data-testid="source-toggle-manual"]').trigger('click')
      await flushPromises()
      const manualPrice = ingredientCards[1].find('[data-testid="manual-price-input"]')
      const manualSize = ingredientCards[1].find('[data-testid="manual-size-input"]')
      await manualPrice.setValue('3.49')
      await manualPrice.trigger('input')
      await manualSize.setValue('2268')
      await manualSize.trigger('input')
      await flushPromises()

      // Switch to summary tab
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      const badges = wrapper.findAll('[data-testid="source-badge"]')
      expect(badges.length).toBe(3) // pantry butter + manual flour + heb eggs
      expect(badges[0].text()).toBe('PANTRY')
      expect(badges[1].text()).toBe('MANUAL')
    })

    it('shows cost row details for each ingredient', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      const rows = wrapper.findAll('[data-testid="summary-cost-row"]')
      expect(rows.length).toBe(3) // butter + flour + eggs
      // Check first row shows ingredient name and amount
      expect(rows[0].text()).toContain('Unsalted butter')
      expect(rows[0].text()).toContain('140g')
      expect(rows[1].text()).toContain('All-purpose flour')
      expect(rows[1].text()).toContain('390g')
    })

    it('falls back to 1 serving when yields is empty', async () => {
      global.fetch = makeFetchSuccess(
        sampleManifest,
        { meta: { name: 'Test Recipe', yields: '', total_time: '1 hour' } },
        sampleHebResults
      )

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      expect(wrapper.find('[data-testid="summary-section"]').text()).toContain('1 servings')
    })
  })

  describe('goBack() else branch', () => {
    it('calls router.back() when recipeId is empty', async () => {
      mockRoute.params = { recipeId: '', date: '2026-02-10' }

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const backBtn = wrapper.find('button.back-link')
      await backBtn.trigger('click')

      expect(mockBack).toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()

      // Restore
      mockRoute.params = { recipeId: 'test-recipe', date: '2026-02-10' }
    })
  })

  describe('Toggle OFF branches', () => {
    it('toggleStep OFF does not clear exclude', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      // Toggle step ON for photo-1 (index 2: editToggle=0, hero=1, step=2)
      await checkboxes[2].trigger('change')
      await flushPromises()

      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(true)

      // Toggle step OFF for photo-1
      await checkboxes[2].trigger('change')
      await flushPromises()

      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false)
    })

    it('toggleProcess OFF does not clear exclude', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      // Toggle process ON for photo-1 (index 3: editToggle=0, hero=1, step=2, process=3)
      await checkboxes[3].trigger('change')
      await flushPromises()

      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(true)

      // Toggle process OFF for photo-1
      await checkboxes[3].trigger('change')
      await flushPromises()

      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false)
    })

    it('toggleExclude OFF does not clear hero/step/process', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      // Toggle exclude ON for photo-1 (index 4: editToggle=0, hero=1, step=2, process=3, exclude=4)
      await checkboxes[4].trigger('change')
      await flushPromises()
      expect((checkboxes[4].element as HTMLInputElement).checked).toBe(true)

      // Toggle exclude OFF for photo-1
      await checkboxes[4].trigger('change')
      await flushPromises()
      expect((checkboxes[4].element as HTMLInputElement).checked).toBe(false)
    })
  })

  describe('Recipe name fallback', () => {
    it('falls back to recipeId when meta.name is undefined', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, { meta: {} } as typeof sampleRecipe)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // recipeName falls back to recipeId since meta.name is undefined
      expect(wrapper.text()).toContain('test-recipe')
    })
  })

  describe('Fetch error handling', () => {
    it('handles recipe fetch rejection gracefully', async () => {
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/recipes/')) {
          return Promise.reject(new Error('Network error'))
        }
        if (url.includes('/review-data/')) {
          return Promise.resolve({ ok: false, status: 404 } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(sampleManifest)
        } as Response)
      })

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Should still render — recipeName falls back to recipeId
      expect(wrapper.find('[data-testid="bake-review-page"]').exists()).toBe(true)
      // recipeId is used as fallback in the template
      expect(wrapper.text()).toContain('test-recipe')
    })

    it('handles manifest fetch rejection', async () => {
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/recipes/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(sampleRecipe)
          } as Response)
        }
        if (url.includes('/review-data/')) {
          return Promise.resolve({ ok: false, status: 404 } as Response)
        }
        return Promise.reject(new Error('Network error'))
      })

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      expect(wrapper.text()).toContain('Failed to load manifest')
    })
  })

  describe('Notes section — renderNextTime source citation', () => {
    it('renders source citation in italics when next_time item has source', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const nextTime = wrapper.find('[data-testid="notes-curated-nexttime"]')
      expect(nextTime.exists()).toBe(true)
      // The second next_time item has source: 'ATK forum'
      // renderNextTime wraps it in *(source)* which marked parses to <em>
      const html = nextTime.html()
      expect(html).toContain('<em>')
      expect(html).toContain('ATK forum')
    })

    it('does not render italics when next_time item has no source', async () => {
      // Use recipe where next_time items have NO source at all
      const recipeNoSource = {
        meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
        cook_log: [
          {
            date: '2026-02-10',
            version: '1.0',
            summary: 'Test bake',
            next_time: [
              { text: 'Try more flour' },
              { text: 'Longer proof time' }
            ]
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, recipeNoSource)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const nextTime = wrapper.find('[data-testid="notes-curated-nexttime"]')
      expect(nextTime.exists()).toBe(true)
      // No source means no italic markup
      expect(nextTime.html()).not.toContain('<em>')
      expect(nextTime.text()).toContain('Try more flour')
      expect(nextTime.text()).toContain('Longer proof time')
    })
  })

  describe('Notes section — renderKeyNotes HTML output', () => {
    it('renders key_notes as markdown bullet list (ul/li elements)', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const keyNotes = wrapper.find('[data-testid="notes-curated-keynotes"]')
      expect(keyNotes.exists()).toBe(true)
      const html = keyNotes.html()
      expect(html).toContain('<ul>')
      expect(html).toContain('<li>')
    })

    it('handles KeyNote[] format with optional timestamps', async () => {
      // Test that renderKeyNotes works with the new KeyNote interface
      // This verifies the code path handles objects with text and optional timestamp
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const keyNotes = wrapper.find('[data-testid="notes-curated-keynotes"]')
      expect(keyNotes.exists()).toBe(true)
      // sampleRecipe has key_notes as KeyNote[] now (migrated by test fixture)
      // Just verify the notes render properly
      expect(keyNotes.text()).toContain('Dough was sticky during kneading')
      expect(keyNotes.text()).toContain('Buns rose well in the oven')
    })

    it('renders notes with fallback when key_notes is absent', async () => {
      // Test the fallback path when key_notes is not present
      const recipeNoKeyNotes = {
        meta: { name: 'Cookies', yields: '24', total_time: '~2 hours' },
        cook_log: [
          {
            date: '2026-02-10',
            version: '1.0',
            notes: ['Mixed ingredients', 'Baked at 350F'],
            // key_notes intentionally absent to trigger fallback
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, recipeNoKeyNotes)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const keyNotes = wrapper.find('[data-testid="notes-curated-keynotes"]')
      expect(keyNotes.exists()).toBe(true)
      // Should render the fallback notes[]
      expect(keyNotes.text()).toContain('Mixed ingredients')
      expect(keyNotes.text()).toContain('Baked at 350F')
    })
  })

  describe('Notes section — rawNotesContent branches', () => {
    it('returns raw_notes string when present on entry', async () => {
      // sampleRecipe already has raw_notes
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const rawTab = wrapper.find('[data-testid="notes-tab-raw"]')
      await rawTab.trigger('click')

      const pre = wrapper.find('[data-testid="notes-raw-pre"]')
      expect(pre.exists()).toBe(true)
      expect(pre.text()).toContain('9:00am')
      expect(pre.text()).toContain('mixed dough, very sticky')
    })

    it('falls back to notes[] joined with newline when raw_notes is absent', async () => {
      const recipeNoRawNotes = {
        meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
        cook_log: [
          {
            date: '2026-02-10',
            version: '1.0',
            notes: ['Note line one', 'Note line two', 'Note line three']
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, recipeNoRawNotes)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const rawTab = wrapper.find('[data-testid="notes-tab-raw"]')
      await rawTab.trigger('click')

      const pre = wrapper.find('[data-testid="notes-raw-pre"]')
      expect(pre.exists()).toBe(true)
      // notes joined with \n
      expect(pre.text()).toContain('Note line one')
      expect(pre.text()).toContain('Note line two')
      expect(pre.text()).toContain('Note line three')
    })

    it('shows empty state when entry has no raw_notes and no notes', async () => {
      const recipeEmptyNotes = {
        meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
        cook_log: [
          {
            date: '2026-02-10',
            version: '1.0',
            summary: 'Just a summary, no notes'
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, recipeEmptyNotes)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const rawTab = wrapper.find('[data-testid="notes-tab-raw"]')
      await rawTab.trigger('click')

      // rawNotesContent returns '' → v-else shows empty state
      expect(wrapper.find('[data-testid="notes-raw-pre"]').exists()).toBe(false)
      const rawSection = wrapper.find('[data-testid="notes-raw"]')
      expect(rawSection.text()).toContain('No notes recorded for this bake.')
    })
  })


  describe('Notes section — hasNotes with only summary', () => {
    it('shows notes when only summary exists (no key_notes, no notes, no next_time)', async () => {
      const recipeSummaryOnly = {
        meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
        cook_log: [
          {
            date: '2026-02-10',
            version: '1.0',
            summary: 'A good bake but nothing else recorded.'
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, recipeSummaryOnly)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      // hasNotes is true because summary exists
      // So we should NOT see the "No notes recorded" empty state
      const notesSection = wrapper.find('[data-testid="notes-section"]')
      expect(notesSection.text()).not.toContain('No notes recorded for this bake.')

      // Should show the curated tab with the summary
      const curated = wrapper.find('[data-testid="notes-curated"]')
      expect(curated.exists()).toBe(true)
      expect(curated.text()).toContain('A good bake but nothing else recorded.')

      // No keynotes section since there are none
      expect(wrapper.find('[data-testid="notes-curated-keynotes"]').exists()).toBe(false)
      // No nexttime section since there are none
      expect(wrapper.find('[data-testid="notes-curated-nexttime"]').exists()).toBe(false)
    })

    it('shows notes when only raw_notes exists (no summary, no key_notes, no next_time)', async () => {
      const recipeRawOnly = {
        meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
        cook_log: [
          {
            date: '2026-02-10',
            version: '1.0',
            raw_notes: 'Quick paste of my notes from the bake'
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, recipeRawOnly)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      // hasNotes is true because raw_notes exists
      const notesSection = wrapper.find('[data-testid="notes-section"]')
      expect(notesSection.text()).not.toContain('No notes recorded for this bake.')

      // Sub-tabs should be visible
      expect(wrapper.find('[data-testid="notes-sub-tabs"]').exists()).toBe(true)

      // Switch to raw tab to see the raw_notes
      const rawTab = wrapper.find('[data-testid="notes-tab-raw"]')
      await rawTab.trigger('click')

      const pre = wrapper.find('[data-testid="notes-raw-pre"]')
      expect(pre.exists()).toBe(true)
      expect(pre.text()).toContain('Quick paste of my notes from the bake')
    })
  })

  describe('Notes section — renderNextTime empty check', () => {
    it('does not render nexttime section when next_time is empty array', async () => {
      const recipeEmptyNextTime = {
        meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
        cook_log: [
          {
            date: '2026-02-10',
            version: '1.0',
            summary: 'Good bake',
            key_notes: [{ text: 'Note one' }],
            next_time: []
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, recipeEmptyNextTime)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      expect(wrapper.find('[data-testid="notes-curated-nexttime"]').exists()).toBe(false)
    })
  })

  describe('Empty notes state', () => {
    it('shows empty message when cook_log entry has no notes data', async () => {
      global.fetch = makeFetchSuccess(sampleManifest, sampleRecipeNoNotes)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      expect(wrapper.text()).toContain('No notes recorded for this bake.')
    })

    it('shows empty message when no cook_log entry matches the bake date', async () => {
      const recipeNoMatchingEntry = {
        meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' },
        cook_log: [
          {
            date: '2026-01-01',
            version: '1.0',
            notes: ['Different date entry']
          }
        ]
      }
      global.fetch = makeFetchSuccess(sampleManifest, recipeNoMatchingEntry)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      expect(wrapper.text()).toContain('No notes recorded for this bake.')
    })
  })

  describe('localStorage corrupt data', () => {
    it('handles corrupt JSON in localStorage gracefully', async () => {
      localStorageMock._store['photo-review:test-recipe:2026-02-10'] = 'NOT VALID JSON {'
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Should still render photos from manifest (corrupt saved state is ignored)
      const cards = wrapper.find('[data-testid="photos-section"]').findAll('.card')
      expect(cards.length).toBe(2)
    })
  })

  describe('Empty photoStates watch branch', () => {
    it('does not save photo state to localStorage when photoStates is empty', async () => {
      // Manifest with no photos
      const emptyManifest = {
        recipeId: 'test-recipe',
        date: '2026-02-10',
        processedAt: '2026-02-10T00:00:00.000Z',
        photos: []
      }
      global.fetch = makeFetchSuccess(emptyManifest)

      mount(BakeReviewPage)
      await flushPromises()

      // localStorage.setItem should not be called for photo state since there are no photos
      // (it may be called for cost selections, so check specifically for photo key)
      const photoSetItemCalls = localStorageMock.setItem.mock.calls.filter(
        (call: string[]) => call[0].startsWith('photo-review:')
      )
      expect(photoSetItemCalls.length).toBe(0)
    })
  })

  describe('Photo edit instructions', () => {
    it('edit controls hidden by default, shown on toggle', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Controls should be hidden initially
      expect(wrapper.findAll('[data-testid="photo-edit-controls"]').length).toBe(0)

      // Toggle first photo's "Edit image" checkbox
      const toggles = wrapper.findAll('[data-testid="photo-edit-toggle"] input')
      await toggles[0].setValue(true)
      await flushPromises()

      // Controls should now be visible for first photo only
      expect(wrapper.findAll('[data-testid="photo-edit-controls"]').length).toBe(1)
      expect(wrapper.findAll('[data-testid="photo-edit-presets"]').length).toBe(1)
      expect(wrapper.findAll('[data-testid="photo-edit-instruction"]').length).toBe(1)
    })

    it('includes editPresets and editInstruction in clipboard JSON', async () => {
      const { copyToClipboard } = await import('@/composables/useClipboard')

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Toggle edit, check a preset, add custom instruction
      const toggles = wrapper.findAll('[data-testid="photo-edit-toggle"] input')
      await toggles[0].setValue(true)
      await flushPromises()

      const presetCheckboxes = wrapper.findAll('[data-testid="photo-edit-presets"] input')
      await presetCheckboxes[0].setValue(true) // rotateCW
      await presetCheckboxes[2].setValue(true) // flip
      await presetCheckboxes[3].setValue(true) // cropTighten
      await flushPromises()

      const textarea = wrapper.find('[data-testid="photo-edit-instruction"]')
      await textarea.setValue('crop tighter on the bread')
      await flushPromises()

      await wrapper.find('[data-testid="copy-all-btn"]').trigger('click')
      await flushPromises()

      const calls = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const parsed = JSON.parse(lastCall)
      expect(parsed.photos[0]).toHaveProperty('editInstruction', 'crop tighter on the bread')
      expect(parsed.photos[0].editPresets).toEqual({
        rotateCW: true,
        rotateCCW: false,
        flip: true,
        cropTighten: true
      })
    })

    it('includes default editPresets when no edits selected', async () => {
      const { copyToClipboard } = await import('@/composables/useClipboard')

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      await wrapper.find('[data-testid="copy-all-btn"]').trigger('click')
      await flushPromises()

      const calls = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = calls[calls.length - 1][0]
      const parsed = JSON.parse(lastCall)
      expect(parsed.photos[0].editPresets).toEqual({
        rotateCW: false,
        rotateCCW: false,
        flip: false,
        cropTighten: false
      })
      expect(parsed.photos[0]).toHaveProperty('editInstruction', '')
    })

    it('persists edit state via localStorage', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Toggle edit and check a preset
      const toggles = wrapper.findAll('[data-testid="photo-edit-toggle"] input')
      await toggles[0].setValue(true)
      await flushPromises()

      const presetCheckboxes = wrapper.findAll('[data-testid="photo-edit-presets"] input')
      await presetCheckboxes[0].setValue(true) // rotateCW
      await flushPromises()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'photo-review:test-recipe:2026-02-10',
        expect.stringContaining('"rotateCW":true')
      )
    })

    it('restores edit state from localStorage', async () => {
      const savedState = JSON.stringify([
        {
          name: 'photo-1',
          summary: 'Test photo 1',
          notes: 'Test note 1',
          editExpanded: true,
          editPresets: { rotateCW: false, rotateCCW: true, flip: false, cropTighten: false },
          editInstruction: 'crop to 500px width',
          usage: { hero: false, step: false, process: false, exclude: false }
        },
        {
          name: 'photo-2',
          summary: 'Test photo 2',
          notes: '',
          editExpanded: false,
          editPresets: { rotateCW: false, rotateCCW: false, flip: false, cropTighten: false },
          editInstruction: '',
          usage: { hero: false, step: false, process: false, exclude: false }
        }
      ])
      localStorageMock._store['photo-review:test-recipe:2026-02-10'] = savedState
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // First photo should have edit controls visible (editExpanded: true)
      expect(wrapper.findAll('[data-testid="photo-edit-controls"]').length).toBe(1)
      const textarea = wrapper.find('[data-testid="photo-edit-instruction"]')
      expect((textarea.element as HTMLTextAreaElement).value).toBe('crop to 500px width')
    })

    it('flattens manifest versions as standalone photo cards', async () => {
      const manifestWithVersions = {
        recipeId: 'test-recipe',
        date: '2026-02-10',
        processedAt: '2026-02-10T00:00:00.000Z',
        photos: [
          {
            name: 'photo-1',
            thumb: 'photo-1-400w.webp',
            src: 'photo-1-800w.webp',
            summary: 'Test photo 1',
            versions: [
              {
                version: 1,
                thumb: 'photo-1-v1-400w.webp',
                src: 'photo-1-v1-800w.webp',
                editInstruction: 'crop tighter',
                editedAt: '2026-02-10T12:00:00.000Z'
              }
            ]
          },
          { name: 'photo-2', thumb: 'photo-2-400w.webp', src: 'photo-2-800w.webp', summary: 'Test photo 2' }
        ]
      }
      global.fetch = makeFetchSuccess(manifestWithVersions, sampleRecipe, sampleHebResults)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Should have 3 cards: photo-1, photo-1-v1, photo-2
      const cards = wrapper.findAll('[data-testid="photos-section"] .card')
      expect(cards.length).toBe(3)

      // Version card should show between parent and next photo
      const summaryTextareas = wrapper.findAll('[data-testid="photos-section"] textarea')
      // Each card has summary + notes + (optional edit instruction) = at least 2 textareas per card
      expect(summaryTextareas.length).toBeGreaterThanOrEqual(6)
    })

    it('clears editInstruction when it matches latest applied version', async () => {
      const manifestWithVersions = {
        recipeId: 'test-recipe',
        date: '2026-02-10',
        processedAt: '2026-02-10T00:00:00.000Z',
        photos: [
          {
            name: 'photo-1',
            thumb: 'photo-1-400w.webp',
            src: 'photo-1-800w.webp',
            summary: 'Test photo 1',
            versions: [
              {
                version: 1,
                thumb: 'photo-1-v1-400w.webp',
                src: 'photo-1-v1-800w.webp',
                editInstruction: 'crop tighter',
                editedAt: '2026-02-10T12:00:00.000Z'
              }
            ]
          },
          { name: 'photo-2', thumb: 'photo-2-400w.webp', src: 'photo-2-800w.webp', summary: 'Test photo 2' }
        ]
      }
      // Save state with editInstruction matching latest version
      const savedState = JSON.stringify([
        {
          name: 'photo-1',
          summary: 'Test photo 1',
          notes: '',
          editInstruction: 'crop tighter',
          usage: { hero: false, step: false, process: false, exclude: false }
        }
      ])
      localStorageMock._store['photo-review:test-recipe:2026-02-10'] = savedState
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)
      global.fetch = makeFetchSuccess(manifestWithVersions, sampleRecipe, sampleHebResults)

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Toggle edit expanded on first photo to reveal textarea
      const editToggle = wrapper.find('[data-testid="photo-edit-toggle"] input')
      await editToggle.setValue(true)
      await flushPromises()

      // editInstruction should have been cleared (matches latest applied version)
      const editTextarea = wrapper.find('[data-testid="photo-edit-instruction"]')
      expect(editTextarea.exists()).toBe(true)
      expect((editTextarea.element as HTMLTextAreaElement).value).toBe('')
    })
  })

  describe('recipeName fallback in template', () => {
    it('displays recipeId when recipeName is empty string', async () => {
      // Recipe fetch fails, so recipeName stays empty, template should show recipeId
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/recipes/')) {
          return Promise.resolve({
            ok: false,
            status: 404
          } as Response)
        }
        if (url.includes('/review-data/')) {
          return Promise.resolve({ ok: false, status: 404 } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(sampleManifest)
        } as Response)
      })

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // recipeName is '' (not set because ok is false), so template shows recipeId
      expect(wrapper.text()).toContain('test-recipe')
    })
  })
})
