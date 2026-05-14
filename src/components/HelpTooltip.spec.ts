import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelpTooltip from './HelpTooltip.vue'

/**
 * HelpTooltip — primitive for DRAFT-89 / F43.
 *
 * Covers reveal modalities (hover, focus, touch), dismiss paths
 * (mouseleave, blur, Escape, second-tap, outside-tap), ARIA wiring,
 * alignment + placement variants, and slot rendering.
 */
describe('HelpTooltip', () => {
  it('renders the slot trigger and the popover text', () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'Helpful explanation' },
      slots: { default: '<button data-testid="trigger">i</button>' },
    })

    expect(wrapper.find('[data-testid="trigger"]').exists()).toBe(true)
    expect(wrapper.find('[role="tooltip"]').text()).toBe('Helpful explanation')
  })

  it('starts closed (data-open="false")', () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'hi' },
      slots: { default: '<button>i</button>' },
    })
    expect(wrapper.find('[role="tooltip"]').attributes('data-open')).toBe('false')
    expect(wrapper.classes()).not.toContain('help-tooltip--open')
  })

  it('opens on hover (mouseenter) and closes on mouseleave', async () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'hover me' },
      slots: { default: '<button>i</button>' },
    })

    await wrapper.trigger('mouseenter')
    expect(wrapper.classes()).toContain('help-tooltip--open')
    expect(wrapper.find('[role="tooltip"]').attributes('data-open')).toBe('true')

    await wrapper.trigger('mouseleave')
    expect(wrapper.classes()).not.toContain('help-tooltip--open')
  })

  it('opens on keyboard focusin', async () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'focus me' },
      slots: { default: '<button>i</button>' },
    })

    await wrapper.trigger('focusin')
    expect(wrapper.classes()).toContain('help-tooltip--open')
  })

  it('closes on focusout when focus leaves the wrapper entirely', async () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'blur me' },
      slots: { default: '<button>i</button>' },
    })

    await wrapper.trigger('focusin')
    expect(wrapper.classes()).toContain('help-tooltip--open')

    // No relatedTarget → focus left the wrapper entirely.
    await wrapper.trigger('focusout', { relatedTarget: null })
    expect(wrapper.classes()).not.toContain('help-tooltip--open')
  })

  it('Escape closes an open tooltip', async () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'esc me' },
      slots: { default: '<button>i</button>' },
    })

    await wrapper.trigger('mouseenter')
    expect(wrapper.classes()).toContain('help-tooltip--open')

    await wrapper.trigger('keydown', { key: 'Escape' })
    expect(wrapper.classes()).not.toContain('help-tooltip--open')
  })

  it('wires aria-describedby from trigger host to tooltip id', () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'a11y' },
      slots: { default: '<button>i</button>' },
    })

    const trigger = wrapper.find('.help-tooltip-trigger')
    const tooltip = wrapper.find('[role="tooltip"]')
    const describedBy = trigger.attributes('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(tooltip.attributes('id')).toBe(describedBy)
  })

  it('honors a custom explicit id', () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'custom', id: 'my-tip' },
      slots: { default: '<button>i</button>' },
    })

    expect(wrapper.find('[role="tooltip"]').attributes('id')).toBe('my-tip')
    expect(wrapper.find('.help-tooltip-trigger').attributes('aria-describedby')).toBe('my-tip')
  })

  it('applies alignment modifier classes', () => {
    const left = mount(HelpTooltip, {
      props: { text: 'L', align: 'left' },
      slots: { default: '<span>i</span>' },
    })
    expect(left.classes()).toContain('help-tooltip--align-left')

    const right = mount(HelpTooltip, {
      props: { text: 'R', align: 'right' },
      slots: { default: '<span>i</span>' },
    })
    expect(right.classes()).toContain('help-tooltip--align-right')

    const center = mount(HelpTooltip, {
      props: { text: 'C' },
      slots: { default: '<span>i</span>' },
    })
    expect(center.classes()).toContain('help-tooltip--align-center')
  })

  it('applies placement modifier classes', () => {
    const top = mount(HelpTooltip, {
      props: { text: 't' },
      slots: { default: '<span>i</span>' },
    })
    expect(top.classes()).toContain('help-tooltip--placement-top')

    const bottom = mount(HelpTooltip, {
      props: { text: 'b', placement: 'bottom' },
      slots: { default: '<span>i</span>' },
    })
    expect(bottom.classes()).toContain('help-tooltip--placement-bottom')
  })

  it('touch tap toggles open then closed', async () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'tap me' },
      slots: { default: '<button>i</button>' },
    })

    // First tap → open.
    await wrapper.trigger('pointerdown', { pointerType: 'touch' })
    expect(wrapper.classes()).toContain('help-tooltip--open')

    // Second tap → close.
    await wrapper.trigger('pointerdown', { pointerType: 'touch' })
    expect(wrapper.classes()).not.toContain('help-tooltip--open')
  })

  it('mouse pointerdown does not trigger tap-toggle', async () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'mouse only' },
      slots: { default: '<button>i</button>' },
    })

    await wrapper.trigger('pointerdown', { pointerType: 'mouse' })
    expect(wrapper.classes()).not.toContain('help-tooltip--open')
  })

  it('outside pointerdown dismisses a tap-revealed tooltip', async () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'tap me' },
      slots: { default: '<button>i</button>' },
      attachTo: document.body,
    })

    await wrapper.trigger('pointerdown', { pointerType: 'touch' })
    expect(wrapper.classes()).toContain('help-tooltip--open')

    // Simulate outside tap via a real event so capture-phase listener fires.
    const evt = new PointerEvent('pointerdown', { bubbles: true })
    document.body.dispatchEvent(evt)
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).not.toContain('help-tooltip--open')

    wrapper.unmount()
  })

  it('renders complex slot content (icons + text)', () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'complex' },
      slots: {
        default: '<span class="icon">⚠</span><span>label</span>',
      },
    })

    expect(wrapper.text()).toContain('label')
    expect(wrapper.find('.icon').exists()).toBe(true)
  })

  it('stays open while mouse is over and focus is held simultaneously', async () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'sticky' },
      slots: { default: '<button>i</button>' },
    })

    await wrapper.trigger('mouseenter')
    await wrapper.trigger('focusin')
    expect(wrapper.classes()).toContain('help-tooltip--open')

    // Mouseleave alone shouldn't close while focus is held.
    await wrapper.trigger('mouseleave')
    expect(wrapper.classes()).toContain('help-tooltip--open')

    // Now blur — popover closes.
    await wrapper.trigger('focusout', { relatedTarget: null })
    expect(wrapper.classes()).not.toContain('help-tooltip--open')
  })

  it('keeps tooltip open when focusout relatedTarget is inside the wrapper', async () => {
    const wrapper = mount(HelpTooltip, {
      props: { text: 'nested' },
      slots: {
        default: '<button class="outer">o</button><button class="inner">i</button>',
      },
    })

    await wrapper.trigger('focusin')
    expect(wrapper.classes()).toContain('help-tooltip--open')

    const inner = wrapper.find('.inner').element
    await wrapper.trigger('focusout', { relatedTarget: inner })
    expect(wrapper.classes()).toContain('help-tooltip--open')
  })
})
