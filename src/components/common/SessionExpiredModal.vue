<template>
  <el-dialog
    v-model="visible"
    title="Session Expired"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="session-expired-modal"
  >
    <div class="modal-content">
      <el-icon class="warning-icon" :size="48" color="#f56c6c">
        <WarningFilled />
      </el-icon>
      <p class="message">Your session has expired. Please log in again to continue.</p>
    </div>
    <template #footer>
      <div class="modal-footer">
        <el-button type="primary" @click="handleRelogin" :loading="loading">
          Re-login
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { WarningFilled } from '@element-plus/icons-vue'
import { clearTokenInfo } from '@/utils/tokenManager'
import { cancelScheduledRefresh } from '@/utils/tokenScheduler'

const router = useRouter()
const visible = ref(false)
const loading = ref(false)

const show = () => {
  visible.value = true
}

const hide = () => {
  visible.value = false
}

const handleRelogin = () => {
  loading.value = true
  
  // Clear token info
  clearTokenInfo()
  cancelScheduledRefresh()
  
  // Navigate to login page
  setTimeout(() => {
    loading.value = false
    hide()
    router.push('/login')
  }, 300)
}

defineExpose({
  show,
  hide
})
</script>

<style scoped>
.session-expired-modal :deep(.el-dialog__header) {
  text-align: center;
  padding-bottom: 10px;
}

.session-expired-modal :deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.warning-icon {
  margin-bottom: 16px;
}

.message {
  font-size: 16px;
  color: #606266;
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.modal-footer .el-button {
  min-width: 120px;
}
</style>
