<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
const { EditPen, SwitchButton } = Icons
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'
import { getTokenInfo } from '@/utils/tokenManager'
import { onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const loginName = ref('')
const { t, locale } = useI18n()
const lang = ref(locale.value)

const changeLang = (l) => {
  setLocale(l)
  locale.value = l
  lang.value = l
  // reload page so ElementPlus locale (set in main.js) is applied
  window.location.reload()
}

// 获取登录用户名的函数，尝试多个字段以兼容不同后端
const loadUserInfo = () => {
  const stored = getTokenInfo().loginUser || JSON.parse(localStorage.getItem('loginUser') || 'null')
  if (stored) {
    const name = stored.name || stored.username || stored.userName || stored.loginName || stored.nick || stored.nickname || stored.userId || ''
    loginName.value = name || ''
    console.log('[Layout] User loaded:', name)
  } else {
    loginName.value = ''
  }
}

onMounted(() => {
  loadUserInfo()
  // listen for storage changes (other tabs or explicit setItem)
  const handler = (e) => {
    if (e.key === 'loginUser') loadUserInfo()
  }
  window.addEventListener('storage', handler)
  // cleanup
  onUnmounted(() => window.removeEventListener('storage', handler))
})

// 监听路由变化，在从登录页跳转后重新加载用户信息
watch(
  () => route.path,
  (newPath, oldPath) => {
    if (oldPath === '/login' || !loginName.value) loadUserInfo()
  }
)

const logout = () => {
  ElMessageBox.confirm(t('quit_confirm'), t('logout'), {
    confirmButtonText: t('confirm') || '确定',
    cancelButtonText: t('cancel') || '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success(t('logout') || '退出登录成功')
    localStorage.removeItem('loginUser')
    router.push('/login')
  })
}

// 构建菜单数据：从路由中读取子路由并保留有 title 的项
const menuList = computed(() => {
  const all = router.getRoutes()
  const root = all.find(r => r.path === '/') || all.find(r => r.name === 'root')
  const children = (root && root.children) || []

  const isAuthenticated = !!localStorage.getItem('loginUser')
  const tokenUser = getTokenInfo().loginUser || JSON.parse(localStorage.getItem('loginUser') || 'null') || {}

  const mapIcon = (name) => {
    if (!name) return null
    return Icons[name] || Icons.Box || null
  }

  const build = (items) => {
    return items
      .filter(i => i.meta && (i.meta.title || i.meta.i18nKey))
      .filter(i => !(i.meta.requiresAuth && !isAuthenticated))
      .filter(i => {
        // 支持 onlyUserId 控制菜单可见性
        if (i.meta && i.meta.onlyUserId) {
          return tokenUser && Number(tokenUser.userId) === Number(i.meta.onlyUserId)
        }
        return true
      })
      .map(i => ({
        path: i.path,
        title: i.meta.i18nKey ? t(i.meta.i18nKey) : i.meta.title,
        icon: mapIcon(i.meta.icon),
        children: i.children && i.children.length ? build(i.children) : null
      }))
  }

  return build(children)
})
</script>

<template>
  <div class="common-layout">
    <el-container>
      <!-- Header 区域 -->
      <el-header class="header">
        <span class="title">{{ t('title') }}</span>
        <span class="right_tool">
          <el-select v-model="lang" placeholder="Lang" size="small" @change="changeLang" style="margin-right:12px; width:80px">
            <el-option label="中文" value="zh"></el-option>
            <el-option label="English" value="en"></el-option>
          </el-select>

          <a href="">
            <el-icon><EditPen /></el-icon> {{ t('change_password') || 'change password' }} &nbsp;&nbsp;&nbsp; |
            &nbsp;&nbsp;&nbsp;
          </a>
          <a href="javascript:void(0)" @click="logout">
            <el-icon><SwitchButton /></el-icon> {{ t('logout') }}【{{ loginName }}】
          </a>
        </span>
      </el-header>

      <el-container>
        <!-- 左侧菜单（基于路由动态生成） -->
        <el-aside width="200px" class="aside">
          <el-menu router>
            <template v-for="item in menuList" :key="item.path">
              <el-sub-menu v-if="item.children && item.children.length" :index="item.path">
                <template #title>
                  <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
                  {{ item.title }}
                </template>
                <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
                  <el-icon v-if="child.icon"><component :is="child.icon" /></el-icon>
                  {{ child.title }}
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item v-else :index="item.path">
                <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
                {{ item.title }}
              </el-menu-item>
            </template>
          </el-menu>
        </el-aside>

        <el-main>
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.header {
  background-image: linear-gradient(
    to right,
    #00547d,
    #007fa4,
    #00aaa0,
    #00d072,
    #a8eb12
  );
}

.title {
  color: white;
  font-size: 40px;
  font-family: 楷体;
  line-height: 60px;
  font-weight: bolder;
}

.right_tool {
  float: right;
  line-height: 60px;
}

a {
  color: white;
  text-decoration: none;
}

.aside {
  width: 220px;
  border-right: 1px solid #ccc;
  height: 730px;
}
</style>
