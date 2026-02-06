import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRecipe } from './useRecipe'

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
  families: [{
    id: 'test-family',
    name: 'Test Family',
    variants: [
      { id: 'v1', recipeId: 'recipe-a', label: 'Variant A' }
    ]
  }],
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
    const { manifest, currentRecipe, currentRecipeId, families, error } = useRecipe()
    manifest.value = null
    currentRecipe.value = null
    currentRecipeId.value = null
    families.value = []
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

  it('populates families from manifest', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })

    const { loadManifest, families } = useRecipe()
    await loadManifest()

    expect(families.value).toHaveLength(1)
    expect(families.value[0].id).toBe('test-family')
    expect(families.value[0].name).toBe('Test Family')
    expect(families.value[0].variants).toHaveLength(1)
    expect(families.value[0].variants[0].recipeId).toBe('recipe-a')
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

  it('returns currentFamily for recipe in family', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRecipe)
    })

    const { loadManifest, loadRecipe, currentFamily } = useRecipe()
    await loadManifest()
    await loadRecipe('recipe-a')

    expect(currentFamily.value).not.toBeNull()
    expect(currentFamily.value?.id).toBe('test-family')
    expect(currentFamily.value?.name).toBe('Test Family')
  })

  it('returns null currentFamily for standalone recipe', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockManifest)
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRecipe)
    })

    const { loadManifest, loadRecipe, currentFamily } = useRecipe()
    await loadManifest()
    // recipe-b is not in any family
    await loadRecipe('recipe-b')

    expect(currentFamily.value).toBeNull()
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
})
