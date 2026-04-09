import { reactive, computed, watch } from 'vue'

interface ProgressState {
  items: Record<string, boolean>
  states: Record<string, boolean>
  stages: Record<string, boolean>
}

interface StageContext {
  stageId: string
  itemIds: string[]
  stateIds: string[]
}

const state = reactive<ProgressState>({
  items: {},
  states: {},
  stages: {}
})

let stageOrder: string[] = []
let stageContexts: Map<string, StageContext> = new Map()
let currentRecipeId: string | null = null

export function useProgress(recipeId: string) {
  const storageKey = `recipe-progress-${recipeId}`

  function load() {
    // Clear state when switching to different recipe
    if (currentRecipeId !== recipeId) {
      state.items = {}
      state.states = {}
      state.stages = {}
      stageOrder = []
      stageContexts = new Map()
      currentRecipeId = recipeId
    }

    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved)
      state.items = parsed.items || {}
      state.states = parsed.states || {}
      state.stages = parsed.stages || {}
    }
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify({
      items: state.items,
      states: state.states,
      stages: state.stages
    }))
  }

  watch(state, save, { deep: true })

  function setStageOrder(stages: string[]) {
    stageOrder = stages
  }

  function registerStage(stageId: string, itemIds: string[], stateIds: string[]) {
    stageContexts.set(stageId, { stageId, itemIds, stateIds })
  }

  function checkAutoAdvance(currentStageId: string): string | null {
    const ctx = stageContexts.get(currentStageId)
    if (!ctx) return null

    const allItemsDone = ctx.itemIds.length === 0 || ctx.itemIds.every(id => state.items[id])
    const allStatesDone = ctx.stateIds.length === 0 || ctx.stateIds.every(id => state.states[id])

    if (allItemsDone && allStatesDone) {
      // Collapse current stage
      state.stages[currentStageId] = true

      // Expand next stage
      const currentIndex = stageOrder.indexOf(currentStageId)
      if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
        const nextStageId = stageOrder[currentIndex + 1]
        state.stages[nextStageId] = false
        return nextStageId
      }
    }
    return null
  }

  function toggleItem(id: string, stageId?: string): string | null {
    state.items[id] = !state.items[id]
    if (stageId) {
      return checkAutoAdvance(stageId)
    }
    return null
  }

  function toggleState(id: string, stageId?: string): string | null {
    state.states[id] = !state.states[id]
    if (stageId) {
      return checkAutoAdvance(stageId)
    }
    return null
  }

  function toggleStageCollapse(id: string) {
    state.stages[id] = !state.stages[id]
  }

  function isItemChecked(id: string): boolean {
    return !!state.items[id]
  }

  function isStateChecked(id: string): boolean {
    return !!state.states[id]
  }

  function isStageCollapsed(id: string): boolean {
    return !!state.stages[id]
  }

  function getCompletionCount(ids: string[]): { done: number; total: number } {
    const done = ids.filter(id => state.items[id] || state.states[id]).length
    return { done, total: ids.length }
  }

  function resetSection(stageId: string) {
    const ctx = stageContexts.get(stageId)
    if (ctx) {
      for (const id of ctx.itemIds) {
        delete state.items[id]
      }
      for (const id of ctx.stateIds) {
        delete state.states[id]
      }
    }
    delete state.stages[stageId]
  }

  function resetProgress() {
    state.items = {}
    state.states = {}
    state.stages = {}
    localStorage.removeItem(storageKey)
  }

  const hasProgress = computed<boolean>(() => {
    return Object.values(state.items).some(Boolean) || Object.values(state.states).some(Boolean)
  })

  const checkedItemCount = computed<number>(() => {
    return Object.values(state.items).filter(Boolean).length
  })

  const checkedStateCount = computed<number>(() => {
    return Object.values(state.states).filter(Boolean).length
  })

  return {
    load,
    setStageOrder,
    registerStage,
    toggleItem,
    toggleState,
    toggleStageCollapse,
    isItemChecked,
    isStateChecked,
    isStageCollapsed,
    getCompletionCount,
    resetSection,
    resetProgress,
    hasProgress,
    checkedItemCount,
    checkedStateCount
  }
}
