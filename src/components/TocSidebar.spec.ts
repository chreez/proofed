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
  hasSource: false,
  hasResearch: false,
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

  it('shows hasNutrition link when prop is true', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasNutrition: true }
    })
    expect(wrapper.text()).toContain('Nutrition')
  })

  it('hides nutrition link when hasNutrition is false', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasNutrition: false }
    })
    // Count Nutrition occurrences in non-FAB text
    const aside = wrapper.find('aside')
    expect(aside.text()).not.toContain('Nutrition')
  })

  it('opens bottom sheet when FAB is clicked', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })
    const fab = wrapper.find('button[aria-label="Open table of contents"]')

    await fab.trigger('click')

    // Bottom sheet should now be open - look for Contents header
    expect(wrapper.html()).toContain('Contents')
  })

  it('closes bottom sheet when backdrop is clicked', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })

    // Open the sheet
    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    // Find backdrop and click it
    const backdrop = wrapper.find('.bg-black\\/40')
    expect(backdrop.exists()).toBe(true)
    await backdrop.trigger('click')

    // Sheet should be closed
    expect(wrapper.find('.bg-black\\/40').exists()).toBe(false)
  })

  it('emits navigate and closes sheet when item clicked in bottom sheet', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })

    // Open the sheet
    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    // Click a stage button in the bottom sheet
    const sheetButtons = wrapper.findAll('ul button')
    const mixDoughBtn = sheetButtons.find(b => b.text() === 'Mix Dough')
    await mixDoughBtn?.trigger('click')

    expect(wrapper.emitted('navigate')).toBeTruthy()
    expect(wrapper.emitted('navigate')![0]).toEqual(['mix-dough'])

    // Sheet should close after navigation
    expect(wrapper.find('.bg-black\\/40').exists()).toBe(false)
  })

  it('renders stages in bottom sheet with correct styling', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })

    // Open the sheet
    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const sheetButtons = wrapper.findAll('ul button')

    // Completed stage should have line-through
    const completedBtn = sheetButtons.find(b => b.text() === 'Mise en Place')
    expect(completedBtn?.classes()).toContain('text-stone-400')
    expect(completedBtn?.classes()).toContain('line-through')

    // Active stage should have accent styling
    const activeBtn = sheetButtons.find(b => b.text() === 'Mix Dough')
    expect(activeBtn?.classes()).toContain('text-accent')
    expect(activeBtn?.classes()).toContain('font-medium')
  })

  it('handles drag to dismiss - short drag does not close', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const sheet = wrapper.find('[class*="fixed bottom-0"]')
    expect(sheet.exists()).toBe(true)

    // Simulate drag start
    await sheet.trigger('mousedown', { clientY: 500 })
    // Simulate short drag (< 100px)
    await sheet.trigger('mousemove', { clientY: 550 })
    // Simulate drag end
    await sheet.trigger('mouseup')

    // Sheet should still be open (drag < 100px)
    expect(wrapper.find('[class*="fixed bottom-0"]').exists()).toBe(true)
  })

  it('handles drag to dismiss - long drag closes sheet', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const sheet = wrapper.find('[class*="fixed bottom-0"]')
    expect(sheet.exists()).toBe(true)

    // Simulate drag start
    await sheet.trigger('mousedown', { clientY: 300 })
    // Simulate long drag (> 100px)
    await sheet.trigger('mousemove', { clientY: 450 })
    // Simulate drag end
    await sheet.trigger('mouseup')

    // Sheet should be closed
    expect(wrapper.find('[class*="fixed bottom-0"]').exists()).toBe(false)
  })

  it('handles touch drag to dismiss', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const sheet = wrapper.find('[class*="fixed bottom-0"]')

    // Simulate touch drag start
    await sheet.trigger('touchstart', { touches: [{ clientY: 300 }] })
    // Simulate long touch drag
    await sheet.trigger('touchmove', { touches: [{ clientY: 450 }] })
    // Simulate touch end
    await sheet.trigger('touchend')

    // Sheet should be closed
    expect(wrapper.find('[class*="fixed bottom-0"]').exists()).toBe(false)
  })

  it('does not move sheet upward on drag', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const sheet = wrapper.find('[class*="fixed bottom-0"]')

    // Simulate drag start
    await sheet.trigger('mousedown', { clientY: 500 })
    // Simulate drag upward (negative delta)
    await sheet.trigger('mousemove', { clientY: 400 })
    // Simulate drag end
    await sheet.trigger('mouseup')

    // Sheet should still be open
    expect(wrapper.find('[class*="fixed bottom-0"]').exists()).toBe(true)
  })

  it('handles mouseleave during drag', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const sheet = wrapper.find('[class*="fixed bottom-0"]')

    // Start drag
    await sheet.trigger('mousedown', { clientY: 300 })
    await sheet.trigger('mousemove', { clientY: 500 })
    // Mouse leaves the sheet
    await sheet.trigger('mouseleave')

    // Sheet should be closed (drag > 100px before leave)
    expect(wrapper.find('[class*="fixed bottom-0"]').exists()).toBe(false)
  })

  it('ignores drag move when not dragging', async () => {
    const wrapper = mount(TocSidebar, {
      props: defaultProps,
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const sheet = wrapper.find('[class*="fixed bottom-0"]')

    // Move without starting a drag
    await sheet.trigger('mousemove', { clientY: 500 })

    // Should have no effect - sheet still open
    expect(wrapper.find('[class*="fixed bottom-0"]').exists()).toBe(true)
  })

  it('hides divider when no extra sections', () => {
    const wrapper = mount(TocSidebar, {
      props: {
        ...defaultProps,
        hasCookLog: false,
        hasChangeLog: false,
        hasNutrition: false
      }
    })

    // The divider between stages and extras should not appear
    const dividers = wrapper.findAll('.my-2.h-px.bg-stone-200')
    expect(dividers.length).toBe(0)
  })

  it('shows technical notes link when hasTechnicalNotes is true', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasTechnicalNotes: true }
    })
    const aside = wrapper.find('aside')
    expect(aside.text()).toContain('Technical Notes')
  })

  it('hides technical notes link when hasTechnicalNotes is false', () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasTechnicalNotes: false }
    })
    const aside = wrapper.find('aside')
    expect(aside.text()).not.toContain('Technical Notes')
  })

  it('emits navigate for technical-notes on click', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasTechnicalNotes: true }
    })
    const items = wrapper.findAll('aside nav > div')
    const tnItem = items.find(d => d.text() === 'Technical Notes')
    await tnItem?.trigger('click')

    expect(wrapper.emitted('navigate')![0]).toEqual(['technical-notes'])
  })

  it('bottom sheet shows technical notes button and emits navigate', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasTechnicalNotes: true },
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const buttons = wrapper.findAll('button')
    const tnBtn = buttons.find(b => b.text().trim() === 'Technical Notes')
    expect(tnBtn?.exists()).toBe(true)

    await tnBtn!.trigger('click')

    const navigateEvents = wrapper.emitted('navigate') as string[][]
    const tnEvent = navigateEvents.find(e => e[0] === 'technical-notes')
    expect(tnEvent).toBeTruthy()
  })

  it('emits navigate for nutrition section', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasNutrition: true }
    })

    const items = wrapper.findAll('aside nav > div')
    const nutritionItem = items.find(d => d.text() === 'Nutrition')
    await nutritionItem?.trigger('click')

    expect(wrapper.emitted('navigate')![0]).toEqual(['nutrition'])
  })

  it('bottom sheet shows nutrition button and emits navigate', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasNutrition: true },
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    // Find the nutrition button in the bottom sheet
    const buttons = wrapper.findAll('button')
    const nutritionBtn = buttons.find(b => b.text().trim() === 'Nutrition')
    expect(nutritionBtn?.exists()).toBe(true)

    await nutritionBtn!.trigger('click')

    const navigateEvents = wrapper.emitted('navigate') as string[][]
    const nutritionEvent = navigateEvents.find(e => e[0] === 'nutrition')
    expect(nutritionEvent).toBeTruthy()
  })

  it('bottom sheet shows cook log button and emits navigate', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasCookLog: true },
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const buttons = wrapper.findAll('button')
    const cookLogBtn = buttons.find(b => b.text().trim() === 'Cook Log')
    expect(cookLogBtn?.exists()).toBe(true)

    await cookLogBtn!.trigger('click')

    const navigateEvents = wrapper.emitted('navigate') as string[][]
    const cookLogEvent = navigateEvents.find(e => e[0] === 'cook-log')
    expect(cookLogEvent).toBeTruthy()
  })

  it('bottom sheet shows version history button and emits navigate', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasChangeLog: true },
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    const buttons = wrapper.findAll('button')
    const changeLogBtn = buttons.find(b => b.text().trim() === 'Version History')
    expect(changeLogBtn?.exists()).toBe(true)

    await changeLogBtn!.trigger('click')

    const navigateEvents = wrapper.emitted('navigate') as string[][]
    const changeLogEvent = navigateEvents.find(e => e[0] === 'change-log')
    expect(changeLogEvent).toBeTruthy()
  })

  it('bottom sheet shows divider when extra sections exist', async () => {
    const wrapper = mount(TocSidebar, {
      props: { ...defaultProps, hasNutrition: true, hasCookLog: true },
      global: { stubs: { Teleport: true } }
    })

    const fab = wrapper.find('button[aria-label="Open table of contents"]')
    await fab.trigger('click')

    // Should have divider(s) in the bottom sheet
    const dividers = wrapper.findAll('.my-2.mx-4.h-px.bg-stone-200')
    expect(dividers.length).toBeGreaterThan(0)
  })
})

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(TocSidebar, { props: defaultProps })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
