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

describe('Collapse when > 4 entries', () => {
  const sixEntries = [
    { version: 'v1.5.0', date: '2026-02-06', summary: 'Fix 5' },
    { version: 'v1.4.0', date: '2026-02-05', summary: 'Fix 4' },
    { version: 'v1.3.0', date: '2026-02-04', summary: 'Fix 3' },
    { version: 'v1.2.0', date: '2026-02-03', summary: 'Fix 2' },
    { version: 'v1.1.0', date: '2026-02-02', summary: 'Fix 1' },
    { version: 'v1.0.0', date: '2026-02-01', summary: 'Initial' }
  ]

  it('renders all entries when count <= 4 (no button)', () => {
    const wrapper = mount(VersionTimeline, {
      props: {
        changeLog: sixEntries.slice(0, 4),
        currentVersion: 'v1.5.0',
        sectionId: 'version-history-section'
      }
    })

    // All 4 rendered — count the dot containers
    expect(wrapper.findAll('.absolute.-left-6').length).toBe(4)
    // No show-more button
    expect(wrapper.text()).not.toContain('Show')
  })

  it('renders only newest 4 when count > 4 and shows expand button', () => {
    const wrapper = mount(VersionTimeline, {
      props: {
        changeLog: sixEntries,
        currentVersion: 'v1.5.0',
        sectionId: 'version-history-section'
      }
    })

    // 4 entries rendered
    expect(wrapper.findAll('.absolute.-left-6').length).toBe(4)
    // Newest 4 shown
    expect(wrapper.text()).toContain('v1.5.0')
    expect(wrapper.text()).toContain('v1.4.0')
    expect(wrapper.text()).toContain('v1.3.0')
    expect(wrapper.text()).toContain('v1.2.0')
    // Older 2 not shown
    expect(wrapper.text()).not.toContain('v1.1.0')
    expect(wrapper.text()).not.toContain('v1.0.0')
    // Button shows hidden count (plural)
    expect(wrapper.text()).toContain('Show 2 more versions')
  })

  it('uses singular "version" when exactly 1 entry is hidden', () => {
    const wrapper = mount(VersionTimeline, {
      props: {
        changeLog: sixEntries.slice(0, 5),
        currentVersion: 'v1.5.0',
        sectionId: 'version-history-section'
      }
    })

    expect(wrapper.text()).toContain('Show 1 more version')
    expect(wrapper.text()).not.toContain('Show 1 more versions')
  })

  it('expands to show all entries when button is clicked (one-way)', async () => {
    const wrapper = mount(VersionTimeline, {
      props: {
        changeLog: sixEntries,
        currentVersion: 'v1.5.0',
        sectionId: 'version-history-section'
      }
    })

    // Before: 4 visible
    expect(wrapper.findAll('.absolute.-left-6').length).toBe(4)

    const button = wrapper.find('[data-testid="version-timeline-expand-button"]')
    expect(button.exists()).toBe(true)
    await button.trigger('click')

    // After: all 6 visible
    expect(wrapper.findAll('.absolute.-left-6').length).toBe(6)
    // Older entries now visible
    expect(wrapper.text()).toContain('v1.1.0')
    expect(wrapper.text()).toContain('v1.0.0')
    // Button gone
    expect(wrapper.find('[data-testid="version-timeline-expand-button"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Show')
  })

  it('preserves array order in both collapsed and expanded states', async () => {
    const wrapper = mount(VersionTimeline, {
      props: {
        changeLog: sixEntries,
        currentVersion: 'v1.5.0',
        sectionId: 'version-history-section'
      }
    })

    // Collapsed: order from array (already newest-first)
    let versions = wrapper.findAll('.flex.items-baseline .font-semibold').map(e => e.text())
    expect(versions).toEqual(['v1.5.0', 'v1.4.0', 'v1.3.0', 'v1.2.0'])

    await wrapper.find('[data-testid="version-timeline-expand-button"]').trigger('click')

    // Expanded: all 6 in same array order
    versions = wrapper.findAll('.flex.items-baseline .font-semibold').map(e => e.text())
    expect(versions).toEqual([
      'v1.5.0', 'v1.4.0', 'v1.3.0', 'v1.2.0', 'v1.1.0', 'v1.0.0'
    ])
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

  it('matches collapsed snapshot (6 entries, newest 4 visible + button)', () => {
    const wrapper = mount(VersionTimeline, {
      props: {
        changeLog: [
          { version: 'v1.5.0', date: '2026-02-06', summary: 'Fix 5' },
          { version: 'v1.4.0', date: '2026-02-05', summary: 'Fix 4' },
          { version: 'v1.3.0', date: '2026-02-04', summary: 'Fix 3' },
          { version: 'v1.2.0', date: '2026-02-03', summary: 'Fix 2' },
          { version: 'v1.1.0', date: '2026-02-02', summary: 'Fix 1' },
          { version: 'v1.0.0', date: '2026-02-01', summary: 'Initial' }
        ],
        currentVersion: 'v1.5.0',
        sectionId: 'version-history-section'
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches expanded snapshot (6 entries, all visible, no button)', async () => {
    const wrapper = mount(VersionTimeline, {
      props: {
        changeLog: [
          { version: 'v1.5.0', date: '2026-02-06', summary: 'Fix 5' },
          { version: 'v1.4.0', date: '2026-02-05', summary: 'Fix 4' },
          { version: 'v1.3.0', date: '2026-02-04', summary: 'Fix 3' },
          { version: 'v1.2.0', date: '2026-02-03', summary: 'Fix 2' },
          { version: 'v1.1.0', date: '2026-02-02', summary: 'Fix 1' },
          { version: 'v1.0.0', date: '2026-02-01', summary: 'Initial' }
        ],
        currentVersion: 'v1.5.0',
        sectionId: 'version-history-section'
      }
    })
    await wrapper.find('[data-testid="version-timeline-expand-button"]').trigger('click')
    expect(wrapper.html()).toMatchSnapshot()
  })
})
