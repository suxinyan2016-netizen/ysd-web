import { createRouter, createWebHistory } from 'vue-router'

// 1. 主布局和登录页（使用常规导入）
import LayoutView from '@/views/layout/index.vue'
import LoginView from '@/views/login/index.vue'

// 2. 路由懒加载函数
const lazyLoad = (view) => {
  return () => import(`@/views/${view}/index.vue`)
}

// 3. 定义路由配置
const routes = [
  {
    path: '/',
    name: 'root',
    component: LayoutView,
    redirect: '/index',
    meta: {
      requiresAuth: true, // 需要登录
      title: '主页'
    },
    children: [
      // 首页
      {
        path: 'index',
        name: 'home',
        component: lazyLoad('index'),
        meta: {
          title: '首页',
          icon: 'House'
        }
      },
      // 班级管理
      {
        path: 'clazz',
        name: 'clazz',
        component: lazyLoad('clazz'),
        meta: {
          title: '班级管理',
          icon: 'School',
          requiresAuth: true
        }
      },
      // 学生管理
      {
        path: 'stu',
        name: 'student',
        component: lazyLoad('stu'),
        meta: {
          title: '学生管理',
          icon: 'User',
          requiresAuth: true
        }
      },
      // 包裹管理
      {
        path: 'parcel',
        name: 'parcel',
        component: lazyLoad('parcel'),
        meta: {
          title: '包裹管理',
          icon: 'Package',
          requiresAuth: true
        }
      },
      // 商品管理
      {
        path: 'item',
        name: 'item',
        component: lazyLoad('item'),
        meta: {
          title: '商品管理',
          icon: 'Goods',
          requiresAuth: true
        }
      },
      // 部门管理
      {
        path: 'dept',
        name: 'department',
        component: lazyLoad('dept'),
        meta: {
          title: '部门管理',
          icon: 'OfficeBuilding',
          requiresAuth: true
        }
      },
      // 员工管理
      {
        path: 'emp',
        name: 'employee',
        component: lazyLoad('emp'),
        meta: {
          title: '员工管理',
          icon: 'UserFilled',
          requiresAuth: true
        }
      },
      // 用户管理
      {
        path: 'user',
        name: 'user',
        component: lazyLoad('user'),
        meta: {
          title: '用户管理',
          icon: 'Setting',
          requiresAuth: true,
          requiresAdmin: true // 需要管理员权限
        }
      },
      // 日志管理
      {
        path: 'log',
        name: 'log',
        component: lazyLoad('log'),
        meta: {
          title: '系统日志',
          icon: 'Document',
          requiresAuth: true,
          requiresAdmin: true
        }
      },
      // 员工报表
      {
        path: 'empReport',
        name: 'employeeReport',
        component: lazyLoad('report/emp'),
        meta: {
          title: '员工报表',
          icon: 'DataAnalysis',
          requiresAuth: true
        }
      },
      // 学生报表
      {
        path: 'stuReport',
        name: 'studentReport',
        component: lazyLoad('report/stu'),
        meta: {
          title: '学生报表',
          icon: 'DataLine',
          requiresAuth: true
        }
      }
    ]
  },
  // 登录页
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      title: '登录',
      requiresAuth: false // 不需要登录
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面未找到',
      requiresAuth: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 路由滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 4. 路由守卫 - 权限控制
router.beforeEach((to, from, next) => {
  // 获取页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 管理系统`
  }

  // 检查是否需要登录
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = localStorage.getItem('loginUser')

  if (requiresAuth && !isAuthenticated) {
    // 需要登录但未登录，跳转到登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (to.path === '/login' && isAuthenticated) {
    // 已登录但访问登录页，跳转到首页
    next('/index')
  } else if (to.meta.requiresAdmin) {
    // 检查管理员权限
    const user = JSON.parse(isAuthenticated || '{}')
    if (user.role !== 'admin') {
      next('/index') // 无权限，跳转到首页
    } else {
      next()
    }
  } else {
    next()
  }
})

// 5. 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  // 可以跳转到错误页面
  router.push('/error')
})

export default router