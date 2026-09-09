<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { initForgotPasswordApi, resetPasswordApi } from '@/api/forgotPassword'

const router = useRouter()

// 步骤：1-验证用户并发送验证码，2-输入验证码和新密码
const currentStep = ref(1)

// 步骤1：验证用户
const userForm = ref({ usernameOrEmail: '' })
const userFormRef = ref(null)
const verifiedUser = ref(null) // 存储验证通过的用户信息 { userId, email }

// 步骤2：验证码和密码
const resetForm = ref({ code: '', newPassword: '', confirmPassword: '' })
const resetFormRef = ref(null)
const countdown = ref(0)
const countdownTimer = ref(null)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 验证规则
const userRules = {
  usernameOrEmail: [
    { required: true, message: 'Please enter username or email', trigger: 'blur' }
  ]
}

const resetRules = {
  code: [
    { required: true, message: 'Please enter verification code', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: 'Verification code must be 6 digits', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: 'Please enter new password', trigger: 'blur' },
    { min: 8, message: 'Password must be at least 8 characters', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        // 检查是否包含至少2种字符类型（大写字母、小写字母、数字、符号）
        let typeCount = 0
        if (/[A-Z]/.test(value)) typeCount++ // 大写字母
        if (/[a-z]/.test(value)) typeCount++ // 小写字母
        if (/[0-9]/.test(value)) typeCount++ // 数字
        if (/[^A-Za-z0-9]/.test(value)) typeCount++ // 符号
        
        if (typeCount < 2) {
          callback(new Error('Password must contain at least 2 of: uppercase, lowercase, numbers, or symbols'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm password', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetForm.value.newPassword) {
          callback(new Error('Passwords do not match'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算密码强度
const passwordStrength = ref(0)
const passwordStrengthText = ref('')

const calculatePasswordStrength = (password) => {
  if (!password) {
    passwordStrength.value = 0
    passwordStrengthText.value = ''
    return
  }
  
  let strength = 0
  // 长度加分
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  
  // 字符类型加分
  let typeCount = 0
  if (/[A-Z]/.test(password)) typeCount++
  if (/[a-z]/.test(password)) typeCount++
  if (/[0-9]/.test(password)) typeCount++
  if (/[^A-Za-z0-9]/.test(password)) typeCount++
  
  strength += typeCount
  
  // 计算强度等级 (0-6)
  if (strength <= 2) {
    passwordStrength.value = 1
    passwordStrengthText.value = 'Weak'
  } else if (strength <= 4) {
    passwordStrength.value = 2
    passwordStrengthText.value = 'Medium'
  } else {
    passwordStrength.value = 3
    passwordStrengthText.value = 'Strong'
  }
}

// 步骤1：验证用户并发送验证码
const initForgotPassword = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    const res = await initForgotPasswordApi(userForm.value)
    
    if (res && res.code === 1) {
      verifiedUser.value = res.data
      ElMessage.success('Verification code sent to your email')
      currentStep.value = 2
      startCountdown()
    } else {
      ElMessage.error(res?.msg || 'User verification failed')
    }
  } catch (err) {
    if (err !== false) {
      console.error('initForgotPassword error', err?.message || err)
      ElMessage.error(err?.response?.data?.msg || err?.message || 'Verification failed')
    }
  }
}

// 重新发送验证码
const resendCode = async () => {
  if (countdown.value > 0) return
  
  try {
    const res = await initForgotPasswordApi(userForm.value)
    
    if (res && res.code === 1) {
      ElMessage.success('Verification code resent to your email')
      startCountdown()
    } else {
      ElMessage.error(res?.msg || 'Failed to resend verification code')
    }
  } catch (err) {
    console.error('resendCode error', err?.message || err)
    ElMessage.error(err?.response?.data?.msg || err?.message || 'Failed to resend verification code')
  }
}

// 倒计时
const startCountdown = () => {
  countdown.value = 60
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
  countdownTimer.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer.value)
    }
  }, 1000)
}

// 步骤2：验证验证码并重置密码
const resetPassword = async () => {
  if (!resetFormRef.value) return
  
  try {
    await resetFormRef.value.validate()
    const res = await resetPasswordApi({
      userId: verifiedUser.value.userId,
      code: resetForm.value.code,
      newPassword: resetForm.value.newPassword
    })
    
    if (res && res.code === 1) {
      ElMessage.success('Password reset successfully')
      // 清空表单
      resetForm.value = { code: '', newPassword: '', confirmPassword: '' }
      // 清除倒计时
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
        countdown.value = 0
      }
      // 3秒后跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      ElMessage.error(res?.msg || 'Password reset failed')
    }
  } catch (err) {
    if (err !== false) {
      console.error('resetPassword error', err?.message || err)
      ElMessage.error(err?.response?.data?.msg || err?.message || 'Password reset failed')
    }
  } finally {
    // 清空密码
    try {
      resetForm.value.newPassword = ''
      resetForm.value.confirmPassword = ''
    } catch (e) { /* ignore */ }
  }
}

// 返回登录页
const backToLogin = () => {
  router.push('/login')
}

// 清理定时器
const onUnmounted = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
}
</script>

