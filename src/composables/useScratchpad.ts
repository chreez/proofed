import { reactive, computed } from 'vue'
import type { BakeScratchpad, ScratchpadEntry, ExperimentExport } from '@/types/recipe'

interface ScratchpadState {
  entries: Record<string, ScratchpadEntry[]>
  generalNotes: ScratchpadEntry[]
  dismissedReminders: Record<string, boolean>
}

const state = reactive<ScratchpadState>({
  entries: {},
  generalNotes: [],
  dismissedReminders: {}
})

let currentRecipeId: string | null = null
let currentStorageKey: string | null = null

function getStorageKey(recipeId: string): string {
  return `scratchpad-${recipeId}`
}

function save(): void {
  if (!currentStorageKey) return
  localStorage.setItem(currentStorageKey, JSON.stringify({
    entries: state.entries,
    generalNotes: state.generalNotes,
    dismissedReminders: state.dismissedReminders
  }))
}

export function useScratchpad(recipeId: string) {
  function load(): void {
    if (currentRecipeId !== recipeId) {
      state.entries = {}
      state.generalNotes = []
      state.dismissedReminders = {}
      currentRecipeId = recipeId
      currentStorageKey = getStorageKey(recipeId)
    }

    const saved = localStorage.getItem(currentStorageKey!)
    if (saved) {
      const parsed = JSON.parse(saved)
      state.entries = parsed.entries || {}
      state.generalNotes = parsed.generalNotes || []
      state.dismissedReminders = parsed.dismissedReminders || {}
    }
  }

  function addNote(stepId: string, value: string): void {
    if (!value.trim()) return
    if (!state.entries[stepId]) {
      state.entries[stepId] = []
    }
    state.entries[stepId].push({
      stepId,
      timestamp: new Date().toISOString(),
      type: 'note',
      value: value.trim()
    })
    save()
  }

  function addReminderResponse(stepId: string, prompt: string, value: string): void {
    if (!value.trim()) return
    if (!state.entries[stepId]) {
      state.entries[stepId] = []
    }
    const existing = state.entries[stepId].findIndex(
      e => e.type === 'reminder_response' && e.prompt === prompt
    )
    const entry: ScratchpadEntry = {
      stepId,
      timestamp: new Date().toISOString(),
      type: 'reminder_response',
      prompt,
      value: value.trim()
    }
    if (existing >= 0) {
      state.entries[stepId][existing] = entry
    } else {
      state.entries[stepId].push(entry)
    }
    save()
  }

  function addGeneralNote(value: string): void {
    if (!value.trim()) return
    state.generalNotes.push({
      stepId: '_general',
      timestamp: new Date().toISOString(),
      type: 'note',
      value: value.trim()
    })
    save()
  }

  function dismissReminder(stepId: string, prompt: string): void {
    state.dismissedReminders[`${stepId}::${prompt}`] = true
    save()
  }

  function isReminderDismissed(stepId: string, prompt: string): boolean {
    return !!state.dismissedReminders[`${stepId}::${prompt}`]
  }

  function getEntriesForStep(stepId: string): ScratchpadEntry[] {
    return state.entries[stepId] || []
  }

  /**
   * Edit an existing scratchpad entry's value. Type-agnostic (works for
   * 'note', 'reminder_response', and 'rating' entries). Trims whitespace and
   * no-ops on empty values to avoid producing invalid entries. Preserves the
   * original timestamp, type, prompt, and stepId.
   */
  function editEntry(
    stepId: string,
    index: number,
    newValue: string
  ): void {
    const trimmed = newValue.trim()
    if (!trimmed) return
    const list = stepId === '_general' ? state.generalNotes : state.entries[stepId]
    if (!list) return
    const existing = list[index]
    if (!existing) return
    list[index] = { ...existing, value: trimmed }
    save()
  }

  /**
   * Hard-delete an entry from a step list (or the general notes list when
   * stepId is '_general'). Splices the entry out of the array. If the step
   * list becomes empty, removes the empty key so the export shape stays clean.
   * Type-agnostic.
   */
  function deleteEntry(stepId: string, index: number): void {
    if (stepId === '_general') {
      if (index < 0 || index >= state.generalNotes.length) return
      state.generalNotes.splice(index, 1)
      save()
      return
    }
    const list = state.entries[stepId]
    if (!list) return
    if (index < 0 || index >= list.length) return
    list.splice(index, 1)
    if (list.length === 0) {
      delete state.entries[stepId]
    }
    save()
  }

  const totalEntryCount = computed<number>(() => {
    let count = 0
    for (const entries of Object.values(state.entries)) {
      count += entries.length
    }
    count += state.generalNotes.length
    return count
  })

  const generalNoteCount = computed<number>(() => state.generalNotes.length)

  function hasEntriesForStep(stepId: string): boolean {
    const entries = state.entries[stepId]
    return !!entries && entries.length > 0
  }

  function exportJson(
    multiplier?: number,
    experimentExport?: ExperimentExport | null
  ): BakeScratchpad {
    return {
      recipeId: recipeId,
      bakeDate: new Date().toISOString().split('T')[0],
      ...(multiplier != null && multiplier !== 1 ? { multiplier } : {}),
      entries: { ...state.entries },
      generalNotes: [...state.generalNotes],
      // Only attach when a real export with at least one adjustment is provided.
      // Use a spread-conditional so the key is fully omitted (not set to null/{})
      // when no experiment was active — preserves byte-identical exports for
      // recipes without experiment config (PF-259 AC #2).
      ...(experimentExport && experimentExport.adjustments.length > 0
        ? { experimentExport }
        : {})
    }
  }

  function exportJsonString(
    multiplier?: number,
    experimentExport?: ExperimentExport | null
  ): string {
    return JSON.stringify(exportJson(multiplier, experimentExport), null, 2)
  }

  function clearAll(): void {
    state.entries = {}
    state.generalNotes = []
    state.dismissedReminders = {}
    if (currentStorageKey) {
      localStorage.removeItem(currentStorageKey)
    }
  }

  return {
    load,
    addNote,
    addReminderResponse,
    addGeneralNote,
    dismissReminder,
    isReminderDismissed,
    getEntriesForStep,
    editEntry,
    deleteEntry,
    hasEntriesForStep,
    totalEntryCount,
    generalNoteCount,
    allStepEntries: computed(() => state.entries),
    generalNotes: computed(() => state.generalNotes),
    exportJson,
    exportJsonString,
    clearAll
  }
}
