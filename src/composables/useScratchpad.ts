import { reactive, computed } from 'vue'
import type { BakeScratchpad, ScratchpadEntry } from '@/types/recipe'

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

  function exportJson(multiplier?: number): BakeScratchpad {
    return {
      recipeId: recipeId,
      bakeDate: new Date().toISOString().split('T')[0],
      ...(multiplier != null && multiplier !== 1 ? { multiplier } : {}),
      entries: { ...state.entries },
      generalNotes: [...state.generalNotes]
    }
  }

  function exportJsonString(multiplier?: number): string {
    return JSON.stringify(exportJson(multiplier), null, 2)
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
