import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import GatherCategory from './GatherCategory.vue'

// Mock child components
vi.mock('@/components/CheckableItem.vue', () => ({
  default: {
    name: 'CheckableItem',
    props: ['id', 'label', 'checked'],
    emits: ['toggle'],
    template: '<div class="checkable-stub" :data-item-id="id"><input type="checkbox" :checked="checked" @change="$emit(\'toggle\')" />{{ label }}</div>'
  }
}))
vi.mock('@/components/TechniqueText.vue', () => ({
  default: {
    name: 'TechniqueText',
    props: ['text'],
    template: '<span>{{ text }}</span>'
  }
}))
vi.mock('lucide-vue-next', () => ({
  ClipboardList: { name: 'ClipboardList', template: '<svg class="icon-clipboard" />' },
  Check: { name: 'Check', template: '<svg class="icon-check" />' }
}))
vi.mock('@/composables/useScrollToNext', () => ({
  scrollToNextItem: vi.fn()
}))

// Mock clipboard
const writeTextMock = vi.fn().mockResolvedValue(undefined)
Object.assign(navigator, {
  clipboard: { writeText: writeTextMock }
})

function makeProgress(checkedIds: string[] = []) {
  return {
    isStageCollapsed: vi.fn(() => false),
    toggleStageCollapse: vi.fn(),
    isStateChecked: vi.fn(() => false),
    isItemChecked: vi.fn((id: string) => checkedIds.includes(id)),
    toggleItem: vi.fn(),
    toggleState: vi.fn(),
    getCompletionCount: vi.fn(() => ({ done: 0, total: 0 })),
    registerStage: vi.fn(),
    load: vi.fn(),
    save: vi.fn(),
    setStageOrder: vi.fn(),
    resetSection: vi.fn(),
    resetProgress: vi.fn()
  }
}

const defaultItems = [
  { id: 'item-1', label: 'All-purpose flour' },
  { id: 'item-2', label: 'Unsalted butter' },
  { id: 'item-3', label: 'Dark brown sugar' }
]

const defaultProps = {
  title: 'Ingredients',
  items: defaultItems,
  progress: makeProgress(),
  stageId: 'prep'
}

