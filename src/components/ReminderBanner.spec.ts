import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ReminderBanner from './ReminderBanner.vue'

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  Bell: { name: 'Bell', template: '<svg class="bell-icon" />' },
  X: { name: 'X', template: '<svg class="x-icon" />' }
}))

const defaultReminders = [
  { prompt: 'Weigh the dough', type: 'measurement' as const },
  { prompt: 'How does it look?', type: 'observation' as const }
]

function defaultProps(overrides: Partial<{
  isReminderDismissed: (stepId: string, prompt: string) => boolean
}> = {}) {
  return {
    stepId: 'mix-dough',
    stepTitle: 'Mix Dough',
    reminders: defaultReminders,
    isReminderDismissed: overrides.isReminderDismissed ?? (() => false)
  }
}

describe('ReminderBanner', () => {
  describe('rendering', () => {
    it('renders all non-dismissed reminders', () => {
      const wrapper = mount(ReminderBanner, { props: defaultProps() })

      expect(wrapper.text()).toContain('Weigh the dough')
      expect(wrapper.text()).toContain('How does it look?')
    })

    it('shows reminder label', () => {
      const wrapper = mount(ReminderBanner, { props: defaultProps() })

      expect(wrapper.text()).toContain('reminder')
    })

    it('shows reminder type badge', () => {
      const wrapper = mount(ReminderBanner, { props: defaultProps() })

      expect(wrapper.text()).toContain('measurement')
      expect(wrapper.text()).toContain('observation')
    })

    it('renders bell icon', () => {
      const wrapper = mount(ReminderBanner, { props: defaultProps() })

      expect(wrapper.findAll('.bell-icon').length).toBeGreaterThan(0)
    })

    it('renders X dismiss button for each reminder', () => {
      const wrapper = mount(ReminderBanner, { props: defaultProps() })

      // Each reminder should have a dismiss button with X icon
      expect(wrapper.findAll('.x-icon').length).toBe(2)
    })

    it('shows input with appropriate placeholder for measurement type', () => {
      const wrapper = mount(ReminderBanner, {
        props: defaultProps()
      })

      const inputs = wrapper.findAll('input')
      const measurementInput = inputs[0]
      expect(measurementInput.attributes('placeholder')).toBe('e.g. 748g')
    })

    it('shows input with appropriate placeholder for observation type', () => {
      const wrapper = mount(ReminderBanner, {
        props: defaultProps()
      })

      const inputs = wrapper.findAll('input')
      const observationInput = inputs[1]
      expect(observationInput.attributes('placeholder')).toBe('Your observation...')
    })

    it('shows rating placeholder for rating type', () => {
      const wrapper = mount(ReminderBanner, {
        props: {
          ...defaultProps(),
          reminders: [{ prompt: 'Rate it', type: 'rating' as const }]
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('good / ok / bad')
    })

    it('shows default placeholder when type is undefined', () => {
      const wrapper = mount(ReminderBanner, {
        props: {
          ...defaultProps(),
          reminders: [{ prompt: 'Any notes?' }]
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('Your observation...')
    })

    it('does not show type badge when type is undefined', () => {
      const wrapper = mount(ReminderBanner, {
        props: {
          ...defaultProps(),
          reminders: [{ prompt: 'Any notes?' }]
        }
      })

      // Should have "reminder" label but no type badge
      expect(wrapper.text()).toContain('reminder')
      // Only 1 span with font-mono text-[10px] in header area (the label)
      // No type badge rendered
      const spans = wrapper.findAll('span')
      const typeBadge = spans.filter(s => s.classes().includes('border'))
      expect(typeBadge).toHaveLength(0)
    })
  })

  describe('dismissed reminders', () => {
    it('hides dismissed reminders', () => {
      const wrapper = mount(ReminderBanner, {
        props: defaultProps({
          isReminderDismissed: (_stepId: string, prompt: string) => prompt === 'Weigh the dough'
        })
      })

      expect(wrapper.text()).not.toContain('Weigh the dough')
      expect(wrapper.text()).toContain('How does it look?')
    })

    it('hides all reminders when all dismissed', () => {
      const wrapper = mount(ReminderBanner, {
        props: defaultProps({
          isReminderDismissed: () => true
        })
      })

      expect(wrapper.text()).not.toContain('Weigh the dough')
      expect(wrapper.text()).not.toContain('How does it look?')
    })
  })

  describe('dismiss interaction', () => {
    it('emits dismiss when X button clicked', async () => {
      const wrapper = mount(ReminderBanner, { props: defaultProps() })

      // Find dismiss buttons (contain X icon)
      const dismissBtns = wrapper.findAll('button').filter(b => b.find('.x-icon').exists())
      await dismissBtns[0].trigger('click')

      expect(wrapper.emitted('dismiss')).toBeTruthy()
      expect(wrapper.emitted('dismiss')![0]).toEqual(['mix-dough', 'Weigh the dough'])
    })
  })

  describe('respond interaction', () => {
    it('emits respond when Log button clicked with value', async () => {
      const wrapper = mount(ReminderBanner, { props: defaultProps() })

      // Type value into first input
      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('748g')

      // Click the first Log button
      const logBtns = wrapper.findAll('button').filter(b => b.text() === 'Log')
      await logBtns[0].trigger('click')

      expect(wrapper.emitted('respond')).toBeTruthy()
      expect(wrapper.emitted('respond')![0]).toEqual(['mix-dough', 'Weigh the dough', '748g'])
    })

    it('does not emit respond when value is empty', async () => {
      const wrapper = mount(ReminderBanner, { props: defaultProps() })

      // Click Log without typing
      const logBtns = wrapper.findAll('button').filter(b => b.text() === 'Log')
      await logBtns[0].trigger('click')

      expect(wrapper.emitted('respond')).toBeFalsy()
    })

    it('emits respond on Enter key in input', async () => {
      const wrapper = mount(ReminderBanner, { props: defaultProps() })

      const inputs = wrapper.findAll('input')
      await inputs[0].setValue('748g')
      await inputs[0].trigger('keydown.enter')

      expect(wrapper.emitted('respond')).toBeTruthy()
      expect(wrapper.emitted('respond')![0]).toEqual(['mix-dough', 'Weigh the dough', '748g'])
    })
  })
})
