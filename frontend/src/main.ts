import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { useAuthStore } from './stores/auth'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 初始化认证状态，然后再注册路由和挂载应用
const authStore = useAuthStore()
authStore.initAuth().finally(() => {
  app.use(router)
  app.mount('#app')
})
