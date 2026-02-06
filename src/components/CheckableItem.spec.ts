import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CheckableItem from './CheckableItem.vue'

// Mock TechniqueText component since it has its own dependencies
vi.mock('@/components/TechniqueText.vue', () => ({
  default: {
    name: 'TechniqueText',
    props: ['text'],
    template: '<span>{{ text }}</span>'
  }
}))

describe('CheckableItem', () => {
  const defaultProps = {
    id: 'item-1',
    label: 'Test item label',
    checked: false
  }

  it('renders label text', () => {
    const wrapper = mount(CheckableItem, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('Test item label')
  })

  it('shows checked state when checked prop is true', () => {
    const wrapper = mount(CheckableItem, {
      props: {
        ...defaultProps,
        checked: true
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)

    // Also verify the label has the checked class
    const labelSpan = wrapper.find('.text-body')
    expect(labelSpan.classes()).toContain('checked')
  })

  it('emits toggle event when clicked', async () => {
    const wrapper = mount(CheckableItem, {
      props: defaultProps
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.trigger('change')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')!.length).toBe(1)
  })
})
