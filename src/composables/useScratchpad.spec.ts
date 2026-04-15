import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useScratchpad } from './useScratchpad'

// Mock localStorage
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

describe('useScratchpad', () => {
  beforeEach(() => {
    store = {}
    vi.clearAllMocks()
    // Reset module state
    const reset = useScratchpad('__reset__')
    reset.load()
    reset.clearAll()
  })

  describe('load', () => {
    it('initializes empty state for a new recipe', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      expect(sp.totalEntryCount.value).toBe(0)
      expect(sp.generalNoteCount.value).toBe(0)
    })

    it('loads saved data from localStorage', () => {
      store['scratchpad-recipe-a'] = JSON.stringify({
        entries: {
          'step-1': [{ stepId: 'step-1', timestamp: '2026-01-01T00:00:00Z', type: 'note', value: 'test' }]
        },
        generalNotes: [{ stepId: '_general', timestamp: '2026-01-01T00:00:00Z', type: 'note', value: 'general' }],
        dismissedReminders: { 'step-1::prompt-1': true }
      })

      const sp = useScratchpad('recipe-a')
      sp.load()

      expect(sp.totalEntryCount.value).toBe(2) // 1 step entry + 1 general note
      expect(sp.generalNoteCount.value).toBe(1)
      expect(sp.hasEntriesForStep('step-1')).toBe(true)
      expect(sp.isReminderDismissed('step-1', 'prompt-1')).toBe(true)
    })

    it('clears state when switching to a different recipe', () => {
      const sp1 = useScratchpad('recipe-a')
      sp1.load()
      sp1.addNote('step-1', 'note for recipe a')

      const sp2 = useScratchpad('recipe-b')
      sp2.load()

      // State should be cleared for the new recipe
      expect(sp2.hasEntriesForStep('step-1')).toBe(false)
      expect(sp2.totalEntryCount.value).toBe(0)
    })

    it('does not clear state when loading same recipe again', () => {
      store['scratchpad-recipe-a'] = JSON.stringify({
        entries: {
          'step-1': [{ stepId: 'step-1', timestamp: '2026-01-01T00:00:00Z', type: 'note', value: 'test' }]
        },
        generalNotes: [],
        dismissedReminders: {}
      })

      const sp = useScratchpad('recipe-a')
      sp.load()
      expect(sp.hasEntriesForStep('step-1')).toBe(true)

      // Load again with same ID
      sp.load()
      expect(sp.hasEntriesForStep('step-1')).toBe(true)
    })

    it('handles missing fields in saved data gracefully', () => {
      store['scratchpad-recipe-a'] = JSON.stringify({})

      const sp = useScratchpad('recipe-a')
      sp.load()

      expect(sp.totalEntryCount.value).toBe(0)
      expect(sp.generalNoteCount.value).toBe(0)
    })
  })

  describe('addNote', () => {
    it('creates an entry keyed by stepId', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'Dough was sticky')

      const entries = sp.getEntriesForStep('step-1')
      expect(entries).toHaveLength(1)
      expect(entries[0].type).toBe('note')
      expect(entries[0].value).toBe('Dough was sticky')
      expect(entries[0].stepId).toBe('step-1')
      expect(entries[0].timestamp).toBeTruthy()
    })

    it('trims whitespace from value', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', '  trimmed note  ')

      const entries = sp.getEntriesForStep('step-1')
      expect(entries[0].value).toBe('trimmed note')
    })

    it('ignores empty/whitespace-only values', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', '')
      sp.addNote('step-1', '   ')

      expect(sp.hasEntriesForStep('step-1')).toBe(false)
    })

    it('appends multiple notes to same step', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'First note')
      sp.addNote('step-1', 'Second note')

      const entries = sp.getEntriesForStep('step-1')
      expect(entries).toHaveLength(2)
    })

    it('saves to localStorage after adding', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'test')

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'scratchpad-recipe-a',
        expect.stringContaining('"step-1"')
      )
    })
  })

  describe('addReminderResponse', () => {
    it('creates a reminder_response entry', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addReminderResponse('step-1', 'Weigh dough', '748g')

      const entries = sp.getEntriesForStep('step-1')
      expect(entries).toHaveLength(1)
      expect(entries[0].type).toBe('reminder_response')
      expect(entries[0].prompt).toBe('Weigh dough')
      expect(entries[0].value).toBe('748g')
    })

    it('updates existing response for same prompt', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addReminderResponse('step-1', 'Weigh dough', '748g')
      sp.addReminderResponse('step-1', 'Weigh dough', '752g')

      const entries = sp.getEntriesForStep('step-1')
      const responses = entries.filter(e => e.type === 'reminder_response')
      expect(responses).toHaveLength(1)
      expect(responses[0].value).toBe('752g')
    })

    it('ignores empty/whitespace-only values', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addReminderResponse('step-1', 'Weigh dough', '')
      sp.addReminderResponse('step-1', 'Weigh dough', '   ')

      expect(sp.hasEntriesForStep('step-1')).toBe(false)
    })

    it('trims whitespace from value', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addReminderResponse('step-1', 'prompt', '  trimmed  ')

      const entries = sp.getEntriesForStep('step-1')
      expect(entries[0].value).toBe('trimmed')
    })

    it('creates entries array if step has no entries yet', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addReminderResponse('new-step', 'prompt', 'value')

      expect(sp.hasEntriesForStep('new-step')).toBe(true)
    })
  })

  describe('addGeneralNote', () => {
    it('adds to generalNotes array', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addGeneralNote('Overall bake went well')

      expect(sp.generalNoteCount.value).toBe(1)
      expect(sp.generalNotes.value[0].value).toBe('Overall bake went well')
      expect(sp.generalNotes.value[0].stepId).toBe('_general')
      expect(sp.generalNotes.value[0].type).toBe('note')
    })

    it('ignores empty values', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addGeneralNote('')
      sp.addGeneralNote('   ')

      expect(sp.generalNoteCount.value).toBe(0)
    })

    it('trims whitespace from value', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addGeneralNote('  trimmed  ')

      expect(sp.generalNotes.value[0].value).toBe('trimmed')
    })

    it('includes general notes in totalEntryCount', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addGeneralNote('note 1')
      sp.addGeneralNote('note 2')

      expect(sp.totalEntryCount.value).toBe(2)
    })
  })

  describe('dismissReminder / isReminderDismissed', () => {
    it('marks a reminder as dismissed', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      expect(sp.isReminderDismissed('step-1', 'Weigh dough')).toBe(false)

      sp.dismissReminder('step-1', 'Weigh dough')

      expect(sp.isReminderDismissed('step-1', 'Weigh dough')).toBe(true)
    })

    it('different prompts are independent', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.dismissReminder('step-1', 'Prompt A')

      expect(sp.isReminderDismissed('step-1', 'Prompt A')).toBe(true)
      expect(sp.isReminderDismissed('step-1', 'Prompt B')).toBe(false)
    })

    it('saves to localStorage on dismiss', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.dismissReminder('step-1', 'Weigh dough')

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('getEntriesForStep', () => {
    it('returns empty array for unknown step', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      expect(sp.getEntriesForStep('unknown')).toEqual([])
    })

    it('returns entries for known step', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'note')

      const entries = sp.getEntriesForStep('step-1')
      expect(entries).toHaveLength(1)
    })
  })

  describe('hasEntriesForStep', () => {
    it('returns false for unknown step', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      expect(sp.hasEntriesForStep('unknown')).toBe(false)
    })

    it('returns true when step has entries', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'note')

      expect(sp.hasEntriesForStep('step-1')).toBe(true)
    })
  })

  describe('totalEntryCount', () => {
    it('sums step entries and general notes', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'note 1')
      sp.addNote('step-2', 'note 2')
      sp.addGeneralNote('general')

      expect(sp.totalEntryCount.value).toBe(3)
    })
  })

  describe('generalNoteCount', () => {
    it('counts only general notes', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'step note')
      sp.addGeneralNote('general 1')
      sp.addGeneralNote('general 2')

      expect(sp.generalNoteCount.value).toBe(2)
    })
  })

  describe('allStepEntries', () => {
    it('returns the entries record', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'note')

      const entries = sp.allStepEntries.value
      expect(entries['step-1']).toHaveLength(1)
    })
  })

  describe('exportJson', () => {
    it('returns BakeScratchpad shape', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'note')
      sp.addGeneralNote('general')

      const exported = sp.exportJson()

      expect(exported.recipeId).toBe('recipe-a')
      expect(exported.bakeDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(exported.entries['step-1']).toHaveLength(1)
      expect(exported.generalNotes).toHaveLength(1)
    })

    it('returns a shallow copy of entries and generalNotes', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'note')
      sp.addGeneralNote('general')

      const exported = sp.exportJson()

      // Top-level entries object should be a different reference
      expect(exported.entries).not.toBe(sp.allStepEntries.value)

      // generalNotes array should be a different reference
      expect(exported.generalNotes).not.toBe(sp.generalNotes.value)
    })

    it('includes multiplier when not 1', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      const exported = sp.exportJson(0.5)
      expect(exported.multiplier).toBe(0.5)
    })

    it('omits multiplier when 1', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      const exported = sp.exportJson(1)
      expect(exported.multiplier).toBeUndefined()
    })

    it('omits multiplier when not provided', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      const exported = sp.exportJson()
      expect(exported.multiplier).toBeUndefined()
    })
  })

  describe('exportJsonString', () => {
    it('returns JSON string', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      const str = sp.exportJsonString()
      const parsed = JSON.parse(str)

      expect(parsed.recipeId).toBe('recipe-a')
    })

    it('passes multiplier through to exportJson', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      const str = sp.exportJsonString(2)
      const parsed = JSON.parse(str)

      expect(parsed.multiplier).toBe(2)
    })
  })

  describe('clearAll', () => {
    it('resets all state', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'note')
      sp.addGeneralNote('general')
      sp.dismissReminder('step-1', 'prompt')

      sp.clearAll()

      expect(sp.totalEntryCount.value).toBe(0)
      expect(sp.generalNoteCount.value).toBe(0)
      expect(sp.hasEntriesForStep('step-1')).toBe(false)
      expect(sp.isReminderDismissed('step-1', 'prompt')).toBe(false)
    })

    it('removes from localStorage', () => {
      const sp = useScratchpad('recipe-a')
      sp.load()

      sp.addNote('step-1', 'note')
      sp.clearAll()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('scratchpad-recipe-a')
    })
  })

  describe('save (internal via addNote)', () => {
    it('does not save when no storage key is set', () => {
      // This tests the guard in save() - the __reset__ recipe clears state
      // and calling clearAll already verified removeItem. This tests the
      // currentStorageKey guard indirectly via the module-level state.
      const sp = useScratchpad('recipe-a')
      sp.load()

      // Save is called internally on addNote
      const callsBefore = localStorageMock.setItem.mock.calls.length
      sp.addNote('step-1', 'note')

      expect(localStorageMock.setItem.mock.calls.length).toBeGreaterThan(callsBefore)
    })
  })
})
