import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import { createRouter, createWebHistory } from 'vue-router'

// 创建路由实例
const router = createRouter({
  history: createWebHistory('/Blockchain-analysis/'),
  routes: [
    {
      path: '/',
      component: App
    },
    {
      path: '/:address',
      component: App
    }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
