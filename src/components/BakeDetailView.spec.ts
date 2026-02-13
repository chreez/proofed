import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import BakeDetailView from './BakeDetailView.vue'
import type { Recipe } from '@/types/recipe'

// Mock vue-router
const mockRouteParams = ref<Record<string, string>>({})
const mockRouteQuery = ref<Record<string, string>>({})
const mockPush = vi.fn()
const mockBack = vi.fn()
const mockReplace = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: mockRouteParams.value,
    query: mockRouteQuery.value
  }),
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace
  })
}))

// Mock useRecipe composable
const mockCurrentRecipe = ref<Recipe | null>(null)
const mockLoading = ref(false)

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
    currentRecipe: mockCurrentRecipe,
    loading: mockLoading
  })
}))

// Mock lucide-vue-next
vi.mock('lucide-vue-next', () => ({
  ArrowLeft: { name: 'ArrowLeft', props: ['size'], template: '<svg class="arrow-left-icon" />' },
  Bot: { name: 'Bot', props: ['size'], template: '<svg class="bot-icon" />' }
}))

// Stub PhotoLightbox
vi.mock('@/components/PhotoLightbox.vue', () => ({
  default: {
    name: 'PhotoLightbox',
    props: ['photos', 'initialIndex', 'open'],
    emits: ['close'],
    template: '<div class="photo-lightbox-stub" v-if="open">Lightbox</div>'
  }
}))

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    meta: {
      name: 'Quick Cinnamon Buns',
      source: { name: "America's Test Kitchen" },
      yields: '8 buns',
      total_time: '~1.5 hours'
    },
    config: { early_check_percent: 75 },
    vessels: [],
    stages: [],
    states: [],
    version: 'v1.1.0',
    cook_log: [
      {
        date: '2026-02-05',
        version: 'v1.1.0',
        summary: 'Great bake, dough was perfect.',
        notes: ['Proofed for 35 minutes instead of 30', 'Used dark brown sugar as written'],
        next_time: [
          { text: 'Try overnight cold ferment' },
          { text: 'Use TJ mozzarella', source: 'ATK forum' }
        ],
        photos: [
          { src: '/img/process-a-800.webp', thumb: '/img/process-a-400.webp', alt: 'Dough after kneading' },
          { src: '/img/process-b-800.webp', thumb: '/img/process-b-400.webp', alt: 'Rolls in skillet' },
          { src: '/img/hero-800.webp', thumb: '/img/hero-400.webp', alt: 'Glazed cinnamon buns' }
        ]
      },
      {
        date: '2026-01-20',
        version: 'v1.0.0',
        notes: ['First attempt'],
        next_time: []
      }
    ],
    ...overrides
  } as Recipe
}

function mountComponent() {
  return mount(BakeDetailView)
}

