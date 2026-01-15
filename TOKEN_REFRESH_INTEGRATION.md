# Token过期自动刷新功能 - 集成文档

## 功能概览

已实现了完整的token过期检测、自动刷新和UI提示机制，提升了用户体验和系统安全性。

## 已实现的功能

### ✅ 1. Token状态检测
- [x] 检测token是否已过期
- [x] 检测token是否即将过期（5分钟缓冲）
- [x] 获取token剩余有效期
- [x] 获取token详细状态信息

**位置：** `src/utils/tokenManager.js`

### ✅ 2. 自动Token刷新
- [x] 请求前检查token状态
- [x] Token过期时自动发起刷新请求
- [x] 防重复刷新机制（多个请求同时到达时）
- [x] 刷新失败自动跳转登录页
- [x] 后台主动刷新（当token即将过期时）

**位置：** `src/utils/tokenRefresh.js`

### ✅ 3. HTTP拦截器增强
- [x] 请求拦截器：检查并刷新过期token
- [x] 响应拦截器：处理401错误并重试
- [x] 自动重试机制：使用新token重发失败请求
- [x] 完善的错误处理和日志

**位置：** `src/utils/request.js`

### ✅ 4. UI状态显示
- [x] Token状态条组件（TokenStatusBar）
- [x] Token倒计时显示
- [x] 手动刷新按钮
- [x] 过期/即将过期警告提示

**位置：** `src/components/common/TokenStatusBar.vue`

### ✅ 5. 登录集成
- [x] 登录成功保存token和过期时间
- [x] 支持refresh token存储
- [x] 自动调用token管理器保存信息

**位置：** `src/api/login.js`、`src/views/login/index.vue`

## 工作流程

```
用户操作
  ↓
发送请求
  ↓
[Request拦截器]
  ├─ 检查token状态 getTokenStatus()
  ├─ 如果已过期 → 调用 refreshAccessToken()
  ├─ 如果即将过期 → scheduleTokenRefresh()
  └─ 附加有效token到请求头
  ↓
后端处理
  ↓
[Response拦截器]
  ├─ 200成功 → 返回数据
  ├─ 401失败（未重试过）
  │   └─ 调用 refreshAccessToken()
  │   └─ 使用新token重试原请求
  └─ 其他错误 → 显示错误提示
  ↓
UI更新
  ↓
TokenStatusBar实时更新倒计时和状态
```

## 文件清单

### 新增文件

| 文件 | 说明 | 状态 |
|------|------|------|
| `src/utils/tokenManager.js` | Token信息管理和过期检测 | ✅ 已实现 |
| `src/utils/tokenRefresh.js` | Token刷新逻辑 | ✅ 已实现 |
| `src/components/common/TokenStatusBar.vue` | Token状态UI组件 | ✅ 已实现 |
| `TOKEN_REFRESH_API_REQUIREMENTS.md` | 后端接口需求文档 | ✅ 已创建 |

### 修改文件

| 文件 | 修改内容 | 状态 |
|------|--------|------|
| `src/utils/request.js` | 增强拦截器，加入token刷新逻辑 | ✅ 已更新 |
| `src/api/login.js` | 添加handleLoginResponse函数 | ✅ 已更新 |
| `src/views/login/index.vue` | 使用handleLoginResponse保存token信息 | ✅ 已更新 |
| `src/App.vue` | 集成TokenStatusBar组件 | ✅ 已更新 |

## 使用指南

### 对于前端开发者

#### 1. 登录页面已自动集成
```javascript
// 登录成功后自动保存token信息（包括过期时间）
handleLoginResponse(result)
```

#### 2. 所有API请求自动处理
```javascript
// 任何通过request发送的请求都会自动：
// - 检查token是否过期
// - 如果过期自动刷新
// - 自动携带有效token
const result = await request.get('/api/users')
```

#### 3. 手动检查token状态
```javascript
import { getTokenStatus, getTokenRemainingTime } from '@/utils/tokenManager'

const status = getTokenStatus()
console.log(status) // { status: 'VALID', message: '...', remainingMs: 1800000 }

const remaining = getTokenRemainingTime()
console.log(remaining) // 毫秒数
```

#### 4. 手动刷新token
```javascript
import { refreshAccessToken } from '@/utils/tokenRefresh'

try {
  const { token, expiresIn } = await refreshAccessToken()
  console.log('Token refreshed, expires in:', expiresIn, 'seconds')
} catch (error) {
  console.error('Refresh failed:', error)
}
```

### 对于后端开发者

**需要实现以下接口：**

1. **增强登录接口** `POST /login`
   - 现有功能保持不变
   - 在响应中添加：`expiresIn`、`refreshToken`、`refreshExpiresIn`

2. **新增刷新接口** `POST /refresh`
   - 输入：`refreshToken`
   - 输出：`token`、`expiresIn`、`refreshToken`（可选）、`refreshExpiresIn`
   - 不需要access token验证

详细需求见：`TOKEN_REFRESH_API_REQUIREMENTS.md`

