import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useExperimentStorage, buildExperimentExport } from './useExperimentStorage'
import type { ExperimentConfig } from '@/types/recipe'
import type { FreeformIngredient } from './useExperiment'

const STORAGE_KEY = 'experiment-test-recipe'

function mockLocalStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store
  }
}

describe('useExperimentStorage', () => {
  let storage: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    storage = mockLocalStorage()
    Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true })
  })

  describe('load()', () => {
    it('does nothing when no data exists', () => {
      const adjustments = ref(new Map<string, number>())
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { load } = useExperimentStorage('test-recipe', adjustments, freeformIngredients, notes)
      load()

      expect(adjustments.value.size).toBe(0)
      expect(freeformIngredients.value).toEqual([])
      expect(notes.value).toEqual({})
    })

    it('restores valid saved data', () => {
      const savedData = {
        adjustments: { flour: 500, water: 350 },
        freeformIngredients: [
          { id: 'ff-1', name: 'Honey', amount: 20, waterPercent: 17, role: 'sweetener' }
        ],
        notes: { flour: 'Increased for stiffer dough' },
        lastEditedAt: '2026-04-30T10:00:00.000Z',
        editHistory: ['2026-04-30T10:00:00.000Z']
      }
      storage._store[STORAGE_KEY] = JSON.stringify(savedData)

      const adjustments = ref(new Map<string, number>())
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { load } = useExperimentStorage('test-recipe', adjustments, freeformIngredients, notes)
      load()

      expect(adjustments.value.get('flour')).toBe(500)
      expect(adjustments.value.get('water')).toBe(350)
      expect(freeformIngredients.value).toEqual([
        { id: 'ff-1', name: 'Honey', amount: 20, waterPercent: 17, role: 'sweetener' }
      ])
      expect(notes.value).toEqual({ flour: 'Increased for stiffer dough' })
    })

    it('handles corrupted JSON gracefully without crashing', () => {
      storage._store[STORAGE_KEY] = 'not-valid-json{{{}'

      const adjustments = ref(new Map<string, number>())
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { load } = useExperimentStorage('test-recipe', adjustments, freeformIngredients, notes)
      load()

      // State should remain at defaults — corrupted data is ignored
      expect(adjustments.value.size).toBe(0)
      expect(freeformIngredients.value).toEqual([])
      expect(notes.value).toEqual({})
    })

    it('handles partial data gracefully', () => {
      const savedData = {
        adjustments: { flour: 450 }
        // missing freeformIngredients and notes
      }
      storage._store[STORAGE_KEY] = JSON.stringify(savedData)

      const adjustments = ref(new Map<string, number>())
      const freeformIngredients = ref<FreeformIngredient[]>([{ id: 'existing', name: 'Salt', amount: 10, waterPercent: 0, role: 'salt' as const }])
      const notes = ref<Record<string, string>>({ old: 'note' })

      const { load } = useExperimentStorage('test-recipe', adjustments, freeformIngredients, notes)
      load()

      expect(adjustments.value.get('flour')).toBe(450)
      // freeformIngredients and notes remain unchanged since saved data lacks them
      expect(freeformIngredients.value).toEqual([{ id: 'existing', name: 'Salt', amount: 10, waterPercent: 0, role: 'salt' }])
      expect(notes.value).toEqual({ old: 'note' })
    })
  })

  describe('save()', () => {
    it('writes data with lastEditedAt and editHistory', () => {
      const adjustments = ref(new Map<string, number>([['flour', 500]]))
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({ flour: 'test note' })

      const { save } = useExperimentStorage('test-recipe', adjustments, freeformIngredients, notes)
      save()

      expect(storage.setItem).toHaveBeenCalled()
      const written = JSON.parse(storage.setItem.mock.calls[0][1])
      expect(written.adjustments).toEqual({ flour: 500 })
      expect(written.notes).toEqual({ flour: 'test note' })
      expect(written.freeformIngredients).toEqual([])
      expect(written.lastEditedAt).toBeTruthy()
      expect(written.editHistory).toHaveLength(1)
      expect(written.editHistory[0]).toBe(written.lastEditedAt)
    })

    it('preserves existing editHistory', () => {
      const existingData = {
        adjustments: { flour: 400 },
        freeformIngredients: [],
        notes: {},
        lastEditedAt: '2026-04-29T08:00:00.000Z',
        editHistory: ['2026-04-28T08:00:00.000Z', '2026-04-29T08:00:00.000Z']
      }
      storage._store[STORAGE_KEY] = JSON.stringify(existingData)

      const adjustments = ref(new Map<string, number>([['flour', 520]]))
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { save } = useExperimentStorage('test-recipe', adjustments, freeformIngredients, notes)
      save()

      const written = JSON.parse(storage.setItem.mock.calls[0][1])
      expect(written.editHistory).toHaveLength(3)
      expect(written.editHistory[0]).toBe('2026-04-28T08:00:00.000Z')
      expect(written.editHistory[1]).toBe('2026-04-29T08:00:00.000Z')
      expect(written.editHistory[2]).toBe(written.lastEditedAt)
    })

    it('handles corrupted existing data when saving', () => {
      storage._store[STORAGE_KEY] = 'corrupted{{{}'

      const adjustments = ref(new Map<string, number>([['water', 300]]))
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { save } = useExperimentStorage('test-recipe', adjustments, freeformIngredients, notes)
      save()

      const written = JSON.parse(storage.setItem.mock.calls[0][1])
      expect(written.adjustments).toEqual({ water: 300 })
      expect(written.editHistory).toHaveLength(1)
    })
  })

  describe('clear()', () => {
    it('removes the key from localStorage', () => {
      storage._store[STORAGE_KEY] = JSON.stringify({ adjustments: { flour: 500 } })

      const adjustments = ref(new Map<string, number>())
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { clear } = useExperimentStorage('test-recipe', adjustments, freeformIngredients, notes)
      clear()

      expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
    })
  })

  describe('buildCurrentExport() — PF-259', () => {
    const cfg: ExperimentConfig = {
      description: 'Test',
      ingredients: [
        { id: 'flour', role: 'base_flour', defaultAmount: 500, min: 400, max: 600, step: 10 },
        { id: 'water', role: 'base_liquid', defaultAmount: 350, min: 250, max: 450, step: 5 }
      ],
      derived: []
    }

    it('AC#9a: returns null when adjustments map is empty', () => {
      const adjustments = ref(new Map<string, number>())
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { buildCurrentExport } = useExperimentStorage(
        'test-recipe',
        adjustments,
        freeformIngredients,
        notes,
        {
          config: ref(cfg),
          derivedValues: ref([]),
          multiplier: ref(1)
        }
      )

      expect(buildCurrentExport()).toBeNull()
    })

    it('AC#9a: returns null when every adjustment equals defaultAmount', () => {
      const adjustments = ref(new Map<string, number>([
        ['flour', 500], // matches default
        ['water', 350]  // matches default
      ]))
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { buildCurrentExport } = useExperimentStorage(
        'test-recipe',
        adjustments,
        freeformIngredients,
        notes,
        {
          config: ref(cfg),
          derivedValues: ref([]),
          multiplier: ref(1)
        }
      )

      expect(buildCurrentExport()).toBeNull()
    })

    it('AC#9b: returns ExperimentExport with correct adjustments when ≥1 ingredient differs', () => {
      const adjustments = ref(new Map<string, number>([
        ['flour', 460], // differs
        ['water', 350]  // matches default — filtered out
      ]))
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const derived = ref([
        { id: 'effective_hydration', label: 'Effective Hydration', value: 81.5, unit: '%' }
      ])

      const { buildCurrentExport } = useExperimentStorage(
        'test-recipe',
        adjustments,
        freeformIngredients,
        notes,
        {
          config: ref(cfg),
          derivedValues: derived,
          multiplier: ref(2)
        }
      )

      const result = buildCurrentExport()
      expect(result).not.toBeNull()
      expect(result!.recipeId).toBe('test-recipe')
      expect(result!.multiplier).toBe(2)
      expect(result!.adjustments).toHaveLength(1)
      expect(result!.adjustments[0]).toEqual({
        ingredientId: 'flour',
        ingredientName: 'flour',
        originalAmount: 500,
        adjustedAmount: 460,
        delta: -40
      })
      expect(result!.derivedValues).toEqual([
        { id: 'effective_hydration', label: 'Effective Hydration', value: 81.5, unit: '%' }
      ])
    })

    it('returns null when exportDeps is not provided (backward compat)', () => {
      const adjustments = ref(new Map<string, number>([['flour', 460]]))
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { buildCurrentExport } = useExperimentStorage(
        'test-recipe',
        adjustments,
        freeformIngredients,
        notes
      )

      expect(buildCurrentExport()).toBeNull()
    })

    it('returns null when config ref resolves to null', () => {
      const adjustments = ref(new Map<string, number>([['flour', 460]]))
      const freeformIngredients = ref<FreeformIngredient[]>([])
      const notes = ref<Record<string, string>>({})

      const { buildCurrentExport } = useExperimentStorage(
        'test-recipe',
        adjustments,
        freeformIngredients,
        notes,
        {
          config: ref<ExperimentConfig | null>(null),
          derivedValues: ref([]),
          multiplier: ref(1)
        }
      )

      expect(buildCurrentExport()).toBeNull()
    })
  })
})

