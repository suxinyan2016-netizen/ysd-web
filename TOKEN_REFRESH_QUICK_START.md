# Token过期刷新 - 快速参考

## 🎯 核心功能

| 功能 | 说明 | 自动/手动 |
|------|------|---------|
| 过期检测 | 自动检测access token是否过期 | 自动 |
| 自动刷新 | token过期时自动刷新 | 自动 |
| 防重复 | 多个请求同时到达时防重复刷新 | 自动 |
| 重试机制 | 刷新成功后自动重试原请求 | 自动 |
| 后台刷新 | token即将过期时后台主动刷新 | 自动 |
| UI提示 | 显示token倒计时和状态 | 自动 |
| 手动刷新 | 用户可手动点击按钮刷新 | 手动 |

## 📁 文件结构

```
src/
├── utils/
│   ├── tokenManager.js          ← Token状态检测和管理
│   ├── tokenRefresh.js          ← Token刷新逻辑
│   └── request.js               ← HTTP拦截器（已增强）
├── api/
│   └── login.js                 ← 登录API（已增强）
├── components/common/
│   └── TokenStatusBar.vue       ← Token状态UI组件
├── views/login/
│   └── index.vue                ← 登录页（已增强）
└── App.vue                       ← 根组件（已增强）
```

## ⚡ 快速开始（后端）

### 步骤1：修改登录接口返回

```java
// 原来的返回
{
  "code": 1,
  "msg": "Login successful",
  "data": {
    "token": "xxx",
    "user": {...}
  }
}

// 改为
{
  "code": 1,
  "msg": "Login successful",
  "data": {
    "token": "xxx",
    "expiresIn": 3600,              // ⭐ 新增
    "refreshToken": "refresh_xxx",  // ⭐ 新增
    "refreshExpiresIn": 604800,     // ⭐ 新增
    "user": {...}
  }
}
```

### 步骤2：实现刷新接口

```java
@PostMapping("/refresh")
public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
    String refreshToken = request.get("refreshToken");
    
    // 验证refresh token
    if (isInvalid(refreshToken)) {
        return error(401, "Invalid refresh token");
    }
    
    // 生成新token
    String newToken = generateToken(extractUserId(refreshToken), 3600);
    
    return success(new TokenResponse(
        newToken,
        3600,
        refreshToken,  // 可选：返回新的
        604800
    ));
}
```

### 步骤3：测试

1. 启动前端开发服务器
2. 打开浏览器访问 http://localhost:5173
3. 登录成功后看到右上角倒计时
4. 等待token过期或手动点击刷新按钮

## 🔍 关键API

### 检测token状态
```javascript
import { getTokenStatus, isTokenExpired, isTokenExpiringSoon } from '@/utils/tokenManager'

// 获取完整状态
const status = getTokenStatus()
// { status: 'VALID'|'EXPIRING_SOON'|'EXPIRED', message: '...', remainingMs: 1800000 }

// 检查是否过期
if (isTokenExpired()) { }

// 检查是否即将过期
if (isTokenExpiringSoon()) { }
```

### 刷新token
```javascript
import { refreshAccessToken } from '@/utils/tokenRefresh'

try {
  const { token, expiresIn } = await refreshAccessToken()
  console.log('新token已获取')
} catch (error) {
  console.log('刷新失败，已跳转登录页')
}
```

### 保存token信息
```javascript
import { saveTokenInfo } from '@/utils/tokenManager'

// 登录后调用此方法（登录页已自动调用）
saveTokenInfo(token, expiresIn, refreshToken, refreshExpiresIn)
```

## 🔄 工作流程

### 正常请求流程
```
用户发起请求
    ↓
检查token是否过期 ← tokenManager.isTokenExpired()
    ↓ 是 ↓ 否
刷新 → 正常请求
```

### 401错误恢复流程
```
请求返回401
    ↓
检查是否重试过 ← originalRequest._retry
    ↓ 未重试 ↓ 已重试
刷新token → 返回错误，跳转登录
    ↓
重试原请求
    ↓
返回数据
```

