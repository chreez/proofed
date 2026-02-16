import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VersionTimeline from './VersionTimeline.vue'

vi.mock('@/composables/useClipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined)
}))

describe('VersionTimeline', () => {
  const defaultProps = {
    changeLog: [
      { version: 'v1.1.0', date: '2026-02-05', summary: 'Added features' },
      { version: 'v1.0.0', date: '2026-02-01', summary: 'Initial release' }
    ],
    currentVersion: 'v1.1.0',
    sectionId: 'version-history-section'
  }

  it('renders all changelog entries', () => {
    const wrapper = mount(VersionTimeline, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('v1.1.0')
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('Added features')
    expect(wrapper.text()).toContain('Initial release')
  })

  it('highlights current version with different styling', () => {
    const wrapper = mount(VersionTimeline, {
      props: defaultProps
    })

    // Find the dot containers and their inner colored dots
    const dotContainers = wrapper.findAll('.absolute.-left-6')
    expect(dotContainers.length).toBe(2)

    // First entry (v1.1.0) is current - inner dot should have bg-success
    expect(dotContainers[0].find('.rounded-full').classes()).toContain('bg-success')

    // Second entry (v1.0.0) is not current - inner dot should have bg-accent
    expect(dotContainers[1].find('.rounded-full').classes()).toContain('bg-accent')
  })

  it('shows version, date, and summary for each entry', () => {
    const wrapper = mount(VersionTimeline, {
      props: defaultProps
    })

    // Check first entry has all parts
    expect(wrapper.text()).toContain('v1.1.0')
    expect(wrapper.text()).toContain('2026-02-05')
    expect(wrapper.text()).toContain('Added features')

    // Check second entry has all parts
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('2026-02-01')
    expect(wrapper.text()).toContain('Initial release')
  })

  it('calls copyToClipboard when permalink button clicked', async () => {
    const { copyToClipboard } = await import('@/composables/useClipboard')
    const wrapper = mount(VersionTimeline, { props: defaultProps })

    const linkButton = wrapper.find('button[title="Copy link"]')
    expect(linkButton.exists()).toBe(true)
    await linkButton.trigger('click')

    expect(copyToClipboard).toHaveBeenCalledWith(
      expect.stringContaining('#version-history-section')
    )
  })
})

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(VersionTimeline, {
      props: {
        changeLog: [
          { version: 'v1.1.0', date: '2026-02-05', summary: 'Added features' },
          { version: 'v1.0.0', date: '2026-02-01', summary: 'Initial release' }
        ],
        currentVersion: 'v1.1.0',
        sectionId: 'version-history-section'
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
