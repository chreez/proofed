import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import RecipePrintView from './RecipePrintView.vue'
import type { Recipe, IngredientSnapshotGroup, CookLogCostItem } from '@/types/recipe'

// Mock vue-router
const mockRouteParams = ref<Record<string, string>>({ recipeId: 'jalapeno-cheddar-sourdough' })

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: mockRouteParams.value,
    query: {},
  }),
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a><slot /></a>',
  },
}))

// Mock useRecipe composable
const mockCurrentRecipe = ref<Recipe | null>(null)

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
    currentRecipe: mockCurrentRecipe,
  }),
}))

// Mock QR rendering — returns no canvas so the QR block is skipped
vi.mock('@/composables/useQrLabel', () => ({
  renderBrandedQr: vi.fn().mockResolvedValue(null),
  generateQrLabelDataUrl: vi.fn().mockReturnValue(''),
}))

// Stub NutritionLabel — the nutrition section content isn't relevant here
vi.mock('@/components/NutritionLabel.vue', () => ({
  default: {
    name: 'NutritionLabel',
    props: ['recipe'],
    template: '<div class="nutrition-label-stub" />',
  },
}))

function makeCostItem(overrides: Partial<CookLogCostItem> = {}): CookLogCostItem {
  return {
    ingredientId: 'flour',
    name: 'Bread Flour',
    sourceType: 'heb',
    sourceName: 'H-E-B Bread Flour',
    amount: 550,
    unit: 'g',
    cost: 1.5,
    ...overrides,
  }
}

function makeSnapshotGroup(
  stageId: string,
  stageName: string,
  ingredients: Array<{ id: string; name: string; total: number; unit?: string }>
): IngredientSnapshotGroup {
  return {
    stageId,
    stageName,
    ingredients: ingredients.map(i => ({
      id: i.id,
      name: i.name,
      total: i.total,
      unit: i.unit ?? 'g',
      breakdown: null,
    })),
  }
}

/**
 * Build a recipe with a current gather state ("default") AND optional
 * change_log + cook_log snapshots so we can verify the resolution order.
 */
function makeRecipe(overrides: {
  versionSnapshot?: IngredientSnapshotGroup[]
  bakeSnapshot?: IngredientSnapshotGroup[]
  bakeCostItems?: CookLogCostItem[]
  bakeDate?: string
  bakeVersion?: string
  recipeVersion?: string
  estimatedCostItems?: CookLogCostItem[]
} = {}): Recipe {
  const recipeVersion = overrides.recipeVersion ?? 'v1.0.0'
  const bakeVersion = overrides.bakeVersion ?? recipeVersion
  const bakeDate = overrides.bakeDate ?? '2026-05-05'

  const recipe: Recipe = {
    meta: {
      name: 'Test Sourdough',
      yields: '1 loaf',
      total_time: '24 hrs',
    },
    config: { early_check_percent: 0.9 },
    vessels: [],
    stages: [
      {
        id: 'PREP',
        title: 'Mise en Place',
        gather: {
          ingredients: [
            { id: 'flour', name: 'Bread Flour', total: 999, unit: 'g', breakdown: null },
            { id: 'water', name: 'Water', total: 999, unit: 'g', breakdown: null },
          ],
        },
        states: [],
      },
    ],
    states: [],
    version: recipeVersion,
    nutrition: {
      servings: 8,
      calculatedDate: '2026-05-01',
      dataSource: 'USDA',
      totals: {
        calories: 1600,
        protein: 50,
        totalFat: 10,
        saturatedFat: 2,
        carbohydrates: 320,
        sugar: 5,
        fiber: 12,
        sodium: 1200,
      },
      perServing: {
        calories: 200,
        protein: 6.25,
        totalFat: 1.25,
        saturatedFat: 0.25,
        carbohydrates: 40,
        sugar: 0.625,
        fiber: 1.5,
        sodium: 150,
      },
      breakdown: [],
    },
    change_log: [
      {
        version: recipeVersion,
        date: '2026-04-01',
        summary: 'Initial.',
        ...(overrides.versionSnapshot ? { ingredients: overrides.versionSnapshot } : {}),
      },
    ],
    cook_log: [
      {
        date: bakeDate,
        version: bakeVersion,
        notes: ['test bake'],
        cost: {
          total: 1.5,
          perServing: 0.19,
          servings: 8,
          items: overrides.bakeCostItems ?? [makeCostItem()],
        },
        ...(overrides.bakeSnapshot ? { ingredients: overrides.bakeSnapshot } : {}),
      },
    ],
  }

  if (overrides.estimatedCostItems) {
    recipe.estimatedCost = {
      total: 2.0,
      perServing: 0.25,
      servings: 8,
      items: overrides.estimatedCostItems,
      estimatedAt: '2026-05-04',
    }
  }

  return recipe
}

