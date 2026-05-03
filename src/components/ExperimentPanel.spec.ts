import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ExperimentPanel from './ExperimentPanel.vue'
import type { Recipe, ExperimentConfig, WaterContentTable } from '@/types/recipe'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} })
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

const waterContentTable: WaterContentTable = {
  version: '1.0.0',
  updatedAt: '2026-05-01',
  description: 'Test water content table',
  sources: ['Test'],
  categories: [
    {
      id: 'flour',
      name: 'Flours',
      items: [
        { id: 'bread-flour', name: 'Bread Flour', waterPercent: 11.8, note: '', aliases: ['strong-flour'] }
      ]
    },
    {
      id: 'liquids',
      name: 'Liquids',
      items: [
        { id: 'water', name: 'Water', waterPercent: 100, note: '', aliases: [] }
      ]
    },
    {
      id: 'cheese',
      name: 'Cheeses',
      items: [
        { id: 'cheddar', name: 'Cheddar', waterPercent: 36.8, note: '', aliases: [] }
      ]
    },
    {
      id: 'vegetables',
      name: 'Vegetables',
      items: [
        { id: 'jalapeno-raw', name: 'Jalapeño', waterPercent: 91.7, note: '', aliases: ['jalapeno'] }
      ]
    },
    {
      id: 'fats',
      name: 'Fats',
      items: [
        { id: 'butter-unsalted', name: 'Butter', waterPercent: 16, note: '', aliases: ['butter'] }
      ]
    },
    {
      id: 'leavening',
      name: 'Leavening',
      items: [
        { id: 'sourdough-starter-100', name: 'Starter', waterPercent: 46, note: '', aliases: ['starter'] },
        { id: 'salt', name: 'Salt', waterPercent: 0, note: '', aliases: [] }
      ]
    },
    {
      id: 'dairy',
      name: 'Dairy',
      items: [
        { id: 'nonfat-milk-powder', name: 'Milk Powder', waterPercent: 3.5, note: '', aliases: ['milk-powder'] }
      ]
    },
    {
      id: 'sugars',
      name: 'Sugars',
      items: [
        { id: 'brown-sugar', name: 'Brown Sugar', waterPercent: 1.3, note: '', aliases: [] }
      ]
    }
  ]
}

const experimentConfig: ExperimentConfig = {
  description: 'Test experiment',
  scaleMode: 'pre_scaled',
  ingredients: [
    { id: 'flour', role: 'base_flour', defaultAmount: 550, min: 450, max: 650, step: 25, waterContentId: 'bread-flour' },
    { id: 'water', role: 'base_liquid', defaultAmount: 360, min: 280, max: 420, step: 10, waterContentId: 'water' },
    { id: 'jalapenos', role: 'inclusion', defaultAmount: 120, min: 0, max: 200, step: 10, waterContentId: 'jalapeno-raw' },
    { id: 'cheddar', role: 'inclusion', defaultAmount: 220, min: 0, max: 350, step: 25, waterContentId: 'cheddar' },
    { id: 'butter', role: 'enrichment', defaultAmount: 45, min: 0, max: 80, step: 5, waterContentId: 'butter-unsalted' }
  ],
  derived: [
    { id: 'effective-hydration', label: 'Effective Hydration', unit: '%', type: 'effective_hydration' },
    { id: 'inclusion-load', label: 'Inclusion Load', unit: '%', type: 'inclusion_load' },
    { id: 'total-dough', label: 'Total Dough Weight', unit: 'g', type: 'total_dough_weight' }
  ]
}

