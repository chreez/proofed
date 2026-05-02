import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TechnicalNotesSection from './TechnicalNotesSection.vue'
import type { TechnicalNote } from '@/types/recipe'

vi.mock('@/composables/useClipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined)
}))

const sampleNotes: TechnicalNote[] = [
  {
    title: 'Hydration Analysis',
    text: '- **Base hydration**: 66%\n- **Effective**: ~71%',
    category: 'hydration'
  },
  {
    title: 'Levain vs. Active Starter',
    text: 'Use 100g active starter instead of building a levain.',
    category: 'substitution'
  }
]

const defaultProps = {
  notes: sampleNotes,
  sectionId: 'technical-notes-section'
}

describe('TechnicalNotesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders card with title', () => {
    const wrapper = mount(TechnicalNotesSection, { props: defaultProps })
    expect(wrapper.find('.card').exists()).toBe(true)
    expect(wrapper.text()).toContain('Technical Notes')
  })

  it('shows note count', () => {
    const wrapper = mount(TechnicalNotesSection, { props: defaultProps })
    expect(wrapper.text()).toContain('2 notes')
  })

  it('shows singular "note" for single note', () => {
    const wrapper = mount(TechnicalNotesSection, {
      props: { ...defaultProps, notes: [sampleNotes[0]] }
    })
    expect(wrapper.text()).toContain('1 note')
  })

  it('starts collapsed — no note content visible', () => {
    const wrapper = mount(TechnicalNotesSection, { props: defaultProps })
    expect(wrapper.text()).not.toContain('Hydration Analysis')
    expect(wrapper.text()).not.toContain('Levain vs. Active Starter')
  })

  it('expands on click to show notes', async () => {
    const wrapper = mount(TechnicalNotesSection, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')
    expect(wrapper.text()).toContain('Hydration Analysis')
    expect(wrapper.text()).toContain('Levain vs. Active Starter')
  })

  it('shows category badges when present', async () => {
    const wrapper = mount(TechnicalNotesSection, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')
    expect(wrapper.text()).toContain('hydration')
    expect(wrapper.text()).toContain('substitution')
  })

  it('hides category badge when not set', async () => {
    const noteWithoutCategory: TechnicalNote[] = [
      { title: 'General Note', text: 'Some text' }
    ]
    const wrapper = mount(TechnicalNotesSection, {
      props: { ...defaultProps, notes: noteWithoutCategory }
    })
    await wrapper.find('[role="button"]').trigger('click')
    expect(wrapper.text()).toContain('General Note')
    // Only the title and text, no category badge
    const badges = wrapper.findAll('.text-\\[10px\\]')
    expect(badges.length).toBe(0)
  })

  it('renders markdown in note text', async () => {
    const wrapper = mount(TechnicalNotesSection, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')
    const prose = wrapper.find('.tech-note-prose')
    expect(prose.html()).toContain('<strong>')
    expect(prose.html()).toContain('<ul>')
  })

  it('does not render tilde as strikethrough', async () => {
    const wrapper = mount(TechnicalNotesSection, { props: defaultProps })
    await wrapper.find('[role="button"]').trigger('click')
    const html = wrapper.html()
    expect(html).not.toContain('<del>')
    expect(html).toContain('~71%')
  })

  it('collapses on second click', async () => {
    const wrapper = mount(TechnicalNotesSection, { props: defaultProps })
    const btn = wrapper.find('[role="button"]')
    await btn.trigger('click')
    expect(wrapper.text()).toContain('Hydration Analysis')
    await btn.trigger('click')
    expect(wrapper.text()).not.toContain('Hydration Analysis')
  })

  it('handles unknown category gracefully', async () => {
    const notes: TechnicalNote[] = [
      { title: 'Test', text: 'text', category: 'equipment' }
    ]
    const wrapper = mount(TechnicalNotesSection, {
      props: { ...defaultProps, notes }
    })
    await wrapper.find('[role="button"]').trigger('click')
    expect(wrapper.text()).toContain('equipment')
  })

  it('copies permalink on link button click', async () => {
    const { copyToClipboard } = await import('@/composables/useClipboard')
    const wrapper = mount(TechnicalNotesSection, { props: defaultProps })
    const linkBtn = wrapper.find('.icon-btn')
    await linkBtn.trigger('click')
    expect(copyToClipboard).toHaveBeenCalled()
  })
})
