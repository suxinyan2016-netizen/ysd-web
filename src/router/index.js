import { createRouter, createWebHistory } from 'vue-router'
import i18n from '@/i18n'

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
          i18nKey: 'menu.home',
          icon: 'House'
        }
      },
      // 包裹（一级菜单，包含包裹管理/待收/待发）
      {
        path: 'packages',
        name: 'packages',
        meta: {
          title: '包裹',
          i18nKey: 'menu.packages',
          icon: 'Box',
          requiresAuth: true
        },
        children: [
          {
            path: '/parcel',
            name: 'parcel',
            component: lazyLoad('parcel'),
            meta: {
              title: '包裹管理',
              i18nKey: 'menu.parcel.title',
              icon: 'Package',
              requiresAuth: true
            }
          },
          {
            path: '/parcel/receive',
            name: 'parcelReceive',
            component: lazyLoad('parcelReceive'),
            meta: {
              title: '待收包裹',
              i18nKey: 'menu.parcel.receive',
              icon: 'Inbox',
              requiresAuth: true
            }
          },
          {
            path: '/parcel/send',
            name: 'parcelSend',
            component: lazyLoad('parcelSend'),
            meta: {
              title: '待发包裹',
              i18nKey: 'menu.parcel.send',
              icon: 'Upload',
              requiresAuth: true
            }
          }
        ]
      },
      // 商品（一级菜单）
      {
        path: 'products',
        name: 'products',
        meta: {
          title: '商品',
          i18nKey: 'menu.products',
          icon: 'Goods',
          requiresAuth: true
        },
        children: [
          {
            path: '/item',
            name: 'item',
            component: lazyLoad('item'),
            meta: {
              title: '商品管理',
              i18nKey: 'menu.item.title',
              icon: 'Goods',
              requiresAuth: true
            }
          },
          {
            path: '/item/owner-inventory',
            name: 'ownerInventory',
            component: lazyLoad('ownerInventory'),
            meta: {
              title: '物主库存',
              i18nKey: 'menu.item.ownerInventory',
              icon: 'Box',
              requiresAuth: true
            }
          },
          {
            path: '/item/warehouse-inventory',
            name: 'warehouseInventory',
            component: lazyLoad('warehouseInventory'),
            meta: {
              title: '仓库库存',
              i18nKey: 'menu.item.warehouseInventory',
              icon: 'Shop',
              requiresAuth: true
            }
          }
        ]
      },
      // 系统（仅部分用户可见）
      {
        path: 'system',
        name: 'system',
        meta: {
          title: '系统',
          i18nKey: 'menu.system',
          icon: 'Setting',
          requiresAuth: true
        },
        children: [
          {
            path: '/user',
            name: 'user',
            component: lazyLoad('user'),
            meta: {
              title: '用户管理',
              i18nKey: 'menu.user',
              icon: 'User',
              requiresAuth: true,
              onlyUserId: 1
            }
          }
        ]
      },
      
      
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
  // 获取页面标题，优先使用 i18n key
  if (to.meta.i18nKey) {
    const title = i18n.global.t(to.meta.i18nKey)
    document.title = `${title} - 管理系统`
  } else if (to.meta.title) {
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
    } else if (to.meta.onlyUserId) {
      // 路由仅对指定 userId 可见
      const user = JSON.parse(isAuthenticated || '{}')
      if (!user || Number(user.userId) !== Number(to.meta.onlyUserId)) {
        next('/index')
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