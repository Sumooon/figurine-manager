import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue')
    },
    {
      path: '/figurines',
      name: 'Figurines',
      component: () => import('@/views/FigurineList.vue')
    },
    {
      path: '/batches',
      name: 'Batches',
      component: () => import('@/views/BatchManage.vue')
    },
    {
      path: '/trades',
      name: 'Trades',
      component: () => import('@/views/TradeRecords.vue')
    },
    {
      path: '/tags',
      name: 'Tags',
      component: () => import('@/views/TagManage.vue')
    }
  ]
})

export default router