function makeRecipe(withExperiment = true): Recipe {
  return {
    meta: { name: 'Test Recipe', source: { name: 'Test' }, yields: '2 loaves', total_time: '26h' },
    config: { early_check_percent: 0.8 },
    vessels: [],
    stages: [
      {
        id: 'LEVAIN',
        title: 'Levain Build',
        gather: {
          ingredients: [
            { id: 'flour', name: 'Bread Flour', total: 550, unit: 'g', breakdown: null },
            { id: 'water', name: 'Water', total: 360, unit: 'g', breakdown: null }
          ]
        },
        states: []
      },
      {
        id: 'PREP',
        title: 'Mise en Place',
        gather: {
          ingredients: [
            { id: 'jalapenos', name: 'Fresh Jalapeños', total: 120, unit: 'g', breakdown: null },
            { id: 'cheddar', name: 'Sharp Cheddar', total: 220, unit: 'g', breakdown: null }
          ]
        },
        states: []
      },
      {
        id: 'MIX',
        title: 'Dough Mixing',
        gather: {
          ingredients: [
            { id: 'butter', name: 'Unsalted Butter', total: 45, unit: 'g', breakdown: null }
          ]
        },
        states: []
      }
    ],
    states: [],
    version: 'v1.0.0',
    experiment: withExperiment ? experimentConfig : undefined
  } as unknown as Recipe
}

const defaultProps = {
  recipe: makeRecipe(),
  recipeId: 'test-recipe',
  waterContentTable,
  sectionId: 'experiment-section'
}

