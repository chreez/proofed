import { describe, it, expect } from 'vitest'
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

    expect(wrapper.text()).toContain('First note')
    expect(wrapper.text()).toContain('Second note')
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('v0.9.0')
  })

  it('shows next_time section when present', () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('Next Time')
    expect(wrapper.text()).toContain('Try this next time')
  })

  it('hides next_time section when empty', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).not.toContain('Next Time')
  })

  it('renders markdown formatting in notes', () => {
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

    expect(wrapper.text()).toContain('Next Time')
    expect(wrapper.text()).toContain('Try this')
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

    expect(wrapper.text()).toContain('A note')
    expect(wrapper.text()).not.toContain('Next Time')
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

    // The formatDate function should produce a readable date
    // The exact format depends on locale, but should contain year/month/day info
    expect(wrapper.text()).toContain('2026')
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

  it('renders hero photo as clickable image (not link)', () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    const heroImg = wrapper.find('.gallery-figure img')
    expect(heroImg.exists()).toBe(true)
    // Should NOT be wrapped in an <a> tag
    expect(wrapper.find('.gallery-figure a').exists()).toBe(false)
  })

  it('renders supporting photo thumbnails', () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    // 3 photos total: 2 supporting + 1 hero
    const thumbs = wrapper.findAll('.flex.gap-2 img')
    expect(thumbs).toHaveLength(2)
  })

  it('opens lightbox when hero photo is clicked', async () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    const heroImg = wrapper.find('.gallery-figure img')
    await heroImg.trigger('click')
    // PhotoLightbox should now be open (teleported to body)
    const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
    expect(lightbox.props('open')).toBe(true)
    expect(lightbox.props('initialIndex')).toBe(2) // hero = last photo
  })

  it('opens lightbox when supporting photo is clicked', async () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    const thumbs = wrapper.findAll('.flex.gap-2 img')
    await thumbs[0].trigger('click')
    const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
    expect(lightbox.props('open')).toBe(true)
    expect(lightbox.props('initialIndex')).toBe(0)
  })

  it('closes lightbox on close event', async () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    // Open it first
    const heroImg = wrapper.find('.gallery-figure img')
    await heroImg.trigger('click')
    // Close it
    const lightbox = wrapper.findComponent({ name: 'PhotoLightbox' })
    lightbox.vm.$emit('close')
    await wrapper.vm.$nextTick()
    expect(lightbox.props('open')).toBe(false)
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
