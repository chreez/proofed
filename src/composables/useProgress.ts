import { reactive, watch } from 'vue'

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

export function useProgress(recipeId: string) {
  const storageKey = `recipe-progress-${recipeId}`

  function load() {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(state.items, parsed.items || {})
      Object.assign(state.states, parsed.states || {})
      Object.assign(state.stages, parsed.stages || {})
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

  function checkAutoAdvance(currentStageId: string) {
    const ctx = stageContexts.get(currentStageId)
    if (!ctx) return

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
      }
    }
  }

  function toggleItem(id: string, stageId?: string) {
    state.items[id] = !state.items[id]
    if (stageId) {
      checkAutoAdvance(stageId)
    }
  }

  function toggleState(id: string, stageId?: string) {
    state.states[id] = !state.states[id]
    if (stageId) {
      checkAutoAdvance(stageId)
    }
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

  function resetProgress() {
    state.items = {}
    state.states = {}
    state.stages = {}
    localStorage.removeItem(storageKey)
  }

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
    resetProgress
  }
}