describe('ExperimentPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    // Restore default getItem behavior (read from empty store = null)
    localStorageMock.getItem.mockReset()
    localStorageMock.getItem.mockImplementation(() => null)
  })

  it('renders when experiment config is present', () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    expect(wrapper.find('[data-testid="experiment-panel"]').exists()).toBe(true)
  })

  it('shows experiment title and badge', () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    expect(wrapper.text()).toContain('Experiment')
    expect(wrapper.text()).toContain('Live')
  })

  it('starts collapsed in inline mode', () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    // Collapsed — sliders should not be visible (hidden by grid-rows-[0fr])
    const body = wrapper.find('.grid')
    expect(body.classes()).toContain('grid-rows-[0fr]')
  })

  it('shows effective hydration in collapsed header', () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    // The collapsed header should show effective hydration peek
    expect(wrapper.text()).toContain('eff.')
  })

  it('expands on click to show sliders', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')
    const body = wrapper.find('.grid')
    expect(body.classes()).toContain('grid-rows-[1fr]')
  })

  it('shows derived values when expanded', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')
    expect(wrapper.text()).toContain('Base Hydration')
    expect(wrapper.text()).toContain('Effective Hydration')
    expect(wrapper.text()).toContain('Inclusion Load')
    expect(wrapper.text()).toContain('Total Dough')
  })

  it('displays ingredient names from recipe stages', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')
    expect(wrapper.text()).toContain('Bread Flour')
    expect(wrapper.text()).toContain('Water')
    expect(wrapper.text()).toContain('Fresh Jalapeños')
    expect(wrapper.text()).toContain('Sharp Cheddar')
    expect(wrapper.text()).toContain('Unsalted Butter')
  })

  it('shows baseline amounts when expanded (sliders hidden until edit)', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')
    // Check that displayed values include defaults
    expect(wrapper.text()).toContain('550g')
    expect(wrapper.text()).toContain('360g')
    expect(wrapper.text()).toContain('120g')
    expect(wrapper.text()).toContain('220g')
    expect(wrapper.text()).toContain('45g')
    // Sliders NOT rendered until edit button clicked
    const sliders = wrapper.findAll('input[type="range"]')
    expect(sliders.length).toBe(0)
  })

  it('clicking edit button reveals slider for that ingredient', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Click the first edit (pencil) button
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    expect(editBtns.length).toBeGreaterThan(0)
    await editBtns[0].trigger('click')

    // Now one slider should appear
    const sliders = wrapper.findAll('input[type="range"]')
    expect(sliders.length).toBe(1)
  })

  it('adjusting a slider updates displayed value and shows diff', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open first ingredient's slider (flour)
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')

    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('600')
    expect(wrapper.text()).toContain('600g')
    expect(wrapper.text()).toContain('+50g')
  })

  it('adjusting slider shows reset button', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open slider and adjust
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('600')

    // Reset button should appear
    const resetBtns = wrapper.findAll('button[title="Reset to default"]')
    expect(resetBtns.length).toBe(1)
  })

  it('reset button returns to baseline', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('600')

    const resetBtn = wrapper.find('button[title="Reset to default"]')
    await resetBtn.trigger('click')

    expect(wrapper.text()).toContain('550g')
    expect(wrapper.text()).not.toContain('+50g')
  })

  it('derived values update when slider moves', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const textBefore = wrapper.text()

    // Open water slider (second edit button) and adjust
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[1].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('400')

    const textAfter = wrapper.text()
    expect(textBefore).not.toBe(textAfter)
  })

  it('reset all clears all adjustments', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open and adjust flour slider
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('600')

    // Reset all button should appear
    const resetAllBtn = wrapper.findAll('button').find(b => b.text().includes('Reset all'))
    expect(resetAllBtn).toBeDefined()
    await resetAllBtn!.trigger('click')

    // Should be back to defaults
    expect(wrapper.text()).toContain('550g')
    expect(wrapper.text()).not.toContain('+50g')
  })

  it('shows freeform addition button', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')
    expect(wrapper.text()).toContain('Add ingredient')
  })

  it('freeform form appears on button click', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add ingredient'))
    await addBtn!.trigger('click')

    expect(wrapper.text()).toContain('Add Freeform Ingredient')
    expect(wrapper.find('input[placeholder="Name (e.g., Kalamata olives)"]').exists()).toBe(true)
  })

  it('persists edit timestamps in localStorage', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open slider and adjust
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('600')

    // localStorage should have been called with data containing lastEditedAt
    const lastCall = localStorageMock.setItem.mock.calls.find(
      (c: [string, string]) => c[0] === 'experiment-test-recipe'
    )
    expect(lastCall).toBeDefined()
    const stored = JSON.parse(lastCall![1])
    expect(stored.lastEditedAt).toBeDefined()
    expect(stored.editHistory).toBeInstanceOf(Array)
    expect(stored.editHistory.length).toBeGreaterThan(0)
  })

  it('persists adjustments to localStorage', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open slider and adjust
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('600')

    // localStorage.setItem should have been called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'experiment-test-recipe',
      expect.any(String)
    )
  })

  it('freeform form submits and adds ingredient', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open freeform form
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add ingredient'))
    await addBtn!.trigger('click')

    // Fill in name and amount
    const nameInput = wrapper.find('input[placeholder="Name (e.g., Kalamata olives)"]')
    const amountInput = wrapper.find('input[type="number"]')
    await nameInput.setValue('Olives')
    await amountInput.setValue('50')

    // Submit
    const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Add'))
    await submitBtn!.trigger('click')

    // Should appear in ingredient list
    expect(wrapper.text()).toContain('Olives')
    expect(wrapper.text()).toContain('50g')
  })

  it('freeform cancel closes form without adding', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add ingredient'))
    await addBtn!.trigger('click')
    expect(wrapper.text()).toContain('Add Freeform Ingredient')

    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancel'))
    await cancelBtn!.trigger('click')
    expect(wrapper.text()).not.toContain('Add Freeform Ingredient')
  })

  it('toggle edit hides slider when clicked again', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open slider
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')
    expect(wrapper.findAll('input[type="range"]').length).toBe(1)

    // Click again to close
    const hideBtn = wrapper.find('button[title="Hide slider"]')
    await hideBtn.trigger('click')
    expect(wrapper.findAll('input[type="range"]').length).toBe(0)
  })

  it('groups ingredients by role', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Should have role group headings
    expect(wrapper.text()).toContain('Flour')
    expect(wrapper.text()).toContain('Liquid')
    expect(wrapper.text()).toContain('Inclusions')
    expect(wrapper.text()).toContain('Enrichment')
  })

  it('reset all closes open sliders and clears localStorage', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open slider and adjust
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('600')

    // Reset all
    const resetAllBtn = wrapper.findAll('button').find(b => b.text().includes('Reset all'))
    await resetAllBtn!.trigger('click')

    // Sliders should be hidden again
    expect(wrapper.findAll('input[type="range"]').length).toBe(0)
    // localStorage should be cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('experiment-test-recipe')
  })

  it('loads persisted state from localStorage on mount', async () => {
    const stored = JSON.stringify({
      adjustments: { flour: 600 },
      freeformIngredients: [],
      notes: {},
      lastEditedAt: '2026-05-01T00:00:00Z',
      editHistory: ['2026-05-01T00:00:00Z']
    })
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'experiment-test-recipe') return stored
      return null
    })

    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Should show the persisted adjustment
    expect(wrapper.text()).toContain('600g')
  })

  it('shows negative diff for reduced amounts', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('500')

    expect(wrapper.text()).toContain('500g')
    expect(wrapper.text()).toContain('-50g')
  })

  it('shows "+ note" button when slider is open and no note exists', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')

    expect(wrapper.text()).toContain('+ note')
  })

  it('clicking "+ note" shows note input', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')

    const noteBtn = wrapper.findAll('button').find(b => b.text() === '+ note')
    await noteBtn!.trigger('click')

    expect(wrapper.find('input[placeholder="Why this adjustment..."]').exists()).toBe(true)
    expect(wrapper.text()).toContain('save')
    expect(wrapper.text()).toContain('cancel')
  })

  it('saving a note stores it and shows it', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')

    const noteBtn = wrapper.findAll('button').find(b => b.text() === '+ note')
    await noteBtn!.trigger('click')

    const noteInput = wrapper.find('input[placeholder="Why this adjustment..."]')
    await noteInput.setValue('Testing higher hydration')

    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'save')
    await saveBtn!.trigger('click')

    expect(wrapper.text()).toContain('Testing higher hydration')
    expect(wrapper.find('input[placeholder="Why this adjustment..."]').exists()).toBe(false)
  })

  it('canceling a note hides input without saving', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')

    const noteBtn = wrapper.findAll('button').find(b => b.text() === '+ note')
    await noteBtn!.trigger('click')

    const noteInput = wrapper.find('input[placeholder="Why this adjustment..."]')
    await noteInput.setValue('Should not save')

    const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'cancel')
    await cancelBtn!.trigger('click')

    expect(wrapper.text()).not.toContain('Should not save')
    expect(wrapper.find('input[placeholder="Why this adjustment..."]').exists()).toBe(false)
  })

  it('existing note shows edit button', async () => {
    // Pre-seed a note via localStorage
    const stored = JSON.stringify({
      adjustments: { flour: 600 },
      freeformIngredients: [],
      notes: { flour: 'My flour note' },
      lastEditedAt: '2026-05-01T00:00:00Z',
      editHistory: ['2026-05-01T00:00:00Z']
    })
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'experiment-test-recipe') return stored
      return null
    })

    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open flour slider
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')

    expect(wrapper.text()).toContain('My flour note')
    expect(wrapper.text()).toContain('edit')
  })

  it('adjusting liquid slider updates derived hydration values', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const textBefore = wrapper.text()

    // Open water slider (find it by looking at the liquid group)
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[1].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('400')

    expect(wrapper.text()).not.toBe(textBefore)
    expect(wrapper.text()).toContain('400g')
  })

  it('adjusting inclusion ingredient shows diff and accent border', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Find jalapenos edit button (3rd ingredient in order: flour, water, jalapenos)
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[2].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('150')

    expect(wrapper.text()).toContain('150g')
    expect(wrapper.text()).toContain('+30g')
  })

  it('adjusting enrichment ingredient works', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Butter is 5th ingredient (flour, water, jalapenos, cheddar, butter)
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[4].trigger('click')
    const slider = wrapper.find('input[type="range"]')
    await slider.setValue('60')

    expect(wrapper.text()).toContain('60g')
    expect(wrapper.text()).toContain('+15g')
  })

  it('note on inclusion ingredient works', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open jalapenos slider (3rd: flour, water, jalapenos)
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[2].trigger('click')

    const noteBtn = wrapper.findAll('button').find(b => b.text() === '+ note')
    await noteBtn!.trigger('click')

    const noteInput = wrapper.find('input[placeholder="Why this adjustment..."]')
    await noteInput.setValue('More heat')
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'save')
    await saveBtn!.trigger('click')

    expect(wrapper.text()).toContain('More heat')
  })

  it('note on enrichment ingredient works', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open butter slider (5th: flour, water, jalapenos, cheddar, butter)
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[4].trigger('click')

    const noteBtn = wrapper.findAll('button').find(b => b.text() === '+ note')
    await noteBtn!.trigger('click')

    const noteInput = wrapper.find('input[placeholder="Why this adjustment..."]')
    await noteInput.setValue('Extra richness')
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'save')
    await saveBtn!.trigger('click')

    expect(wrapper.text()).toContain('Extra richness')
  })

  it('save note via Enter key', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')

    const noteBtn = wrapper.findAll('button').find(b => b.text() === '+ note')
    await noteBtn!.trigger('click')

    const noteInput = wrapper.find('input[placeholder="Why this adjustment..."]')
    await noteInput.setValue('Enter save test')
    await noteInput.trigger('keydown.enter')

    expect(wrapper.text()).toContain('Enter save test')
    expect(wrapper.find('input[placeholder="Why this adjustment..."]').exists()).toBe(false)
  })

  it('cancel note via Esc key', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[0].trigger('click')

    const noteBtn = wrapper.findAll('button').find(b => b.text() === '+ note')
    await noteBtn!.trigger('click')

    const noteInput = wrapper.find('input[placeholder="Why this adjustment..."]')
    await noteInput.setValue('Should disappear')
    await noteInput.trigger('keydown.esc')

    expect(wrapper.text()).not.toContain('Should disappear')
    expect(wrapper.find('input[placeholder="Why this adjustment..."]').exists()).toBe(false)
  })

  it('freeform form does not submit with empty name', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add ingredient'))
    await addBtn!.trigger('click')

    // Only fill amount, leave name empty
    const amountInput = wrapper.find('input[type="number"]')
    await amountInput.setValue('50')

    const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Add'))
    await submitBtn!.trigger('click')

    // Form should still be open (not submitted)
    expect(wrapper.text()).toContain('Add Freeform Ingredient')
  })

  it('freeform form does not submit with zero amount', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add ingredient'))
    await addBtn!.trigger('click')

    // Only fill name, amount stays null
    const nameInput = wrapper.find('input[placeholder="Name (e.g., Kalamata olives)"]')
    await nameInput.setValue('Olives')

    const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Add'))
    await submitBtn!.trigger('click')

    // Form should still be open
    expect(wrapper.text()).toContain('Add Freeform Ingredient')
  })

  it('does not toggle when text is selected', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    // Expand first
    await wrapper.find('[role="button"]').trigger('click')
    expect(wrapper.find('.grid').classes()).toContain('grid-rows-[1fr]')

    // Mock window.getSelection returning selected text
    const origGetSelection = window.getSelection
    window.getSelection = () => ({ toString: () => 'selected text', length: 13 }) as unknown as Selection
    await wrapper.find('[role="button"]').trigger('click')
    // Should NOT collapse because text is selected
    expect(wrapper.find('.grid').classes()).toContain('grid-rows-[1fr]')
    window.getSelection = origGetSelection
  })

  it('copyPermalink copies URL to clipboard', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    // Mock clipboard
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    // Find and click the copy link button
    const linkBtnEl = wrapper.find('button[title="Copy link"]')
    await linkBtnEl.trigger('click')

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('#experiment-section'))
  })

  it('note on liquid ingredient works', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Open water slider
    const editBtns = wrapper.findAll('button[title="Adjust amount"], button[title="Hide slider"]')
    await editBtns[1].trigger('click')

    // Add note
    const noteBtn = wrapper.findAll('button').find(b => b.text() === '+ note')
    await noteBtn!.trigger('click')

    const noteInput = wrapper.find('input[placeholder="Why this adjustment..."]')
    await noteInput.setValue('Trying higher hydration')
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'save')
    await saveBtn!.trigger('click')

    expect(wrapper.text()).toContain('Trying higher hydration')
  })

  it('remove freeform ingredient removes it from list', async () => {
    const wrapper = mount(ExperimentPanel, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')

    // Add a freeform ingredient first
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('Add ingredient'))
    await addBtn!.trigger('click')
    const nameInput = wrapper.find('input[placeholder="Name (e.g., Kalamata olives)"]')
    const amountInput = wrapper.find('input[type="number"]')
    await nameInput.setValue('Olives')
    await amountInput.setValue('50')
    const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Add'))
    await submitBtn!.trigger('click')

    expect(wrapper.text()).toContain('Olives')

    // Remove it (X button)
    const removeBtn = wrapper.find('button[title="Remove"]')
    await removeBtn.trigger('click')

    expect(wrapper.text()).not.toContain('Olives')
  })
})
