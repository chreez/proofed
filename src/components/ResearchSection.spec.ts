import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ResearchSection from './ResearchSection.vue'
import type { Research } from '@/types/recipe'

vi.mock('@/composables/useClipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined)
}))

describe('ResearchSection', () => {
  const defaultResearch: Research = {
    sources: [
      { name: 'Source A', url: 'https://example.com', type: 'original' },
      { name: 'Source B', type: 'adapted', author: 'Chef B' }
    ],
    techniques: [
      {
        name: 'Cold ferment',
        sourcedFrom: 'Source A',
        rationale: 'Develops flavor over time',
        confidence: 'high'
      }
    ],
    strategy: 'Cross-referenced multiple recipes',
    sourceCount: 2,
    date: '2026-02-05'
  }

  const defaultProps = {
    research: defaultResearch,
    sectionId: 'research-section'
  }

  function findToggleButton(wrapper: ReturnType<typeof mount>): ReturnType<ReturnType<typeof mount>['find']> {
    return wrapper.find('button.voice-agent')
  }

  it('renders section title', () => {
    const wrapper = mount(ResearchSection, { props: defaultProps })
    expect(wrapper.find('h3').text()).toBe('Research')
  })

  it('shows collapsed summary by default', () => {
    const wrapper = mount(ResearchSection, { props: defaultProps })
    expect(wrapper.text()).toContain('Researched from')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('sources')
  })

  it('does not show expanded content by default', () => {
    const wrapper = mount(ResearchSection, { props: defaultProps })
    expect(wrapper.text()).not.toContain('Strategy')
  })

  it('expands on click to show strategy and techniques', async () => {
    const wrapper = mount(ResearchSection, { props: defaultProps })
    await findToggleButton(wrapper).trigger('click')
    expect(wrapper.text()).toContain('Strategy')
    expect(wrapper.text()).toContain('Cross-referenced multiple recipes')
    expect(wrapper.text()).toContain('Technique Findings')
    expect(wrapper.text()).toContain('Cold ferment')
  })

  it('shows sources grouped by type when expanded', async () => {
    const wrapper = mount(ResearchSection, { props: defaultProps })
    await findToggleButton(wrapper).trigger('click')
    expect(wrapper.text()).toContain('Sources (2)')
    expect(wrapper.text()).toContain('Source A')
    expect(wrapper.text()).toContain('Source B')
  })

  it('hides techniques section when no techniques', async () => {
    const wrapper = mount(ResearchSection, {
      props: {
        ...defaultProps,
        research: { ...defaultResearch, techniques: [] }
      }
    })
    await findToggleButton(wrapper).trigger('click')
    expect(wrapper.text()).not.toContain('Technique Findings')
  })

  it('applies voice-agent styling to summary button', () => {
    const wrapper = mount(ResearchSection, { props: defaultProps })
    const button = findToggleButton(wrapper)
    expect(button.exists()).toBe(true)
    expect(button.classes()).toContain('voice-agent')
  })

  it('shows researched tag', () => {
    const wrapper = mount(ResearchSection, { props: defaultProps })
    const tag = wrapper.find('.voice-agent-tag')
    expect(tag.exists()).toBe(true)
    expect(tag.text()).toBe('researched')
  })

  it('calls copyToClipboard when permalink button clicked', async () => {
    const { copyToClipboard } = await import('@/composables/useClipboard')
    const wrapper = mount(ResearchSection, { props: defaultProps })

    const linkButton = wrapper.find('button[title="Copy link"]')
    expect(linkButton.exists()).toBe(true)
    await linkButton.trigger('click')

    expect(copyToClipboard).toHaveBeenCalledWith(
      expect.stringContaining('#research-section')
    )
  })
})
