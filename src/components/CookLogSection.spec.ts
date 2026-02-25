import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CookLogSection from './CookLogSection.vue'

// Mock vue-router
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('CookLogSection', () => {
  const defaultProps = {
    cookLog: [{
      date: '2026-02-05',
      version: 'v1.0.0',
      notes: ['Note 1', 'Note 2'],
      next_time: [{ text: 'Try this next time' }]
    }],
    sectionId: 'cook-log-section'
  }

  it('renders section title', () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    expect(wrapper.find('h3').text()).toBe('Cook Log')
  })

  it('renders entries with stats in card view', () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    // Should show note count
    expect(wrapper.text()).toContain('2 notes')
    // Should NOT show full note text (notes only on bake detail page now)
    expect(wrapper.text()).not.toContain('Note 1')
  })

  it('renders all cook log entries', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [
          {
            date: '2026-02-05',
            version: 'v1.0.0',
            notes: ['First note'],
            next_time: []
          },
          {
            date: '2026-02-04',
            version: 'v0.9.0',
            notes: ['Second note'],
            next_time: []
          }
        ],
        sectionId: 'cook-log-section'
      }
    })

    // Both entries show version badges
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('v0.9.0')
    // Notes should NOT be visible (only on bake detail page)
    expect(wrapper.text()).not.toContain('First note')
    expect(wrapper.text()).not.toContain('Second note')
  })

  it('handles entry with empty notes array', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: [],
          next_time: [{ text: 'Try this' }]
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Should show counts
    expect(wrapper.text()).toContain('0 notes')
    expect(wrapper.text()).toContain('1 next-time')
  })

  it('handles entry with undefined next_time', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['A note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Should not show next-time count
    expect(wrapper.text()).not.toContain('next-time')
  })

  it('formats dates correctly', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('2026')
  })

  it('shows end date only when start_date differs from date', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-20',
          start_date: '2026-02-19',
          version: 'v2.0.0',
          notes: ['Multi-day'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Always shows end date, never a range
    expect(wrapper.text()).toContain('2026-02-20')
    expect(wrapper.text()).not.toContain('Feb 19\u201320')
  })

  it('shows "since" in in-progress badge when start_date exists', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-20',
          start_date: '2026-02-19',
          version: 'v2.0.0',
          status: 'in_progress' as const,
          notes: ['In progress bake'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('In Progress (since Feb 19)')
  })

  it('shows plain "In Progress" when no start_date on in-progress entry', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-20',
          version: 'v2.0.0',
          status: 'in_progress' as const,
          notes: ['In progress bake'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.text()).not.toContain('since')
  })

  it('shows standard date when start_date is absent', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Should show full date with weekday, not range
    expect(wrapper.text()).toContain('2026-02-05')
  })

  it('shows summary text when present', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'First bake went great. Dough was perfect.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('First bake went great')
  })

  it('renders gracefully when summary is missing (AC#6)', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1', 'Note 2']
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Should still show date + version + counts without summary
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('2 notes')
  })

  it('assigns bake permalink IDs to entries', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.find('#bake-2026-02-05').exists()).toBe(true)
  })

  it('shows no thumbnail when entry has no photos', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1'],
          summary: 'A summary.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    // No thumbnail — card without photo
    expect(wrapper.find('.w-20').exists()).toBe(false)
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('A summary.')
    expect(wrapper.text()).toContain('1 notes')
  })

  it('hides next_time count when not present', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          photos: [
            { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'A' }
          ]
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).not.toContain('next-time')
  })

  it('copies section permalink when header link button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Click the button inside the IconButton component
    const iconBtn = wrapper.findComponent({ name: 'IconButton' })
    await iconBtn.find('button').trigger('click')

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('#cook-log-section')
    )
  })

  it('shows summary with photo banner', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'Great bake this time.',
          photos: [
            { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'A' }
          ]
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('Great bake this time.')
  })

  it('shows next_time count with photos', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          next_time: [{ text: 'Try X' }, { text: 'Try Y' }],
          photos: [
            { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'A' }
          ]
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('2 next-time')
  })
})

describe('Summary expand', () => {
  it('summary starts with line-clamp-2 class', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'A long summary that could be truncated.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    const summary = wrapper.find('.text-sm.text-stone-500')
    expect(summary.classes()).toContain('line-clamp-2')
  })

  it('removes line-clamp-2 when summary is clicked', async () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'A long summary that could be truncated.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    const summary = wrapper.find('.text-sm.text-stone-500')
    await summary.trigger('click')

    expect(summary.classes()).not.toContain('line-clamp-2')
  })

  it('re-applies line-clamp-2 on second click', async () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'A long summary that could be truncated.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    const summary = wrapper.find('.text-sm.text-stone-500')
    await summary.trigger('click')
    await summary.trigger('click')

    expect(summary.classes()).toContain('line-clamp-2')
  })

  it('summary has cursor-pointer class', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'A summary.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    const summary = wrapper.find('.text-sm.text-stone-500')
    expect(summary.classes()).toContain('cursor-pointer')
  })
})

describe('Bake detail link', () => {
  it('shows "View bake" link when recipeId is provided', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section',
        recipeId: 'test-recipe'
      }
    })

    expect(wrapper.text()).toContain('View bake')
  })

  it('does not show "View bake" link when recipeId is not provided', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).not.toContain('View bake')
  })

  it('navigates to bake detail page when "View bake" is clicked', async () => {
    mockPush.mockClear()

    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section',
        recipeId: 'test-recipe'
      }
    })

    const viewBakeLink = wrapper.find('.ml-auto.flex.items-center')
    await viewBakeLink.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/recipe/test-recipe/bake/2026-02-05')
  })
})

describe('Photo thumbnail', () => {
  const photosProps = {
    cookLog: [{
      date: '2026-02-05',
      version: 'v1.0.0',
      notes: ['Note'],
      photos: [
        { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'Photo A' },
        { src: '/img/b-800.webp', thumb: '/img/b-400.webp', alt: 'Photo B' },
        { src: '/img/c-800.webp', thumb: '/img/c-400.webp', alt: 'Photo C' }
      ]
    }],
    sectionId: 'cook-log-section'
  }

  it('shows hero thumbnail when entry has photos', () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    // Hero is last photo (Photo C) shown as small thumbnail
    const thumbImg = wrapper.find('.w-20')
    expect(thumbImg.exists()).toBe(true)
    expect(thumbImg.attributes('alt')).toBe('Photo C')
  })

  it('shows photo count', () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    expect(wrapper.text()).toContain('3 photos')
  })
})

describe('Cost one-liner', () => {
  const costData = {
    total: 1.29,
    perServing: 1.29,
    servings: 1,
    items: [
      { ingredientId: 'flour', name: 'Flour', sourceType: 'heb' as const, sourceName: 'KA', amount: 500, unit: 'g', cost: 1.23 }
    ]
  }

  it('shows cost one-liner when entry.cost exists', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          cost: costData
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('$1.29 total')
    expect(wrapper.text()).toContain('$1.29/serving')
  })

  it('shows cost one-liner with photo card when entry.cost exists', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          photos: [
            { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'A' }
          ],
          cost: costData
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('$1.29 total')
    expect(wrapper.text()).toContain('$1.29/serving')
  })

  it('hides cost line when no cost data', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).not.toContain('total')
    expect(wrapper.text()).not.toContain('/serving')
  })
})

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1', 'Note 2'],
          next_time: [{ text: 'Try this next time' }]
        }],
        sectionId: 'cook-log-section'
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
