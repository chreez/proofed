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

  it('shows hero thumbnail when entry has photos', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          {
            date: '2026-02-10',
            version: 'v1.2.0',
            summary: 'Bake with photos',
            notes: [],
            photos: [
              { src: '/images/photo-1-800w.webp', thumb: '/images/photo-1-400w.webp', alt: 'Process shot' },
              { src: '/images/photo-2-800w.webp', thumb: '/images/photo-2-400w.webp', alt: 'Finished buns' }
            ]
          }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    const thumb = wrapper.find('.bake-log-thumb')
    expect(thumb.exists()).toBe(true)
    // Hero = last photo in array
    expect(thumb.attributes('src')).toBe('/images/photo-2-400w.webp')
    expect(thumb.attributes('alt')).toBe('Finished buns')
  })

  it('does not show thumbnail when entry has no photos', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-02-10', version: 'v1.2.0', summary: 'No photos bake', notes: [] }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    expect(wrapper.find('.bake-log-thumb').exists()).toBe(false)
    // Text content still renders
    expect(wrapper.find('.bake-log-name').text()).toBe('ATK Ultimate Cinnamon Buns')
  })

  it('shows thumb for entries with photos and no thumb for entries without', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          {
            date: '2026-02-10',
            version: 'v1.2.0',
            summary: 'Has photos',
            notes: [],
            photos: [
              { src: '/images/hero-800w.webp', thumb: '/images/hero-400w.webp', alt: 'Hero shot' }
            ]
          }
        ]
      },
      'tartine-baguette.json': {
        cook_log: [
          { date: '2026-02-09', version: 'v1.0.0', summary: 'No photos', notes: [] }
        ]
      }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    const rows = wrapper.findAll('.bake-log-item')
    expect(rows.length).toBe(2)

    // First row (Feb 10) has photo
    expect(rows[0].find('.bake-log-thumb').exists()).toBe(true)
    // Second row (Feb 9) has no photo
    expect(rows[1].find('.bake-log-thumb').exists()).toBe(false)
  })

  it('uses hero thumb from single-photo entry', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          {
            date: '2026-02-10',
            version: 'v1.2.0',
            notes: [],
            photos: [
              { src: '/images/only-800w.webp', thumb: '/images/only-400w.webp', alt: 'Only photo' }
            ]
          }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    const thumb = wrapper.find('.bake-log-thumb')
    expect(thumb.exists()).toBe(true)
    expect(thumb.attributes('src')).toBe('/images/only-400w.webp')
    expect(thumb.attributes('alt')).toBe('Only photo')
  })

  it('shows end date only when start_date differs from date', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-02-20', start_date: '2026-02-19', version: 'v2.0.0', summary: 'Multi-day bake', notes: [] }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    // Always shows end date, never a range
    expect(wrapper.find('.bake-log-date').text()).toBe('Feb 20')
  })

  it('shows single date when start_date is absent', async () => {
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

    expect(wrapper.find('.bake-log-date').text()).toBe('Feb 10')
  })

  it('shows "since" in in-progress status when start_date exists', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-02-20', start_date: '2026-02-19', version: 'v2.0.0', status: 'in_progress', notes: [] }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    expect(wrapper.find('.bake-log-status').text()).toContain('In Progress (since Feb 19)')
  })

  // --- Weather badge (PF-210) ---

  it('shows weather badge when entry has weather data', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [{
          date: '2026-02-10', version: 'v1.2.0', notes: [],
          weather: { location: 'Austin, TX', date: '2026-02-10', temp_high_f: 75, temp_low_f: 58, humidity_avg_percent: 90, condition: 'Rain', source: 'open-meteo' }
        }]
      },
      'tartine-baguette.json': { cook_log: [] }
    })
    const wrapper = mount(BakeLogPage)
    await flushPromises()

    const badge = wrapper.find('[data-testid="weather-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('75°/58°')
    expect(badge.text()).toContain('90%rh')
    expect(badge.text()).toContain('🌧️')
  })

  it('hides weather badge when entry has no weather data', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [{ date: '2026-02-10', version: 'v1.2.0', notes: [] }]
      },
      'tartine-baguette.json': { cook_log: [] }
    })
    const wrapper = mount(BakeLogPage)
    await flushPromises()

    expect(wrapper.find('[data-testid="weather-badge"]').exists()).toBe(false)
  })

  it('maps Clear sky condition to sun icon', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [{
          date: '2026-02-10', version: 'v1.2.0', notes: [],
          weather: { location: 'Austin, TX', date: '2026-02-10', temp_high_f: 82, temp_low_f: 60, humidity_avg_percent: 45, condition: 'Clear sky', source: 'open-meteo' }
        }]
      },
      'tartine-baguette.json': { cook_log: [] }
    })
    const wrapper = mount(BakeLogPage)
    await flushPromises()

    expect(wrapper.find('[data-testid="weather-badge"]').text()).toContain('☀️')
  })

  it('maps Overcast to cloud icon', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [{
          date: '2026-02-10', version: 'v1.2.0', notes: [],
          weather: { location: 'Austin, TX', date: '2026-02-10', temp_high_f: 70, temp_low_f: 55, humidity_avg_percent: 80, condition: 'Overcast', source: 'open-meteo' }
        }]
      },
      'tartine-baguette.json': { cook_log: [] }
    })
    const wrapper = mount(BakeLogPage)
    await flushPromises()
    expect(wrapper.find('[data-testid="weather-badge"]').text()).toContain('☁️')
  })

  it('maps Drizzle to drizzle icon', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [{
          date: '2026-02-10', version: 'v1.2.0', notes: [],
          weather: { location: 'Austin, TX', date: '2026-02-10', temp_high_f: 65, temp_low_f: 52, humidity_avg_percent: 95, condition: 'Drizzle', source: 'open-meteo' }
        }]
      },
      'tartine-baguette.json': { cook_log: [] }
    })
    const wrapper = mount(BakeLogPage)
    await flushPromises()
    expect(wrapper.find('[data-testid="weather-badge"]').text()).toContain('🌦️')
  })

  it('uses fallback icon for unknown condition', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [{
          date: '2026-02-10', version: 'v1.2.0', notes: [],
          weather: { location: 'Austin, TX', date: '2026-02-10', temp_high_f: 60, temp_low_f: 45, humidity_avg_percent: 50, condition: 'Fog', source: 'open-meteo' }
        }]
      },
      'tartine-baguette.json': { cook_log: [] }
    })
    const wrapper = mount(BakeLogPage)
    await flushPromises()
    expect(wrapper.find('[data-testid="weather-badge"]').text()).toContain('🌤️')
  })

  it('shows plain "In Progress" when in-progress entry has no start_date', async () => {
    global.fetch = makeFetchMockByFile({
      'atk-cinnamon-buns-ultimate.json': {
        cook_log: [
          { date: '2026-02-20', version: 'v2.0.0', status: 'in_progress', notes: [] }
        ]
      },
      'tartine-baguette.json': { cook_log: [] }
    })

    const wrapper = mount(BakeLogPage)
    await flushPromises()

    expect(wrapper.find('.bake-log-status').text()).toBe('In Progress')
  })

  describe('tag search', () => {
    it('renders the TagSearch input when bakes exist', async () => {
      global.fetch = makeFetchMockByFile({
        'atk-cinnamon-buns-ultimate.json': { cook_log: [{ date: '2026-04-10', version: 'v1.0.0', notes: [] }] },
        'tartine-baguette.json': { cook_log: [] }
      })
      const wrapper = mount(BakeLogPage)
      await flushPromises()
      expect(wrapper.find('[data-testid="tag-search-input"]').exists()).toBe(true)
    })

    it('filters the timeline when a chip is active', async () => {
      global.fetch = makeFetchMockByFile({
        'atk-cinnamon-buns-ultimate.json': { cook_log: [{ date: '2026-04-10', version: 'v1.0.0', notes: [] }] },
        'tartine-baguette.json': { cook_log: [{ date: '2026-04-15', version: 'v1.1.0', notes: [] }] }
      })
      const wrapper = mount(BakeLogPage)
      await flushPromises()
      expect(wrapper.findAll('.bake-log-item').length).toBe(2)

      const tagSearch = wrapper.findComponent({ name: 'TagSearch' })
      await tagSearch.setValue(['name:baguette'], 'modelValue')
      await flushPromises()
      const rows = wrapper.findAll('.bake-log-item')
      expect(rows.length).toBe(1)
      expect(rows[0].text()).toContain('Tartine Baguette')
    })

    it('shows "No bakes match" when filter yields zero results', async () => {
      global.fetch = makeFetchMockByFile({
        'atk-cinnamon-buns-ultimate.json': { cook_log: [{ date: '2026-04-10', version: 'v1.0.0', notes: [] }] },
        'tartine-baguette.json': { cook_log: [] }
      })
      const wrapper = mount(BakeLogPage)
      await flushPromises()
      const tagSearch = wrapper.findComponent({ name: 'TagSearch' })
      await tagSearch.setValue(['name:nonexistent'], 'modelValue')
      await flushPromises()
      expect(wrapper.text()).toContain('No bakes match the current filter.')
    })

    it('renders preview slot with photo + weather variants in dropdown', async () => {
      global.fetch = makeFetchMockByFile({
        'atk-cinnamon-buns-ultimate.json': { cook_log: [{
          date: '2026-04-10', version: 'v1.0.0', notes: [],
          photos: [{ src: '/img/h.webp', thumb: '/img/t.webp', alt: 'photo' }],
          weather: { location: 'A', date: '2026-04-10', temp_high_f: 80, temp_low_f: 60, humidity_avg_percent: 50, condition: 'Clear sky', source: 'open-meteo' }
        }] },
        'tartine-baguette.json': { cook_log: [{ date: '2026-04-15', version: 'v1.0.0', notes: [] }] }
      })
      const wrapper = mount(BakeLogPage, { attachTo: document.body })
      await flushPromises()
      const input = wrapper.find('[data-testid="tag-search-input"]')
      await input.setValue('atk')
      await input.trigger('focus')
      await flushPromises()
      const previews = wrapper.findAll('[data-testid="result-preview"]')
      expect(previews.length).toBeGreaterThan(0)
      expect(wrapper.html()).toContain('ATK Ultimate Cinnamon Buns')
      // verify both branches: one entry has heroThumb (img) + weather, other has neither
      await input.setValue('baguette')
      await flushPromises()
      expect(wrapper.findAll('[data-testid="result-preview"]').length).toBeGreaterThan(0)
      wrapper.unmount()
    })

    it('navigates when a preview is clicked through the search', async () => {
      global.fetch = makeFetchMockByFile({
        'atk-cinnamon-buns-ultimate.json': { cook_log: [{ date: '2026-04-10', version: 'v1.0.0', notes: [] }] },
        'tartine-baguette.json': { cook_log: [] }
      })
      const wrapper = mount(BakeLogPage)
      await flushPromises()
      const tagSearch = wrapper.findComponent({ name: 'TagSearch' })
      tagSearch.vm.$emit('navigate', {
        recipeId: 'atk-cinnamon-buns-ultimate', date: '2026-04-10',
        recipeName: 'ATK', version: 'v1.0.0', summary: null, heroThumb: null, heroAlt: null, weather: null
      })
      await flushPromises()
      expect(mockPush).toHaveBeenCalledWith('/recipe/atk-cinnamon-buns-ultimate/bake/2026-04-10')
    })
  })
})
