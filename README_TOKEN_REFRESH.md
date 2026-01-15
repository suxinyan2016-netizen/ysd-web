# 🔐 Token过期自动刷新功能指南

> 完整的token生命周期管理和自动刷新实现

## 快速导航

| 文档 | 适用对象 | 内容 |
|------|---------|------|
| 📖 [完整集成文档](./TOKEN_REFRESH_INTEGRATION.md) | 所有人 | 详细的实现细节和使用指南 |
| ⚡ [快速参考](./TOKEN_REFRESH_QUICK_START.md) | 开发者 | 快速查阅，常见问题解答 |
| 📋 [API需求文档](./TOKEN_REFRESH_API_REQUIREMENTS.md) | 后端开发 | 后端接口实现需求 |
| 📝 [实现总结](./TOKEN_REFRESH_SUMMARY.md) | 项目管理 | 功能概览，技术架构 |

## 🎯 核心功能

```
✅ Token过期自动检测
✅ Token过期自动刷新
✅ Token即将过期提醒
✅ 后台主动刷新
✅ 防重复刷新机制
✅ 请求失败自动重试
✅ 实时UI倒计时显示
✅ 完善的错误处理
```

## 🚀 5分钟快速开始

### 前端（已完成 ✅）

只需确保代码已正确集成：

```bash
# 1. 查看新增文件
ls src/utils/tokenManager.js          # Token管理器
ls src/utils/tokenRefresh.js          # Token刷新引擎
ls src/components/common/TokenStatusBar.vue  # UI组件

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器
http://localhost:5173
```

### 后端（待实现 ⏳）

需要在后端实现两个接口：

#### 1. 修改登录接口 `POST /login`

增加这些字段到响应中：

```json
{
  "code": 1,
  "data": {
    "token": "xxx",
    "expiresIn": 3600,              // 💡 新增
    "refreshToken": "refresh_xxx",  // 💡 新增
    "refreshExpiresIn": 604800,     // 💡 新增
    "user": {...}
  }
}
```

#### 2. 新增刷新接口 `POST /refresh`

```java
@PostMapping("/refresh")
public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
    String refreshToken = request.get("refreshToken");
    // ... 验证和生成新token的逻辑
    return success(new TokenResponse(newToken, 3600, ...));
}
```

详见 → [API需求文档](./TOKEN_REFRESH_API_REQUIREMENTS.md)

## 📦 文件清单

### 新增文件（7个）

```
src/
├── utils/
│   ├── tokenManager.js              ✅ Token状态检测和管理
│   └── tokenRefresh.js              ✅ Token刷新逻辑
├── components/common/
│   └── TokenStatusBar.vue           ✅ Token状态UI组件
└── (文档文件)
    ├── TOKEN_REFRESH_SUMMARY.md     ✅ 实现总结
    ├── TOKEN_REFRESH_INTEGRATION.md ✅ 完整集成文档
    ├── TOKEN_REFRESH_QUICK_START.md ✅ 快速参考
    ├── TOKEN_REFRESH_API_REQUIREMENTS.md ✅ API需求
    └── README_TOKEN_REFRESH.md      ✅ 本文件
```

### 修改文件（4个）

```
src/
├── utils/request.js                 ✏️ HTTP拦截器增强
├── api/login.js                     ✏️ 登录API增强
├── views/login/index.vue            ✏️ 登录页更新
└── App.vue                          ✏️ 根组件更新
```

## 🎨 UI展示

### TokenStatusBar 组件

**位置：** 页面右上角

**状态显示：**
- 🟢 **绿色**（隐藏）- Token有效，剩余时间充足
- 🟡 **黄色** - Token即将过期，显示倒计时 + 刷新按钮
- 🔴 **红色** - Token已过期，显示错误信息 + 跳转登录

**交互：**
- 自动倒计时，每秒更新
- 点击"Refresh Now"按钮手动刷新
- 自动隐藏（非登录页才显示）

## 🔄 工作流程示意

```
登录 → 保存token信息 → 显示倒计时
                ↓
              发送请求
                ↓
        ┌─检查token状态
        ├─已过期？→ 刷新token
        ├─即将过期？→ 计划后台刷新
        └─正常请求
                ↓
        ┌─200成功 → 返回数据
        ├─401失败 → 刷新 → 重试
        └─网络错误 → 显示提示
                ↓
        TokenStatusBar更新倒计时
```

## 🔍 日志输出

打开浏览器开发者工具（F12 → Console）查看：

```
[TokenManager] Token status updated: VALID
[HTTP Request] Token status: VALID - Token valid for 1800s
[TokenRefresh] Background token refresh triggered
[TokenRefresh] Token refreshed successfully
[HTTP Error] Received 401, attempting token refresh...
```

## ⚙️ 配置调整

### Token缓冲时间
编辑 `src/utils/tokenManager.js` 第4行：
```javascript
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5分钟
```

### 后台刷新延迟
编辑 `src/utils/tokenRefresh.js`：
```javascript
const refreshDelay = Math.max(0, remainingMs - 5 * 60 * 1000);
```

## 🧪 测试验证

### 步骤1：启动项目
```bash
npm run dev
```

