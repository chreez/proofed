import { watch, type Ref } from 'vue'
import type { FreeformIngredient } from './useExperiment'
import type { ExperimentExport, ExperimentAdjustment, ExperimentDerivedSnapshot, ExperimentConfig } from '@/types/recipe'

/** Shape of experiment data persisted in localStorage. */
export interface ExperimentStorageData {
  adjustments: Record<string, number>
  freeformIngredients: FreeformIngredient[]
  notes: Record<string, string>
  lastEditedAt: string | null
  editHistory: string[]
}

function getStorageKey(recipeId: string): string {
  return `experiment-${recipeId}`
}

/**
 * Persistence layer for experiment panel state.
 * Saves adjustments, freeform ingredients, and per-slider notes to localStorage.
 */
export function useExperimentStorage(
  recipeId: string,
  adjustments: Ref<Map<string, number>>,
  freeformIngredients: Ref<FreeformIngredient[]>,
  notes: Ref<Record<string, string>>
) {
  const key = getStorageKey(recipeId)

  /** Load saved state from localStorage. */
  function load(): void {
    try {
      const saved = localStorage.getItem(key)
      if (!saved) return
      const data: Partial<ExperimentStorageData> = JSON.parse(saved)
      if (data.adjustments) {
        adjustments.value = new Map(Object.entries(data.adjustments))
      }
      if (data.freeformIngredients) {
        freeformIngredients.value = data.freeformIngredients
      }
      if (data.notes) {
        notes.value = data.notes
      }
    } catch {
      // Corrupted data or unavailable storage — ignore
    }
  }

  /** Save current state to localStorage. Tracks edit timestamps silently. */
  function save(): void {
    try {
      const now = new Date().toISOString()
      const existing = localStorage.getItem(key)
      let editHistory: string[] = []
      if (existing) {
        try {
          const prev: Partial<ExperimentStorageData> = JSON.parse(existing)
          editHistory = prev.editHistory || []
        } catch { /* ignore */ }
      }
      editHistory.push(now)
      const data: ExperimentStorageData = {
        adjustments: Object.fromEntries(adjustments.value),
        freeformIngredients: freeformIngredients.value,
        notes: notes.value,
        lastEditedAt: now,
        editHistory
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      // Storage unavailable or full — ignore
    }
  }

  /** Clear persisted state. */
  function clear(): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Storage unavailable — ignore
    }
  }

  // Auto-save on state changes
  watch(adjustments, save, { deep: true })
  watch(freeformIngredients, save, { deep: true })
  watch(notes, save, { deep: true })

  return { load, save, clear }
}

/**
 * Build an ExperimentExport from the current experiment state.
 * Used by scratchpad export to capture the active experiment variation.
 */
export function buildExperimentExport(
  recipeId: string,
  config: ExperimentConfig,
  adjustments: Map<string, number>,
  derivedValues: { id: string; label: string; value: number; unit: string }[],
  multiplier: number = 1
): ExperimentExport {
  const exportAdjustments: ExperimentAdjustment[] = []

  for (const ing of config.ingredients) {
    const adjusted = adjustments.get(ing.id)
    if (adjusted != null && adjusted !== ing.defaultAmount) {
      // Look up ingredient name from config (fallback to id)
      exportAdjustments.push({
        ingredientId: ing.id,
        ingredientName: ing.id,
        originalAmount: ing.defaultAmount,
        adjustedAmount: adjusted,
        delta: adjusted - ing.defaultAmount
      })
    }
  }

  const derivedSnapshots: ExperimentDerivedSnapshot[] = derivedValues.map(d => ({
    id: d.id,
    label: d.label,
    value: d.value,
    unit: d.unit
  }))

  return {
    recipeId,
    exportedAt: new Date().toISOString(),
    multiplier,
    scaleMode: config.scaleMode ?? 'pre_scaled',
    adjustments: exportAdjustments,
    derivedValues: derivedSnapshots
  }
}
