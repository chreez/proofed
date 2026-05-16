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
      path: '/bake-log',
      name: 'bake-log',
      component: EmptyRouteView,
      meta: { showIndex: false }
    },
    {
      path: '/recipe/:recipeId',
      name: 'recipe',
      component: EmptyRouteView,
      meta: { showIndex: false }
    },
    {
      path: '/recipe/:recipeId/bake/:date',
      name: 'bake-detail',
      component: EmptyRouteView,
      meta: { showIndex: false, bakeDetail: true }
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
      path: '/review/bake/:recipeId/:date',
      name: 'bake-review',
      component: EmptyRouteView,
      meta: { showIndex: false }
    },
    {
      path: '/demo/qr-test',
      name: 'qr-test-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/shared-mode',
      name: 'shared-mode-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/qr-print-test',
      name: 'qr-print-test-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/scratchpad',
      name: 'scratchpad-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/cost-picker',
      name: 'cost-picker-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/cost-render',
      name: 'cost-render-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/bake-log-photos',
      name: 'bake-log-photos-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/stats-block',
      name: 'stats-block-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/bake-stats-shapes',
      name: 'bake-stats-shapes-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/qr-label-variants',
      name: 'qr-label-variants-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/state-note-tables',
      name: 'state-note-tables-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/recipe-printout',
      name: 'recipe-printout-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/demo/print-nav',
      name: 'print-nav-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, demoPage: true }
    },
    {
      path: '/recipe/:recipeId/print',
      name: 'recipe-print',
      component: EmptyRouteView,
      meta: { showIndex: false, printMode: true }
    },
    {
      path: '/stats',
      name: 'stats',
      component: EmptyRouteView,
      meta: { showIndex: false, showStats: true }
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: EmptyRouteView,
      meta: { showIndex: false, showPricing: true }
    },
    {
      path: '/production',
      name: 'production',
      component: EmptyRouteView,
      meta: { showIndex: false, showProduction: true }
    },
    {
      path: '/labels',
      name: 'labels',
      component: EmptyRouteView,
      meta: { showIndex: false, showLabels: true }
    },
    {
      path: '/sales',
      name: 'sales',
      component: EmptyRouteView,
      meta: { showIndex: false, showSales: true }
    },
    {
      path: '/demo/stats',
      name: 'stats-demo',
      component: EmptyRouteView,
      meta: { showIndex: false, showStats: true }
    },
  ]
})

export default router