### 后台刷新流程
```
发送请求时检查token
    ↓
token即将过期？
    ↓ 是 ↓ 否
计划后台刷新 → 继续
    ↓
在token过期前5分钟触发刷新
```

## 📊 Token状态转换

```
[VALID] ← 刚登录或刚刷新
   ↓
   ← 5分钟后变为
[EXPIRING_SOON] ← 自动后台刷新
   ↓
   ← 如果没刷新，继续到期
[EXPIRED] ← 下一个请求时自动刷新或跳转登录
```

## 🎨 UI组件

### TokenStatusBar（自动显示）
- 位置：页面右上角
- 显示：token倒计时
- 状态：
  - 绿色 → token有效（不显示）
  - 黄色 → token即将过期（显示倒计时和刷新按钮）
  - 红色 → token已过期（显示错误信息）

### 手动刷新
点击TokenStatusBar中的"Refresh Now"按钮可手动刷新token。

## 🚨 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| Token已过期 | access token到期 | 自动刷新 |
| Refresh token已过期 | refresh token也过期 | 跳转登录 |
| 网络错误 | 无法连接后端 | 显示提示，用户可重试 |
| 401 Unauthorized | token无效 | 尝试刷新，失败跳转登录 |

## 🔐 安全建议

1. **Token有效期设置**
   - Access token：1-2小时（3600-7200秒）
   - Refresh token：7-30天（604800-2592000秒）

2. **HTTPS**
   - 生产环境必须使用HTTPS

3. **HttpOnly Cookie**
   - 考虑使用httpOnly cookie代替localStorage存储token

4. **Token黑名单**
   - 登出时添加到黑名单

5. **Token轮换**
   - 每次刷新返回新的refresh token

## 📝 配置调整

### 修改token过期缓冲时间
编辑 `src/utils/tokenManager.js`：
```javascript
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 改为想要的毫秒数
```

### 修改后台刷新延迟
编辑 `src/utils/tokenRefresh.js`：
```javascript
const refreshDelay = Math.max(0, remainingMs - 5 * 60 * 1000);
// 改为想要的延迟值
```

## 🐛 常见问题

**Q: 为什么没有看到TokenStatusBar？**
A: TokenStatusBar只在非登录页显示。登录后才会显示。

**Q: 手动刷新后还是401？**
A: 可能是后端的POST /refresh接口没有正确实现。检查后端日志。

**Q: 多个标签页打开会有问题吗？**
A: 不会。每个标签页独立管理token，相互不影响。

**Q: 能否禁用自动刷新？**
A: 可以注释掉request.js中的刷新逻辑，但不推荐。

## 📞 后端接口清单

| 接口 | 方法 | 现有 | 需改进 | 需新增 |
|------|------|------|--------|--------|
| /login | POST | ✅ | 添加expiresIn等字段 | - |
| /refresh | POST | ❌ | - | ✅ 需实现 |
| 其他API | * | ✅ | - | - |

## 🚀 部署检查清单

- [ ] 后端修改了登录接口，返回expiresIn等字段
- [ ] 后端实现了POST /refresh接口
- [ ] 前端已启动开发服务器
- [ ] 登录成功后可看到右上角倒计时
- [ ] 手动点击"Refresh Now"可正常工作
- [ ] 等待token过期时能自动跳转登录页
- [ ] 检查浏览器console是否有错误日志
- [ ] 生产环境使用HTTPS

## 📚 相关文档

- [完整集成文档](./TOKEN_REFRESH_INTEGRATION.md)
- [API需求文档](./TOKEN_REFRESH_API_REQUIREMENTS.md)
- [Vue官方文档](https://vuejs.org/)
- [Axios文档](https://axios-http.com/)

---

**状态：** ✅ 生产就绪（需要后端配合）
**最后更新：** 2026-01-15
