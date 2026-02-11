import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRecipe, normalizeSource } from './useRecipe'

// Mock localStorage with proper implementation
let store: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { store = {} }),
  get length() { return Object.keys(store).length },
  key: vi.fn((i: number) => Object.keys(store)[i] || null)
}

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Mock data
const mockManifest = {
  recipes: [
    { id: 'recipe-a', name: 'Recipe A', file: 'recipe-a.json' },
    { id: 'recipe-b', name: 'Recipe B', file: 'recipe-b.json' }
  ]
}

const mockRecipe = {
  meta: { name: 'Test Recipe', yields: '8 servings', total_time: '1 hr' },
  config: { early_check_percent: 0.8 },
  vessels: [],
  stages: [],
  states: []
}

describe('useRecipe', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    store = {}

    // Reset module-level refs by clearing them
    const { manifest, currentRecipe, currentRecipeId, error } = useRecipe()
    manifest.value = null
    currentRecipe.value = null
    currentRecipeId.value = null
    error.value = null
  })

  it('loads manifest from /recipes/index.json', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })

    const { loadManifest, recipeList } = useRecipe()
    await loadManifest()

    expect(mockFetch).toHaveBeenCalledWith('/recipes/index.json')
    expect(recipeList.value).toHaveLength(2)
    expect(recipeList.value[0]).toEqual({ id: 'recipe-a', name: 'Recipe A', file: 'recipe-a.json' })
    expect(recipeList.value[1]).toEqual({ id: 'recipe-b', name: 'Recipe B', file: 'recipe-b.json' })
  })

  it('loads recipe by id', async () => {
    // First fetch for manifest (already loaded in loadManifest)
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })
    // Second fetch for recipe file
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRecipe)
    })

    const { loadManifest, loadRecipe, currentRecipe, currentRecipeId } = useRecipe()
    await loadManifest()
    await loadRecipe('recipe-a')

    expect(mockFetch).toHaveBeenCalledWith('/recipes/recipe-a.json')
    expect(currentRecipe.value).toEqual(mockRecipe)
    expect(currentRecipeId.value).toBe('recipe-a')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('last-recipe-id', 'recipe-a')
  })

  it('restoreLastRecipe returns true when restored', async () => {
    // Set up localStorage with last recipe id
    store['last-recipe-id'] = 'recipe-a'

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRecipe)
    })

    const { loadManifest, restoreLastRecipe, currentRecipe, currentRecipeId } = useRecipe()
    await loadManifest()
    const restored = await restoreLastRecipe()

    expect(restored).toBe(true)
    expect(currentRecipe.value).toEqual(mockRecipe)
    expect(currentRecipeId.value).toBe('recipe-a')
  })

  it('restoreLastRecipe returns false when no saved recipe', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })

    const { loadManifest, restoreLastRecipe } = useRecipe()
    await loadManifest()
    const restored = await restoreLastRecipe()

    expect(restored).toBe(false)
  })

  it('restoreLastRecipe returns false when saved recipe not in manifest', async () => {
    // Set up localStorage with a recipe id that doesn't exist
    store['last-recipe-id'] = 'nonexistent-recipe'

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })

    const { loadManifest, restoreLastRecipe } = useRecipe()
    await loadManifest()
    const restored = await restoreLastRecipe()

    expect(restored).toBe(false)
  })

  it('sets error when manifest fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { loadManifest, error } = useRecipe()
    await loadManifest()

    expect(error.value).toBe('Failed to load recipe list')
  })

  it('sets error when recipe not found in manifest', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })

    const { loadManifest, loadRecipe, error, currentRecipe } = useRecipe()
    await loadManifest()
    await loadRecipe('nonexistent')

    expect(error.value).toBe('Recipe not found')
    expect(currentRecipe.value).toBeNull()
  })

  it('sets error when recipe fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({})
    })

    const { loadManifest, loadRecipe, error, currentRecipe } = useRecipe()
    await loadManifest()
    await loadRecipe('recipe-a')

    expect(error.value).toBe('Failed to fetch recipe')
    expect(currentRecipe.value).toBeNull()
  })

  it('handles non-Error exceptions in loadRecipe', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })
    mockFetch.mockRejectedValueOnce('string error')

    const { loadManifest, loadRecipe, error } = useRecipe()
    await loadManifest()
    await loadRecipe('recipe-a')

    expect(error.value).toBe('Unknown error')
  })

  it('hasRecipe is true when currentRecipe is set', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRecipe)
    })

    const { loadManifest, loadRecipe, hasRecipe } = useRecipe()
    expect(hasRecipe.value).toBe(false)

    await loadManifest()
    await loadRecipe('recipe-a')

    expect(hasRecipe.value).toBe(true)
  })

})

describe('normalizeSource', () => {
  it('converts string to RecipeSource object', () => {
    expect(normalizeSource("America's Test Kitchen")).toEqual({ name: "America's Test Kitchen" })
  })

  it('passes through structured RecipeSource object', () => {
    const source = { name: 'ATK', url: 'https://example.com', type: 'original' as const }
    expect(normalizeSource(source)).toEqual(source)
  })

  it('returns undefined for null', () => {
    expect(normalizeSource(null)).toBeUndefined()
  })

  it('returns undefined for undefined', () => {
    expect(normalizeSource(undefined)).toBeUndefined()
  })

  it('returns undefined for object without name', () => {
    expect(normalizeSource({ url: 'https://example.com' })).toBeUndefined()
  })
})
