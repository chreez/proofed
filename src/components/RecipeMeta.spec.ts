import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipeMeta from './RecipeMeta.vue'

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(RecipeMeta, {
      props: {
        recipe: {
          meta: {
            name: 'Quick Cinnamon Buns',
            source: "America's Test Kitchen",
            yields: '8 buns',
            total_time: '~1.5 hours'
          },
          config: { early_check_percent: 75 },
          vessels: [],
          stages: [
            {
              id: 'prep',
              title: 'Prep',
              gather: {
                ingredients: [
                  { id: 'flour', name: 'All-purpose flour', total: 390, unit: 'g', breakdown: null }
                ]
              },
              states: ['mix']
            }
          ],
          states: [
            {
              id: 'mix',
              title: 'Mix Dough',
              direction: 'Combine dry ingredients',
              components: null,
              exit_condition: 'Dough comes together',
              notes: null
            }
          ],
          version: 'v1.0.0'
        }
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
