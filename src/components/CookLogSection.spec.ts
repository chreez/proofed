import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CookLogSection from './CookLogSection.vue'

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

  it('renders entries collapsed by default', () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    // Should show note count (collapsed state)
    expect(wrapper.text()).toContain('2 notes')
    // Should NOT show full note text in collapsed state
    expect(wrapper.text()).not.toContain('Note 1')
  })

  it('expands entry on click to show full notes', async () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    // Click to expand
    const entry = wrapper.find('.cursor-pointer')
    await entry.trigger('click')

    // Now should show notes
    expect(wrapper.text()).toContain('Note 1')
    expect(wrapper.text()).toContain('Note 2')
  })

  it('shows next_time section when expanded', async () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    // Click to expand
    const entry = wrapper.find('.cursor-pointer')
    await entry.trigger('click')

    expect(wrapper.text()).toContain('Next Time')
    expect(wrapper.text()).toContain('Try this next time')
  })

  it('collapses entry on second click', async () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    const entry = wrapper.find('.cursor-pointer')

    // Expand
    await entry.trigger('click')
    expect(wrapper.text()).toContain('Note 1')

    // Collapse
    await entry.trigger('click')
    expect(wrapper.text()).not.toContain('Note 1')
    expect(wrapper.text()).toContain('2 notes')
  })

  it('renders all cook log entries collapsed', () => {
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

    // Both entries show version badges in collapsed state
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('v0.9.0')
    // Notes should NOT be visible (collapsed)
    expect(wrapper.text()).not.toContain('First note')
    expect(wrapper.text()).not.toContain('Second note')
  })

  it('renders markdown formatting in notes when expanded', async () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['**Bold text** and *italic*'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Expand
    await wrapper.find('.cursor-pointer').trigger('click')

    expect(wrapper.html()).toContain('<strong>Bold text</strong>')
    expect(wrapper.html()).toContain('<em>italic</em>')
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

    // Collapsed state should show counts
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

  it('shows summary text in collapsed state when present', () => {
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

  it('shows no-photo fallback in collapsed state when entry has no photos', () => {
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

    // No hero banner — should use text-only fallback
    expect(wrapper.find('.h-36').exists()).toBe(false)
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('A summary.')
    expect(wrapper.text()).toContain('1 notes')
  })

  it('shows permalink button in expanded state', async () => {
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

    await wrapper.find('.cursor-pointer').trigger('click')

    const permalinkBtn = wrapper.find('button[title="Copy link"]')
    expect(permalinkBtn.exists()).toBe(true)
  })

  it('does not toggle collapse when permalink button is clicked', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    })

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

    // Expand
    await wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.text()).toContain('Note')

    // Click permalink button — should NOT collapse (stopPropagation)
    const permalinkBtn = wrapper.find('button[title="Copy link"]')
    await permalinkBtn.trigger('click')
    // Still expanded
    expect(wrapper.text()).toContain('Note')
  })

  it('copies entry permalink and shows feedback when entry link button is clicked', async () => {
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

    // Expand
    await wrapper.find('.cursor-pointer').trigger('click')

    // Click the entry-level permalink IconButton
    const entryLinkBtns = wrapper.findAll('button[title="Copy link"]')
    // Second "Copy link" button is the entry-level one (first is section header)
    await entryLinkBtns[1].trigger('click')

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('#bake-2026-02-05')
    )
  })

  it('renders entry permalink as IconButton with feedback slot', async () => {
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

    await wrapper.find('.cursor-pointer').trigger('click')

    // Should have 2 IconButton instances: section header + entry
    const iconBtns = wrapper.findAllComponents({ name: 'IconButton' })
    expect(iconBtns.length).toBeGreaterThanOrEqual(2)
  })

  it('hides next_time count in collapsed state when not present', () => {
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

  it('auto-expands entry matching URL hash on mount', async () => {
    // Set hash before mounting
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, hash: '#bake-2026-02-05' }
    })

    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Auto-expanded note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Entry should be auto-expanded
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Auto-expanded note')

    // Reset
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, hash: '' }
    })
  })

  it('does not auto-expand when hash does not match any entry', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, hash: '#bake-2099-01-01' }
    })

    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Should stay collapsed']
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Should remain collapsed — no matching date
    expect(wrapper.text()).not.toContain('Should stay collapsed')
    expect(wrapper.text()).toContain('1 notes')

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, hash: '' }
    })
  })

  it('stays collapsed when hash is not a bake permalink', () => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, hash: '#cook-log-section' }
    })

    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Should stay collapsed']
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).not.toContain('Should stay collapsed')

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, hash: '' }
    })
  })

  it('shows summary in collapsed state with photo banner', () => {
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

  it('renders next_time source attribution when expanded', async () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          next_time: [{ text: 'Try X', source: 'ATK' }]
        }],
        sectionId: 'cook-log-section'
      }
    })

    await wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.text()).toContain('Try X')
    expect(wrapper.html()).toContain('(ATK)')
  })

  it('shows next_time count in collapsed state with photos', () => {
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

describe('Photo lightbox', () => {
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

  it('shows hero banner in collapsed state', () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    // Hero is last photo (Photo C) shown as banner
    const bannerImg = wrapper.find('.h-36')
    expect(bannerImg.exists()).toBe(true)
    expect(bannerImg.attributes('alt')).toBe('Photo C')
  })

  it('shows photo count in collapsed state', () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    expect(wrapper.text()).toContain('3 photos')
  })

  it('renders hero photo when expanded', async () => {
    const wrapper = mount(CookLogSection, { props: photosProps })

    // Expand
    await wrapper.find('.cursor-pointer').trigger('click')

    const heroImg = wrapper.find('.gallery-figure img')
    expect(heroImg.exists()).toBe(true)
  })

  it('renders supporting photo thumbnails when expanded', async () => {
    const wrapper = mount(CookLogSection, { props: photosProps })

    // Expand
    await wrapper.find('.cursor-pointer').trigger('click')

    // 3 photos total: 2 supporting + 1 hero
    const thumbs = wrapper.findAll('.flex.gap-2 img')
    expect(thumbs).toHaveLength(2)
  })

  it('opens lightbox when hero photo is clicked in expanded state', async () => {
    const wrapper = mount(CookLogSection, { props: photosProps })

    // Expand first
    await wrapper.find('.cursor-pointer').trigger('click')

    // Click hero image
    const heroImg = wrapper.find('.gallery-figure img')
    await heroImg.trigger('click')

    const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
    expect(lightbox.props('open')).toBe(true)
    expect(lightbox.props('initialIndex')).toBe(0) // hero reordered to front
    // Verify photos are reordered: hero (C) first, then supporting (A, B)
    const photos = lightbox.props('photos')
    expect(photos[0].alt).toBe('Photo C')
    expect(photos[1].alt).toBe('Photo A')
    expect(photos[2].alt).toBe('Photo B')
  })

  it('opens lightbox when supporting photo is clicked in expanded state', async () => {
    const wrapper = mount(CookLogSection, { props: photosProps })

    // Expand first
    await wrapper.find('.cursor-pointer').trigger('click')

    const thumbs = wrapper.findAll('.flex.gap-2 img')
    await thumbs[0].trigger('click')
    const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
    expect(lightbox.props('open')).toBe(true)
    expect(lightbox.props('initialIndex')).toBe(0)
  })

  it('closes lightbox on close event', async () => {
    const wrapper = mount(CookLogSection, { props: photosProps })

    // Expand first
    await wrapper.find('.cursor-pointer').trigger('click')

    // Open lightbox
    const heroImg = wrapper.find('.gallery-figure img')
    await heroImg.trigger('click')

    // Close it
    const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
    lightbox.vm.$emit('close')
    await wrapper.vm.$nextTick()
    expect(lightbox.props('open')).toBe(false)
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

  it('shows cost one-liner in collapsed no-photo card when entry.cost exists', () => {
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

  it('shows cost one-liner in collapsed photo card when entry.cost exists', () => {
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

  it('shows cost one-liner in expanded state when entry.cost exists', async () => {
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

    await wrapper.find('.cursor-pointer').trigger('click')

    expect(wrapper.text()).toContain('$1.29 total')
    expect(wrapper.text()).toContain('$1.29/serving')
  })

  it('hides cost line when no cost data in collapsed state', () => {
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

  it('hides cost line when no cost data in expanded state', async () => {
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

    await wrapper.find('.cursor-pointer').trigger('click')

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
