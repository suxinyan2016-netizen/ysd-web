/**
 * Token Scheduler - Handles scheduling of token refresh
 * Separated to avoid circular dependency between tokenManager and tokenRefresh
 */

import { getTokenInfo } from './tokenManager'
import { refreshTokenInBackground } from './tokenRefresh'

let refreshTimeoutId = null;

/**
 * 计划后台刷新
 * 当token即将过期时，自动在过期前刷新
 * 
 * @param {number} remainingMs - token剩余有效期（毫秒）
 */
export const scheduleTokenRefresh = (remainingMs) => {
  // 检查是否有refresh token
  const { refreshToken } = getTokenInfo();
  if (!refreshToken) {
    console.warn('[TokenScheduler] Cannot schedule auto-refresh: no refresh token available');
    console.warn('[TokenScheduler] Backend needs to provide refreshToken in login response');
    return;
  }
  
  // 在剩余时间减去5分钟后，进行刷新（给刷新操作留出时间）
  const refreshDelay = Math.max(0, remainingMs - 5 * 60 * 1000);

  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
  }

  if (refreshDelay > 0) {
    const delayMinutes = Math.round(refreshDelay / 60000);
    console.log('[TokenScheduler] Auto-refresh scheduled in', delayMinutes, 'minutes (', Math.round(refreshDelay / 1000), 'seconds)');
    
    refreshTimeoutId = setTimeout(() => {
      refreshTokenInBackground();
    }, refreshDelay);
  } else {
    console.log('[TokenScheduler] Token will expire soon, refreshing immediately');
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
    console.log('[TokenScheduler] Scheduled refresh cancelled');
  }
};
