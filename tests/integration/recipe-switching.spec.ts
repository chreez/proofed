import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProgress } from '@/composables/useProgress'

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

describe('Recipe Switching Integration', () => {
  beforeEach(() => {
    // Clear the store directly
    store = {}
    vi.clearAllMocks()
    // Reset module state by loading a dummy recipe and clearing
    const reset = useProgress('__reset__')
    reset.load()
    reset.resetProgress()
  })

  it('preserves progress when switching between recipes', async () => {
    // Pre-populate localStorage as if user had previously made progress
    // This simulates the real-world scenario where progress was saved from a previous session
    store['recipe-progress-recipe-a'] = JSON.stringify({
      items: { 'item-1': true, 'item-2': true },
      states: {},
      stages: {}
    })
    store['recipe-progress-recipe-b'] = JSON.stringify({
      items: { 'item-x': true },
      states: {},
      stages: {}
    })

    // 1. Load recipe A
    const progressA = useProgress('recipe-a')
    progressA.load()

    // Verify recipe A progress was loaded
    expect(progressA.isItemChecked('item-1')).toBe(true)
    expect(progressA.isItemChecked('item-2')).toBe(true)

    // 2. Switch to recipe B
    const progressB = useProgress('recipe-b')
    progressB.load()

    // Verify recipe B progress was loaded
    expect(progressB.isItemChecked('item-x')).toBe(true)

    // 3. Switch back to recipe A
    const progressA2 = useProgress('recipe-a')
    progressA2.load()

    // 4. Verify recipe A progress is intact
    expect(progressA2.isItemChecked('item-1')).toBe(true)
    expect(progressA2.isItemChecked('item-2')).toBe(true)

    // 5. Verify no cross-contamination
    expect(progressA2.isItemChecked('item-x')).toBe(false)
  })

  it('each recipe has independent localStorage keys', () => {
    // This test verifies the localStorage key structure
    // Pre-populate both recipes
    store['recipe-progress-recipe-a'] = JSON.stringify({
      items: { 'flour': true },
      states: { 'mix-state': true },
      stages: {}
    })
    store['recipe-progress-recipe-b'] = JSON.stringify({
      items: { 'butter': true, 'eggs': true },
      states: {},
      stages: {}
    })

    // Load recipe A and verify isolation
    const progressA = useProgress('recipe-a')
    progressA.load()
    expect(progressA.isItemChecked('flour')).toBe(true)
    expect(progressA.isStateChecked('mix-state')).toBe(true)
    expect(progressA.isItemChecked('butter')).toBe(false)
    expect(progressA.isItemChecked('eggs')).toBe(false)

    // Load recipe B and verify isolation
    const progressB = useProgress('recipe-b')
    progressB.load()
    expect(progressB.isItemChecked('butter')).toBe(true)
    expect(progressB.isItemChecked('eggs')).toBe(true)
    expect(progressB.isItemChecked('flour')).toBe(false)
    expect(progressB.isStateChecked('mix-state')).toBe(false)
  })

  it('switching recipes does not corrupt stored data', () => {
    // Pre-populate localStorage for recipe-a
    store['recipe-progress-recipe-a'] = JSON.stringify({
      items: { 'flour': true, 'sugar': true },
      states: { 'mix-state': true },
      stages: {}
    })

    // Load recipe-b and make changes (this should not touch recipe-a data)
    const progressB = useProgress('recipe-b')
    progressB.load()
    progressB.toggleItem('butter')

    // Switch back to recipe-a and verify data is intact
    const progressA = useProgress('recipe-a')
    progressA.load()

    expect(progressA.isItemChecked('flour')).toBe(true)
    expect(progressA.isItemChecked('sugar')).toBe(true)
    expect(progressA.isStateChecked('mix-state')).toBe(true)
    expect(progressA.isItemChecked('butter')).toBe(false)
  })

  it('clears in-memory state when switching recipes', () => {
    // Pre-populate localStorage
    store['recipe-progress-recipe-a'] = JSON.stringify({
      items: { 'flour': true },
      states: {},
      stages: {}
    })
    store['recipe-progress-recipe-b'] = JSON.stringify({
      items: { 'butter': true },
      states: {},
      stages: {}
    })

    // Load recipe-a
    const progressA = useProgress('recipe-a')
    progressA.load()
    expect(progressA.isItemChecked('flour')).toBe(true)
    expect(progressA.isItemChecked('butter')).toBe(false)

    // Switch to recipe-b
    const progressB = useProgress('recipe-b')
    progressB.load()

    // In-memory state should now reflect recipe-b only
    expect(progressB.isItemChecked('butter')).toBe(true)
    expect(progressB.isItemChecked('flour')).toBe(false)
  })

  it('resetProgress only clears current recipe', async () => {
    // Setup both recipes with progress
    store['recipe-progress-recipe-a'] = JSON.stringify({
      items: { 'flour': true },
      states: {},
      stages: {}
    })
    store['recipe-progress-recipe-b'] = JSON.stringify({
      items: { 'butter': true },
      states: {},
      stages: {}
    })

    // Load recipe-a and reset
    const progressA = useProgress('recipe-a')
    progressA.load()
    progressA.resetProgress()

    // Recipe-a should be cleared
    expect(store['recipe-progress-recipe-a']).toBeUndefined()

    // Recipe-b should be intact
    const dataB = JSON.parse(store['recipe-progress-recipe-b'])
    expect(dataB.items.butter).toBe(true)
  })
})
