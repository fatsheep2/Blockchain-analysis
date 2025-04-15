import { createRouter, createWebHashHistory } from 'vue-router'
import App from '../App.vue'

const routes = [
  {
    path: '/',
    component: App,
    props: route => ({ startAddressAnalysis: route.params.address })
  },
  {
    path: '/:address',
    component: App,
    props: route => ({ startAddressAnalysis: route.params.address })
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router 