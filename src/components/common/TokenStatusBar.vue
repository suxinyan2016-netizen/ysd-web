<template>
  <div v-if="showWarning" class="token-status-bar">
    <el-alert
      :type="alertType"
      :title="alertTitle"
      :description="alertDescription"
      show-icon
      :closable="false"
      class="token-alert"
    >
      <template v-if="isExpiringSoon">
        <div class="token-countdown">
          <span>Token expires in: {{ remainingSeconds }}s</span>
          <el-button 
            v-if="hasRefreshToken" 
            type="primary" 
            size="small" 
            @click="handleRefreshClick">
            Refresh Now
          </el-button>
          <el-button 
            v-else 
            type="warning" 
            size="small" 
            @click="handleReloginClick">
            Log In Again
          </el-button>
        </div>
      </template>
    </el-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getTokenStatus, getTokenRemainingTime, getTokenInfo } from '@/utils/tokenManager'
import { refreshTokenInBackground } from '@/utils/tokenRefresh'
import { ElMessage } from 'element-plus'

const tokenStatus = ref('VALID')
const remainingSeconds = ref(0)
let countdownTimer = null

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
    return 'Your session will expire soon. Click "Refresh Now" to extend your session.'
  }
  return 'Your session is valid.'
})

// 更新token状态
const updateTokenStatus = () => {
  const status = getTokenStatus()
  const oldStatus = tokenStatus.value
  tokenStatus.value = status.status
  
  if (status.remainingMs) {
    remainingSeconds.value = Math.ceil(status.remainingMs / 1000)
  }

  // 只在状态改变时输出日志，避免每秒输出造成日志爆炸
  if (oldStatus !== status.status) {
    console.log('[TokenStatusBar] Token status changed:', oldStatus, '->', status.status)
  }
}

// 处理手动刷新
const handleRefreshClick = async () => {
  try {
    ElMessage.info('Refreshing session...')
    await refreshTokenInBackground()
    ElMessage.success('Session refreshed successfully')
    updateTokenStatus()
  } catch (error) {
    ElMessage.error('Failed to refresh session')
  }
}

// 处理重新登录
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

// 启动倒计时
const startCountdown = () => {
  if (countdownTimer) clearInterval(countdownTimer)
  
  countdownTimer = setInterval(() => {
    remainingSeconds.value = Math.max(0, remainingSeconds.value - 1)
    
    // 每秒更新一次状态
    updateTokenStatus()
  }, 1000)
}

// 停止倒计时
const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

onMounted(() => {
  updateTokenStatus()
  startCountdown()
})

onUnmounted(() => {
  stopCountdown()
})

// 暴露方法供外部调用
defineExpose({
  updateTokenStatus,
  startCountdown,
  stopCountdown
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

.token-countdown {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.token-countdown span {
  font-weight: 500;
  color: #606266;
}

@media (max-width: 768px) {
  .token-status-bar {
    max-width: 300px;
    right: 10px;
  }
}
</style>
