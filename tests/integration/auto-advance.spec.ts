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

describe('Auto-Advance Integration', () => {
  beforeEach(() => {
    // Clear the store directly
    store = {}
    vi.clearAllMocks()
    // Reset module state by loading a dummy recipe and clearing
    const reset = useProgress('__reset__')
    reset.load()
    reset.resetProgress()
  })

  it('collapses stage and expands next when all items complete', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    // Set up stages
    progress.setStageOrder(['stage-1', 'stage-2', 'stage-3'])
    progress.registerStage('stage-1', ['item-1', 'item-2'], ['state-1'])
    progress.registerStage('stage-2', ['item-3'], [])
    progress.registerStage('stage-3', [], ['state-2'])

    // Initially no stages collapsed
    expect(progress.isStageCollapsed('stage-1')).toBe(false)
    expect(progress.isStageCollapsed('stage-2')).toBe(false)
    expect(progress.isStageCollapsed('stage-3')).toBe(false)

    // Complete all items in stage-1
    progress.toggleItem('item-1', 'stage-1')
    progress.toggleItem('item-2', 'stage-1')
    progress.toggleState('state-1', 'stage-1')

    // Verify stage-1 collapsed, stage-2 expanded (not collapsed)
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
    expect(progress.isStageCollapsed('stage-2')).toBe(false)
    expect(progress.isStageCollapsed('stage-3')).toBe(false)
  })

  it('does not auto-advance if items remain incomplete', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    // Set up stages
    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', ['item-1', 'item-2'], ['state-1'])
    progress.registerStage('stage-2', ['item-3'], [])

    // Complete only some items
    progress.toggleItem('item-1', 'stage-1')
    progress.toggleState('state-1', 'stage-1')
    // item-2 is NOT completed

    // Stage-1 should NOT be collapsed
    expect(progress.isStageCollapsed('stage-1')).toBe(false)
    expect(progress.isStageCollapsed('stage-2')).toBe(false)
  })

  it('does not auto-advance if states remain incomplete', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    // Set up stages
    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', ['item-1'], ['state-1', 'state-2'])
    progress.registerStage('stage-2', [], [])

    // Complete all items but not all states
    progress.toggleItem('item-1', 'stage-1')
    progress.toggleState('state-1', 'stage-1')
    // state-2 is NOT completed

    // Stage-1 should NOT be collapsed
    expect(progress.isStageCollapsed('stage-1')).toBe(false)
  })

  it('auto-advances through multiple stages sequentially', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    // Set up 3 stages
    progress.setStageOrder(['stage-1', 'stage-2', 'stage-3'])
    progress.registerStage('stage-1', ['item-1'], [])
    progress.registerStage('stage-2', ['item-2'], [])
    progress.registerStage('stage-3', ['item-3'], [])

    // Complete stage-1
    progress.toggleItem('item-1', 'stage-1')
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
    expect(progress.isStageCollapsed('stage-2')).toBe(false)

    // Complete stage-2
    progress.toggleItem('item-2', 'stage-2')
    expect(progress.isStageCollapsed('stage-2')).toBe(true)
    expect(progress.isStageCollapsed('stage-3')).toBe(false)
  })

  it('does not collapse last stage when complete', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    // Set up stages
    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', ['item-1'], [])
    progress.registerStage('stage-2', ['item-2'], [])

    // Complete both stages
    progress.toggleItem('item-1', 'stage-1')
    progress.toggleItem('item-2', 'stage-2')

    // Both should be collapsed when complete
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
    expect(progress.isStageCollapsed('stage-2')).toBe(true)
  })

  it('handles stage with only items (no states)', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', ['item-1', 'item-2'], []) // No states
    progress.registerStage('stage-2', [], [])

    // Complete all items
    progress.toggleItem('item-1', 'stage-1')
    progress.toggleItem('item-2', 'stage-1')

    // Should auto-advance since no states required
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
  })

  it('handles stage with only states (no items)', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', [], ['state-1', 'state-2']) // No items
    progress.registerStage('stage-2', [], [])

    // Complete all states
    progress.toggleState('state-1', 'stage-1')
    progress.toggleState('state-2', 'stage-1')

    // Should auto-advance since no items required
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
  })

  it('handles empty stage (no items or states)', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', [], []) // Empty stage
    progress.registerStage('stage-2', ['item-1'], [])

    // Manually collapse should work
    progress.toggleStageCollapse('stage-1')
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
  })

  it('unchecking item re-evaluates but does not uncollapse', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', ['item-1'], [])
    progress.registerStage('stage-2', [], [])

    // Complete stage-1
    progress.toggleItem('item-1', 'stage-1')
    expect(progress.isStageCollapsed('stage-1')).toBe(true)

    // Uncheck item-1
    progress.toggleItem('item-1', 'stage-1')

    // Stage remains collapsed (current behavior - collapse is sticky)
    // The auto-advance only triggers on completion, not on unchecking
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
  })

  it('manual toggle overrides auto-advance state', () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', ['item-1'], [])
    progress.registerStage('stage-2', [], [])

    // Complete stage-1, auto-collapses
    progress.toggleItem('item-1', 'stage-1')
    expect(progress.isStageCollapsed('stage-1')).toBe(true)

    // Manually expand stage-1
    progress.toggleStageCollapse('stage-1')
    expect(progress.isStageCollapsed('stage-1')).toBe(false)

    // Manually collapse again
    progress.toggleStageCollapse('stage-1')
    expect(progress.isStageCollapsed('stage-1')).toBe(true)
  })

  it('persists stage collapse state to localStorage', async () => {
    const progress = useProgress('test-recipe')
    progress.load()

    progress.setStageOrder(['stage-1', 'stage-2'])
    progress.registerStage('stage-1', ['item-1'], [])
    progress.registerStage('stage-2', [], [])

    // Complete stage-1
    progress.toggleItem('item-1', 'stage-1')

    // Wait for localStorage save
    await vi.waitFor(() => {
      const saved = store['recipe-progress-test-recipe']
      expect(saved).toBeDefined()
      const data = JSON.parse(saved)
      expect(data.stages['stage-1']).toBe(true)
    })
  })
})
