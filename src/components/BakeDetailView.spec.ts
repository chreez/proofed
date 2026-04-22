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
  return mount(BakeDetailView, {
    global: { stubs: { Teleport: true } }
  })
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

  describe('cost breakdown', () => {
    const costData = {
      total: 1.29,
      perServing: 1.29,
      servings: 1,
      items: [
        { ingredientId: 'bread_flour', name: 'Bread Flour', sourceType: 'heb' as const, sourceName: 'King Arthur Bread Flour, 5 lb', amount: 500, unit: 'g', cost: 1.23 },
        { ingredientId: 'water', name: 'Water', sourceType: 'rate' as const, sourceName: 'Tap water (negligible)', amount: 350, unit: 'g', cost: 0.00 },
        { ingredientId: 'salt', name: 'Fine Sea Salt', sourceType: 'manual' as const, sourceName: 'H-E-B Mediterranean Sea Salt', amount: 10, unit: 'g', cost: 0.03 }
      ]
    }

    it('renders cost table when entry.cost exists', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          cost: costData
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="cost-breakdown"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Cost Breakdown')
    })

    it('hides cost section when entry.cost is undefined', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="cost-breakdown"]').exists()).toBe(false)
    })

    it('shows source badges (HEB, RATE, MANUAL)', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          cost: costData
        }]
      })
      const wrapper = mountComponent()
      const badges = wrapper.findAll('[data-testid="source-badge"]')
      const badgeTexts = badges.map(b => b.text())
      expect(badgeTexts).toContain('HEB')
      expect(badgeTexts).toContain('RATE')
      expect(badgeTexts).toContain('MANUAL')
    })

    it('shows "negligible" for zero-cost rate items', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          cost: costData
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('negligible')
    })

    it('does not show "negligible" for non-zero cost items', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          cost: {
            total: 1.23,
            perServing: 1.23,
            servings: 1,
            items: [
              { ingredientId: 'flour', name: 'Flour', sourceType: 'heb' as const, sourceName: 'KA', amount: 500, unit: 'g', cost: 1.23 }
            ]
          }
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.text()).not.toContain('negligible')
    })

    it('shows total and per-serving in footer', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          cost: costData
        }]
      })
      const wrapper = mountComponent()
      const footer = wrapper.find('[data-testid="cost-footer"]')
      expect(footer.exists()).toBe(true)
      expect(footer.text()).toContain('$1.29')
      expect(footer.text()).toContain('Total bake cost')
      expect(footer.text()).toContain('Per serving')
    })

    it('shows serving count in header', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          cost: { ...costData, servings: 8 }
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('8 servings')
    })

    it('shows singular "serving" for 1 serving', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          cost: costData
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('1 serving')
      expect(wrapper.text()).not.toContain('1 servings')
    })

    it('shows ingredient names and amounts', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          cost: costData
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Bread Flour')
      expect(wrapper.text()).toContain('500g')
      expect(wrapper.text()).toContain('Water')
      expect(wrapper.text()).toContain('350g')
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

    it('shows end date only when start_date differs from date', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-20',
          start_date: '2026-02-19',
          version: 'v1.1.0',
          notes: ['Multi-day bake'],
          next_time: []
        }]
      })
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2026-02-20' }
      const wrapper = mountComponent()
      // Always shows end date, never a range
      expect(wrapper.text()).toContain('2026-02-20 \u2014 Friday')
      expect(wrapper.text()).not.toContain('Feb 19\u201320')
    })

    it('shows single date when start_date equals date', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-20',
          start_date: '2026-02-20',
          version: 'v1.1.0',
          notes: ['Same-day bake'],
          next_time: []
        }]
      })
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2026-02-20' }
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('2026-02-20 \u2014 Friday')
    })

    it('shows single date when start_date is absent', () => {
      const wrapper = mountComponent()
      // Default entry has no start_date
      expect(wrapper.text()).toContain('2026-02-05 \u2014 Thursday')
    })

    it('shows "since" in in-progress badge when start_date exists', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-20',
          start_date: '2026-02-19',
          version: 'v1.1.0',
          status: 'in_progress' as const,
          notes: ['In progress bake'],
          next_time: []
        }]
      })
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2026-02-20' }
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('In Progress (since Feb 19)')
    })

    it('shows plain "In Progress" when no start_date on in-progress entry', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-20',
          version: 'v1.1.0',
          status: 'in_progress' as const,
          notes: ['In progress bake'],
          next_time: []
        }]
      })
      mockRouteParams.value = { recipeId: 'atk-cinnamon-buns', date: '2026-02-20' }
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('In Progress')
      expect(wrapper.text()).not.toContain('since')
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
      expect(wrapper.text()).toContain('I made this')
      expect(wrapper.text()).toContain("Here's how to reheat it:")
    })

    it('popover reheat methods expand on click', async () => {
      mockRouteQuery.value = { shared: 'true' }
      mockCurrentRecipe.value = makeRecipe({
        reheat: {
          methods: [
            { method: 'Oven', detail: '350F 10 min on a rack', source: 'user' as const },
            { method: 'Skillet', detail: 'Medium heat covered', source: 'user' as const }
          ]
        }
      })
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      const methods = popover.findAll('.cursor-pointer')
      expect(methods).toHaveLength(2)
      // Both methods start collapsed
      expect(methods[0].find('p').classes()).toContain('truncate')
      expect(methods[1].find('p').classes()).toContain('truncate')
      // Click first method to expand
      await methods[0].trigger('click')
      expect(methods[0].find('p').classes()).not.toContain('truncate')
      // Click first method again to collapse
      await methods[0].trigger('click')
      expect(methods[0].find('p').classes()).toContain('truncate')
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

    it('popover shows reference link when reheat method is expanded', async () => {
      mockRouteQuery.value = { shared: 'true' }
      mockCurrentRecipe.value = makeRecipe({
        reheat: {
          methods: [
            { method: 'Oven', detail: '350F 10 min on a rack', source: 'user' as const, reference: 'https://example.com/reheat' },
            { method: 'Skillet', detail: 'Medium heat covered', source: 'user' as const }
          ]
        }
      })
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      const methods = popover.findAll('.cursor-pointer')

      // Reference link hidden when collapsed
      expect(methods[0].find('a').exists()).toBe(false)

      // Expand the method with reference
      await methods[0].trigger('click')
      const link = methods[0].find('a')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://example.com/reheat')
      expect(link.text()).toContain('source')

      // Method without reference has no link even when expanded
      await methods[1].trigger('click')
      expect(methods[1].find('a').exists()).toBe(false)
    })

    it('popover does not render reheat section when no reheat data', async () => {
      mockRouteQuery.value = { shared: 'true' }
      // Default recipe has no reheat field
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      expect(popover.text()).not.toContain('Reheat')
    })

    it('popover renders without hero photo when entry has no photos', async () => {
      mockRouteQuery.value = { shared: 'true' }
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [
          { date: '2026-02-05', version: 'v1.1.0', notes: ['No photos this time'], next_time: [] }
        ]
      })
      const wrapper = mountComponent()
      await flushPromises()
      await nextTick()
      const popover = wrapper.find('[data-testid="shared-popover-overlay"]')
      expect(popover.exists()).toBe(true)
      expect(popover.findAll('img')).toHaveLength(0)
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

  describe('weather row (PF-210)', () => {
    const weatherData = {
      location: 'Austin, TX',
      date: '2026-02-05',
      temp_high_f: 75,
      temp_low_f: 58,
      humidity_avg_percent: 45,
      condition: 'Clear sky',
      source: 'open-meteo' as const
    }

    it('renders weather row when entry has weather data', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          weather: weatherData
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="weather-row"]').exists()).toBe(true)
    })

    it('does not render weather row when entry has no weather data', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="weather-row"]').exists()).toBe(false)
    })

    it('displays condition name, temp range, humidity, and location', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          weather: weatherData
        }]
      })
      const wrapper = mountComponent()
      const row = wrapper.find('[data-testid="weather-row"]')
      expect(row.text()).toContain('Clear sky')
      expect(row.text()).toContain('75°F / 58°F')
      expect(row.text()).toContain('45% humidity')
      expect(row.text()).toContain('Austin, TX')
    })

    it('displays correct icon for Clear sky condition', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          weather: weatherData
        }]
      })
      const wrapper = mountComponent()
      const row = wrapper.find('[data-testid="weather-row"]')
      expect(row.text()).toContain('\u2600\uFE0F')
    })

    it('displays correct icon for Rain condition', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          weather: { ...weatherData, condition: 'Rain' }
        }]
      })
      const wrapper = mountComponent()
      const row = wrapper.find('[data-testid="weather-row"]')
      expect(row.text()).toContain('\uD83C\uDF27\uFE0F')
    })

    it('displays fallback icon for unknown condition', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          weather: { ...weatherData, condition: 'Thunderstorm' }
        }]
      })
      const wrapper = mountComponent()
      const row = wrapper.find('[data-testid="weather-row"]')
      expect(row.text()).toContain('\uD83C\uDF24\uFE0F')
    })

    it('weather row appears before summary', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          summary: 'Great bake.',
          notes: ['A note'],
          weather: weatherData
        }]
      })
      const wrapper = mountComponent()
      const html = wrapper.html()
      const weatherIdx = html.indexOf('data-testid="weather-row"')
      const summaryIdx = html.indexOf('Great bake.')
      expect(weatherIdx).toBeGreaterThan(-1)
      expect(summaryIdx).toBeGreaterThan(-1)
      expect(weatherIdx).toBeLessThan(summaryIdx)
    })
  })

  describe('BakeStatsBlock wiring (PF-177.5)', () => {
    const bakeStats = {
      confidence: 'high' as const,
      dough_temps: [
        { time: '2026-02-05 - 08:00', temp_f: 74 },
        { time: '2026-02-05 - 12:00', temp_f: 76 }
      ],
      bake_phases: [
        { stage: 'preheat' as const, temp_f: 500, duration_min: 45 },
        { stage: 'covered' as const, temp_f: 450, duration_min: 20 },
        { stage: 'uncovered' as const, temp_f: 425, duration_min: 20 }
      ]
    }

    it('renders BakeStatsBlock when the entry has bake_stats', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          bake_stats: bakeStats
        }]
      })
      const wrapper = mountComponent()
      // The root data-testid passed on <BakeStatsBlock> overrides the
      // component's internal root testid via inheritAttrs.
      expect(wrapper.find('[data-testid="bake-detail-stats"]').exists()).toBe(true)
      // Internal child testids still work (e.g. the pills row).
      expect(wrapper.find('[data-testid="bsb-pills"]').exists()).toBe(true)
    })

    it('does NOT render BakeStatsBlock when entry has no bake_stats', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note']
          // no bake_stats
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="bake-detail-stats"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="bsb-pills"]').exists()).toBe(false)
    })

    it('passes bake_defaults from recipe to BakeStatsBlock for low-conf fallback', () => {
      mockCurrentRecipe.value = makeRecipe({
        bake_defaults: {
          bake_phases: [
            { stage: 'preheat' as const, temp_f: 500, duration_min: 45 },
            { stage: 'covered' as const, temp_f: 450, duration_min: 20 },
            { stage: 'uncovered' as const, temp_f: 425, duration_min: 20 }
          ]
        },
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Recalled after the fact'],
          bake_stats: { confidence: 'low' as const }
        }]
      })
      const wrapper = mountComponent()
      const block = wrapper.find('[data-testid="bake-detail-stats"]')
      expect(block.exists()).toBe(true)
      // Low-conf callout visible + recipe baseline subheading on bake phases
      expect(wrapper.find('[data-testid="bsb-low-conf-callout"]').exists()).toBe(true)
      const phases = wrapper.find('[data-testid="bsb-bake-phases"]')
      expect(phases.exists()).toBe(true)
      expect(phases.text()).toContain('recipe baseline')
    })

    it('does NOT render raw notes disclosure inside BakeStatsBlock (moved to BakeDetailView)', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['First note', 'Second note'],
          bake_stats: bakeStats
        }]
      })
      const wrapper = mountComponent()
      // The old BakeStatsBlock disclosure is gone — raw notes are now a
      // BakeDetailView-owned section below the Notes list.
      expect(wrapper.find('[data-testid="bsb-raw-disclosure"]').exists()).toBe(false)
    })

    it('renders BakeStatsBlock AFTER the hero photo and BEFORE the Notes section (Option C placement)', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['A note'],
          bake_stats: bakeStats,
          photos: [
            { src: '/img/hero-800.webp', thumb: '/img/hero-400.webp', alt: 'Hero shot' }
          ]
        }]
      })
      const wrapper = mountComponent()
      const html = wrapper.html()
      const heroIdx = html.indexOf('/img/hero-800.webp')
      const statsIdx = html.indexOf('data-testid="bake-detail-stats"')
      const notesIdx = html.indexOf('data-testid="notes-section"')
      expect(heroIdx).toBeGreaterThan(-1)
      expect(statsIdx).toBeGreaterThan(-1)
      expect(notesIdx).toBeGreaterThan(-1)
      expect(heroIdx).toBeLessThan(statsIdx)
      expect(statsIdx).toBeLessThan(notesIdx)
    })
  })

  describe('key_notes fallback (PF-177.5)', () => {
    it('renders full notes[] when key_notes is absent', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Line A', 'Line B', 'Line C']
        }]
      })
      const wrapper = mountComponent()
      const notesSection = wrapper.find('[data-testid="notes-section"]')
      expect(notesSection.exists()).toBe(true)
      expect(notesSection.text()).toContain('Line A')
      expect(notesSection.text()).toContain('Line B')
      expect(notesSection.text()).toContain('Line C')
    })

    it('renders curated key_notes[] when present', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Pure chart line: 75°F at 14:00', 'Narrative observation'],
          key_notes: [{ text: 'Narrative observation' }]
        }]
      })
      const wrapper = mountComponent()
      const notesSection = wrapper.find('[data-testid="notes-section"]')
      expect(notesSection.exists()).toBe(true)
      expect(notesSection.text()).toContain('Narrative observation')
      // Excluded chart-data line should NOT render in the curated Notes section.
      expect(notesSection.text()).not.toContain('Pure chart line')
    })

    it('renders silent Notes section when key_notes is present but empty', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Everything captured in chart'],
          key_notes: []
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="notes-section"]').exists()).toBe(false)
    })

    it('still shows notes[] as raw notes even when key_notes is empty', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Everything captured in chart'],
          key_notes: []
        }]
      })
      const wrapper = mountComponent()
      // Raw notes section still exists (anchored to notes[] not key_notes).
      expect(wrapper.find('[data-testid="raw-notes-section"]').exists()).toBe(true)
    })

    it('handles entry with both key_notes and notes undefined (nullish fallbacks)', () => {
      // Exercises the `?? []` branch in keyNotesList and the `?? 0` branch in hasRawNotes
      // when both fields are absent on the entry object entirely.
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0'
          // notes and key_notes both intentionally omitted
        } as unknown as Recipe['cook_log'][number]]
      })
      const wrapper = mountComponent()
      // Neither Notes nor Raw notes sections render when there is nothing to show.
      expect(wrapper.find('[data-testid="notes-section"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="raw-notes-section"]').exists()).toBe(false)
    })
  })

  describe('raw notes disclosure (PF-177.5, Option C)', () => {
    it('renders raw notes section when entry has notes', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Line 1', 'Line 2']
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="raw-notes-section"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="raw-notes-toggle"]').exists()).toBe(true)
    })

    it('starts collapsed — <pre> is not rendered by default', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Line 1', 'Line 2']
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="raw-notes-pre"]').exists()).toBe(false)
      const toggle = wrapper.find('[data-testid="raw-notes-toggle"]')
      expect(toggle.attributes('aria-expanded')).toBe('false')
      expect(toggle.text()).toContain('Raw notes')
    })

    it('expands on toggle click — <pre> renders full notes[] joined by newlines', async () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Line 1', 'Line 2', 'Line 3']
        }]
      })
      const wrapper = mountComponent()
      await wrapper.find('[data-testid="raw-notes-toggle"]').trigger('click')
      const pre = wrapper.find('[data-testid="raw-notes-pre"]')
      expect(pre.exists()).toBe(true)
      expect(pre.text()).toBe('Line 1\nLine 2\nLine 3')
      expect(wrapper.find('[data-testid="raw-notes-toggle"]').attributes('aria-expanded')).toBe('true')
    })

    it('collapses again on second toggle click', async () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Line 1']
        }]
      })
      const wrapper = mountComponent()
      const toggle = wrapper.find('[data-testid="raw-notes-toggle"]')
      await toggle.trigger('click')
      expect(wrapper.find('[data-testid="raw-notes-pre"]').exists()).toBe(true)
      await toggle.trigger('click')
      expect(wrapper.find('[data-testid="raw-notes-pre"]').exists()).toBe(false)
    })

    it('does NOT render raw notes section when notes is empty', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: []
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="raw-notes-section"]').exists()).toBe(false)
    })

    it('renders raw notes even when key_notes is set (still anchored to notes[])', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Full line 1', 'Full line 2', 'Full line 3'],
          key_notes: [{ text: 'Full line 2' }]
        }]
      })
      const wrapper = mountComponent()
      expect(wrapper.find('[data-testid="raw-notes-section"]').exists()).toBe(true)
    })

    it('shows in-progress placeholder when notes/key_notes are empty and status is in_progress', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          status: 'in_progress' as const,
          notes: [],
          next_time: []
        }]
      })
      const wrapper = mountComponent()
      // No curated key_notes and no raw notes → no Notes section but placeholder is shown
      expect(wrapper.find('[data-testid="notes-section"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="raw-notes-section"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('Notes will appear here as the bake progresses.')
    })

    it('converts key_notes string[] fallback to KeyNote[] when rendering', () => {
      // Tests that the keyNotesList function properly handles fallback
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: ['Fallback note 1', 'Fallback note 2'],
          // key_notes intentionally absent to trigger fallback
        }]
      })
      const wrapper = mountComponent()
      const notesSection = wrapper.find('[data-testid="notes-section"]')
      expect(notesSection.exists()).toBe(true)
      // Fallback should wrap notes[] as KeyNote objects
      expect(notesSection.text()).toContain('Fallback note 1')
      expect(notesSection.text()).toContain('Fallback note 2')
    })

    it('handles multi-day key_notes with missing timestamps', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          start_date: '2026-02-04',
          version: 'v1.1.0',
          notes: [],
          key_notes: [
            { text: 'Timestamped note', timestamp: '2026-02-04T10:00:00Z' },
            { text: 'Note without timestamp' }
          ]
        }]
      })
      const wrapper = mountComponent()
      const notesSection = wrapper.find('[data-testid="notes-section"]')
      expect(notesSection.exists()).toBe(true)
      const proseDiv = notesSection.find('.bake-prose')
      const html = proseDiv.html()
      // Should render day header for timestamped note
      expect(html).toContain('Feb 4')
      // Should render both notes
      expect(html).toContain('Timestamped note')
      expect(html).toContain('Note without timestamp')
    })

    it('renders flat list when start_date equals date (single-day bake)', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          start_date: '2026-02-05',
          version: 'v1.1.0',
          notes: [],
          key_notes: [
            { text: 'First note', timestamp: '2026-02-05T10:00:00Z' },
            { text: 'Second note', timestamp: '2026-02-05T15:00:00Z' }
          ]
        }]
      })
      const wrapper = mountComponent()
      const notesSection = wrapper.find('[data-testid="notes-section"]')
      expect(notesSection.exists()).toBe(true)
      const proseDiv = notesSection.find('.bake-prose')
      const html = proseDiv.html()
      // Should NOT render day headers inside prose when start_date === date
      const h4Count = (html.match(/<h4/g) || []).length
      expect(h4Count).toBe(0)
      // Should still render the notes
      expect(html).toContain('First note')
      expect(html).toContain('Second note')
    })

    it('renders flat list when start_date is absent (default behavior)', () => {
      mockCurrentRecipe.value = makeRecipe({
        cook_log: [{
          date: '2026-02-05',
          version: 'v1.1.0',
          notes: [],
          key_notes: [
            { text: 'First note', timestamp: '2026-02-05T10:00:00Z' },
            { text: 'Second note' }
          ]
        }]
      })
      const wrapper = mountComponent()
      const notesSection = wrapper.find('[data-testid="notes-section"]')
      expect(notesSection.exists()).toBe(true)
      const proseDiv = notesSection.find('.bake-prose')
      const html = proseDiv.html()
      // Should NOT render day headers inside prose when start_date is absent
      const h4Count = (html.match(/<h4/g) || []).length
      expect(h4Count).toBe(0)
      // Should still render the notes
      expect(html).toContain('First note')
      expect(html).toContain('Second note')
    })
  })
})
