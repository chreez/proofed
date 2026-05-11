import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TagSearch from './TagSearch.vue'

interface Item {
  id: string
  name: string
  category: string
}

const items: Item[] = [
  { id: '1', name: 'Sourdough Bread', category: 'baking' },
  { id: '2', name: 'Sourdough Cookies', category: 'baking' },
  { id: '3', name: 'Pizza Dough', category: 'pizza' },
  { id: '4', name: 'Bolognese', category: 'mains' },
]

const tokensFn = (item: Item): string[] => {
  const tokens = new Set<string>()
  item.name.toLowerCase().split(/\s+/).forEach((w) => {
    if (w.length >= 3) tokens.add(`name:${w}`)
  })
  tokens.add(`category:${item.category}`)
  return [...tokens]
}

const matchTextFn = (item: Item, q: string): boolean =>
  `${item.name} ${item.category}`.toLowerCase().includes(q.toLowerCase())

function makeWrapper(overrides = {}) {
  return mount(TagSearch as never, {
    props: {
      items,
      tokensFn,
      matchTextFn,
      ...overrides,
    },
    slots: {
      preview: '<div class="preview-row">{{ params.item.name }}</div>',
    },
  })
}

describe('TagSearch', () => {
  it('renders the input', () => {
    const w = makeWrapper()
    expect(w.find('[data-testid="tag-search-input"]').exists()).toBe(true)
  })

  it('opens dropdown with both sections when input matches tag + items', async () => {
    const w = makeWrapper()
    const input = w.find('[data-testid="tag-search-input"]')
    await input.setValue('sour')
    await input.trigger('focus')
    await nextTick()
    expect(w.find('[data-testid="tag-dropdown"]').exists()).toBe(true)
    expect(w.findAll('[data-testid="tag-suggestion"]').length).toBeGreaterThan(0)
    expect(w.findAll('[data-testid="result-preview"]').length).toBeGreaterThan(0)
  })

  it('adds a chip on tag suggestion click', async () => {
    const w = makeWrapper()
    const input = w.find('[data-testid="tag-search-input"]')
    await input.setValue('pizza')
    await input.trigger('focus')
    await nextTick()
    const suggestion = w.find('[data-testid="tag-suggestion"]')
    expect(suggestion.exists()).toBe(true)
    await suggestion.trigger('mousedown')
    await nextTick()
    expect(w.findAll('[data-testid="tag-chip"]').length).toBe(1)
    expect(w.emitted('update:modelValue')).toBeTruthy()
  })

  it('AND-filters when multiple chips are active', async () => {
    const w = makeWrapper({ modelValue: ['name:sourdough', 'name:cookies'] })
    await nextTick()
    const scoped = (w.vm as unknown as { scopedItems: Item[] }).scopedItems
    expect(scoped).toHaveLength(1)
    expect(scoped[0].id).toBe('2')
  })

  it('removes a chip when × is clicked', async () => {
    const w = makeWrapper({ modelValue: ['category:pizza'] })
    await nextTick()
    expect(w.findAll('[data-testid="tag-chip"]').length).toBe(1)
    await w.find('.chip-x').trigger('click')
    await nextTick()
    expect(w.findAll('[data-testid="tag-chip"]').length).toBe(0)
  })

  it('emits navigate when a preview row is clicked', async () => {
    const w = makeWrapper()
    const input = w.find('[data-testid="tag-search-input"]')
    await input.setValue('bolognese')
    await input.trigger('focus')
    await nextTick()
    const preview = w.find('[data-testid="result-preview"]')
    expect(preview.exists()).toBe(true)
    await preview.trigger('mousedown')
    await nextTick()
    const navEmits = w.emitted('navigate')
    expect(navEmits).toBeTruthy()
    expect((navEmits as unknown[][])[0][0]).toMatchObject({ id: '4' })
  })

  it('clears query on Escape', async () => {
    const w = makeWrapper()
    const input = w.find('[data-testid="tag-search-input"]')
    await input.setValue('sour')
    await input.trigger('focus')
    await nextTick()
    expect(w.find('[data-testid="tag-dropdown"]').exists()).toBe(true)
    await input.trigger('keydown', { key: 'Escape' })
    await nextTick()
    expect(w.find('[data-testid="tag-dropdown"]').exists()).toBe(false)
  })

  it('pops last chip on Backspace when input is empty', async () => {
    const w = makeWrapper({ modelValue: ['name:sourdough', 'category:baking'] })
    await nextTick()
    expect(w.findAll('[data-testid="tag-chip"]').length).toBe(2)
    const input = w.find('[data-testid="tag-search-input"]')
    await input.trigger('keydown', { key: 'Backspace' })
    await nextTick()
    expect(w.findAll('[data-testid="tag-chip"]').length).toBe(1)
  })

  it('shows empty state when query matches no tags or items', async () => {
    const w = makeWrapper()
    const input = w.find('[data-testid="tag-search-input"]')
    await input.setValue('xyznomatch')
    await input.trigger('focus')
    await nextTick()
    const dd = w.find('[data-testid="tag-dropdown"]')
    expect(dd.exists()).toBe(true)
    expect(dd.text()).toMatch(/No tags or matches/)
  })

  it('hides dropdown when query is empty', async () => {
    const w = makeWrapper()
    const input = w.find('[data-testid="tag-search-input"]')
    await input.setValue('')
    await input.trigger('focus')
    await nextTick()
    expect(w.find('[data-testid="tag-dropdown"]').exists()).toBe(false)
  })

  it('arrow keys traverse all dropdown rows (tags + previews)', async () => {
    const w = makeWrapper()
    const input = w.find('[data-testid="tag-search-input"]')
    await input.setValue('sour')
    await input.trigger('focus')
    await nextTick()
    await input.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    expect(w.find('.dd-tag-row.active, .dd-result-row.active').exists()).toBe(true)
  })
})
