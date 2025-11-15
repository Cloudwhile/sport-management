import { createRouter, createWebHistory } from 'vue-router';
import { getMe } from '@/api/auth';
import { useUserStore } from '@/stores/user';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'students',
        name: 'StudentManage',
        component: () => import('@/views/admin/students/Index.vue'),
        meta: { title: '学生管理' },
      },
      {
        path: 'classes',
        name: 'ClassManage',
        component: () => import('@/views/admin/classes/Index.vue'),
        meta: { title: '班级管理' },
      },
      {
        path: 'grades',
        name: 'GradeManage',
        component: () => import('@/views/admin/grades/Index.vue'),
        meta: { title: '年级管理' },
      },
      {
        path: 'forms',
        name: 'FormManage',
        component: () => import('@/views/admin/forms/Index.vue'),
        meta: { title: '体测表单' },
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/admin/statistics/Index.vue'),
        meta: { title: '数据统计' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');
  const userStore = useUserStore();

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 体测管理系统` : '体测管理系统';

  // 不需要认证的页面，直接放行
  if (!to.meta.requiresAuth) {
    next();
    return;
  }

  // 需要认证但没有 token，跳转到登录页
  if (!token) {
    next('/login');
    return;
  }

  // 有 token，验证 token 有效性
  try {
    // 如果 userStore 中没有用户信息，则获取
    if (!userStore.userInfo) {
      const userInfo = await getMe();
      userStore.setUserInfo(userInfo);
    }

    // TODO: 可以在这里添加角色权限检查
    // if (to.meta.role && !checkRole(userStore.userInfo.role, to.meta.role)) {
    //   next('/403');
    //   return;
    // }

    next();
  } catch (error) {
    // token 无效或过期，清除并跳转到登录页
    console.error('验证失败:', error);
    userStore.logout();
    next('/login');
  }
});

export default router;
