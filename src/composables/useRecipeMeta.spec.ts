import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import type { Recipe } from '@/types/recipe'

// Track what useSeoMeta receives
let capturedInput: Record<string, unknown> = {}
vi.mock('@unhead/vue', () => ({
  useSeoMeta: (input: Record<string, unknown>) => {
    capturedInput = input
  },
}))

// Import after mocking
import { useRecipeMeta, formatBakeDate } from './useRecipeMeta'

const makeRecipe = (overrides: Partial<Recipe['meta']> = {}): Recipe => ({
  meta: {
    name: 'Test Buns',
    yields: '8 buns',
    total_time: '~1.5 hrs',
    ...overrides,
  },
  config: { early_check_percent: 75 },
  vessels: [],
  stages: [],
  states: [],
})

describe('useRecipeMeta', () => {
  beforeEach(() => {
    capturedInput = {}
  })

  it('sets brand defaults when no recipe is loaded', () => {
    const recipe = ref<Recipe | null>(null)
    const recipeId = ref<string | null>(null)

    useRecipeMeta(() => recipe.value, () => recipeId.value)

    // useSeoMeta receives computed refs — resolve them
    const title = (capturedInput.title as { value: string }).value
    const ogDescription = (capturedInput.ogDescription as { value: string }).value
    const ogUrl = (capturedInput.ogUrl as { value: string }).value

    expect(title).toBe('proofed.')
    expect(ogDescription).toBe('A personal cooking notebook. Recipes as structured data.')
    expect(ogUrl).toBe('https://proofeddot.netlify.app')
  })

  it('sets recipe-specific meta when a recipe is loaded', () => {
    const recipe = ref<Recipe | null>(makeRecipe())
    const recipeId = ref<string | null>('test-buns')

    useRecipeMeta(() => recipe.value, () => recipeId.value)

    const title = (capturedInput.title as { value: string }).value
    const ogDescription = (capturedInput.ogDescription as { value: string }).value
    const ogUrl = (capturedInput.ogUrl as { value: string }).value

    expect(title).toBe('Test Buns — proofed.')
    expect(ogDescription).toBe('A proofed. recipe: Test Buns — 8 buns, ~1.5 hrs total')
    expect(ogUrl).toBe('https://proofeddot.netlify.app/recipe/test-buns')
  })

  it('uses meta.description when provided', () => {
    const recipe = ref<Recipe | null>(
      makeRecipe({ description: 'Custom description for sharing' })
    )
    const recipeId = ref<string | null>('test-buns')

    useRecipeMeta(() => recipe.value, () => recipeId.value)

    const ogDescription = (capturedInput.ogDescription as { value: string }).value
    expect(ogDescription).toBe('Custom description for sharing')
  })

  it('reacts to recipe changes', async () => {
    const recipe = ref<Recipe | null>(null)
    const recipeId = ref<string | null>(null)

    useRecipeMeta(() => recipe.value, () => recipeId.value)

    // Initially brand defaults
    expect((capturedInput.title as { value: string }).value).toBe('proofed.')

    // Load a recipe
    recipe.value = makeRecipe()
    recipeId.value = 'test-buns'
    await nextTick()

    expect((capturedInput.title as { value: string }).value).toBe('Test Buns — proofed.')
  })

  it('falls back to generic OG image when no cook_log photos', () => {
    const recipe = ref<Recipe | null>(null)
    const recipeId = ref<string | null>(null)

    useRecipeMeta(() => recipe.value, () => recipeId.value)

    const ogImage = (capturedInput.ogImage as { value: string }).value
    const ogImageWidth = (capturedInput.ogImageWidth as { value: number }).value
    const ogImageHeight = (capturedInput.ogImageHeight as { value: number | undefined }).value

    expect(ogImage).toBe('https://proofeddot.netlify.app/og-image.png')
    expect(ogImageWidth).toBe(1200)
    expect(ogImageHeight).toBe(630)
    expect(capturedInput.twitterCard).toBe('summary_large_image')
  })

  it('uses hero photo from cook_log for OG image', () => {
    const recipeWithPhotos = makeRecipe()
    recipeWithPhotos.cook_log = [
      {
        date: '2026-02-10',
        version: 'v1.0.0',
        notes: ['Test bake'],
        photos: [
          { src: '/images/test/2026-02-10/img-001-800w.webp', thumb: '/images/test/2026-02-10/img-001-400w.webp', alt: 'Process shot' },
          { src: '/images/test/2026-02-10/img-hero-800w.webp', thumb: '/images/test/2026-02-10/img-hero-400w.webp', alt: 'Hero shot' },
        ],
      },
    ]
    const recipe = ref<Recipe | null>(recipeWithPhotos)
    const recipeId = ref<string | null>('test-buns')

    useRecipeMeta(() => recipe.value, () => recipeId.value)

    const ogImage = (capturedInput.ogImage as { value: string }).value
    const ogImageWidth = (capturedInput.ogImageWidth as { value: number }).value
    const ogImageHeight = (capturedInput.ogImageHeight as { value: number | undefined }).value
    const twitterImage = (capturedInput.twitterImage as { value: string }).value

    expect(ogImage).toBe('https://proofeddot.netlify.app/images/test/2026-02-10/img-hero-800w.webp')
    expect(ogImageWidth).toBe(800)
    expect(ogImageHeight).toBeUndefined()
    expect(twitterImage).toBe('https://proofeddot.netlify.app/images/test/2026-02-10/img-hero-800w.webp')
  })

  describe('bake-specific meta (with bakeDate)', () => {
    const makeBakeRecipe = (): Recipe => {
      const r = makeRecipe()
      r.cook_log = [
        {
          date: '2026-02-10',
          version: 'v2.0.0',
          notes: ['Great oven spring this time'],
          summary: 'Best bake yet — perfect crumb structure and even browning across all eight buns.',
          photos: [
            { src: '/images/test/2026-02-10/img-001-800w.webp', thumb: '/images/test/2026-02-10/img-001-400w.webp', alt: 'Dough rising' },
            { src: '/images/test/2026-02-10/img-002-800w.webp', thumb: '/images/test/2026-02-10/img-002-400w.webp', alt: 'Finished buns' },
          ],
        },
        {
          date: '2026-01-15',
          version: 'v1.0.0',
          notes: ['First attempt'],
        },
      ]
      return r
    }

    it('sets bake-specific title with formatted date', () => {
      const recipe = ref<Recipe | null>(makeBakeRecipe())
      const recipeId = ref<string | null>('test-buns')
      const bakeDate = ref<string | undefined>('2026-02-10')

      useRecipeMeta(() => recipe.value, () => recipeId.value, () => bakeDate.value)

      const title = (capturedInput.title as { value: string }).value
      expect(title).toBe('Test Buns — Feb 10, 2026 Bake')
    })

    it('sets bake-specific URL with date', () => {
      const recipe = ref<Recipe | null>(makeBakeRecipe())
      const recipeId = ref<string | null>('test-buns')
      const bakeDate = ref<string | undefined>('2026-02-10')

      useRecipeMeta(() => recipe.value, () => recipeId.value, () => bakeDate.value)

      const ogUrl = (capturedInput.ogUrl as { value: string }).value
      expect(ogUrl).toBe('https://proofeddot.netlify.app/recipe/test-buns/bake/2026-02-10')
    })

    it('uses cook_log summary as og:description', () => {
      const recipe = ref<Recipe | null>(makeBakeRecipe())
      const recipeId = ref<string | null>('test-buns')
      const bakeDate = ref<string | undefined>('2026-02-10')

      useRecipeMeta(() => recipe.value, () => recipeId.value, () => bakeDate.value)

      const ogDescription = (capturedInput.ogDescription as { value: string }).value
      expect(ogDescription).toBe('Best bake yet — perfect crumb structure and even browning across all eight buns.')
    })

    it('truncates long summary to ~150 chars', () => {
      const r = makeBakeRecipe()
      r.cook_log![0].summary = 'A'.repeat(200)
      const recipe = ref<Recipe | null>(r)
      const recipeId = ref<string | null>('test-buns')
      const bakeDate = ref<string | undefined>('2026-02-10')

      useRecipeMeta(() => recipe.value, () => recipeId.value, () => bakeDate.value)

      const ogDescription = (capturedInput.ogDescription as { value: string }).value
      expect(ogDescription.length).toBe(150)
      expect(ogDescription.endsWith('\u2026')).toBe(true)
    })

    it('falls back to recipe description when bake has no summary', () => {
      const r = makeBakeRecipe()
      r.meta.description = 'A classic recipe for cinnamon buns'
      // Use the entry without summary
      const recipe = ref<Recipe | null>(r)
      const recipeId = ref<string | null>('test-buns')
      const bakeDate = ref<string | undefined>('2026-01-15')

      useRecipeMeta(() => recipe.value, () => recipeId.value, () => bakeDate.value)

      const ogDescription = (capturedInput.ogDescription as { value: string }).value
      expect(ogDescription).toBe('A classic recipe for cinnamon buns')
    })

    it('uses hero photo from specific bake entry', () => {
      const recipe = ref<Recipe | null>(makeBakeRecipe())
      const recipeId = ref<string | null>('test-buns')
      const bakeDate = ref<string | undefined>('2026-02-10')

      useRecipeMeta(() => recipe.value, () => recipeId.value, () => bakeDate.value)

      const ogImage = (capturedInput.ogImage as { value: string }).value
      const twitterImage = (capturedInput.twitterImage as { value: string }).value

      // Hero = last photo in that bake's array
      expect(ogImage).toBe('https://proofeddot.netlify.app/images/test/2026-02-10/img-002-800w.webp')
      expect(twitterImage).toBe('https://proofeddot.netlify.app/images/test/2026-02-10/img-002-800w.webp')
    })

    it('falls back to og-image.png when bake has no photos', () => {
      const recipe = ref<Recipe | null>(makeBakeRecipe())
      const recipeId = ref<string | null>('test-buns')
      const bakeDate = ref<string | undefined>('2026-01-15')

      useRecipeMeta(() => recipe.value, () => recipeId.value, () => bakeDate.value)

      const ogImage = (capturedInput.ogImage as { value: string }).value
      expect(ogImage).toBe('https://proofeddot.netlify.app/og-image.png')
    })

    it('mirrors OG values in twitter tags', () => {
      const recipe = ref<Recipe | null>(makeBakeRecipe())
      const recipeId = ref<string | null>('test-buns')
      const bakeDate = ref<string | undefined>('2026-02-10')

      useRecipeMeta(() => recipe.value, () => recipeId.value, () => bakeDate.value)

      const ogTitle = (capturedInput.ogTitle as { value: string }).value
      const twitterTitle = (capturedInput.twitterTitle as { value: string }).value
      const ogDesc = (capturedInput.ogDescription as { value: string }).value
      const twitterDesc = (capturedInput.twitterDescription as { value: string }).value

      expect(twitterTitle).toBe(ogTitle)
      expect(twitterDesc).toBe(ogDesc)
      expect(capturedInput.twitterCard).toBe('summary_large_image')
    })

    it('behaves like recipe meta when bakeDate returns undefined', () => {
      const recipe = ref<Recipe | null>(makeBakeRecipe())
      const recipeId = ref<string | null>('test-buns')

      useRecipeMeta(() => recipe.value, () => recipeId.value, () => undefined)

      const title = (capturedInput.title as { value: string }).value
      const ogUrl = (capturedInput.ogUrl as { value: string }).value

      // Should act as normal recipe meta, not bake-specific
      expect(title).toBe('Test Buns — proofed.')
      expect(ogUrl).toBe('https://proofeddot.netlify.app/recipe/test-buns')
    })
  })

  describe('formatBakeDate', () => {
    it('formats YYYY-MM-DD as Mon DD, YYYY', () => {
      expect(formatBakeDate('2026-02-10')).toBe('Feb 10, 2026')
      expect(formatBakeDate('2026-01-15')).toBe('Jan 15, 2026')
      expect(formatBakeDate('2025-12-25')).toBe('Dec 25, 2025')
    })
  })
})
