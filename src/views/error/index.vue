<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">{{ errorCode }}</h1>
      <h2 class="error-title">{{ errorTitle }}</h2>
      <p class="error-message">
        {{ errorMessage }}
      </p>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><Back /></el-icon>
          返回上一页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, Back } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 根据路由参数确定错误类型
const errorCode = computed(() => route.params.code || '500')
const errorTitle = computed(() => {
  const codes = {
    '403': '无权限访问',
    '404': '页面未找到',
    '500': '服务器错误'
  }
  return codes[errorCode.value] || '未知错误'
})

const errorMessage = computed(() => {
  const messages = {
    '403': '抱歉，您没有权限访问此页面。',
    '404': '抱歉，您访问的页面不存在或已被移除。',
    '500': '抱歉，服务器发生了错误，请稍后重试。'
  }
  return messages[errorCode.value] || '发生未知错误，请稍后重试。'
})

const goHome = () => {
  router.push('/index')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
/* 样式同404页面，可以提取为公共样式 */
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.error-content {
  text-align: center;
  color: white;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.error-code {
  font-size: 120px;
  margin: 0;
  font-weight: bold;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.error-title {
  font-size: 32px;
  margin: 20px 0 10px;
}

.error-message {
  font-size: 16px;
  margin-bottom: 30px;
  opacity: 0.8;
}

.error-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}
</style>