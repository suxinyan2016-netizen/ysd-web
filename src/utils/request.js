import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { 
  getTokenInfo, 
  isTokenExpired, 
  isTokenExpiringSoon, 
  getTokenStatus,
  saveTokenInfo,
  clearTokenInfo 
} from './tokenManager'
import { 
  refreshAccessToken, 
  scheduleTokenRefresh,
  cancelScheduledRefresh 
} from './tokenRefresh'

// Create axios instance with configurable base URL (use VITE_API_BASE to target backend directly when not using dev proxy)
const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const request = axios.create({
  baseURL: API_BASE,
  timeout: 600000
})

// 标记是否正在处理token刷新
let isHandlingTokenRefresh = false

// 白名单：不需要 token 的接口
const AUTH_WHITELIST = [
  '/login',
  '/register',
  '/refresh',
  '/public'
]

// 检查是否在白名单中
function isInWhitelist(url) {
  return AUTH_WHITELIST.some(path => url.includes(path))
}

//axios的请求 request 拦截器, 每次请求获取localStorage中的loginUser, 从中获取到token, 在请求头token中携带到服务端
request.interceptors.request.use(
  async (config) => {
    // Debug: show outgoing request target for troubleshooting proxy/CORS issues
    try {
      console.debug('[HTTP Request] ', config.method?.toUpperCase(), (config.baseURL || '') + config.url, config)
    } catch (e) { console.debug('[HTTP Request] (failed to print config)', e) }

    // 检查是否跳过认证（白名单或自定义 skipAuth 标记）
    const skipAuth = config.skipAuth === true || isInWhitelist(config.url)
    if (skipAuth) {
      console.log('[HTTP Request] Skipping auth for:', config.url)
      return config
    }

    const { token } = getTokenInfo()
    
    // 检查token状态
    const tokenStatus = getTokenStatus()
    console.log('[HTTP Request] Token status:', tokenStatus.status, '-', tokenStatus.message)

    // 如果token已过期，则尝试刷新
    if (isTokenExpired()) {
      console.log('[HTTP Request] Token expired, attempting to refresh...')
      
      if (!isHandlingTokenRefresh) {
        isHandlingTokenRefresh = true
        try {
          const refreshResult = await refreshAccessToken()
          if (refreshResult && refreshResult.token) {
            // 刷新成功，使用新token
            config.headers.token = refreshResult.token
          } else {
            // 刷新失败或无refresh token，让请求继续，由后端返回401
            console.warn('[HTTP Request] Token refresh returned null, request will proceed without token')
            // 不清除token，让后端来判断
          }
        } catch (error) {
          // 网络错误，让请求继续
          console.error('[HTTP Request] Error during token refresh:', error.message)
        } finally {
          isHandlingTokenRefresh = false
        }
      }
    } else if (token) {
      // token有效，正常携带
      config.headers.token = token
      
      // 如果token即将过期，计划后台刷新
      if (isTokenExpiringSoon()) {
        const remainingTime = getTokenInfo().tokenExpiry - Date.now()
        scheduleTokenRefresh(remainingTime)
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

//axios的响应 response 拦截器
request.interceptors.response.use(
  (response) => { //成功回调
    return response.data
  },
  async (error) => { //失败回调
    // 如果 error.response 存在，则服务器有返回信息
    if (error && error.response) {
      // Debug: print full error response for investigation
      try { console.error('[HTTP Error] response:', error.response) } catch (e) { console.error('[HTTP Error] (failed to print response)', e) }

      const status = error.response.status
      const originalRequest = error.config

      // Handle unauthorized (401) - token invalid or expired
      if (status === 401) {
        // 如果还没有尝试过刷新，则尝试刷新token并重试
        if (!originalRequest._retry) {
          originalRequest._retry = true

          try {
            console.log('[HTTP Error] Received 401, attempting token refresh...')
            const refreshResult = await refreshAccessToken()
            
            if (refreshResult && refreshResult.token) {
              // 用新token重试原请求
              originalRequest.headers.token = refreshResult.token
              console.log('[HTTP Error] Retrying original request with new token')
              return request(originalRequest)
            } else {
              // 刷新失败（无refresh token或已过期），跳转登录
              console.warn('[HTTP Error] Token refresh returned null, redirecting to login')
              clearTokenInfo()
              cancelScheduledRefresh()
              ElMessage.error('Your session has expired. Please log in again.')
              router.push('/login')
              return Promise.reject(new Error('Token refresh failed'))
            }
          } catch (refreshError) {
            // 刷新过程中出错，跳转登录
            console.error('[HTTP Error] Error during token refresh, redirecting to login')
            clearTokenInfo()
            cancelScheduledRefresh()
            ElMessage.error('Your session has expired. Please log in again.')
            router.push('/login')
            return Promise.reject(refreshError)
          }
        } else {
          // 已经重试过了，还是401，说明有其他问题
          const serverMsg = error.response.data && (error.response.data.msg || error.response.data.message || '')
          const isTokenError = serverMsg.toLowerCase().includes('token') || 
                              serverMsg.toLowerCase().includes('invalid') || 
                              serverMsg.toLowerCase().includes('expire') ||
                              serverMsg.toLowerCase().includes('unauthorized')
          
          if (isTokenError || !serverMsg) {
            ElMessage.error('Your session is invalid. Please log in again.')
          } else {
            ElMessage.error(serverMsg)
          }
          
          clearTokenInfo()
          cancelScheduledRefresh()
          router.push('/login')
        }
      } else if (status === 403) {
        // Helpful message for forbidden errors (often CORS or proxy misconfiguration)
        const serverMsg = error.response.data && (error.response.data.msg || error.response.data.message)
        ElMessage.error(serverMsg || 'Forbidden (403): check API base URL, proxy or CORS settings')
      } else {
        const msg = (error.response.data && (error.response.data.msg || error.response.data.message)) || `Interface Error (${status})`
        ElMessage.error(msg)
      }
    } else {
      // Network, CORS, or no response
      console.error('[HTTP Error] no response object - network or CORS error', error)
      ElMessage.error('Network Error: could not reach server')
    }
    // 将错误继续抛出，供调用方（如登录）捕获并处理
    return Promise.reject(error)
  }
)

export default request