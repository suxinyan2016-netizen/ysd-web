# Token 过期时间问题修复

## 问题描述

登录成功后，点击菜单（如 parcel）时报错：

```
tokenManager.js:56 [TokenManager] Token saved. Expires in: undefined seconds
request.js:60 [HTTP Request] Token status: VALID - Token valid for NaNs
request.js:64 [HTTP Request] Token expired, attempting to refresh...
tokenRefresh.js:39 [TokenRefresh] No refresh token available
```

导致所有请求都失败，用户被清除登录状态。

## 问题根源

### 1. 后端没有返回 `expiresIn`
后端登录接口返回的数据中**没有 `expiresIn` 字段**，导致：
- `saveTokenInfo(token, undefined, ...)` 保存了 `undefined` 的过期时间
- `tokenExpiry` 计算结果为 `NaN`（`undefined * 1000`）
- localStorage 中保存了 `"NaN"` 字符串

### 2. `isTokenExpired()` 判断逻辑缺陷
原代码：
```javascript
export const isTokenExpired = () => {
  const { tokenExpiry } = getTokenInfo();
  if (!tokenExpiry) return true;  // ❌ NaN 也会进这里，但返回 true 是错误的
  // ...
}
```

当 `tokenExpiry` 为 `NaN` 时：
- `!tokenExpiry` 为 `false`（因为 `NaN` 是 truthy）
- `now >= tokenExpiry` 结果也是 `NaN`，被转换为 `false`
- 但在某些场景下会被认为已过期

### 3. 连锁反应
1. 认为 token 已过期
2. 尝试刷新 token
3. 没有 refresh token，返回 `false`
4. 清除所有 token
5. 后续所有请求都失败

## 修复方案

### 1. tokenManager.js - 增强向后兼容性

#### ✅ isTokenExpired() 修复
```javascript
export const isTokenExpired = () => {
  const { token, tokenExpiry } = getTokenInfo();
  
  // 如果没有token，认为已过期
  if (!token) return true;
  
  // 如果有token但没有过期时间，认为token长期有效（向后兼容）
  if (!tokenExpiry) {
    console.log('[TokenManager] Token has no expiry time, assuming valid');
    return false;  // ✅ 向后兼容：没有过期时间时，认为有效
  }

  const now = Date.now();
  const isExpired = now >= tokenExpiry;
  return isExpired;
};
```

**修改说明**：
- 检查是否有 token
- **如果有 token 但没有过期时间，认为 token 长期有效**（向后兼容旧系统）
- 只有在明确有过期时间的情况下才进行过期判断

#### ✅ isTokenExpiringSoon() 修复
```javascript
export const isTokenExpiringSoon = () => {
  const { tokenExpiry } = getTokenInfo();
  // 如果没有过期时间，认为不会即将过期（向后兼容）
  if (!tokenExpiry) return false;  // ✅ 改为 false
  // ...
};
```

#### ✅ isRefreshTokenExpired() 修复
```javascript
export const isRefreshTokenExpired = () => {
  const { refreshToken, refreshTokenExpiry } = getTokenInfo();
  
  // 如果没有refresh token，认为已过期
  if (!refreshToken) return true;
  
  // 如果有refresh token但没有过期时间，认为长期有效（向后兼容）
  if (!refreshTokenExpiry) return false;
  // ...
};
```

#### ✅ getTokenStatus() 修复
```javascript
export const getTokenStatus = () => {
  const { token, tokenExpiry } = getTokenInfo();
  
  if (!token) {
    return { status: 'NO_TOKEN', message: 'No token available' };
  }

  // 如果没有过期时间，认为长期有效
  if (!tokenExpiry) {
    return { 
      status: 'VALID', 
      message: 'Token valid (no expiry)', 
      remainingMs: Infinity 
    };
  }
  // ...
};
```

### 2. login.js - 设置默认过期时间

```javascript
export const handleLoginResponse = (response) => {
  if (response && response.code === 1 && response.data) {
    const { token, expiresIn, refreshToken, refreshExpiresIn, user } = response.data
    
    // ✅ 如果后端没有返回expiresIn，设置默认值86400秒（24小时）
    const tokenExpiresIn = expiresIn || 86400
    
    saveTokenInfo(token, tokenExpiresIn, refreshToken, refreshExpiresIn)
    
    // ...
    console.log('[Login] Token saved with expiry:', tokenExpiresIn, 'seconds', 
                expiresIn ? '' : '(default)')
  }
}
```

**默认值说明**：
- `86400` 秒 = 24 小时
- 这是一个合理的默认值，大多数系统的 session 有效期
- 如果需要其他默认值，可以修改这个数字

## 修复效果

