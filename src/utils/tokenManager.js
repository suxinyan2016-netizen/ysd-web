/**
 * Token Manager - 管理 access token 和 refresh token 的有效期
 * 包括：检测过期、刷新token、清除token等
 */

const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5分钟缓冲时间（即将过期的阈值）
const STORAGE_KEYS = {
  LOGIN_USER: 'loginUser',
  TOKEN_EXPIRY: 'tokenExpiry',
  REFRESH_TOKEN: 'refreshToken',
  REFRESH_TOKEN_EXPIRY: 'refreshTokenExpiry'
};

/**
 * 获取当前保存的token信息
 */
export const getTokenInfo = () => {
  const loginUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGIN_USER) || '{}');
  const tokenExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  const refreshTokenExpiry = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY);

  return {
    token: loginUser.token || null,
    tokenExpiry: tokenExpiry ? parseInt(tokenExpiry) : null,
    refreshToken: refreshToken,
    refreshTokenExpiry: refreshTokenExpiry ? parseInt(refreshTokenExpiry) : null,
    loginUser: loginUser
  };
};

/**
 * 保存token和过期时间
 * @param {string} token - access token
 * @param {number} expiresIn - token有效期（秒）
 * @param {string} refreshToken - refresh token（可选）
 * @param {number} refreshExpiresIn - refresh token有效期（秒，可选）
 */
export const saveTokenInfo = (token, expiresIn, refreshToken = null, refreshExpiresIn = null) => {
  const now = Date.now();
  const tokenExpiry = now + (expiresIn * 1000);

  // 保存access token相关信息
  const loginUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGIN_USER) || '{}');
  loginUser.token = token;
  localStorage.setItem(STORAGE_KEYS.LOGIN_USER, JSON.stringify(loginUser));
  localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry.toString());

  // 保存refresh token相关信息（如果提供了的话）
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    const refreshTokenExpiry = now + (refreshExpiresIn * 1000);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, refreshTokenExpiry.toString());
  }

  console.log('[TokenManager] Token saved. Expires in:', expiresIn, 'seconds');
  
  // 计划自动刷新
  if (expiresIn && typeof window !== 'undefined') {
    // 动态导入避免循环依赖
    import('./tokenRefresh.js').then(({ scheduleTokenRefresh }) => {
      const remainingMs = expiresIn * 1000
      scheduleTokenRefresh(remainingMs)
    })
  }
};

/**
 * 检查token是否已过期
 * @returns {boolean} true 表示已过期，false 表示未过期
 */
export const isTokenExpired = () => {
  const { token, tokenExpiry } = getTokenInfo();
  
  // 如果没有token，认为已过期
  if (!token) return true;
  
  // 如果有token但没有过期时间，认为token长期有效（向后兼容）
  if (!tokenExpiry) {
    console.log('[TokenManager] Token has no expiry time, assuming valid');
    return false;
  }

  const now = Date.now();
  const isExpired = now >= tokenExpiry;
  
  if (isExpired) {
    console.log('[TokenManager] Access token expired');
  }
  
  return isExpired;
};

/**
 * 检查token是否即将过期（在缓冲时间内）
 * @returns {boolean} true 表示即将过期，false 表示还有充足时间
 */
export const isTokenExpiringSoon = () => {
  const { tokenExpiry } = getTokenInfo();
  // 如果没有过期时间，认为不会即将过期（向后兼容）
  if (!tokenExpiry) return false;

  const now = Date.now();
  const expiresIn = tokenExpiry - now;
  const isExpiringSoon = expiresIn < TOKEN_EXPIRY_BUFFER && expiresIn > 0;

  if (isExpiringSoon) {
    console.log('[TokenManager] Token expiring soon. Expires in:', Math.round(expiresIn / 1000), 'seconds');
  }

  return isExpiringSoon;
};

/**
 * 检查refresh token是否已过期
 * @returns {boolean} true 表示已过期，false 表示未过期
 */
export const isRefreshTokenExpired = () => {
  const { refreshToken, refreshTokenExpiry } = getTokenInfo();
  
  // 如果没有refresh token，认为已过期
  if (!refreshToken) return true;
  
  // 如果有refresh token但没有过期时间，认为长期有效（向后兼容）
  if (!refreshTokenExpiry) return false;

  const now = Date.now();
  const isExpired = now >= refreshTokenExpiry;

  if (isExpired) {
    console.log('[TokenManager] Refresh token expired');
  }

  return isExpired;
};

/**
 * 清除所有token信息
 */
export const clearTokenInfo = () => {
  localStorage.removeItem(STORAGE_KEYS.LOGIN_USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY);
  console.log('[TokenManager] All token info cleared');
};

/**
 * 获取token剩余有效期（毫秒）
 * @returns {number} 剩余毫秒数，如果过期则返回0
 */
export const getTokenRemainingTime = () => {
  const { tokenExpiry } = getTokenInfo();
  if (!tokenExpiry) return 0;

  const now = Date.now();
  const remaining = Math.max(0, tokenExpiry - now);
  return remaining;
};

/**
 * 获取token过期状态的详细信息
 */
export const getTokenStatus = () => {
  const { token, tokenExpiry } = getTokenInfo();
  const now = Date.now();

  if (!token) {
    return { status: 'NO_TOKEN', message: 'No token available' };
  }

  // 如果没有过期时间，认为长期有效
  if (!tokenExpiry) {
    return { status: 'VALID', message: 'Token valid (no expiry)', remainingMs: Infinity };
  }

  if (now >= tokenExpiry) {
    return { status: 'EXPIRED', message: 'Token has expired', remainingMs: 0 };
  }

  const remainingMs = tokenExpiry - now;
  const remainingSec = Math.round(remainingMs / 1000);

  if (remainingMs < TOKEN_EXPIRY_BUFFER) {
    return { 
      status: 'EXPIRING_SOON', 
      message: `Token expires in ${remainingSec}s`, 
      remainingMs 
    };
  }

  return { 
    status: 'VALID', 
    message: `Token valid for ${remainingSec}s`, 
    remainingMs 
  };
};
