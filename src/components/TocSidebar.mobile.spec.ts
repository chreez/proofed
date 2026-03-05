import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TocSidebar from './TocSidebar.vue'

const defaultProps = {
  stages: [
    { id: 'mise-en-place', title: 'Mise en Place' },
    { id: 'mix-dough', title: 'Mix Dough' }
  ],
  hasCookLog: true,
  hasChangeLog: true,
  hasSource: false,
  hasResearch: false,
  currentStageId: 'mix-dough',
  completedStageIds: ['mise-en-place']
}

describe('TocSidebar source and research sections', () => {
  it('renders source link when hasSource is true', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasSource: true }
    })
    expect(wrapper.text()).toContain('Source')
  })

  it('renders research link when hasResearch is true', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasResearch: true }
    })
    expect(wrapper.text()).toContain('Research')
  })

  it('emits navigate for source section', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasSource: true }
    })
    const items = wrapper.findAll('aside nav > div')
    const sourceItem = items.find(d => d.text() === 'Source')
    await sourceItem?.trigger('click')
    expect(wrapper.emitted('navigate')![0]).toEqual(['source'])
  })

  it('emits navigate for research section', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasResearch: true }
    })
    const items = wrapper.findAll('aside nav > div')
    const researchItem = items.find(d => d.text() === 'Research')
    await researchItem?.trigger('click')
    expect(wrapper.emitted('navigate')![0]).toEqual(['research'])
  })

  it('bottom sheet shows source button when hasSource is true', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasSource: true },
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const buttons = wrapper.findAll('button')
    const sourceBtn = buttons.find(b => b.text().trim() === 'Source')
    expect(sourceBtn?.exists()).toBe(true)
  })

  it('bottom sheet emits navigate for source', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasSource: true },
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const buttons = wrapper.findAll('button')
    const sourceBtn = buttons.find(b => b.text().trim() === 'Source')
    await sourceBtn!.trigger('click')

    const navigateEvents = wrapper.emitted('navigate') as string[][]
    const sourceEvent = navigateEvents.find(e => e[0] === 'source')
    expect(sourceEvent).toBeTruthy()
  })

  it('bottom sheet shows research button when hasResearch is true', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasResearch: true },
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const buttons = wrapper.findAll('button')
    const researchBtn = buttons.find(b => b.text().trim() === 'Research')
    expect(researchBtn?.exists()).toBe(true)
  })

  it('bottom sheet emits navigate for research', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasResearch: true },
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const buttons = wrapper.findAll('button')
    const researchBtn = buttons.find(b => b.text().trim() === 'Research')
    await researchBtn!.trigger('click')

    const navigateEvents = wrapper.emitted('navigate') as string[][]
    const researchEvent = navigateEvents.find(e => e[0] === 'research')
    expect(researchEvent).toBeTruthy()
  })

  it('highlights active source in desktop sidebar', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasSource: true, currentStageId: 'source' }
    })
    const items = wrapper.findAll('aside nav > div')
    const sourceItem = items.find(d => d.text() === 'Source')
    expect(sourceItem!.classes()).toContain('text-accent')
  })

  it('highlights active research in desktop sidebar', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasResearch: true, currentStageId: 'research' }
    })
    const items = wrapper.findAll('aside nav > div')
    const researchItem = items.find(d => d.text() === 'Research')
    expect(researchItem!.classes()).toContain('text-accent')
  })
})