async function mountAndSelect(recipe: Recipe, sourceLabelMatch: RegExp) {
  mockCurrentRecipe.value = recipe
  const wrapper = mount(RecipePrintView)
  await flushPromises()
  await nextTick()

  // Pick the requested source from the dropdown
  const select = wrapper.find('select.cost-source-dropdown')
  expect(select.exists()).toBe(true)
  const options = select.findAll('option')
  const targetIdx = options.findIndex(o => sourceLabelMatch.test(o.text()))
  expect(targetIdx, `expected option matching ${sourceLabelMatch}`).toBeGreaterThanOrEqual(0)
  await select.setValue(targetIdx)
  await nextTick()
  return wrapper
}

describe('RecipePrintView — ingredient snapshot resolution (PF-237)', () => {
  beforeEach(() => {
    mockCurrentRecipe.value = null
    mockRouteParams.value = { recipeId: 'test-recipe' }
  })

  it('AC #12: bake selected → renders cook_log[].ingredients (NOT cost.items, NOT gather defaults)', async () => {
    const bakeSnapshot = [
      makeSnapshotGroup('PREP', 'Mise en Place', [
        { id: 'flour', name: 'Bread Flour', total: 510, unit: 'g' },
        { id: 'water', name: 'Water', total: 340, unit: 'g' },
      ]),
    ]
    const recipe = makeRecipe({
      // gather defaults are 999 — proves we are NOT falling back
      bakeSnapshot,
      // cost.items[].amount is intentionally different to prove cost no longer drives ingredients
      bakeCostItems: [makeCostItem({ ingredientId: 'flour', amount: 550 })],
    })

    const wrapper = await mountAndSelect(recipe, /^Bake/)

    const items = wrapper.findAll('.ingredient-item')
    const flourItem = items.find(i => i.text().includes('Bread Flour'))
    const waterItem = items.find(i => i.text().includes('Water'))
    expect(flourItem?.text()).toContain('510 g')
    expect(waterItem?.text()).toContain('340 g')
    // Verify it's NOT using cost.items (550) or gather (999)
    expect(wrapper.text()).not.toContain('550 g')
    expect(wrapper.text()).not.toContain('999 g')
  })

  it('AC #13: estimated selected → renders change_log[].ingredients for matching version', async () => {
    const versionSnapshot = [
      makeSnapshotGroup('PREP', 'Mise en Place', [
        { id: 'flour', name: 'Bread Flour', total: 500, unit: 'g' },
        { id: 'water', name: 'Water', total: 350, unit: 'g' },
      ]),
    ]
    const recipe = makeRecipe({
      versionSnapshot,
      estimatedCostItems: [makeCostItem()],
    })

    const wrapper = await mountAndSelect(recipe, /^Estimated/)

    const text = wrapper.text()
    expect(text).toContain('500 g')
    expect(text).toContain('350 g')
    // Not gather defaults
    expect(text).not.toContain('999 g')
  })

  it('AC #14 / fallback: missing snapshots fall back to stages[].gather.ingredients', async () => {
    // No versionSnapshot, no bakeSnapshot — should use gather defaults (999/999)
    const recipe = makeRecipe({
      estimatedCostItems: [makeCostItem()],
    })

    const wrapper = await mountAndSelect(recipe, /^Estimated/)

    expect(wrapper.text()).toContain('999 g')
  })

  it('AC #5: cost.items[] does NOT override ingredient amounts when bake snapshot present', async () => {
    const bakeSnapshot = [
      makeSnapshotGroup('PREP', 'Mise en Place', [
        { id: 'flour', name: 'Bread Flour', total: 500, unit: 'g' },
      ]),
    ]
    const recipe = makeRecipe({
      bakeSnapshot,
      // cost.items has DIFFERENT amount — print must ignore it
      bakeCostItems: [makeCostItem({ ingredientId: 'flour', amount: 480 })],
    })

    const wrapper = await mountAndSelect(recipe, /^Bake/)

    expect(wrapper.text()).toContain('500 g')
    expect(wrapper.text()).not.toContain('480 g')
  })

  it('PF-241 AC #8: display_amount renders alongside grams in print (snapshot path)', async () => {
    const bakeSnapshot: IngredientSnapshotGroup[] = [
      {
        stageId: 'PREP',
        stageName: 'Mise en Place',
        ingredients: [
          { id: 'onion', name: 'Onion', total: 110, unit: 'g', breakdown: null, display_amount: 'medium' },
          { id: 'flour', name: 'Flour', total: 510, unit: 'g', breakdown: null },
        ],
      },
    ]
    const recipe = makeRecipe({ bakeSnapshot })

    const wrapper = await mountAndSelect(recipe, /^Bake/)

    const items = wrapper.findAll('.ingredient-item')
    const onionItem = items.find(i => i.text().includes('Onion'))
    const flourItem = items.find(i => i.text().includes('Flour'))
    expect(onionItem?.text()).toContain('medium (110 g)')
    expect(flourItem?.text()).toContain('510 g')
    expect(flourItem?.text()).not.toContain('medium')
  })

  it('PF-241: display_amount also renders in gather fallback (un-migrated recipes)', async () => {
    // No snapshot path; uses stages[].gather.ingredients with display_amount
    const recipe = makeRecipe({ estimatedCostItems: [makeCostItem()] })
    // Inject display_amount into the gather defaults (mirrors how the recipe JSON is authored)
    recipe.stages[0].gather!.ingredients![0].display_amount = 'medium'
    recipe.stages[0].gather!.ingredients![0].name = 'Onion'

    const wrapper = await mountAndSelect(recipe, /^Estimated/)
    expect(wrapper.text()).toContain('medium (999 g)')
  })
})

