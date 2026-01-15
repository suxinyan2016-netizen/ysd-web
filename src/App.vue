<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TokenStatusBar from '@/components/common/TokenStatusBar.vue'

// 只在非登录页面显示token状态条
const route = useRoute()
const showTokenStatus = computed(() => {
  return route.path !== '/login'
})
</script>

<template>
  <!-- Token状态提示条（仅在非登录页显示） -->
  <TokenStatusBar v-if="showTokenStatus" />
  
  <!-- 主路由视图 -->
  <router-view></router-view>
</template>

<style scoped>

</style>