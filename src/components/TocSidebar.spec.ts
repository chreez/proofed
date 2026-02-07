import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TocSidebar from './TocSidebar.vue'

const defaultProps = {
  stages: [
    { id: 'mise-en-place', title: 'Mise en Place' },
    { id: 'mix-dough', title: 'Mix Dough' },
    { id: 'first-rise', title: 'First Rise' }
  ],
  hasCookLog: true,
  hasChangeLog: true,
  currentStageId: 'mix-dough',
  completedStageIds: ['mise-en-place']
}

describe('TocSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all stage items', () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    expect(wrapper.text()).toContain('Mise en Place')
    expect(wrapper.text()).toContain('Mix Dough')
    expect(wrapper.text()).toContain('First Rise')
  })

  it('renders cook log and version history links', () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    expect(wrapper.text()).toContain('Cook Log')
    expect(wrapper.text()).toContain('Version History')
  })

  it('hides cook log link when hasCookLog is false', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasCookLog: false }
    })
    expect(wrapper.text()).not.toContain('Cook Log')
    expect(wrapper.text()).toContain('Version History')
  })

  it('hides version history link when hasChangeLog is false', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasChangeLog: false }
    })
    expect(wrapper.text()).toContain('Cook Log')
    expect(wrapper.text()).not.toContain('Version History')
  })

  it('applies completed styling to completed stages', () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    const items = wrapper.findAll('aside nav > div')
    // First item (completed) should have line-through
    const completedItem = items.find(d => d.text() === 'Mise en Place')
    expect(completedItem?.classes()).toContain('line-through')
    expect(completedItem?.classes()).toContain('text-stone-400')
  })

  it('highlights current active stage', () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    const items = wrapper.findAll('aside nav > div')
    const activeItem = items.find(d => d.text() === 'Mix Dough')
    expect(activeItem?.classes()).toContain('text-accent')
    expect(activeItem?.classes()).toContain('font-medium')
  })

  it('emits navigate with stage id on click', async () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    const items = wrapper.findAll('aside nav > div')
    const firstRiseItem = items.find(d => d.text() === 'First Rise')
    await firstRiseItem?.trigger('click')

    expect(wrapper.emitted('navigate')).toBeTruthy()
    expect(wrapper.emitted('navigate')![0]).toEqual(['first-rise'])
  })

  it('emits navigate with cook-log on cook log click', async () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    const items = wrapper.findAll('aside nav > div')
    const cookLogItem = items.find(d => d.text() === 'Cook Log')
    await cookLogItem?.trigger('click')

    expect(wrapper.emitted('navigate')).toBeTruthy()
    expect(wrapper.emitted('navigate')![0]).toEqual(['cook-log'])
  })

  it('emits navigate with change-log on version history click', async () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    const items = wrapper.findAll('aside nav > div')
    const versionItem = items.find(d => d.text() === 'Version History')
    await versionItem?.trigger('click')

    expect(wrapper.emitted('navigate')).toBeTruthy()
    expect(wrapper.emitted('navigate')![0]).toEqual(['change-log'])
  })

  it('renders mobile FAB button', () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    expect(fab.exists()).toBe(true)
  })
})

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
