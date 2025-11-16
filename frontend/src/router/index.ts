import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types/common'
import { authGuard } from './guards'

// 懒加载组件
const MainLayout = () => import('@/components/layouts/MainLayout.vue')
const Login = () => import('@/views/auth/Login.vue')
const Dashboard = () => import('@/views/dashboard/Dashboard.vue')
const UserManagement = () => import('@/views/users/Users.vue')
const ClassManagement = () => import('@/views/classes/ClassManagement.vue')
const ClassDetail = () => import('@/views/classes/ClassDetail.vue')
const StudentManagement = () => import('@/views/students/StudentManagement.vue')
const FormManagement = () => import('@/views/forms/Forms.vue')
const RecordManagement = () => import('@/views/records/Records.vue')
const Statistics = () => import('@/views/statistics/Statistics.vue')
const About = () => import('@/views/about/About.vue')

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      title: '登录'
    }
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: '控制台'
        }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
          roles: [UserRole.ADMIN],
          title: '用户管理'
        }
      },
      {
        path: 'classes',
        name: 'ClassManagement',
        component: ClassManagement,
        meta: {
          roles: [UserRole.ADMIN, UserRole.TEACHER],
          title: '班级管理'
        }
      },
      {
        path: 'classes/:id',
        name: 'ClassDetail',
        component: ClassDetail,
        meta: {
          roles: [UserRole.ADMIN, UserRole.TEACHER],
          title: '班级详情'
        }
      },
      {
        path: 'students',
        name: 'StudentManagement',
        component: StudentManagement,
        meta: {
          roles: [UserRole.ADMIN, UserRole.TEACHER],
          title: '学生管理'
        }
      },
      {
        path: 'forms',
        name: 'FormManagement',
        component: FormManagement,
        meta: {
          roles: [UserRole.ADMIN, UserRole.TEACHER],
          title: '表单管理'
        }
      },
      {
        path: 'records',
        name: 'RecordManagement',
        component: RecordManagement,
        meta: {
          title: '数据录入'
        }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: Statistics,
        meta: {
          roles: [UserRole.ADMIN, UserRole.TEACHER],
          title: '统计分析'
        }
      },
      {
        path: 'about',
        name: 'About',
        component: About,
        meta: {
          title: '关于我们'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 应用路由守卫
router.beforeEach(authGuard)

// 设置页面标题
router.afterEach((to) => {
  const appTitle = import.meta.env.VITE_APP_TITLE || '学校体测数据管理系统'
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - ${appTitle}`
  } else {
    document.title = appTitle
  }
})

export default router
