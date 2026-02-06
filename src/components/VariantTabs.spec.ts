import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import VariantTabs from './VariantTabs.vue'

// Mock data
const mockFamilies = ref([
  {
    id: 'cinnamon-buns',
    name: 'ATK Cinnamon Buns',
    variants: [
      { id: 'quick', recipeId: 'atk-cinnamon-buns-quick', label: 'Quick (Same Day)' },
      { id: 'overnight', recipeId: 'atk-cinnamon-buns-overnight', label: 'Overnight' }
    ]
  }
])

const mockCurrentRecipeId = ref('atk-cinnamon-buns-quick')

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
    families: mockFamilies,
    currentRecipeId: mockCurrentRecipeId
  })
}))

describe('VariantTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentRecipeId.value = 'atk-cinnamon-buns-quick'
  })

  it('renders tabs for all variants in family', () => {
    const wrapper = mount(VariantTabs, {
      props: {
        familyId: 'cinnamon-buns'
      }
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)
    expect(wrapper.text()).toContain('Quick (Same Day)')
    expect(wrapper.text()).toContain('Overnight')
  })

  it('highlights active variant tab', () => {
    const wrapper = mount(VariantTabs, {
      props: {
        familyId: 'cinnamon-buns'
      }
    })

    const buttons = wrapper.findAll('button')
    // First button (Quick) is active
    expect(buttons[0].classes()).toContain('border-accent')
    expect(buttons[0].classes()).toContain('font-medium')
    // Second button (Overnight) is not active
    expect(buttons[1].classes()).toContain('border-transparent')
  })

  it('emits select event when tab clicked', async () => {
    const wrapper = mount(VariantTabs, {
      props: {
        familyId: 'cinnamon-buns'
      }
    })

    const buttons = wrapper.findAll('button')
    // Click on the Overnight tab (not current)
    await buttons[1].trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['atk-cinnamon-buns-overnight'])
  })
})
