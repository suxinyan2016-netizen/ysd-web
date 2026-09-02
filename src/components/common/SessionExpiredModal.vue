<template>
  <el-dialog
    v-model="visible"
    title=""
    width="450px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    class="session-expired-modal"
  >
    <div class="modal-header">
      <div class="header-icon">
        <el-icon :size="36" color="#ffffff">
          <WarningFilled />
        </el-icon>
      </div>
      <h2 class="header-title">Session Expired!</h2>
    </div>
    <div class="modal-content">
      <p class="message">Your session has expired. Please log in again to continue.</p>
    </div>
    <template #footer>
      <div class="modal-footer">
        <el-button type="primary" @click="handleRelogin" :loading="loading" class="relogin-btn">
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
  display: none;
}

.session-expired-modal :deep(.el-dialog__body) {
  padding: 0;
}

.modal-header {
  background: linear-gradient(135deg, #00547d 0%, #006699 100%);
  padding: 24px 20px;
  text-align: center;
  border-radius: 8px 8px 0 0;
}

.header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  margin-bottom: 12px;
}

.header-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 30px 16px;
}

.message {
  font-size: 15px;
  color: #606266;
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: center;
  padding: 16px 30px 24px;
  background-color: #fafbfc;
  border-radius: 0 0 8px 8px;
}

.relogin-btn {
  min-width: 140px;
  height: 40px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 6px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  transition: all 0.3s ease;
}

.relogin-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}
</style>
