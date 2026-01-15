import request from '@/utils/request'
import { saveTokenInfo } from '@/utils/tokenManager'

//登录
export const loginApi = (data) => request.post('/login', data, { skipAuth: true })

/**
 * 处理登录响应，保存token信息
 * @param {Object} response - 后端返回的登录响应
 * @param {Object} response.data - 包含token和用户信息的数据
 * @param {string} response.data.token - access token
 * @param {number} response.data.expiresIn - token有效期（秒）
 * @param {string} response.data.refreshToken - refresh token（可选）
 * @param {number} response.data.refreshExpiresIn - refresh token有效期（秒，可选）
 * @param {Object} response.data.user - 用户信息
 */
export const handleLoginResponse = (response) => {
  console.log('[Login] Full response:', response)
  
  if (response && response.code === 1 && response.data) {
    const { token, expiresIn, refreshToken, refreshExpiresIn, user, ...otherData } = response.data
    
    console.log('[Login] Extracted data:', { 
      hasToken: !!token, 
      hasUser: !!user,
      hasRefreshToken: !!refreshToken,
      otherDataKeys: Object.keys(otherData) 
    })
    
    // 如果后端没有返回expiresIn，设置默认值86400秒（24小时）
    const tokenExpiresIn = expiresIn || 86400
    
    // 使用tokenManager保存token信息和过期时间
    saveTokenInfo(token, tokenExpiresIn, refreshToken, refreshExpiresIn)
    
    // 保存用户信息（保持原有方式）
    // 如果有user对象则使用user，否则使用response.data中的其他字段
    const userData = user || otherData
    const loginUser = {
      ...userData,
      token: token
    }
    
    console.log('[Login] Saving loginUser to localStorage:', loginUser)
    localStorage.setItem('loginUser', JSON.stringify(loginUser))
    
    console.log('[Login] Token saved with expiry:', tokenExpiresIn, 'seconds', expiresIn ? '' : '(default)')
    console.log('[Login] User info saved:', { name: loginUser.name, userId: loginUser.userId || loginUser.id })
    
    // 注意：scheduleTokenRefresh 已在 tokenManager.saveTokenInfo 中调用
    // 这里不需要重复调用
  }
}
