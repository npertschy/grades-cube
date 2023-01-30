import App from '@/App.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      redirect: {}
    },
    {
      path: '/management',
      name: 'Management',
      component: App
    }
  ]
})

export default router