describe('GatherCategory', () => {
  it('renders title', () => {
    const wrapper = mount(GatherCategory, { props: defaultProps })
    expect(wrapper.text()).toContain('Ingredients')
  })

  it('renders all items as unchecked', () => {
    const wrapper = mount(GatherCategory, { props: defaultProps })
    expect(wrapper.text()).toContain('All-purpose flour')
    expect(wrapper.text()).toContain('Unsalted butter')
    expect(wrapper.text()).toContain('Dark brown sugar')
  })

  it('calls toggleItem when an item is toggled', async () => {
    const progress = makeProgress()
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Find the first CheckableItem stub and trigger its toggle
    const stubs = wrapper.findAll('.checkable-stub')
    await stubs[0].find('input').trigger('change')

    expect(progress.toggleItem).toHaveBeenCalledWith('item-1', 'prep')
  })

  it('shows Complete All label when not all checked', () => {
    const wrapper = mount(GatherCategory, { props: defaultProps })
    expect(wrapper.text()).toContain('Complete All')
    expect(wrapper.text()).not.toContain('Clear All')
  })

  it('shows Clear All label when all items are checked and manually expanded', async () => {
    const progress = makeProgress(['item-1', 'item-2', 'item-3'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // When all checked, it collapses. Click to expand.
    const headerRow = wrapper.find('.bg-stone-200')
    await headerRow.trigger('click')

    expect(wrapper.text()).toContain('Clear All')
  })

  it('completes all items on Complete All click', async () => {
    const progress = makeProgress()
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    const label = wrapper.find('label')
    await label.trigger('click')

    // Should toggle all unchecked items
    expect(progress.toggleItem).toHaveBeenCalledTimes(3)
    expect(progress.toggleItem).toHaveBeenCalledWith('item-1', 'prep')
    expect(progress.toggleItem).toHaveBeenCalledWith('item-2', 'prep')
    expect(progress.toggleItem).toHaveBeenCalledWith('item-3', 'prep')
  })

  it('clears all items on Clear All click', async () => {
    const progress = makeProgress(['item-1', 'item-2', 'item-3'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Expand first (it's collapsed when all checked)
    const headerRow = wrapper.find('.bg-stone-200')
    await headerRow.trigger('click')

    const label = wrapper.find('label')
    await label.trigger('click')

    // Should toggle all checked items to uncheck them
    expect(progress.toggleItem).toHaveBeenCalledTimes(3)
  })

  it('checked items sink to bottom', () => {
    const progress = makeProgress(['item-2'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Unchecked items rendered via CheckableItem stubs
    const stubs = wrapper.findAll('.checkable-stub')
    expect(stubs.length).toBe(2) // 2 unchecked items via CheckableItem

    // Checked item rendered as label with line-through
    const checkedLabels = wrapper.findAll('label.opacity-50')
    expect(checkedLabels.length).toBe(1)
    expect(checkedLabels[0].text()).toContain('Unsalted butter')
  })

  it('collapses when all items are checked', () => {
    const progress = makeProgress(['item-1', 'item-2', 'item-3'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Should show collapsed badge
    expect(wrapper.text()).toContain('3/3')
  })

  it('expands when clicking collapsed badge', async () => {
    const progress = makeProgress(['item-1', 'item-2', 'item-3'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Click the header row (which should expand since it's collapsed)
    const headerRow = wrapper.find('.bg-stone-200')
    expect(headerRow.exists()).toBe(true)
    await headerRow.trigger('click')

    // After clicking, should show Clear All (expanded state)
    expect(wrapper.text()).toContain('Clear All')
  })

  it('shows collapse button when manually expanded and all checked', async () => {
    const progress = makeProgress(['item-1', 'item-2', 'item-3'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Click to expand
    const headerRow = wrapper.find('.bg-stone-200')
    await headerRow.trigger('click')

    // Should show collapse button (upward arrow)
    const collapseBtn = wrapper.findAll('button').find(b => b.text().includes('\u25B2'))
    expect(collapseBtn?.exists()).toBe(true)
  })

  it('renders divider between unchecked and checked items', () => {
    const progress = makeProgress(['item-2'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // There should be a divider (h-px bg-stone-200)
    const divider = wrapper.find('.h-px.bg-stone-200')
    expect(divider.exists()).toBe(true)
  })

  it('does not render divider when all items are unchecked', () => {
    const wrapper = mount(GatherCategory, { props: defaultProps })

    // The only dividers would be inline, but no checked items means no mixed divider
    const dividers = wrapper.findAll('.h-px.bg-stone-200.my-1')
    expect(dividers.length).toBe(0)
  })

  it('handles single item list', () => {
    const items = [
      { id: 'item-1', label: 'Flour' }
    ]
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, items }
    })

    expect(wrapper.text()).toContain('Flour')
    expect(wrapper.text()).toContain('Complete All')
  })

  it('collapse button exists when expanded with all checked', async () => {
    const progress = makeProgress(['item-1', 'item-2', 'item-3'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Initially collapsed since all checked
    expect(wrapper.find('.bg-stone-200').exists()).toBe(true)

    // Expand
    await wrapper.find('.bg-stone-200').trigger('click')

    // Should show collapse button (triangle up)
    const collapseBtn = wrapper.findAll('button').find(b => b.text().includes('\u25B2'))
    expect(collapseBtn?.exists()).toBe(true)

    // Click it - triggers the collapse function internally
    await collapseBtn!.trigger('click')
  })

  it('scrolls to next unchecked item when checking an item', async () => {
    const { scrollToNextItem } = await import('@/composables/useScrollToNext')
    vi.mocked(scrollToNextItem).mockClear()

    // item-1 is about to be checked, item-2 and item-3 are unchecked
    const progress = makeProgress()
    // Make toggleItem actually flip the isItemChecked result for item-1
    let item1Checked = false
    progress.isItemChecked = vi.fn((id: string) => {
      if (id === 'item-1') return item1Checked
      return false
    })
    progress.toggleItem = vi.fn((id: string) => {
      if (id === 'item-1') item1Checked = true
    })

    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Toggle item-1 (checking it)
    const stubs = wrapper.findAll('.checkable-stub')
    await stubs[0].find('input').trigger('change')

    expect(scrollToNextItem).toHaveBeenCalledWith('[data-item-id="item-2"]')
  })

  it('does not scroll when unchecking an item', async () => {
    const { scrollToNextItem } = await import('@/composables/useScrollToNext')
    vi.mocked(scrollToNextItem).mockClear()

    // item-1 is already checked, about to be unchecked
    const progress = makeProgress(['item-1'])

    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Toggle item-1 via the checked label (unchecking it)
    const checkedLabel = wrapper.find('label.opacity-50 input')
    await checkedLabel.trigger('change')

    expect(scrollToNextItem).not.toHaveBeenCalled()
  })

  it('renders items with detail text', () => {
    const items = [
      { id: 'item-1', label: 'Flour', detail: '390g total' }
    ]
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, items }
    })

    expect(wrapper.text()).toContain('Flour')
  })
})

describe('GatherCategory per-category copy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    writeTextMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows copy button when unchecked items exist', () => {
    const wrapper = mount(GatherCategory, { props: defaultProps })

    const copyBtn = wrapper.find('button[title="Copy List"]')
    expect(copyBtn.exists()).toBe(true)
  })

  it('hides copy button when all items are checked', async () => {
    const progress = makeProgress(['item-1', 'item-2', 'item-3'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    // Expand first (it's collapsed when all checked)
    const headerRow = wrapper.find('.bg-stone-200')
    await headerRow.trigger('click')

    const copyBtn = wrapper.find('button[title="Copy List"]')
    expect(copyBtn.exists()).toBe(false)
  })

  it('copies unchecked items to clipboard with clean format', async () => {
    const progress = makeProgress(['item-2'])
    const wrapper = mount(GatherCategory, {
      props: { ...defaultProps, progress }
    })

    const copyBtn = wrapper.find('button[title="Copy List"]')
    await copyBtn.trigger('click')

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    const copiedText = writeTextMock.mock.calls[0][0]
    // Should be plain names, one per line, no headers or bullets
    expect(copiedText).toBe('All-purpose flour\nDark brown sugar')
  })

  it('copies all items when none are checked', async () => {
    const wrapper = mount(GatherCategory, { props: defaultProps })

    const copyBtn = wrapper.find('button[title="Copy List"]')
    await copyBtn.trigger('click')

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    const copiedText = writeTextMock.mock.calls[0][0]
    expect(copiedText).toBe('All-purpose flour\nUnsalted butter\nDark brown sugar')
  })
})
