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
      // 所有 /api 请求统一代理到后端，保留 /api 前缀（包括 /api/login）
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // 不 rewrite，保留 /api 前缀
        headers: {
          'X-Forwarded-For': 'localhost',
          'X-Forwarded-Proto': 'http',
          'X-Forwarded-Host': 'localhost:8080'
        }
      }
    }
  }
});