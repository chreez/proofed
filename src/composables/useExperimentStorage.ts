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

/**
 * Optional dependencies wired in by callers that need `buildCurrentExport()`.
 * Kept optional so existing call sites (and tests) that only use load/save/clear
 * continue to work without change.
 */
export interface ExperimentExportDeps {
  /** Active ExperimentConfig (auto-generated or recipe-defined). */
  config: Ref<ExperimentConfig | null>
  /** Snapshot of derived values at the moment of export. */
  derivedValues: Ref<ExperimentDerivedSnapshot[]>
  /** Active scaling multiplier (1 = unscaled). */
  multiplier: Ref<number>
}

function getStorageKey(recipeId: string): string {
  return `experiment-${recipeId}`
}

/**
 * Persistence layer for experiment panel state.
 * Saves adjustments, freeform ingredients, and per-slider notes to localStorage.
 *
 * When `exportDeps` is provided, also exposes `buildCurrentExport()` that
 * snapshots the current adjustments + derived values as an ExperimentExport
 * (used by the scratchpad export pathway, PF-259).
 */
export function useExperimentStorage(
  recipeId: string,
  adjustments: Ref<Map<string, number>>,
  freeformIngredients: Ref<FreeformIngredient[]>,
  notes: Ref<Record<string, string>>,
  exportDeps?: ExperimentExportDeps
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

  /**
   * Snapshot the current experiment state as an `ExperimentExport`.
   * Returns `null` when:
   *   - `exportDeps` was not supplied at composable instantiation
   *   - active `config` ref is null
   *   - every adjustment equals the config's `defaultAmount` (i.e. the user
   *     hasn't actually deviated from the recipe baseline)
   *
   * Mirrors the filtering in `buildExperimentExport()`: only ingredients whose
   * adjusted amount differs from `defaultAmount` are included.
   */
  function buildCurrentExport(): ExperimentExport | null {
    if (!exportDeps) return null
    const cfg = exportDeps.config.value
    if (!cfg) return null
    const result = buildExperimentExport(
      recipeId,
      cfg,
      adjustments.value,
      exportDeps.derivedValues.value,
      exportDeps.multiplier.value
    )
    if (result.adjustments.length === 0) return null
    return result
  }

  return { load, save, clear, buildCurrentExport }
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