describe('RecipePrintView — unit-aware cost labels (PF-277)', () => {
  beforeEach(() => {
    mockCurrentRecipe.value = null
    mockRouteParams.value = { recipeId: 'test-recipe' }
  })

  it('renders "per loaf" for bread recipe (1 loaf yields)', async () => {
    const recipe = makeRecipe({ estimatedCostItems: [makeCostItem()] })
    // makeRecipe defaults to yields = '1 loaf'
    const wrapper = await mountAndSelect(recipe, /^Estimated/)
    const text = wrapper.text()
    expect(text).toContain('per loaf')
    expect(text).not.toContain('per unit')
    expect(text).not.toContain('per serving')
  })

  it('renders "per cookie" for cookie recipe (PF-277)', async () => {
    const recipe = makeRecipe({ estimatedCostItems: [makeCostItem()] })
    recipe.meta.yields = '~22-24 cookies'
    const wrapper = await mountAndSelect(recipe, /^Estimated/)
    const text = wrapper.text()
    expect(text).toContain('per cookie')
    expect(text).not.toContain('per unit')
  })

  it('"Recipe makes …" sentence uses meta.yields when present', async () => {
    const recipe = makeRecipe({ estimatedCostItems: [makeCostItem()] })
    recipe.meta.yields = '2 loaves (~800g each)'
    const wrapper = await mountAndSelect(recipe, /^Estimated/)
    expect(wrapper.text()).toContain('Recipe makes 2 loaves (~800g each)')
  })

  // Note: empty meta.yields makes validation.ready === false, so the print view
  // gates the cost section entirely. The fallback to "per serving" still
  // exists in the code as a defensive path; unit-tested in
  // useProductionPlan.spec.ts via inferDefaultUnit/pluralizeUnit integration.
})