describe('buildExperimentExport', () => {
  const baseConfig: ExperimentConfig = {
    description: 'Test experiment',
    ingredients: [
      { id: 'flour', role: 'flour', defaultAmount: 500, min: 400, max: 600, step: 10, waterContentId: '' },
      { id: 'water', role: 'water', defaultAmount: 350, min: 250, max: 450, step: 5, waterContentId: '' },
      { id: 'salt', role: 'salt', defaultAmount: 10, min: 5, max: 15, step: 1, waterContentId: '' }
    ],
    derived: []
  }

  const baseDerived = [
    { id: 'hydration', label: 'Hydration', value: 70, unit: '%' },
    { id: 'total-weight', label: 'Total Weight', value: 860, unit: 'g' }
  ]

  it('creates no adjustment entries when all values match defaults', () => {
    const adjustments = new Map<string, number>([
      ['flour', 500],
      ['water', 350],
      ['salt', 10]
    ])

    const result = buildExperimentExport('test-recipe', baseConfig, adjustments, baseDerived)

    expect(result.recipeId).toBe('test-recipe')
    expect(result.adjustments).toEqual([])
    expect(result.multiplier).toBe(1)
    expect(result.scaleMode).toBe('pre_scaled')
  })

  it('creates adjustment entries only for changed ingredients', () => {
    const adjustments = new Map<string, number>([
      ['flour', 500],
      ['water', 375],
      ['salt', 12]
    ])

    const result = buildExperimentExport('test-recipe', baseConfig, adjustments, baseDerived)

    expect(result.adjustments).toHaveLength(2)
    expect(result.adjustments[0]).toEqual({
      ingredientId: 'water',
      ingredientName: 'water',
      originalAmount: 350,
      adjustedAmount: 375,
      delta: 25
    })
    expect(result.adjustments[1]).toEqual({
      ingredientId: 'salt',
      ingredientName: 'salt',
      originalAmount: 10,
      adjustedAmount: 12,
      delta: 2
    })
  })

  it('maps derived values to snapshots', () => {
    const adjustments = new Map<string, number>()

    const result = buildExperimentExport('test-recipe', baseConfig, adjustments, baseDerived)

    expect(result.derivedValues).toEqual([
      { id: 'hydration', label: 'Hydration', value: 70, unit: '%' },
      { id: 'total-weight', label: 'Total Weight', value: 860, unit: 'g' }
    ])
  })

  it('uses provided multiplier', () => {
    const adjustments = new Map<string, number>()

    const result = buildExperimentExport('test-recipe', baseConfig, adjustments, baseDerived, 2)

    expect(result.multiplier).toBe(2)
  })

  it('uses config.scaleMode when specified', () => {
    const configWithMode: ExperimentConfig = {
      ...baseConfig,
      scaleMode: 'at_bake_time'
    }
    const adjustments = new Map<string, number>()

    const result = buildExperimentExport('test-recipe', configWithMode, adjustments, baseDerived)

    expect(result.scaleMode).toBe('at_bake_time')
  })

  it('defaults scaleMode to pre_scaled when config omits it', () => {
    const configNoMode: ExperimentConfig = {
      description: 'No scale mode',
      ingredients: [],
      derived: []
    }
    const adjustments = new Map<string, number>()

    const result = buildExperimentExport('test-recipe', configNoMode, adjustments, [], 1)

    expect(result.scaleMode).toBe('pre_scaled')
  })

  it('includes exportedAt timestamp', () => {
    const adjustments = new Map<string, number>()
    const before = new Date().toISOString()

    const result = buildExperimentExport('test-recipe', baseConfig, adjustments, baseDerived)

    const after = new Date().toISOString()
    expect(result.exportedAt >= before).toBe(true)
    expect(result.exportedAt <= after).toBe(true)
  })

  it('handles negative delta when ingredient is reduced', () => {
    const adjustments = new Map<string, number>([
      ['flour', 450]
    ])

    const result = buildExperimentExport('test-recipe', baseConfig, adjustments, baseDerived)

    expect(result.adjustments).toHaveLength(1)
    expect(result.adjustments[0].delta).toBe(-50)
    expect(result.adjustments[0].originalAmount).toBe(500)
    expect(result.adjustments[0].adjustedAmount).toBe(450)
  })
})