### 修复前 ❌
```
1. 登录成功，token 保存，但 expiresIn = undefined
2. tokenExpiry = NaN
3. 访问 parcel 页面
4. isTokenExpired() 返回 true（错误判断）
5. 尝试刷新 token
6. 刷新失败，清除 token
7. 所有请求失败
```

### 修复后 ✅
```
1. 登录成功，token 保存
2. expiresIn = undefined → 自动设置为 86400（24小时）
3. tokenExpiry = Date.now() + 86400000（正常的时间戳）
4. 访问 parcel 页面
5. isTokenExpired() 返回 false（正确判断）
6. 正常携带 token 发送请求
7. 请求成功 ✅
```

或者，如果后端彻底不支持过期时间：
```
1. 登录成功，token 保存
2. expiresIn = undefined → 设置为 86400，但如果保存时也是 undefined
3. isTokenExpired() 检测到没有 tokenExpiry，假定长期有效
4. 返回 false，正常使用 token
5. 请求成功 ✅
```

## 兼容性说明

此修复方案向后兼容三种情况：

### 情况1：后端返回 `expiresIn`（标准情况）
- 正常使用后端提供的过期时间
- 自动刷新机制正常工作

### 情况2：后端不返回 `expiresIn`（当前情况）
- 使用默认值 86400 秒（24小时）
- token 在 24 小时后过期
- 用户需要重新登录

### 情况3：后端永远不会返回 `expiresIn`（旧系统）
- 如果 `saveTokenInfo` 时传入 `undefined`
- token 被认为长期有效
- 直到用户手动退出或后端返回 401

## 建议后端改进

虽然前端已经做了兼容处理，但**强烈建议后端在登录响应中添加 `expiresIn` 字段**：

### 后端响应格式（建议）
```json
{
  "code": 1,
  "msg": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 3600,  // ✅ 添加这个字段（秒）
    "refreshToken": "refresh_token_here",  // 可选
    "refreshExpiresIn": 604800,  // 可选（秒）
    "user": {
      "userId": 1,
      "name": "username",
      // ...
    }
  }
}
```

### 字段说明
- `expiresIn`: access token 有效期，**单位：秒**（建议 3600 = 1小时）
- `refreshToken`: 用于刷新 access token 的 refresh token（可选）
- `refreshExpiresIn`: refresh token 有效期，**单位：秒**（可选，建议 604800 = 7天）

## 测试建议

### 1. 测试登录和访问
```
1. 清除 localStorage
2. 登录
3. 检查控制台：应该显示 "Token saved with expiry: 86400 seconds (default)"
4. 点击 parcel 菜单
5. 检查控制台：应该显示 "Token has no expiry time, assuming valid" 或正常的剩余时间
6. 验证请求成功
```

### 2. 测试 token 刷新（需要后端支持）
```
1. 登录（后端返回 expiresIn 和 refreshToken）
2. 等待接近过期时间
3. 发起请求
4. 验证自动刷新 token
5. 验证请求成功
```

### 3. 测试兼容性
```
1. 修改 login.js，临时移除默认值设置
2. 登录
3. 验证即使 expiresIn = undefined，请求也能正常工作
```

## 注意事项

⚠️ **重要**：

1. **默认过期时间（24小时）是前端的妥协方案**
   - 实际应该由后端决定过期时间
   - 前端不应该替后端做安全决策

2. **没有过期时间的 token 风险**
   - 如果 token 泄露，可能被长期滥用
   - 建议后端尽快添加过期机制

3. **自动刷新功能需要后端支持**
   - 需要后端提供 `/refresh` 接口
   - 需要后端返回 `refreshToken` 和 `refreshExpiresIn`
   - 详见 [TOKEN_REFRESH_API_REQUIREMENTS.md](TOKEN_REFRESH_API_REQUIREMENTS.md)

4. **Token 安全性**
   - Token 存储在 localStorage 中，存在 XSS 风险
   - 建议后端使用短过期时间（如 1 小时）+ refresh token 机制
   - 敏感操作应该二次验证

## 相关文档

- [TOKEN_LOGIN_FIX.md](TOKEN_LOGIN_FIX.md) - 登录白名单修复
- [TOKEN_REFRESH_API_REQUIREMENTS.md](TOKEN_REFRESH_API_REQUIREMENTS.md) - 后端接口需求
- [TOKEN_REFRESH_SUMMARY.md](TOKEN_REFRESH_SUMMARY.md) - Token 刷新系统总览
- [README_TOKEN_REFRESH.md](README_TOKEN_REFRESH.md) - Token 刷新功能导航

---

**修复完成时间**：2026-01-15  
**修复文件**：
- `src/utils/tokenManager.js`
- `src/api/login.js`

**修复效果**：✅ 登录后可以正常访问所有页面，即使后端不返回 `expiresIn`