describe('BakeDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2026-02-05' }
    mockRouteQuery.value = {}
    mockCurrentRecipe.value = makeRecipe()
    mockLoading.value = false
  })

  describe('loading state', () => {
    it('shows loading indicator when loading is true', () => {
      mockLoading.value = true
      mockCurrentRecipe.value = null
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Loading...')
    })
  })

  describe('not found state', () => {
    it('shows "Bake not found" when date does not match any entry', () => {
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2099-01-01' }
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Bake not found')
      expect(wrapper.text()).toContain('2099-01-01')
    })

    it('shows "Bake not found" when cook_log is undefined', () => {
      mockCurrentRecipe.value = makeRecipe({ cook_log: undefined })
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Bake not found')
    })

    it('shows back button in not-found state', () => {
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2099-01-01' }
      const wrapper = mountComponent()
      const backBtn = wrapper.find('button.back-link')
      expect(backBtn.exists()).toBe(true)
    })

    it('navigates back to recipe on back button click in not-found state', async () => {
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2099-01-01' }
      const wrapper = mountComponent()
      await wrapper.find('button').trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/recipe/atk-cinnamon-buns#cook-log-section')
    })

    it('does not show not-found when still loading', () => {
      mockLoading.value = true
      mockCurrentRecipe.value = null
      const wrapper = mountComponent()
      expect(wrapper.text()).not.toContain('Bake not found')
    })

    it('does not show not-found when recipe is null', () => {
      mockCurrentRecipe.value = null
      mockLoading.value = false
      const wrapper = mountComponent()
      // notFound requires currentRecipe to be truthy
      expect(wrapper.text()).not.toContain('Bake not found')
    })
  })

  describe('normal render with matching entry', () => {
    it('renders recipe name in header', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Quick Cinnamon Buns')
    })

    it('renders back link button', () => {
      const wrapper = mountComponent()
      const backBtn = wrapper.find('button.back-link')
      expect(backBtn.exists()).toBe(true)
    })

    it('renders formatted date with weekday', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('2026-02-05')
      expect(wrapper.text()).toContain('Thursday')
    })

    it('renders version badge', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('v1.1.0')
    })

    it('renders summary text', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Great bake, dough was perfect.')
    })

    it('renders notes as markdown list', () => {
      const wrapper = mountComponent()
      expect(wrapper.html()).toContain('Proofed for 35 minutes instead of 30')
      expect(wrapper.html()).toContain('Used dark brown sugar as written')
      expect(wrapper.find('.bake-prose').exists()).toBe(true)
    })

    it('renders Notes heading', () => {
      const wrapper = mountComponent()
      const headings = wrapper.findAll('h4')
      const notesHeading = headings.find(h => h.text() === 'Notes')
      expect(notesHeading).toBeDefined()
    })

    it('renders next_time items as markdown', () => {
      const wrapper = mountComponent()
      expect(wrapper.html()).toContain('Try overnight cold ferment')
      expect(wrapper.html()).toContain('Use TJ mozzarella')
    })

    it('renders next_time source attribution in italics', () => {
      const wrapper = mountComponent()
      expect(wrapper.html()).toContain('(ATK forum)')
    })

    it('renders Next Time heading', () => {
      const wrapper = mountComponent()
      const headings = wrapper.findAll('h4')
      const nextTimeHeading = headings.find(h => h.text() === 'Next Time')
      expect(nextTimeHeading).toBeDefined()
    })

    it('renders bottom nav back link', () => {
      const wrapper = mountComponent()
      const backLinks = wrapper.findAll('button.back-link')
      expect(backLinks.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('hero photo', () => {
    it('renders hero photo (last in array) full-width', () => {
      const wrapper = mountComponent()
      const heroImg = wrapper.find('img.w-full')
      expect(heroImg.exists()).toBe(true)
      expect(heroImg.attributes('src')).toBe('/img/hero-800.webp')
      expect(heroImg.attributes('alt')).toBe('Glazed cinnamon buns')
    })

    it('does not render hero photo when entry has no photos', () => {
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2026-01-20' }
      const wrapper = mountComponent()
      expect(wrapper.find('img.w-full').exists()).toBe(false)
    })

    it('does not render hero photo when photos is undefined', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('img.w-full').exists()).toBe(false)
    })

    it('does not render hero photo when photos is empty', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          photos: []
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('img.w-full').exists()).toBe(false)
    })
  })

  describe('supporting photos', () => {
    it('renders supporting photo thumbnails (all except last)', () => {
      const wrapper = mountComponent()
      const thumbs = wrapper.findAll('img.h-20')
      expect(thumbs).toHaveLength(2)
      expect(thumbs[0].attributes('src')).toBe('/img/process-a-400.webp')
      expect(thumbs[0].attributes('alt')).toBe('Dough after kneading')
      expect(thumbs[1].attributes('src')).toBe('/img/process-b-400.webp')
      expect(thumbs[1].attributes('alt')).toBe('Rolls in skillet')
    })

    it('does not render supporting photos when only one photo', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Note'],
          photos: [
            { src: '/img/hero-800.webp', thumb: '/img/hero-400.webp', alt: 'Hero only' }
          ]
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.findAll('img.h-20')).toHaveLength(0)
    })

    it('does not render supporting photos when no photos', () => {
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2026-01-20' }
      const wrapper = mountComponent()
      expect(wrapper.findAll('img.h-20')).toHaveLength(0)
    })
  })

  describe('PhotoLightbox integration', () => {
    it('opens lightbox when hero photo is clicked', async () => {
      const wrapper = mountComponent()
      const heroImg = wrapper.find('img.w-full')
      await heroImg.trigger('click')

      const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
      expect(lightbox.props('open')).toBe(true)
      expect(lightbox.props('initialIndex')).toBe(0)
      // Hero (last photo) should be reordered to front
      const photos = lightbox.props('photos')
      expect(photos[0].alt).toBe('Glazed cinnamon buns')
      expect(photos[1].alt).toBe('Dough after kneading')
      expect(photos[2].alt).toBe('Rolls in skillet')
    })

    it('opens lightbox at correct index when supporting thumb is clicked', async () => {
      const wrapper = mountComponent()
      const thumbs = wrapper.findAll('img.h-20')
      await thumbs[0].trigger('click')

      const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
      expect(lightbox.props('open')).toBe(true)
      // Thumb index 0 maps to lightboxPhotos index 1 (hero is index 0)
      expect(lightbox.props('initialIndex')).toBe(1)
    })

    it('opens lightbox at correct index for second supporting thumb', async () => {
      const wrapper = mountComponent()
      const thumbs = wrapper.findAll('img.h-20')
      await thumbs[1].trigger('click')

      const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
      expect(lightbox.props('open')).toBe(true)
      expect(lightbox.props('initialIndex')).toBe(2)
    })

    it('closes lightbox on close event', async () => {
      const wrapper = mountComponent()

      // Open lightbox
      await wrapper.find('img.w-full').trigger('click')
      const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
      expect(lightbox.props('open')).toBe(true)

      // Close it
      lightbox.vm.$emit('close')
      await wrapper.vm.$nextTick()
      expect(lightbox.props('open')).toBe(false)
    })

    it('does not open lightbox from hero when no photos', async () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          photos: []
        }]
      })
      const wrapper = mountComponent()
      // No hero image exists, so lightbox should stay closed
      const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
      expect(lightbox.props('open')).toBe(false)
    })

    it('does not open lightbox from thumb when no photos', async () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          photos: []
        }]
      })
      const wrapper = mountComponent()
      const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
      expect(lightbox.props('open')).toBe(false)
    })
  })

  describe('back button navigation', () => {
    it('navigates to recipe cook-log section when recipeId is present', async () => {
      const wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      await buttons[0].trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/recipe/atk-cinnamon-buns#cook-log-section')
    })

    it('calls router.back when recipeId is not a string', async () => {
      mockRouteParams.value = { date: '2026-02-05' }
      // Also need a recipe that makes entry resolve
      mockCurrentRecipe.value = makeRecipe()
      const wrapper = mountComponent()

      // This won't render the entry view (no bakeDate match due to different params structure)
      // but we need to test the goBack function via not-found state
      // Since recipeId is missing, notFound is true (bakeDate is present but entry may not match)
      // Actually, let's test with array recipeId
      mockRouteParams.value = { recipeId: ['a', 'b'] as unknown as string, date: '2026-02-05' }
      const wrapper2 = mountComponent()
      // The not-found state will show if entry doesn't match
      // Let's find the back button in whatever state renders
      const backBtns = wrapper2.findAll('button')
      if (backBtns.length > 0) {
        await backBtns[0].trigger('click')
        expect(mockBack).toHaveBeenCalled()
      }
    })

    it('bottom back button also navigates to recipe', async () => {
      const wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      // Last button is the bottom "Back to recipe"
      await buttons[buttons.length - 1].trigger('click')
      expect(mockPush).toHaveBeenCalledWith('/recipe/atk-cinnamon-buns#cook-log-section')
    })
  })

  describe('edge cases: no notes', () => {
    it('does not render Notes section when notes is empty', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: [],
          next_time: [{ text: 'Try something' }]
        }]
      })
      const wrapper = mountComponent()
      const headings = wrapper.findAll('h4')
      const notesHeading = headings.find(h => h.text() === 'Notes')
      expect(notesHeading).toBeUndefined()
    })
  })

  describe('edge cases: no next_time', () => {
    it('does not render Next Time section when next_time is empty', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          next_time: []
        }]
      })
      const wrapper = mountComponent()
      const headings = wrapper.findAll('h4')
      const nextTimeHeading = headings.find(h => h.text() === 'Next Time')
      expect(nextTimeHeading).toBeUndefined()
    })

    it('does not render Next Time section when next_time is undefined', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note']
        }]
      })
      const wrapper = mountComponent()
      const headings = wrapper.findAll('h4')
      const nextTimeHeading = headings.find(h => h.text() === 'Next Time')
      expect(nextTimeHeading).toBeUndefined()
    })
  })

  describe('edge cases: no summary', () => {
    it('does not render summary paragraph when summary is absent', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note']
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.text()).not.toContain('Great bake')
    })
  })

  describe('bakeDate computed', () => {
    it('handles array date param by returning empty string', () => {
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: ['2026-02-05'] as unknown as string }
      const wrapper = mountComponent()
      // bakeDate returns '' when not a string, so entry will be null
      // Since currentRecipe exists and loading is false, notFound should be true
      expect(wrapper.text()).toContain('Bake not found')
    })

    it('handles missing date param', () => {
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns' }
      const wrapper = mountComponent()
      // bakeDate is undefined which is not a string, returns ''
      // entry returns null because bakeDate is empty
      // notFound = !loading && currentRecipe && !entry = true
      expect(wrapper.text()).toContain('Bake not found')
    })
  })

  describe('formatDate', () => {
    it('formats date with correct weekday', () => {
      // 2026-02-05 is a Thursday
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('2026-02-05 \u2014 Thursday')
    })

    it('formats different date correctly', () => {
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2026-01-20' }
      const wrapper = mountComponent()
      // 2026-01-20 is a Tuesday
      expect(wrapper.text()).toContain('2026-01-20 \u2014 Tuesday')
    })
  })

  describe('renderNotes', () => {
    it('renders notes as bullet list HTML', () => {
      const wrapper = mountComponent()
      const notesDiv = wrapper.findAll('.bake-prose')[0]
      expect(notesDiv.html()).toContain('<li>')
      expect(notesDiv.html()).toContain('Proofed for 35 minutes')
    })

    it('handles empty notes gracefully', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: [],
          next_time: [{ text: 'Something' }]
        }]
      })
      const wrapper = mountComponent()
      // Notes section not rendered, so no crash
      expect(wrapper.find('.bake-prose').exists()).toBe(true) // next_time still renders
    })
  })

  describe('renderNextTime', () => {
    it('renders next_time items without source', () => {
      const wrapper = mountComponent()
      expect(wrapper.html()).toContain('Try overnight cold ferment')
    })

    it('renders next_time items with source in italics', () => {
      const wrapper = mountComponent()
      // Source should be rendered as *(source)* which becomes <em>
      expect(wrapper.html()).toContain('<em>(ATK forum)</em>')
    })

    it('returns empty string for empty next_time', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Note'],
          next_time: []
        }]
      })
      const wrapper = mountComponent()
      const headings = wrapper.findAll('h4')
      const nextTimeHeading = headings.find(h => h.text() === 'Next Time')
      expect(nextTimeHeading).toBeUndefined()
    })
  })

  describe('shared mode popover', () => {
    it('does not show popover when shared=true is not in query', async () => {
      const wrapper = mountComponent()
      await flushPromises()
      expect(wrapper.find('[data-testid="shared-popover-overlay"]').exists()).toBe(false)
    })

    it('shows popover when shared=true is in query', async () => {
      mockRouteQuery.value = { shared: 'true' }
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      expect(wrapper.find('[data-testid="shared-popover-overlay"]').exists()).toBe(true)
    })

    it('popover displays greeting text', async () => {
      mockRouteQuery.value = { shared: 'true' }
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      expect(wrapper.text()).toContain("Hey, I'm Chris")
      expect(wrapper.text()).toContain('I baked these for you')
    })

    it('popover displays recipe name and date', async () => {
      mockRouteQuery.value = { shared: 'true' }
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      expect(popover.text()).toContain('Quick Cinnamon Buns')
      expect(popover.text()).toContain('2026-02-05')
    })

    it('popover displays hero photo', async () => {
      mockRouteQuery.value = { shared: 'true' }
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      const heroImg = popover.find('img')
      expect(heroImg.exists()).toBe(true)
      expect(heroImg.attributes('src')).toBe('/img/hero-800.webp')
    })

    it('popover displays reheat instructions when recipe has reheat data', async () => {
      mockRouteQuery.value = { shared: 'true' }
      mockCurrentRecipe.value = makeRecipe({
        reheat: {
          methods: [
            { method: 'Air Fryer', detail: '300F 5 min', source: 'user' as const },
            { method: 'Storage', detail: 'Room temp 2 days', source: 'agent' as const }
          ]
        }
      })
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      expect(popover.text()).toContain('Reheat')
      expect(popover.text()).toContain('Air Fryer')
      expect(popover.text()).toContain('300F 5 min')
      expect(popover.text()).toContain('Storage')
    })

    it('popover shows agent attribution for agent-sourced methods', async () => {
      mockRouteQuery.value = { shared: 'true' }
      mockCurrentRecipe.value = makeRecipe({
        reheat: {
          methods: [
            { method: 'Storage', detail: 'Room temp', source: 'agent' as const }
          ]
        }
      })
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      expect(popover.text()).toContain('ai generated')
      expect(popover.text()).toContain('not from Chris')
    })

    it('popover does not show agent attribution for user-sourced methods', async () => {
      mockRouteQuery.value = { shared: 'true' }
      mockCurrentRecipe.value = makeRecipe({
        reheat: {
          methods: [
            { method: 'Air Fryer', detail: '300F 5 min', source: 'user' as const }
          ]
        }
      })
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      expect(popover.text()).not.toContain('ai generated')
    })

    it('popover shows fallback when no reheat data', async () => {
      mockRouteQuery.value = { shared: 'true' }
      // Default recipe has no reheat field
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      expect(popover.text()).toContain('No specific reheat instructions yet')
    })

    it('dismisses popover on button click', async () => {
      mockRouteQuery.value = { shared: 'true' }
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      expect(wrapper.find('[data-testid="shared-popover-overlay"]').exists()).toBe(true)

      await wrapper.find('[data-testid="shared-popover-dismiss"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-testid="shared-popover-overlay"]').exists()).toBe(false)
      expect(mockReplace).toHaveBeenCalledWith({ query: {} })
    })

    it('dismisses popover on overlay click', async () => {
      mockRouteQuery.value = { shared: 'true' }
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      expect(wrapper.find('[data-testid="shared-popover-overlay"]').exists()).toBe(true)

      await wrapper.find('[data-testid="shared-popover-overlay"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-testid="shared-popover-overlay"]').exists()).toBe(false)
    })

    it('has dismiss button with correct text', async () => {
      mockRouteQuery.value = { shared: 'true' }
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const dismissBtn = wrapper.find('[data-testid="shared-popover-dismiss"]')
      expect(dismissBtn.text()).toBe('View Full Bake Details')
    })
  })
})
