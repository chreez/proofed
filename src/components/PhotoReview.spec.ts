import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PhotoReview from './PhotoReview.vue'

// Mock vue-router
const mockRoute = {
  params: { recipeId: 'test-recipe', date: '2026-01-01' }
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute
}))

const sampleManifest = {
  recipeId: 'test-recipe',
  date: '2026-01-01',
  processedAt: '2026-01-01T00:00:00.000Z',
  photos: [
    { name: 'photo-1', thumb: 'photo-1-400w.webp', src: 'photo-1-800w.webp', summary: 'Test summary' },
    { name: 'photo-2', thumb: 'photo-2-400w.webp', src: 'photo-2-800w.webp', summary: '' }
  ]
}

function makeFetchSuccess(manifest = sampleManifest) {
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(manifest)
    } as Response)
  )
}

function makeFetchNotFound() {
  return vi.fn(() =>
    Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.reject(new Error('Not found'))
    } as Response)
  )
}

function makeFetchNetworkError() {
  return vi.fn(() => Promise.reject(new Error('Network error')))
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

describe('PhotoReview', () => {
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

  describe('Loading state', () => {
    it('shows loading text initially before manifest resolves', () => {
      // Use a fetch that never resolves
      global.fetch = vi.fn(() => new Promise(() => {}))

      const wrapper = mount(PhotoReview)

      expect(wrapper.text()).toContain('Loading manifest...')
    })

    it('hides loading text after manifest loads', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      expect(wrapper.text()).not.toContain('Loading manifest...')
    })
  })

  describe('Error state', () => {
    it('shows error when manifest fetch returns non-ok response', async () => {
      global.fetch = makeFetchNotFound()

      const wrapper = mount(PhotoReview)
      await flushPromises()

      expect(wrapper.text()).toContain('Manifest not found (404)')
    })

    it('shows error when fetch throws a network error', async () => {
      global.fetch = makeFetchNetworkError()

      const wrapper = mount(PhotoReview)
      await flushPromises()

      expect(wrapper.text()).toContain('Failed to load manifest')
    })

    it('does not render photo cards on error', async () => {
      global.fetch = makeFetchNotFound()

      const wrapper = mount(PhotoReview)
      await flushPromises()

      expect(wrapper.findAll('.card').length).toBeLessThanOrEqual(1) // error card only
      expect(wrapper.find('textarea').exists()).toBe(false)
    })
  })

  describe('Rendering after successful load', () => {
    it('renders header with recipeId and date', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      expect(wrapper.text()).toContain('Photo Review')
      expect(wrapper.text()).toContain('test-recipe')
      expect(wrapper.text()).toContain('2026-01-01')
    })

    it('renders a card for each photo in the manifest', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(2)
    })

    it('renders photo thumbnails with correct src', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const imgs = wrapper.findAll('img')
      const thumbSrcs = imgs.map(img => img.attributes('src')).filter(s => s?.includes('400w'))
      expect(thumbSrcs).toContain('/images/test-recipe/2026-01-01/photo-1-400w.webp')
      expect(thumbSrcs).toContain('/images/test-recipe/2026-01-01/photo-2-400w.webp')
    })

    it('renders photo name under each thumbnail', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      expect(wrapper.text()).toContain('photo-1')
      expect(wrapper.text()).toContain('photo-2')
    })

    it('renders summary textarea pre-filled from manifest', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const textareas = wrapper.findAll('textarea')
      // First textarea is summary for photo-1
      const summaryTextarea = textareas[0]
      expect((summaryTextarea.element as HTMLTextAreaElement).value).toBe('Test summary')
    })

    it('renders usage checkboxes for each photo', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      // 4 checkboxes per photo (hero, step, process, exclude) * 2 photos = 8
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(8)
    })

    it('renders submit button', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const button = wrapper.find('button')
      expect(button.text()).toContain('Copy feedback to clipboard')
    })

    it('fetches the correct manifest URL', async () => {
      mount(PhotoReview)
      await flushPromises()

      expect(global.fetch).toHaveBeenCalledWith('/images/test-recipe/2026-01-01/manifest.json')
    })
  })

  describe('Hero radio behavior', () => {
    it('sets hero on the clicked photo', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      // Hero is the first checkbox of each photo card group
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      // checkboxes: [hero-0, step-0, process-0, exclude-0, hero-1, step-1, process-1, exclude-1]
      await checkboxes[0].setValue(true) // hero for photo-1

      // hero-0 should be checked
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    })

    it('clears hero on other photos when hero is set (radio behavior)', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set hero on photo-1
      await checkboxes[0].trigger('change')
      await flushPromises()

      // Set hero on photo-2
      await checkboxes[4].trigger('change')
      await flushPromises()

      // photo-1 hero should be cleared, photo-2 hero should be set
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false)
      expect((checkboxes[4].element as HTMLInputElement).checked).toBe(true)
    })

    it('setting hero clears exclude on that photo', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // First set exclude on photo-1
      await checkboxes[3].trigger('change') // exclude-0
      await flushPromises()
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(true)

      // Now set hero on photo-1
      await checkboxes[0].trigger('change') // hero-0
      await flushPromises()

      // exclude should be cleared
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false)
    })
  })

  describe('Exclude mutual exclusivity', () => {
    it('setting exclude clears hero, step, and process', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set hero and step on photo-1
      await checkboxes[0].trigger('change') // hero-0
      await checkboxes[1].trigger('change') // step-0
      await checkboxes[2].trigger('change') // process-0
      await flushPromises()

      // Now set exclude
      await checkboxes[3].trigger('change') // exclude-0
      await flushPromises()

      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false) // hero cleared
      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false) // step cleared
      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false) // process cleared
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(true) // exclude set
    })

    it('excluded card has reduced opacity class', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Exclude photo-1
      await checkboxes[3].trigger('change') // exclude-0
      await flushPromises()

      const cards = wrapper.findAll('.card')
      expect(cards[0].classes()).toContain('opacity-40')
    })
  })

  describe('Step/Process toggles clear exclude', () => {
    it('toggling step on clears exclude', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set exclude on photo-1
      await checkboxes[3].trigger('change') // exclude-0
      await flushPromises()
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(true)

      // Now set step on photo-1
      await checkboxes[1].trigger('change') // step-0
      await flushPromises()

      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true) // step set
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false) // exclude cleared
    })

    it('toggling process on clears exclude', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set exclude on photo-1
      await checkboxes[3].trigger('change') // exclude-0
      await flushPromises()
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(true)

      // Now set process on photo-1
      await checkboxes[2].trigger('change') // process-0
      await flushPromises()

      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(true) // process set
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false) // exclude cleared
    })

    it('toggling step off does NOT re-enable exclude', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set step on
      await checkboxes[1].trigger('change') // step-0 ON
      await flushPromises()

      // Toggle step off
      await checkboxes[1].trigger('change') // step-0 OFF
      await flushPromises()

      // exclude should still be off
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false)
    })
  })

  describe('localStorage persistence', () => {
    it('saves state to localStorage on usage change', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      await checkboxes[0].trigger('change') // hero-0
      await flushPromises()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'photo-review:test-recipe:2026-01-01',
        expect.any(String)
      )
    })

    it('saves state to localStorage on summary change', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const textareas = wrapper.findAll('textarea')
      await textareas[0].setValue('Updated summary')
      await flushPromises()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'photo-review:test-recipe:2026-01-01',
        expect.any(String)
      )
    })

    it('saved data includes name, summary, notes, and usage', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      await checkboxes[0].trigger('change') // hero-0
      await flushPromises()

      const savedCalls = localStorageMock.setItem.mock.calls.filter(
        (c: string[]) => c[0] === 'photo-review:test-recipe:2026-01-01'
      )
      expect(savedCalls.length).toBeGreaterThan(0)

      const lastSaved = JSON.parse(savedCalls[savedCalls.length - 1][1])
      expect(lastSaved[0]).toHaveProperty('name', 'photo-1')
      expect(lastSaved[0]).toHaveProperty('summary')
      expect(lastSaved[0]).toHaveProperty('notes')
      expect(lastSaved[0]).toHaveProperty('usage')
      expect(lastSaved[0].usage).toHaveProperty('hero', true)
    })

    it('restores state from localStorage on mount', async () => {
      const savedState = JSON.stringify([
        {
          name: 'photo-1',
          summary: 'Saved summary',
          notes: 'Saved notes',
          usage: { hero: true, step: false, process: false, exclude: false }
        },
        {
          name: 'photo-2',
          summary: 'Photo 2 summary',
          notes: '',
          usage: { hero: false, step: true, process: false, exclude: false }
        }
      ])
      localStorageMock._store['photo-review:test-recipe:2026-01-01'] = savedState
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)

      const wrapper = mount(PhotoReview)
      await flushPromises()

      // Check restored summary
      const textareas = wrapper.findAll('textarea')
      expect((textareas[0].element as HTMLTextAreaElement).value).toBe('Saved summary')

      // Check restored notes
      expect((textareas[1].element as HTMLTextAreaElement).value).toBe('Saved notes')

      // Check restored hero checkbox
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true) // hero-0
      expect((checkboxes[5].element as HTMLInputElement).checked).toBe(true) // step-1
    })

    it('ignores corrupt localStorage data gracefully', async () => {
      localStorageMock._store['photo-review:test-recipe:2026-01-01'] = '{invalid json'
      localStorageMock.getItem.mockImplementation((key: string) => localStorageMock._store[key] ?? null)

      const wrapper = mount(PhotoReview)
      await flushPromises()

      // Should still render with default state from manifest
      const textareas = wrapper.findAll('textarea')
      expect((textareas[0].element as HTMLTextAreaElement).value).toBe('Test summary')

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false)
    })
  })

  describe('Submit / copy to clipboard', () => {
    it('copies JSON payload to clipboard on submit', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const wrapper = mount(PhotoReview)
      await flushPromises()

      await wrapper.find('button').trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledTimes(1)
      const copiedJson = JSON.parse(writeText.mock.calls[0][0])
      expect(copiedJson).toHaveProperty('recipeId', 'test-recipe')
      expect(copiedJson).toHaveProperty('date', '2026-01-01')
      expect(copiedJson.photos).toHaveLength(2)
    })

    it('payload includes photo src and thumb paths', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const wrapper = mount(PhotoReview)
      await flushPromises()

      await wrapper.find('button').trigger('click')
      await flushPromises()

      const copiedJson = JSON.parse(writeText.mock.calls[0][0])
      expect(copiedJson.photos[0].src).toBe('photo-1-800w.webp')
      expect(copiedJson.photos[0].thumb).toBe('photo-1-400w.webp')
    })

    it('payload reflects current usage state', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const wrapper = mount(PhotoReview)
      await flushPromises()

      // Set hero on photo-1 and exclude on photo-2
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      await checkboxes[0].trigger('change') // hero-0
      await checkboxes[7].trigger('change') // exclude-1
      await flushPromises()

      await wrapper.find('button').trigger('click')
      await flushPromises()

      const copiedJson = JSON.parse(writeText.mock.calls[0][0])
      expect(copiedJson.photos[0].usage.hero).toBe(true)
      expect(copiedJson.photos[1].usage.exclude).toBe(true)
    })

    it('payload reflects edited summary and notes', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const wrapper = mount(PhotoReview)
      await flushPromises()

      // Edit summary and notes
      const textareas = wrapper.findAll('textarea')
      await textareas[0].setValue('Updated summary')
      await textareas[1].setValue('Some notes')
      await flushPromises()

      await wrapper.find('button').trigger('click')
      await flushPromises()

      const copiedJson = JSON.parse(writeText.mock.calls[0][0])
      expect(copiedJson.photos[0].summary).toBe('Updated summary')
      expect(copiedJson.photos[0].notes).toBe('Some notes')
    })

    it('shows "Copied!" text after submit', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const wrapper = mount(PhotoReview)
      await flushPromises()

      await wrapper.find('button').trigger('click')
      await flushPromises()

      expect(wrapper.find('button').text()).toContain('Copied!')
    })

    it('resets "Copied!" text after timeout', async () => {
      vi.useFakeTimers()
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const wrapper = mount(PhotoReview)
      await flushPromises()

      await wrapper.find('button').trigger('click')
      await flushPromises()

      expect(wrapper.find('button').text()).toContain('Copied!')

      vi.advanceTimersByTime(2000)
      await flushPromises()

      expect(wrapper.find('button').text()).toContain('Copy feedback to clipboard')

      vi.useRealTimers()
    })
  })

  describe('Edge cases', () => {
    it('handles manifest with zero photos', async () => {
      global.fetch = makeFetchSuccess({
        ...sampleManifest,
        photos: []
      })

      const wrapper = mount(PhotoReview)
      await flushPromises()

      expect(wrapper.findAll('.card').length).toBe(0)
      // Submit button should still render
      expect(wrapper.find('button').exists()).toBe(true)
    })

    it('handles manifest with single photo', async () => {
      global.fetch = makeFetchSuccess({
        ...sampleManifest,
        photos: [
          { name: 'solo', thumb: 'solo-400w.webp', src: 'solo-800w.webp', summary: 'Solo photo' }
        ]
      })

      const wrapper = mount(PhotoReview)
      await flushPromises()

      expect(wrapper.findAll('.card').length).toBe(1)
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(4)
    })

    it('hero radio works correctly with single photo', async () => {
      global.fetch = makeFetchSuccess({
        ...sampleManifest,
        photos: [
          { name: 'solo', thumb: 'solo-400w.webp', src: 'solo-800w.webp', summary: 'Solo photo' }
        ]
      })

      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      await checkboxes[0].trigger('change') // hero
      await flushPromises()

      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    })

    it('exclude toggle is idempotent — toggling off does not affect other flags', async () => {
      const wrapper = mount(PhotoReview)
      await flushPromises()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')

      // Set exclude on
      await checkboxes[3].trigger('change') // exclude-0 ON
      await flushPromises()

      // Toggle exclude off
      await checkboxes[3].trigger('change') // exclude-0 OFF
      await flushPromises()

      // All flags should be off
      expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false) // hero
      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(false) // step
      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false) // process
      expect((checkboxes[3].element as HTMLInputElement).checked).toBe(false) // exclude
    })
  })
})
