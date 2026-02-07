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
import { useRecipeMeta } from './useRecipeMeta'

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

  it('sets static OG image and dimensions', () => {
    const recipe = ref<Recipe | null>(null)
    const recipeId = ref<string | null>(null)

    useRecipeMeta(() => recipe.value, () => recipeId.value)

    expect(capturedInput.ogImage).toBe('https://proofeddot.netlify.app/og-image.png')
    expect(capturedInput.ogImageWidth).toBe(1200)
    expect(capturedInput.ogImageHeight).toBe(630)
    expect(capturedInput.twitterCard).toBe('summary_large_image')
  })
})
