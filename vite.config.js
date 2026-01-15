import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // 1. 登录接口 - 移除 /api 前缀（因为 LoginController 没有 /api）
      '/api/login': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // /api/login → /login
        headers: {
          'X-Forwarded-For': 'localhost',
          'X-Forwarded-Proto': 'http',
          'X-Forwarded-Host': 'localhost:8080'
        }
      },
      // 2. 其他所有接口 - 不移除 /api 前缀（因为其他 Controller 都有 /api）
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // 注意：这里没有 rewrite！不移除 /api 前缀
        headers: {
          'X-Forwarded-For': 'localhost',
          'X-Forwarded-Proto': 'http',
          'X-Forwarded-Host': 'localhost:8080'
        }
      }
    }
  }
});