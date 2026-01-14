import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// Create axios instance with configurable base URL (use VITE_API_BASE to target backend directly when not using dev proxy)
const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const request = axios.create({
  baseURL: API_BASE,
  timeout: 600000
})


//axios的请求 request 拦截器, 每次请求获取localStorage中的loginUser, 从中获取到token, 在请求头token中携带到服务端
request.interceptors.request.use(
  (config) => {
    let loginUser = JSON.parse(localStorage.getItem('loginUser'))
    // Debug: show outgoing request target for troubleshooting proxy/CORS issues
    try {
      console.debug('[HTTP Request] ', config.method?.toUpperCase(), (config.baseURL || '') + config.url, config)
    } catch (e) { console.debug('[HTTP Request] (failed to print config)', e) }



    if (loginUser) {
      config.headers.token = loginUser.token
    }
    return config
  }
)

//axios的响应 response 拦截器
request.interceptors.response.use(
  (response) => { //成功回调
    return response.data
  },
  (error) => { //失败回调
    // 如果 error.response 存在，则服务器有返回信息
    if (error && error.response) {
      // Debug: print full error response for investigation
      try { console.error('[HTTP Error] response:', error.response) } catch (e) { console.error('[HTTP Error] (failed to print response)', e) }



      const status = error.response.status
      // Handle unauthorized
      if (status === 401) {
        // Check if the error is due to invalid or expired token
        const serverMsg = error.response.data && (error.response.data.msg || error.response.data.message || '')
        const isTokenError = serverMsg.toLowerCase().includes('token') || 
                            serverMsg.toLowerCase().includes('invalid') || 
                            serverMsg.toLowerCase().includes('expire') ||
                            serverMsg.toLowerCase().includes('unauthorized')
        
        if (isTokenError || !serverMsg) {
          ElMessage.error('Your token has expired or is invalid. Please log in again.')
        } else {
          ElMessage.error(serverMsg)
        }
        router.push('/login')
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