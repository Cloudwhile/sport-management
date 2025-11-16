import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // 侧边栏是否收缩
  const sidebarCollapsed = ref(false)

  // 切换侧边栏状态
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    // 保存到 localStorage
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }

  // 设置侧边栏状态
  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }

  // 从 localStorage 恢复状态
  const restoreSidebarState = () => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      sidebarCollapsed.value = saved === 'true'
    }
  }

  return {
    sidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    restoreSidebarState
  }
})
