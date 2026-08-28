<template>
  <SessionExpiredModal ref="sessionExpiredModalRef" />
  <div v-if="showWarning && !isExpired" class="token-status-bar">
    <el-alert
      :type="alertType"
      :title="alertTitle"
      :description="alertDescription"
      show-icon
      :closable="false"
      class="token-alert"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getTokenStatus, getTokenRemainingTime, getTokenInfo } from '@/utils/tokenManager'
import { refreshTokenInBackground } from '@/utils/tokenRefresh'
import { ElMessage } from 'element-plus'
import SessionExpiredModal from './SessionExpiredModal.vue'

const tokenStatus = ref('VALID')
const sessionExpiredModalRef = ref(null)
let statusCheckTimer = null

// 检查是否有refresh token
const hasRefreshToken = computed(() => {
  const { refreshToken } = getTokenInfo()
  return !!refreshToken
})

// 计算是否应该显示警告
const isExpiringSoon = computed(() => {
  return tokenStatus.value === 'EXPIRING_SOON'
})

const isExpired = computed(() => {
  return tokenStatus.value === 'EXPIRED'
})

const showWarning = computed(() => {
  return isExpiringSoon.value || isExpired.value
})

// 根据状态确定alert类型
const alertType = computed(() => {
  if (isExpired.value) return 'error'
  if (isExpiringSoon.value) return 'warning'
  return 'info'
})

// 根据状态确定alert标题
const alertTitle = computed(() => {
  if (isExpired.value) return 'Session Expired'
  if (isExpiringSoon.value) return 'Session Expiring Soon'
  return 'Session Status'
})

// 根据状态确定alert描述
const alertDescription = computed(() => {
  if (isExpired.value) return 'Your session has expired. Please log in again.'
  if (isExpiringSoon.value) {
    const { refreshToken } = getTokenInfo()
    if (!refreshToken) {
      return 'Your session will expire soon. Please save your work and log in again.'
    }
    return 'Your session is being refreshed automatically.'
  }
  return 'Your session is valid.'
})

// 更新token状态
const updateTokenStatus = () => {
  const status = getTokenStatus()
  const oldStatus = tokenStatus.value
  tokenStatus.value = status.status

  // 只在状态改变时输出日志
  if (oldStatus !== status.status) {
    console.log('[TokenStatusBar] Token status changed:', oldStatus, '->', status.status)
  }
}

// 处理手动刷新
/*
const handleRefreshClick = async () => {
  try {
    ElMessage.info('Refreshing session...')
    const res = await refreshTokenInBackground()
    if (res && res.ok) {
      ElMessage.success('Session refreshed successfully')
      // 更新时间和倒计时
      updateTokenStatus()
    } else {
      const msg = res && res.msg ? res.msg : 'Failed to refresh session'
      ElMessage.error(msg)
    }
  } catch (error) {
    ElMessage.error('Failed to refresh session')
  }
}
*/

// 处理重新登录
/*
const handleReloginClick = () => {
  ElMessage.warning('Session expiring. Redirecting to login...')
  // 清除token信息
  localStorage.removeItem('loginUser')
  localStorage.removeItem('tokenExpiry')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('refreshTokenExpiry')
  // 跳转到登录页
  window.location.href = '/login'
}
*/

// Watch for token status changes to show modal when expired
watch(tokenStatus, (newStatus, oldStatus) => {
  if (newStatus === 'EXPIRED' && oldStatus !== 'EXPIRED') {
    console.log('[TokenStatusBar] Token expired, showing session expired modal')
    sessionExpiredModalRef.value?.show()
  }
})

onMounted(() => {
  updateTokenStatus()

  // Periodic status check (without displaying countdown)
  statusCheckTimer = setInterval(() => {
    updateTokenStatus()
  }, 5000) // Check every 5 seconds

  // Listen for localStorage changes to detect token updates after login
  const handleStorageChange = (e) => {
    if (e.key === 'loginUser' || e.key === 'tokenExpiry') {
      console.log('[TokenStatusBar] Token changed, updating status')
      updateTokenStatus()
    }
  }
  window.addEventListener('storage', handleStorageChange)

  // Cleanup on unmount
  onUnmounted(() => {
    if (statusCheckTimer) {
      clearInterval(statusCheckTimer)
    }
    window.removeEventListener('storage', handleStorageChange)
  })
})

// 暴露方法供外部调用
defineExpose({
  updateTokenStatus
})
</script>

<style scoped>
.token-status-bar {
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 2000;
  max-width: 400px;
}

.token-alert {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .token-status-bar {
    max-width: 300px;
    right: 10px;
  }
}
</style>