## 配置说明

### Token过期缓冲时间

在 `src/utils/tokenManager.js` 中：
```javascript
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5分钟
```

这表示在token真正过期前5分钟，系统会认为token"即将过期"并进行刷新。可根据需求调整。

### 请求超时时间

在 `src/utils/request.js` 中：
```javascript
timeout: 600000 // 10分钟
```

### 背景刷新延迟

在 `src/utils/tokenRefresh.js` 中：
```javascript
const refreshDelay = Math.max(0, remainingMs - 5 * 60 * 1000);
```

在token剩余5分钟时触发背景刷新。可调整此值。

## 日志输出

系统会输出详细的日志帮助调试，包括：

```
[TokenManager] Token status updated: VALID
[HTTP Request] Token status: VALID - Token valid for 1800s
[TokenRefresh] Background token refresh triggered
[TokenRefresh] Token refreshed successfully
[HTTP Error] Received 401, attempting token refresh...
```

在浏览器开发者工具的Console中查看。

## 错误处理流程

### 场景1：Token已过期，刷新失败
```
请求发送
  ↓
Request拦截器检查到token已过期
  ↓
调用refreshAccessToken()
  ↓
POST /refresh返回401
  ↓
清除token信息
  ↓
显示"Session expired. Please log in again."
  ↓
跳转到登录页
```

### 场景2：请求返回401，重试仍失败
```
发送请求（携带token）
  ↓
后端返回401
  ↓
Response拦截器尝试刷新token
  ↓
刷新成功，使用新token重试
  ↓
如果重试还是401，则跳转登录页
```

### 场景3：网络错误
```
请求失败（无response）
  ↓
显示"Network Error: could not reach server"
  ↓
不自动跳转登录页（用户可重试）
```

## 测试建议

### 单元测试
```javascript
import { isTokenExpired, getTokenStatus } from '@/utils/tokenManager'

test('should detect expired token', () => {
  // 模拟已过期的token
  expect(isTokenExpired()).toBe(true)
})

test('should detect expiring soon token', () => {
  // 模拟即将过期的token（2分钟后）
  expect(isTokenExpiringSoon()).toBe(true)
})
```

### 集成测试
1. 登录并记录token过期时间
2. 等待token过期或伪造过期状态
3. 发送API请求
4. 验证是否自动刷新并重试
5. 检查UI是否显示正确的倒计时

### 手动测试步骤
1. 打开浏览器开发者工具（F12）
2. 进入Console标签
3. 登录成功后观察日志
4. 查看右上角TokenStatusBar的倒计时
5. 等待token过期或手动点击"Refresh Now"按钮
6. 观察是否自动刷新和发送请求

## 故障排除

### 问题1：TokenStatusBar不显示
**原因：** 可能在登录页面（route.path === '/login'）
**解决：** TokenStatusBar在非登录页才显示，登录成功后会自动显示

### 问题2：token不能自动刷新
**原因：** 后端未实现POST /refresh接口
**解决：** 按照`TOKEN_REFRESH_API_REQUIREMENTS.md`实现接口

### 问题3：用户被频繁踢回登录页
**原因：** 
- token过期时间设置过短
- 后端refresh token也过期了
**解决：** 
- 增加token过期时间
- 检查后端refresh token是否正确实现

### 问题4：多个请求同时发起重复刷新
**原因：** token刷新还在进行中
**解决：** 已实现防重复机制，第一个请求刷新，其他请求等待
- 可在日志中看到"Already refreshing, waiting for result..."

## 安全考虑

1. **Token存储**
   - Access token存储在localStorage（现有方式）
   - Refresh token也存储在localStorage
   - 建议生产环境考虑使用httpOnly cookie

2. **Token传输**
   - Access token通过请求头传输
   - Refresh token通过请求体POST传输
   - 建议使用HTTPS

3. **Token撤销**
   - 登出时清除本地token
   - 后端可实现refresh token黑名单

4. **Token轮换**
   - 每次刷新可返回新的refresh token
   - 提高安全性

## 性能优化

1. **请求合并**
   - 多个请求同时到达时，只发起一次刷新

2. **后台刷新**
   - 在token过期前主动刷新
   - 用户无感知

3. **缓冲时间**
   - 5分钟缓冲，避免网络延迟导致过期

## 相关文档

- [Token Refresh API需求](./TOKEN_REFRESH_API_REQUIREMENTS.md)
- [Vue Router文档](https://router.vuejs.org/)
- [Axios拦截器文档](https://axios-http.com/zh/docs/interceptors)
- [JWT最佳实践](https://tools.ietf.org/html/rfc8725)

## 支持和反馈

如有任何问题或建议，请：
1. 检查console中的日志输出
2. 查看TOKEN_REFRESH_API_REQUIREMENTS.md中的后端需求
3. 确认后端是否正确实现了接口
4. 联系前端团队

---

**最后更新：** 2026-01-15
**状态：** ✅ 生产就绪（需要后端配合实现）
