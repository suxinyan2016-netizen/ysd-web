/**
 * Token Refresh Manager - 处理token刷新逻辑
 * 包括：发起刷新请求、处理刷新失败、防止重复刷新等
 */

import axios from 'axios';
import { saveTokenInfo, clearTokenInfo, getTokenInfo } from './tokenManager';
import router from '@/router';
import { ElMessage } from 'element-plus';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// 用于防止多个刷新请求同时发起
let isRefreshing = false;
let refreshPromise = null;

/**
 * 发起token刷新请求
 * 注意：这个方法假设后端提供了 POST /refresh 接口
 * 该接口需要：
 *   - 接收 refresh_token（在请求头或body中）
 *   - 返回新的 access_token 和 expires_in
 * 
 * @returns {Promise<{token: string, expiresIn: number}>} 新的token信息
 */
export const refreshAccessToken = async () => {
  // 如果已经在刷新中，则等待刷新结果
  if (isRefreshing) {
    console.log('[TokenRefresh] Already refreshing, waiting for result...');
    return refreshPromise;
  }

  isRefreshing = true;

  try {
    const { refreshToken } = getTokenInfo();

    if (!refreshToken) {
      console.warn('[TokenRefresh] No refresh token available');
      return null; // 返回null而不是false，与后端建议一致
    }

    // 创建一个不需要token的axios实例来调用刷新接口
    const refreshInstance = axios.create({
      baseURL: API_BASE,
      timeout: 10000
    });

    console.log('[TokenRefresh] Sending refresh token request...');

    // 调用后端刷新接口
    refreshPromise = refreshInstance.post('/refresh', {
      refreshToken: refreshToken
    });

    const response = await refreshPromise;

    if (response.data && response.data.code === 1) {
      const { token: newToken, expiresIn, refreshToken: newRefreshToken, refreshExpiresIn } = response.data.data;

      // 保存新的token和新的refreshToken（后端实现了轮换）
      saveTokenInfo(newToken, expiresIn, newRefreshToken, refreshExpiresIn);

      console.log('[TokenRefresh] Token refreshed successfully, new tokens saved');

      return { token: newToken, expiresIn };
    } else {
      const message = response.data?.msg || 'Failed to refresh token';
      console.warn('[TokenRefresh] Refresh response not successful:', message);
      return null; // 逻辑失败（无效/过期）- 返回null
    }
  } catch (error) {
    console.error('[TokenRefresh] Network/server error during refresh:', error.message);
    // 网络/服务器错误 - 返回null让调用者决定怎么处理
    return null;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
};

/**
 * 处理token已过期的场景
 * 在发送请求前调用，如果token过期则先刷新token
 * 
 * @returns {Promise<string|null>} 返回有效的token，如果无法刷新则返回null
 */
export const ensureValidToken = async () => {
  const { token } = getTokenInfo();

  if (!token) {
    console.warn('[TokenRefresh] No token available');
    router.push('/login');
    return null;
  }

  try {
    const { token: validToken } = await refreshAccessToken();
    return validToken;
  } catch (error) {
    // 刷新失败，返回null，router已在refreshAccessToken中跳转登录
    return null;
  }
};

/**
 * 后台主动刷新token（当token即将过期时调用）
 * 这个方法在后台默默刷新，不打扰用户
 * 
 * @returns {Promise<void>}
 */
export const refreshTokenInBackground = async () => {
  try {
    console.log('[TokenRefresh] Background token refresh triggered');
    await refreshAccessToken();
  } catch (error) {
    // 失败时已在refreshAccessToken中处理，这里仅记录
    console.warn('[TokenRefresh] Background refresh failed, user will need to log in again on next request');
  }
};

/**
 * 计划后台刷新
 * 当token即将过期时，自动在过期前刷新
 * 
 * @param {number} remainingMs - token剩余有效期（毫秒）
 */
let refreshTimeoutId = null;

export const scheduleTokenRefresh = (remainingMs) => {
  // 检查是否有refresh token
  const { refreshToken } = getTokenInfo();
  if (!refreshToken) {
    console.warn('[TokenRefresh] Cannot schedule auto-refresh: no refresh token available');
    console.warn('[TokenRefresh] Backend needs to provide refreshToken in login response');
    return;
  }
  
  // 在剩余时间减去5分钟后，进行刷新（给刷新操作留出时间）
  const refreshDelay = Math.max(0, remainingMs - 5 * 60 * 1000);

  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
  }

  if (refreshDelay > 0) {
    const delayMinutes = Math.round(refreshDelay / 60000);
    console.log('[TokenRefresh] Auto-refresh scheduled in', delayMinutes, 'minutes (', Math.round(refreshDelay / 1000), 'seconds)');
    
    refreshTimeoutId = setTimeout(() => {
      refreshTokenInBackground();
    }, refreshDelay);
  } else {
    console.log('[TokenRefresh] Token will expire soon, refreshing immediately');
    refreshTokenInBackground();
  }
};

/**
 * 取消已计划的刷新
 */
export const cancelScheduledRefresh = () => {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
    console.log('[TokenRefresh] Scheduled refresh cancelled');
  }
};
