<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
const { EditPen, SwitchButton } = Icons
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'
import { getTokenInfo, clearTokenInfo } from '@/utils/tokenManager'
import { changePasswordApi } from '@/api/user'
import { cancelScheduledRefresh } from '@/utils/tokenRefresh'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const loginName = ref('')
const showChangePwdDialog = ref(false)
const changeOld = ref('')
const changeNew = ref('')
const changeConfirm = ref('')
const changeFormRef = ref(null)
const { t, locale } = useI18n()
const lang = ref(locale.value)

const changeLang = (l) => {
  setLocale(l)
  locale.value = l
  lang.value = l
  // reload page so ElementPlus locale (set in main.js) is applied
  window.location.reload()
}

const openChangePassword = () => {
  // open dialog and ensure fields cleared
  changeOld.value = ''
  changeNew.value = ''
  changeConfirm.value = ''
  showChangePwdDialog.value = true
}

const submitChangePassword = async () => {
  // minimal client-side check
  if (!changeOld.value || !changeNew.value) { ElMessage.error(t('input_password') || 'Please enter passwords'); return }
  if (changeNew.value !== changeConfirm.value) { ElMessage.error(t('password_mismatch') || 'New passwords do not match'); return }

  // determine current user id
  const stored = getTokenInfo().loginUser || JSON.parse(localStorage.getItem('loginUser') || 'null')
  const userId = stored ? (stored.userId || stored.id) : null
  if (!userId) { ElMessage.error('Not authenticated'); return }

  try {
    await changePasswordApi(userId, changeOld.value, changeNew.value)
    ElMessage.success(t('change_password') + ' ' + (t('success') || 'success'))
    showChangePwdDialog.value = false
  } catch (err) {
    // backend currently may return 500 for wrong old password. Show friendly message.
    const status = err?.response?.status
    if (status === 500) {
      ElMessage.error(t('old_password_incorrect') || 'Old password incorrect')
    } else {
      const msg = err?.response?.data?.msg || err?.message || 'Change password failed'
      ElMessage.error(msg)
    }
  } finally {
    // clear sensitive fields immediately
    try { changeOld.value = ''; changeNew.value = ''; changeConfirm.value = '' } catch (e) { /* ignore */ }
  }
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
    // clear stored tokens and scheduled refresh to avoid refresh attempts after logout
    try { clearTokenInfo() } catch (e) { console.error('clearTokenInfo error', e) }
    try { cancelScheduledRefresh() } catch (e) { console.error('cancelScheduledRefresh error', e) }
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

  const build = (items, base = '') => {
    return items
      .filter(i => i.meta && (i.meta.title || i.meta.i18nKey))
      .filter(i => !(i.meta.requiresAuth && !isAuthenticated))
      .filter(i => {
        if (i.meta && i.meta.onlyUserId) {
          const uid = tokenUser && (tokenUser.userId ?? tokenUser.id ?? tokenUser.userID)
          return uid != null && Number(uid) === Number(i.meta.onlyUserId)
        }
        return true
      })
      .map(i => {
        const raw = i.path || ''
        // compute absolute path: if already absolute, use it; otherwise combine with base
        let fullPath = raw.startsWith('/') ? raw : (base ? (base.endsWith('/') ? base + raw : base + '/' + raw) : ('/' + raw))
        const children = i.children && i.children.length ? build(i.children, fullPath) : null
        return {
          path: fullPath,
          title: i.meta.i18nKey ? t(i.meta.i18nKey) : i.meta.title,
          icon: mapIcon(i.meta.icon),
          children
        }
      })
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

          <a href="javascript:void(0)" @click.prevent="openChangePassword">
            <el-icon><EditPen /></el-icon> {{ t('change_password') || 'change password' }} &nbsp;&nbsp;&nbsp; |
            &nbsp;&nbsp;&nbsp;
          </a>
          <a href="javascript:void(0)" @click="logout">
            <el-icon><SwitchButton /></el-icon> {{ t('logout') }}【{{ loginName }}】
          </a>
        </span>
      </el-header>

      <!-- Change Password Dialog -->
      <el-dialog v-model="showChangePwdDialog" :title="t('change_password') || 'Change Password'">
        <el-form ref="changeFormRef" label-width="120px">
          <el-form-item :label="t('oldPassword') || 'Old Password'">
            <el-input type="password" v-model="changeOld" autocomplete="new-password" />
          </el-form-item>
          <el-form-item :label="t('newPassword') || 'New Password'">
            <el-input type="password" v-model="changeNew" autocomplete="new-password" />
          </el-form-item>
          <el-form-item :label="t('confirmPassword') || 'Confirm'">
            <el-input type="password" v-model="changeConfirm" autocomplete="new-password" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showChangePwdDialog = false">{{ t('cancel') || 'Cancel' }}</el-button>
          <el-button type="primary" @click="submitChangePassword">{{ t('confirm') || 'OK' }}</el-button>
        </template>
      </el-dialog>

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
  background-color: #00547d;
  height: 48px;
}

.title {
  color: white;
  font-size: 20px;
  /* inherit global font; English locale will override via .lang-en */
  font-family: inherit;
  line-height: 48px;
}

.right_tool {
  float: right;
  line-height: 48px;
  color: rgba(255,255,255,0.95);
  font-family: inherit;
  padding-right: 8px;
}

a {
  color: rgba(230,247,255,0.95);
  text-decoration: none;
}

.right_tool a {
  color: rgba(230,247,255,0.95);
}

.aside {
  width: 220px;
  border-right: 1px solid #ccc;
  height: 730px;
}
</style>
