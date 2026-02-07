import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProgress } from './useProgress'

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

describe('useProgress', () => {
  beforeEach(() => {
    // Clear the store directly
    store = {}
    vi.clearAllMocks()
    // Reset module state by loading a dummy recipe and clearing
    const reset = useProgress('__reset__')
    reset.load()
    reset.resetProgress()
  })

  it('initializes with empty state', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    expect(progress.isItemChecked('item-1')).toBe(false)
    expect(progress.isStateChecked('state-1')).toBe(false)
    expect(progress.isStageCollapsed('stage-1')).toBe(false)
  })

  it('toggleItem flips boolean', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    expect(progress.isItemChecked('item-1')).toBe(false)

    progress.toggleItem('item-1')
    expect(progress.isItemChecked('item-1')).toBe(true)

    progress.toggleItem('item-1')
    expect(progress.isItemChecked('item-1')).toBe(false)
  })

  it('toggleState flips boolean', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    expect(progress.isStateChecked('state-1')).toBe(false)

    progress.toggleState('state-1')
    expect(progress.isStateChecked('state-1')).toBe(true)

    progress.toggleState('state-1')
    expect(progress.isStateChecked('state-1')).toBe(false)
  })

  it('persists to localStorage on change', async () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.toggleItem('item-1')

    // Vue watch is async, need to wait a tick
    await vi.waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recipe-progress-test-recipe',
        expect.stringContaining('"items":{"item-1":true}')
      )
    })
  })

  it('loads from localStorage', () => {
    const savedData = {
      items: { 'item-1': true, 'item-2': true },
      states: { 'state-1': true },
      stages: { 'stage-1': true }
    }
    localStorageMock.setItem('recipe-progress-test-recipe', JSON.stringify(savedData))

    const progress = useProgress('test-recipe')
    progress.load()

    expect(progress.isItemChecked('item-1')).toBe(true)
    expect(progress.isItemChecked('item-2')).toBe(true)
    expect(progress.isStateChecked('state-1')).toBe(true)
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
  })

  it('clears state when switching recipes', async () => {
    // CRITICAL REGRESSION TEST
    // Tests that switching between recipes clears in-memory state
    // and prevents cross-contamination between recipes.
    //
    // Simulating how the app works: the user views recipe-a, makes progress,
    // then navigates to recipe-b, then returns to recipe-a.

    // Pre-populate localStorage as if user had previously made progress
    store['recipe-progress-recipe-a'] = JSON.stringify({
      items: { 'flour': true, 'sugar': true },
      states: { 'mix-state': true },
      stages: {}
    })

    store['recipe-progress-recipe-b'] = JSON.stringify({
      items: { 'butter': true },
      states: {},
      stages: {}
    })

    // 1. User opens recipe-a page
    const progressA = useProgress('recipe-a')
    progressA.load()

    // Verify recipe-a state was loaded from localStorage
    expect(progressA.isItemChecked('flour')).toBe(true)
    expect(progressA.isItemChecked('sugar')).toBe(true)
    expect(progressA.isStateChecked('mix-state')).toBe(true)

    // 2. User navigates to recipe-b
    const progressB = useProgress('recipe-b')
    progressB.load()

    // Verify recipe-b starts clean (no recipe-a items)
    expect(progressB.isItemChecked('flour')).toBe(false)
    expect(progressB.isItemChecked('sugar')).toBe(false)
    expect(progressB.isStateChecked('mix-state')).toBe(false)

    // Verify recipe-b loaded its own state
    expect(progressB.isItemChecked('butter')).toBe(true)

    // 3. User navigates back to recipe-a
    progressA.load()

    // 4. Verify recipe-a state was preserved (loaded from localStorage)
    expect(progressA.isItemChecked('flour')).toBe(true)
    expect(progressA.isItemChecked('sugar')).toBe(true)
    expect(progressA.isStateChecked('mix-state')).toBe(true)

    // 5. Verify no cross-contamination from recipe-b
    expect(progressA.isItemChecked('butter')).toBe(false)
  })

  it('auto-advances when stage complete', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    // Set up stage order
    progress.setStageOrder(['stage-1', 'stage-2', 'stage-3'])

    // Register stage-1 with items and states
    progress.registerStage('stage-1', ['item-1', 'item-2'], ['state-1'])
    progress.registerStage('stage-2', ['item-3'], ['state-2'])

    // Initially stage-1 should not be collapsed
    expect(progress.isStageCollapsed('stage-1')).toBe(false)
    expect(progress.isStageCollapsed('stage-2')).toBe(false)

    // Complete some items (not all)
    progress.toggleItem('item-1', 'stage-1')
    expect(progress.isStageCollapsed('stage-1')).toBe(false)

    // Complete remaining items
    progress.toggleItem('item-2', 'stage-1')
    // Still not collapsed because state-1 is not complete
    expect(progress.isStageCollapsed('stage-1')).toBe(false)

    // Complete the state - this should trigger auto-advance
    progress.toggleState('state-1', 'stage-1')

    // Stage-1 should now be collapsed
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
    // Stage-2 should be expanded (false = not collapsed)
    expect(progress.isStageCollapsed('stage-2')).toBe(false)
  })

  it('auto-advances stage with no items (only states)', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', [], ['state-1']) // no items
    progress.registerStage('stage-2', [], ['state-2'])

    // Complete the only state
    progress.toggleState('state-1', 'stage-1')

    expect(progress.isStageCollapsed('stage-1')).toBe(true)
    expect(progress.isStageCollapsed('stage-2')).toBe(false)
  })

  it('auto-advances stage with no states (only items)', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', ['item-1'], []) // no states
    progress.registerStage('stage-2', ['item-2'], [])

    // Complete the only item
    progress.toggleItem('item-1', 'stage-1')

    expect(progress.isStageCollapsed('stage-1')).toBe(true)
  })

  it('does not auto-advance when stage not in order', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    // Register a stage but don't set it in the order
    progress.setStageOrder([])
    progress.registerStage('stage-1', [], ['state-1'])

    progress.toggleState('state-1', 'stage-1')

    // Should collapse but no next stage to expand
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
  })

  it('does not auto-advance when last stage in order', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1'])
    progress.registerStage('stage-1', [], ['state-1'])

    progress.toggleState('state-1', 'stage-1')

    // Should collapse (it's the last stage)
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
  })

  it('does not check auto-advance when stageId not provided', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', ['item-1'], ['state-1'])

    // Toggle without stageId — no auto-advance check
    progress.toggleItem('item-1')
    progress.toggleState('state-1')

    // Stage should NOT be collapsed (no auto-advance was triggered)
    expect(progress.isStageCollapsed('stage-1')).toBe(false)
  })

  it('loads from same recipe ID without clearing state', async () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.toggleItem('item-1')
    expect(progress.isItemChecked('item-1')).toBe(true)

    // Wait for the watcher to save to localStorage
    await vi.waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recipe-progress-test-recipe',
        expect.stringContaining('"item-1":true')
      )
    })

    // Load again with same recipe ID — should not clear state
    progress.load()

    // State should still be there (read from localStorage)
    expect(progress.isItemChecked('item-1')).toBe(true)
  })

  it('hasProgress is false when no items or states checked', () => {
    const progress = useProgress('test-recipe')
    progress.load()
    expect(progress.hasProgress.value).toBe(false)
  })

  it('hasProgress is true when an item is checked', () => {
    const progress = useProgress('test-recipe')
    progress.load()
    progress.toggleItem('item-1')
    expect(progress.hasProgress.value).toBe(true)
  })

  it('hasProgress is true when a state is checked', () => {
    const progress = useProgress('test-recipe')
    progress.load()
    progress.toggleState('state-1')
    expect(progress.hasProgress.value).toBe(true)
  })

  it('hasProgress resets to false after resetProgress', () => {
    const progress = useProgress('test-recipe')
    progress.load()
    progress.toggleItem('item-1')
    expect(progress.hasProgress.value).toBe(true)
    progress.resetProgress()
    expect(progress.hasProgress.value).toBe(false)
  })

  it('tracks completion count correctly', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    const ids = ['item-1', 'item-2', 'state-1', 'state-2', 'item-3']

    // Initially nothing done
    let count = progress.getCompletionCount(ids)
    expect(count.done).toBe(0)
    expect(count.total).toBe(5)

    // Complete some items
    progress.toggleItem('item-1')
    progress.toggleItem('item-2')
    count = progress.getCompletionCount(ids)
    expect(count.done).toBe(2)
    expect(count.total).toBe(5)

    // Complete some states
    progress.toggleState('state-1')
    count = progress.getCompletionCount(ids)
    expect(count.done).toBe(3)
    expect(count.total).toBe(5)

    // Complete remaining
    progress.toggleState('state-2')
    progress.toggleItem('item-3')
    count = progress.getCompletionCount(ids)
    expect(count.done).toBe(5)
    expect(count.total).toBe(5)
  })
})