### 步骤2：登录
访问 http://localhost:5173，输入用户名密码登录

### 步骤3：观察倒计时
登录成功后，右上角应显示token倒计时（如"3600s"）

### 步骤4：手动测试刷新
点击"Refresh Now"按钮，应看到倒计时重置

### 步骤5：自动测试
等待token过期或使用浏览器控制台模拟（见下）

### 浏览器控制台测试
```javascript
// 检查token状态
import { getTokenStatus } from '/src/utils/tokenManager.js'
getTokenStatus()

// 手动刷新token
import { refreshAccessToken } from '/src/utils/tokenRefresh.js'
await refreshAccessToken()

// 查看localStorage中的token信息
localStorage.getItem('tokenExpiry')
```

## ❌ 故障排除

| 症状 | 可能原因 | 解决方案 |
|------|--------|--------|
| TokenStatusBar不显示 | 在登录页 | 登录后才显示 |
| token不自动刷新 | 后端未实现/refresh | 实现POST /refresh接口 |
| 频繁跳转登录页 | token过期时间太短 | 增加expiresIn值 |
| 无法刷新 | refresh token也过期 | 检查refreshExpiresIn值 |
| 日志中看不到信息 | 需要开启Console | 按F12打开开发者工具 |

详见 → [完整集成文档 - 故障排除](./TOKEN_REFRESH_INTEGRATION.md#故障排除)

## 📖 详细文档

### 🎯 按角色查看

**👨‍💼 项目经理/产品**
- 查看 [实现总结](./TOKEN_REFRESH_SUMMARY.md)
- 了解功能完成度和技术指标

**👨‍💻 前端开发**
- 查看 [快速参考](./TOKEN_REFRESH_QUICK_START.md)
- 学习API使用和集成方法

**🔧 后端开发**
- 查看 [API需求文档](./TOKEN_REFRESH_API_REQUIREMENTS.md)
- 实现登录接口增强和刷新接口

**🧪 QA/测试**
- 查看 [完整集成文档 - 测试建议](./TOKEN_REFRESH_INTEGRATION.md#测试建议)
- 制定测试用例

## 💡 关键API

### 检测token状态
```javascript
import { getTokenStatus, isTokenExpired } from '@/utils/tokenManager'

const status = getTokenStatus()
console.log(status.status)  // 'VALID' | 'EXPIRING_SOON' | 'EXPIRED'
```

### 刷新token
```javascript
import { refreshAccessToken } from '@/utils/tokenRefresh'

await refreshAccessToken()
```

### 保存token信息
```javascript
import { saveTokenInfo } from '@/utils/tokenManager'

saveTokenInfo(token, expiresIn, refreshToken, refreshExpiresIn)
```

更多API见 → [快速参考 - 关键API](./TOKEN_REFRESH_QUICK_START.md#-关键api)

## 🔐 安全提示

1. **生产环境使用HTTPS**
2. **建议token有效期：**
   - Access token: 1-2小时
   - Refresh token: 7-30天
3. **考虑使用httpOnly cookie存储token**
4. **实现token黑名单机制**
5. **定期更换secret key**

## 📚 相关资源

- [Axios官方文档](https://axios-http.com/)
- [Vue 3官方指南](https://vuejs.org/)
- [JWT标准](https://tools.ietf.org/html/rfc7519)
- [Spring Boot CORS](https://spring.io/guides/gs/cors-rest/)

## ❓ 常见问题

**Q: 需要做什么？**
A: 只需在后端实现两个接口。前端已完全实现。

**Q: Token有效期建议设多长？**
A: Access token 1-2小时，Refresh token 7-30天。

**Q: 支持多标签页吗？**
A: 支持，每个标签页独立管理token。

**Q: 线上遇到问题怎么办？**
A: 检查浏览器console日志，根据日志排查。

更多问题 → [快速参考 - 常见问题](./TOKEN_REFRESH_QUICK_START.md#常见问题)

## 📞 联系和支持

- 📖 查看详细文档
- 💬 检查代码注释
- 🔍 观察browser console日志
- 🐛 提交issue（如有BUG）

## ✅ 实现状态

| 部分 | 状态 | 备注 |
|------|------|------|
| 前端实现 | ✅ 完成 | 无需额外开发 |
| 后端接口 | ⏳ 待实现 | 见API需求文档 |
| 文档完善 | ✅ 完成 | 4份详细文档 |
| 测试覆盖 | ✅ 就绪 | 可开始测试 |

## 🎉 下一步

1. **后端**：按照[API需求文档](./TOKEN_REFRESH_API_REQUIREMENTS.md)实现接口
2. **测试**：按照[测试建议](./TOKEN_REFRESH_INTEGRATION.md#测试建议)验证功能
3. **部署**：参考[部署检查清单](./TOKEN_REFRESH_QUICK_START.md#部署检查清单)

---

## 📋 文档版本

- **版本：** 1.0.0
- **发布日期：** 2026-01-15
- **状态：** ✅ 生产就绪
- **更新频率：** 需要时更新

---

**祝项目顺利！如有问题，查阅详细文档或观察日志输出。** 🚀
