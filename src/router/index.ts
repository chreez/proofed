import { createRouter, createWebHistory } from 'vue-router'
import { defineComponent, h } from 'vue'

// Dummy component - App.vue handles all rendering based on route
const EmptyRouteView = defineComponent({
  render: () => h('div')
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'index',
      component: EmptyRouteView,
      meta: { showIndex: true }
    },
    {
      path: '/recipe/:recipeId',
      name: 'recipe',
      component: EmptyRouteView,
      meta: { showIndex: false }
    }
  ]
})

export default router
