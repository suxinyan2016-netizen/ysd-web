# Token 登录问题修复

## 问题描述

用户点击登录后，报错：
```
[HTTP Request] Token status: NO_TOKEN - No token available
[HTTP Request] Token expired, attempting to refresh...
[TokenRefresh] No refresh token available
Token refresh failed: No refresh token
```

**根本原因**：登录请求被 token 拦截器检测到，尝试刷新 token，但此时还没有登录，没有 refresh token，导致报错。

## 修复内容

### 1. request.js - 添加白名单机制

**修改位置**：`src/utils/request.js`

**新增内容**：
```javascript
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
```

**request 拦截器修改**：
```javascript
request.interceptors.request.use(
  async (config) => {
    // 检查是否跳过认证（白名单或自定义 skipAuth 标记）
    const skipAuth = config.skipAuth === true || isInWhitelist(config.url)
    if (skipAuth) {
      console.log('[HTTP Request] Skipping auth for:', config.url)
      return config
    }
    
    // ... 其他 token 检查逻辑
  }
)
```

### 2. tokenRefresh.js - 修改错误处理

**修改位置**：`src/utils/tokenRefresh.js`

**修改前**：
```javascript
if (!refreshToken) {
  console.warn('[TokenRefresh] No refresh token available');
  throw new Error('No refresh token');
}
```

**修改后**：
```javascript
if (!refreshToken) {
  console.warn('[TokenRefresh] No refresh token available');
  return false;  // 返回 false 而不是抛错
}
```

**catch 块修改前**：
```javascript
} catch (error) {
  // ...
  throw error;
}
```

**catch 块修改后**：
```javascript
} catch (error) {
  // ...
  return false;  // 返回 false 而不是抛错
}
```

### 3. login.js - 添加 skipAuth 标记

**修改位置**：`src/api/login.js`

**修改前**：
```javascript
export const loginApi = (data) => request.post('/login', data)
```

**修改后**：
```javascript
export const loginApi = (data) => request.post('/login', data, { skipAuth: true })
```

## 修复效果

### 修复前
1. 用户点击登录
2. request 拦截器检测到没有 token
3. 尝试刷新 token
4. 没有 refresh token，抛出错误
5. 登录失败 ❌

### 修复后
1. 用户点击登录
2. request 拦截器检测到 `/login` 在白名单中或有 `skipAuth` 标记
3. 跳过 token 检查，直接发送请求
4. 登录成功，保存 token
5. 后续请求正常使用 token ✅

## 白名单说明

当前白名单包含：
- `/login` - 登录接口
- `/register` - 注册接口（如果有）
- `/refresh` - token 刷新接口
- `/public` - 公共资源接口

如需添加其他不需要 token 的接口，在 `AUTH_WHITELIST` 数组中添加路径即可。

## skipAuth 使用方法

如果某个接口不在白名单中，但也不需要 token，可以在调用时添加 `skipAuth` 标记：

```javascript
// 方法1: 在config中添加skipAuth
export const publicApi = (data) => request.get('/some-public-api', { 
  params: data,
  skipAuth: true 
})

// 方法2: 在请求时添加
request.post('/some-api', data, { skipAuth: true })
```

## 测试建议

1. **登录测试**：
   - 清除 localStorage 中的 token
   - 访问登录页面
   - 输入用户名密码点击登录
   - 验证登录成功，没有 token 错误

2. **token 刷新测试**：
   - 登录成功后
   - 等待 token 过期（或手动修改 localStorage 中的过期时间）
   - 发起任何需要 token 的请求
   - 验证自动刷新 token 并继续请求

3. **白名单测试**：
   - 测试所有白名单中的接口
   - 验证不需要 token 即可访问

## 注意事项

⚠️ **重要**：
- 白名单路径使用 `includes` 匹配，如 `/login` 会匹配 `/api/login`、`/user/login` 等
- 如果需要精确匹配，修改 `isInWhitelist` 函数使用 `===` 或正则表达式
- `skipAuth` 标记优先级高于白名单

## 后续优化建议

1. **细化白名单匹配**：使用正则表达式精确匹配接口路径
2. **添加更多公共接口**：如验证码、找回密码等
3. **日志优化**：在生产环境减少或关闭 token 相关的 console.log

---

**修复完成时间**：2026-01-15  
**修复文件**：
- `src/utils/request.js`
- `src/utils/tokenRefresh.js`
- `src/api/login.js`
