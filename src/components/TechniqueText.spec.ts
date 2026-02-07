import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import TechniqueText from './TechniqueText.vue'

// Mock useTechniques
vi.mock('@/composables/useTechniques', () => ({
  useTechniques: () => ({
    parseTextWithTechniques: (text: string) => {
      // Simple mock: if text contains "softened", split around it
      if (text.includes('softened')) {
        const idx = text.indexOf('softened')
        const parts = []
        if (idx > 0) {
          parts.push({ type: 'text' as const, content: text.slice(0, idx) })
        }
        parts.push({
          type: 'technique' as const,
          content: 'softened',
          technique: { title: 'Softened Butter', description: 'Leave at room temp 30-60 min' }
        })
        const rest = text.slice(idx + 'softened'.length)
        if (rest.length > 0) {
          parts.push({ type: 'text' as const, content: rest })
        }
        return parts
      }
      return [{ type: 'text' as const, content: text }]
    },
    techniques: ref({}),
    loaded: ref(true),
    loadTechniques: vi.fn(),
    findTechnique: vi.fn()
  })
}))

describe('TechniqueText', () => {
  it('renders plain text when no techniques found', () => {
    const wrapper = mount(TechniqueText, {
      props: { text: 'plain ingredient text' }
    })

    expect(wrapper.text()).toBe('plain ingredient text')
  })

  it('renders technique keyword with special styling', () => {
    const wrapper = mount(TechniqueText, {
      props: { text: 'butter, softened' }
    })

    expect(wrapper.text()).toContain('butter,')
    expect(wrapper.text()).toContain('softened')

    // Find the technique keyword span
    const keyword = wrapper.find('.technique-keyword')
    expect(keyword.exists()).toBe(true)
    expect(keyword.text()).toContain('softened')
  })

  it('shows tooltip on hover', async () => {
    const wrapper = mount(TechniqueText, {
      props: { text: 'butter, softened' }
    })

    const keyword = wrapper.find('.technique-keyword')
    await keyword.trigger('mouseenter')

    // Tooltip should appear
    const tooltip = wrapper.find('.technique-tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Softened Butter')
    expect(tooltip.text()).toContain('Leave at room temp 30-60 min')
  })

  it('hides tooltip on mouseleave', async () => {
    const wrapper = mount(TechniqueText, {
      props: { text: 'butter, softened' }
    })

    const keyword = wrapper.find('.technique-keyword')
    await keyword.trigger('mouseenter')
    expect(wrapper.find('.technique-tooltip').exists()).toBe(true)

    await keyword.trigger('mouseleave')
    expect(wrapper.find('.technique-tooltip').exists()).toBe(false)
  })

  it('shows tooltip on focus', async () => {
    const wrapper = mount(TechniqueText, {
      props: { text: 'butter, softened' }
    })

    const keyword = wrapper.find('.technique-keyword')
    await keyword.trigger('focus')

    expect(wrapper.find('.technique-tooltip').exists()).toBe(true)
  })

  it('hides tooltip on blur', async () => {
    const wrapper = mount(TechniqueText, {
      props: { text: 'butter, softened' }
    })

    const keyword = wrapper.find('.technique-keyword')
    await keyword.trigger('focus')
    await keyword.trigger('blur')

    expect(wrapper.find('.technique-tooltip').exists()).toBe(false)
  })

  it('keyword has tabindex for keyboard accessibility', () => {
    const wrapper = mount(TechniqueText, {
      props: { text: 'butter, softened' }
    })

    const keyword = wrapper.find('.technique-keyword')
    expect(keyword.attributes('tabindex')).toBe('0')
  })
})
