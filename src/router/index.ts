import { createRouter, createWebHistory } from 'vue-router'
import { defineComponent, h } from 'vue'

// Dummy component - App.vue handles all rendering based on route
const EmptyRouteView = defineComponent({
  render: () => h('div')
})

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    // When a hash is present, skip the automatic scroll-to-top.
    // The App.vue watcher handles hash scrolling after recipe DOM mounts.
    if (to.hash) {
      return false
    }
    return { top: 0 }
  },
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
    },
    {
      path: '/about',
      name: 'about',
      component: EmptyRouteView,
      meta: { showIndex: false }
    },
    {
      path: '/review/photos/:recipeId/:date',
      name: 'photo-review',
      component: EmptyRouteView,
      meta: { showIndex: false }
    },
    {
      path: '/demo/agent-notes',
      name: 'demo-agent-notes',
      component: EmptyRouteView,
      meta: { showIndex: false }
    }
  ]
})

export default router