<template>
  <div id="container">
    <div class="forgot-password-card">
      <el-card class="card" shadow="hover">
        <p class="title">Forgot Password</p>

        <!-- 步骤1：验证用户并发送验证码 -->
        <div v-if="currentStep === 1">
          <el-form ref="userFormRef" :model="userForm" :rules="userRules" label-width="140px">
            <el-form-item label="Username or Email" prop="usernameOrEmail">
              <el-input v-model="userForm.usernameOrEmail" placeholder="Enter username or email" @keyup.enter="initForgotPassword" />
            </el-form-item>
            <el-form-item>
              <div class="button-group">
                <el-button class="button" type="primary" @click="initForgotPassword">Send Code</el-button>
                <el-button class="button" type="info" @click="backToLogin">Back to Login</el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤2：输入验证码和新密码 -->
        <div v-else-if="currentStep === 2">
          <el-alert
            title="Verification code has been sent to your email"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 20px"
          />
          <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-width="140px">
            <el-form-item label="Verification Code" prop="code">
              <el-input 
                v-model="resetForm.code" 
                placeholder="Enter 6-digit code" 
                maxlength="6"
                autocomplete="off"
                clearable
              >
                <template #append>
                  <el-button 
                    @click="resendCode"
                    :disabled="countdown > 0"
                  >
                    {{ countdown > 0 ? `Resend (${countdown}s)` : 'Resend' }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="New Password" prop="newPassword">
              <el-input 
                v-model="resetForm.newPassword" 
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter new password"
                @input="calculatePasswordStrength(resetForm.newPassword)"
              >
                <template #append>
                  <el-button @click="showPassword = !showPassword">
                    <el-icon><component :is="showPassword ? 'View' : 'Hide'" /></el-icon>
                  </el-button>
                </template>
              </el-input>
              <!-- 密码强度提示 -->
              <div v-if="resetForm.newPassword" class="password-hint">
                <div class="password-requirement">
                  Password must be at least 8 characters and contain at least 2 of:
                </div>
                <div class="password-requirement">
                  • Uppercase letters (A-Z) • Lowercase letters (a-z) • Numbers (0-9) • Symbols (!@#$%...)
                </div>
                <div class="password-strength" :class="`strength-${passwordStrength}`">
                  <span class="strength-text">Strength: {{ passwordStrengthText }}</span>
                  <div class="strength-bar">
                    <div class="strength-fill" :style="{ width: (passwordStrength / 3) * 100 + '%' }"></div>
                  </div>
                </div>
              </div>
            </el-form-item>
            <el-form-item label="Confirm Password" prop="confirmPassword">
              <el-input 
                v-model="resetForm.confirmPassword" 
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirm new password"
              >
                <template #append>
                  <el-button @click="showConfirmPassword = !showConfirmPassword">
                    <el-icon><component :is="showConfirmPassword ? 'View' : 'Hide'" /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <div class="button-group">
                <el-button class="button" type="primary" @click="resetPassword">Reset Password</el-button>
                <el-button class="button" type="info" @click="backToLogin">Cancel</el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
#container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('../../assets/loginbg.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  padding: 0;
}

.forgot-password-card {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.card {
  width: 480px;
  background-color: rgba(0, 0, 0, 0.32);
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.title {
  font-size: clamp(16px, 2.5vw, 24px);
  font-weight: bold;
  color: #fff;
  margin-bottom: 18px;
}

.button {
  margin-top: 24px;
  width: 120px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
}

:deep(.el-form-item__label) {
  color: #fff;
}

:deep(.el-input__inner) {
  background: transparent;
  color: #000;
}

:deep(.el-input__inner)::placeholder {
  color: #777;
  opacity: 1;
}

/* 确保输入框可点击 */
.card .el-card__body {
  overflow: visible;
}

.card .el-input,
.card .el-input__inner {
  position: relative;
  z-index: 2;
  pointer-events: auto;
}

.card .el-form-item {
  z-index: 1;
}

/* 输入框背景 */
.card :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.94);
}

/* 密码强度提示 */
.password-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.password-requirement {
  margin-bottom: 4px;
  line-height: 1.4;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  min-width: 70px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-1 .strength-fill {
  background: #f56c6c;
}

.strength-2 .strength-fill {
  background: #e6a23c;
}

.strength-3 .strength-fill {
  background: #67c23a;
}

.strength-1 .strength-text {
  color: #f56c6c;
}

.strength-2 .strength-text {
  color: #e6a23c;
}

.strength-3 .strength-text {
  color: #67c23a;
}
</style>
