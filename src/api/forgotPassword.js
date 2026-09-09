import request from '@/utils/request'

/**
 * 验证用户身份并发送验证码
 * @param {Object} data - { usernameOrEmail: string }
 * @returns {Promise}
 */
export const initForgotPasswordApi = (data) => request.post('/forgot-password/init', data, { skipAuth: true })

/**
 * 验证验证码并重置密码
 * @param {Object} data - { userId: number, code: string, newPassword: string }
 * @returns {Promise}
 */
export const resetPasswordApi = (data) => request.post('/forgot-password/reset', data, { skipAuth: true })

export default {
  initForgotPasswordApi,
  resetPasswordApi
}
