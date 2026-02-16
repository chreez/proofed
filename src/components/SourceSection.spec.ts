import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SourceSection from './SourceSection.vue'
import type { RecipeSource } from '@/types/recipe'

vi.mock('@/composables/useClipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined)
}))

describe('SourceSection', () => {
  const defaultSource: RecipeSource = {
    name: 'Test Recipe Book',
    type: 'original',
    author: 'Test Author',
    url: 'https://example.com/recipe'
  }

  const defaultProps = {
    source: defaultSource,
    sectionId: 'source-section'
  }

  it('renders section title', () => {
    const wrapper = mount(SourceSection, { props: defaultProps })
    expect(wrapper.find('h3').text()).toBe('Source')
  })

  it('renders source name with link when url provided', () => {
    const wrapper = mount(SourceSection, { props: defaultProps })
    const link = wrapper.find('a[target="_blank"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Test Recipe Book')
    expect(link.attributes('href')).toBe('https://example.com/recipe')
  })

  it('renders source name without link when no url', () => {
    const sourceNoUrl = { ...defaultSource, url: undefined }
    const wrapper = mount(SourceSection, {
      props: { source: sourceNoUrl, sectionId: 'source-section' }
    })
    expect(wrapper.text()).toContain('Test Recipe Book')
    expect(wrapper.find('a[target="_blank"]').exists()).toBe(false)
  })

  it('shows correct label for original type', () => {
    const wrapper = mount(SourceSection, { props: defaultProps })
    expect(wrapper.text()).toContain('Original recipe by')
  })

  it('shows correct label for adapted type', () => {
    const sourceAdapted = { ...defaultSource, type: 'adapted' as const }
    const wrapper = mount(SourceSection, {
      props: { source: sourceAdapted, sectionId: 'source-section' }
    })
    expect(wrapper.text()).toContain('Adapted from')
  })

  it('shows correct label for inspired type', () => {
    const sourceInspired = { ...defaultSource, type: 'inspired' as const }
    const wrapper = mount(SourceSection, {
      props: { source: sourceInspired, sectionId: 'source-section' }
    })
    expect(wrapper.text()).toContain('Inspired by')
  })

  it('shows author when provided and different from name', () => {
    const wrapper = mount(SourceSection, { props: defaultProps })
    expect(wrapper.text()).toContain('by Test Author')
  })

  it('hides author when same as name', () => {
    const sourceSameAuthor = { ...defaultSource, author: 'Test Recipe Book' }
    const wrapper = mount(SourceSection, {
      props: { source: sourceSameAuthor, sectionId: 'source-section' }
    })
    expect(wrapper.text()).not.toContain('by Test Recipe Book')
  })

  it('shows accessed date when provided', () => {
    const sourceWithDate = { ...defaultSource, accessed: '2026-02-15' }
    const wrapper = mount(SourceSection, {
      props: { source: sourceWithDate, sectionId: 'source-section' }
    })
    expect(wrapper.text()).toContain('(accessed 2026-02-15)')
  })

  it('calls copyToClipboard when permalink button clicked', async () => {
    const { copyToClipboard } = await import('@/composables/useClipboard')
    const wrapper = mount(SourceSection, { props: defaultProps })

    const linkButton = wrapper.find('button[title="Copy link"]')
    expect(linkButton.exists()).toBe(true)
    await linkButton.trigger('click')

    expect(copyToClipboard).toHaveBeenCalledWith(
      expect.stringContaining('#source-section')
    )
  })
})
