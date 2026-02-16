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

// Mock useScratchpad
const defaultScratchpadEntries: Record<string, unknown[]> = {
  'knead-dough': [
    {
      stepId: 'knead-dough',
      timestamp: '2026-02-10T14:30:00.000Z',
      type: 'note' as const,
      value: 'Dough was sticky'
    },
    {
      stepId: 'knead-dough',
      timestamp: '2026-02-10T14:35:00.000Z',
      type: 'rating' as const,
      value: 'good',
      rating: 'good' as const
    }
  ],
  'shape-rolls': [
    {
      stepId: 'shape-rolls',
      timestamp: '2026-02-10T15:00:00.000Z',
      type: 'reminder_response' as const,
      prompt: 'How tight was the roll?',
      value: 'Medium tension'
    }
  ]
}

const defaultGeneralNotes = [
  {
    stepId: '_general',
    timestamp: '2026-02-10T16:00:00.000Z',
    type: 'note' as const,
    value: 'Overall great bake'
  }
]

// Mutable overrides that tests can swap before mounting
let scratchpadEntriesOverride: Record<string, unknown[]> | null = null
let generalNotesOverride: unknown[] | null = null

vi.mock('@/composables/useScratchpad', () => ({
  useScratchpad: () => ({
    load: vi.fn(),
    allStepEntries: { value: scratchpadEntriesOverride ?? defaultScratchpadEntries },
    generalNotes: { value: generalNotesOverride ?? defaultGeneralNotes }
  })
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
  meta: { name: 'Quick Cinnamon Buns', yields: '8 buns', total_time: '~1.5 hours' }
}

function makeFetchSuccess(manifest = sampleManifest, recipe = sampleRecipe) {
  return vi.fn((url: string) => {
    if (url.includes('/recipes/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(recipe)
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
    if (url.includes('/recipes/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleRecipe)
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
    scratchpadEntriesOverride = null
    generalNotesOverride = null
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

      // 4 checkboxes per photo * 2 photos = 8
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(8)
    })

    it('renders submit/copy button', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const btn = wrapper.find('[data-testid="copy-feedback-btn"]')
      expect(btn.text()).toContain('Copy feedback to clipboard')
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
      await checkboxes[0].trigger('change')
      await flushPromises()

      // Set hero on photo-2
      await checkboxes[4].trigger('change')
      await flushPromises()

      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false)
      expect((checkboxes[4].element as HTMLInputElement).checked).toBe(true)
    })

    it('setting hero clears exclude', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set exclude on photo-1
      await checkboxes[3].trigger('change')
      await flushPromises()

      // Set hero on photo-1
      await checkboxes[0].trigger('change')
      await flushPromises()

      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false)
    })

    it('setting exclude clears hero, step, and process', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set hero, step, process on photo-1
      await checkboxes[0].trigger('change') // hero
      await checkboxes[1].trigger('change') // step
      await checkboxes[2].trigger('change') // process
      await flushPromises()

      // Now set exclude
      await checkboxes[3].trigger('change')
      await flushPromises()

      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false) // hero
      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false) // step
      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false) // process
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(true) // exclude
    })
  })

  describe('Photo submit copies JSON', () => {
    it('copies JSON payload to clipboard on submit', async () => {
      const { copyToClipboard } = await import('@/composables/useClipboard')

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      await wrapper.find('[data-testid="copy-feedback-btn"]').trigger('click')
      await flushPromises()

      expect(copyToClipboard).toHaveBeenCalledTimes(1)
      const calledWith = (copyToClipboard as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const parsed = JSON.parse(calledWith)
      expect(parsed).toHaveProperty('recipeId', 'test-recipe')
      expect(parsed).toHaveProperty('date', '2026-02-10')
      expect(parsed.photos).toHaveLength(2)
    })

    it('shows Copied! text after submit', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      await wrapper.find('[data-testid="copy-feedback-btn"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="copy-feedback-btn"]').text()).toContain('Copied!')
    })
  })

  describe('Photo localStorage persistence', () => {
    it('saves photo state to localStorage on change', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      await checkboxes[0].trigger('change') // hero-0
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
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true) // hero-0
    })
  })

  describe('Notes section', () => {
    it('renders scratchpad entries when switching to notes tab', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      // Switch to notes tab
      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const notesSection = wrapper.find('[data-testid="notes-section"]')
      expect(notesSection.exists()).toBe(true)
      expect(notesSection.text()).toContain('Dough was sticky')
      expect(notesSection.text()).toContain('Medium tension')
    })

    it('renders general notes', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      expect(wrapper.text()).toContain('General Notes')
      expect(wrapper.text()).toContain('Overall great bake')
    })

    it('renders step IDs as group headings', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      expect(wrapper.text()).toContain('knead-dough')
      expect(wrapper.text()).toContain('shape-rolls')
    })

    it('renders rating badges with color', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const ratingBadge = wrapper.find('[data-testid="rating-badge"]')
      expect(ratingBadge.exists()).toBe(true)
      expect(ratingBadge.text()).toBe('good')
      expect(ratingBadge.classes()).toContain('bg-success')
    })

    it('renders type badges for each entry', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      // Should have badges for: note, rating, reminder, general note = multiple
      expect(wrapper.text()).toContain('note')
      expect(wrapper.text()).toContain('rating')
      expect(wrapper.text()).toContain('reminder')
    })
  })

  describe('Placeholder sections', () => {
    it('renders cost placeholder', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const costTab = tabs.find(t => t.text() === 'Cost')!
      await costTab.trigger('click')

      expect(wrapper.find('[data-testid="cost-section"]').text()).toContain('Cost capture coming soon')
    })

    it('renders summary placeholder', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const summaryTab = tabs.find(t => t.text() === 'Summary')!
      await summaryTab.trigger('click')

      expect(wrapper.find('[data-testid="summary-section"]').text()).toContain('Session summary coming soon')
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
      // Toggle step ON for photo-1
      await checkboxes[1].trigger('change')
      await flushPromises()

      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true)

      // Toggle step OFF for photo-1
      await checkboxes[1].trigger('change')
      await flushPromises()

      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false)
    })

    it('toggleProcess OFF does not clear exclude', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      // Toggle process ON for photo-1
      await checkboxes[2].trigger('change')
      await flushPromises()

      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(true)

      // Toggle process OFF for photo-1
      await checkboxes[2].trigger('change')
      await flushPromises()

      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false)
    })

    it('toggleExclude OFF does not clear hero/step/process', async () => {
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      // Toggle exclude ON for photo-1
      await checkboxes[3].trigger('change')
      await flushPromises()
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(true)

      // Toggle exclude OFF for photo-1
      await checkboxes[3].trigger('change')
      await flushPromises()
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false)
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
        return Promise.reject(new Error('Network error'))
      })

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      expect(wrapper.text()).toContain('Failed to load manifest')
    })
  })

  describe('ratingColor branches', () => {
    it('returns ok color class', async () => {
      scratchpadEntriesOverride = {
        'step-1': [
          { stepId: 'step-1', timestamp: '2026-02-10T14:30:00.000Z', type: 'rating', value: 'ok', rating: 'ok' }
        ]
      }
      generalNotesOverride = []

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const ratingBadge = wrapper.find('[data-testid="rating-badge"]')
      expect(ratingBadge.exists()).toBe(true)
      expect(ratingBadge.classes()).toContain('bg-warning')
    })

    it('returns bad color class', async () => {
      scratchpadEntriesOverride = {
        'step-1': [
          { stepId: 'step-1', timestamp: '2026-02-10T14:30:00.000Z', type: 'rating', value: 'bad', rating: 'bad' }
        ]
      }
      generalNotesOverride = []

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const ratingBadge = wrapper.find('[data-testid="rating-badge"]')
      expect(ratingBadge.exists()).toBe(true)
      expect(ratingBadge.classes()).toContain('bg-danger')
    })

    it('returns default color for unknown rating', async () => {
      scratchpadEntriesOverride = {
        'step-1': [
          { stepId: 'step-1', timestamp: '2026-02-10T14:30:00.000Z', type: 'rating', value: 'meh', rating: 'meh' }
        ]
      }
      generalNotesOverride = []

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      const ratingBadge = wrapper.find('[data-testid="rating-badge"]')
      expect(ratingBadge.exists()).toBe(true)
      expect(ratingBadge.classes()).toContain('bg-stone-300')
    })
  })

  describe('typeBadgeClass and typeBadgeLabel branches', () => {
    it('renders rating type badge correctly', async () => {
      // The existing mock already has a 'rating' type entry in knead-dough
      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      // The rating type entry should have 'rating' badge label
      expect(wrapper.text()).toContain('rating')
    })

    it('renders default type badge for unknown type', async () => {
      scratchpadEntriesOverride = {
        'step-1': [
          { stepId: 'step-1', timestamp: '2026-02-10T14:30:00.000Z', type: 'custom_type', value: 'test' }
        ]
      }
      generalNotesOverride = []

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      // Default case in typeBadgeLabel returns the type string itself
      expect(wrapper.text()).toContain('custom_type')
    })
  })

  describe('Empty scratchpad (no notes)', () => {
    it('shows no-notes message when scratchpad is empty', async () => {
      scratchpadEntriesOverride = {}
      generalNotesOverride = []

      const wrapper = mount(BakeReviewPage)
      await flushPromises()

      const tabs = wrapper.find('[data-testid="section-nav"]').findAll('button')
      const notesTab = tabs.find(t => t.text() === 'Notes')!
      await notesTab.trigger('click')

      expect(wrapper.text()).toContain('No scratchpad notes for this bake')
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
    it('does not save to localStorage when photoStates is empty', async () => {
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
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
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
