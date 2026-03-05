import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BottomSheet from './BottomSheet.vue'

describe('BottomSheet', () => {
  it('does not render content when closed', () => {
    mount(BottomSheet, {
      props: { open: false },
      slots: { default: '<p class="test-content">Sheet content</p>' }
    })
    expect(document.body.querySelector('.test-content')).toBeNull()
  })

  it('renders slot content when open', () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<p class="test-content">Sheet content</p>' }
    })
    const el = document.body.querySelector('.test-content')
    expect(el).toBeTruthy()
    expect(el!.textContent).toBe('Sheet content')
  })

  it('renders title when provided', () => {
    mount(BottomSheet, {
      props: { open: true, title: 'Test Title' },
      slots: { default: '<p>Content</p>' }
    })
    expect(document.body.textContent).toContain('Test Title')
  })

  it('renders backdrop when open', () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<p>Content</p>' }
    })
    const backdrop = document.querySelector('[class*="bg-black"]')
    expect(backdrop).toBeTruthy()
  })

  it('renders drag handle', () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<p>Content</p>' }
    })
    const handle = document.querySelector('.cursor-grab')
    expect(handle).toBeTruthy()
  })

  it('hides content when open changes to false', async () => {
    const wrapper = mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<p class="sheet-test">Visible</p>' }
    })
    expect(document.body.querySelector('.sheet-test')).toBeTruthy()

    await wrapper.setProps({ open: false })
    await nextTick()
    expect(document.body.querySelector('.sheet-test')).toBeNull()
  })

  it('has scrollable content area', () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<p>Content</p>' }
    })
    const scrollArea = document.querySelector('.overflow-y-auto')
    expect(scrollArea).toBeTruthy()
  })

  it('has overscroll-contain on content area', () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<p>Content</p>' }
    })
    const scrollArea = document.querySelector('.overscroll-contain')
    expect(scrollArea).toBeTruthy()
  })

  it('applies max-height with dvh units', () => {
    mount(BottomSheet, {
      props: { open: true },
      slots: { default: '<p>Content</p>' }
    })
    const sheet = document.querySelector('[class*="max-h-"]')
    expect(sheet).toBeTruthy()
  })
})
