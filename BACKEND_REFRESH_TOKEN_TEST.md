# 测试后端 Login 接口是否返回 RefreshToken

## PowerShell 测试命令

```powershell
# 替换为你的实际用户名和密码
$body = @{ 
    username = 'admin'
    password = 'your_password_here' 
} | ConvertTo-Json

# 调用登录接口
$response = Invoke-RestMethod -Uri 'http://localhost:8080/login' -Method POST -Body $body -ContentType 'application/json'

# 显示完整响应
Write-Host "=== Full Response ===" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10

# 检查关键字段
Write-Host "`n=== Key Fields Check ===" -ForegroundColor Green
Write-Host "Code: $($response.code)"
Write-Host "Message: $($response.msg)"
Write-Host "Has token: $($null -ne $response.data.token)"
Write-Host "Has expiresIn: $($null -ne $response.data.expiresIn)"
Write-Host "Has refreshToken: $($null -ne $response.data.refreshToken)"
Write-Host "Has refreshExpiresIn: $($null -ne $response.data.refreshExpiresIn)"
Write-Host "Has user: $($null -ne $response.data.user)"

# 如果有refreshToken，显示前20个字符
if ($response.data.refreshToken) {
    $preview = $response.data.refreshToken.Substring(0, [Math]::Min(20, $response.data.refreshToken.Length))
    Write-Host "`nRefreshToken preview: $preview..."
} else {
    Write-Host "`n❌ WARNING: No refreshToken in response!" -ForegroundColor Red
}
```

## 预期的成功响应

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoi...",
    "expiresIn": 3600,
    "refreshToken": "B64randomstring...",
    "refreshExpiresIn": 604800,
    "user": {
      "id": 1,
      "username": "admin",
      "name": "Admin User"
    }
  }
}
```

## 故障排查步骤

### 1. 确认后端已重启
```powershell
# 检查Java进程
Get-Process | Where-Object {$_.ProcessName -like "*java*"}

# 如果需要重启，先停止旧进程
# Stop-Process -Name java -Force

# 然后重新启动后端服务
# cd G:\sucode\ysd-parcel-project\ysd-parcel-management
# mvn spring-boot:run
```

### 2. 检查后端日志
查看后端启动日志，确认：
- RefreshTokenService bean 已加载
- 没有 Mapper 加载异常
- /login 和 /refresh 端点已注册

### 3. 如果返回中没有 refreshToken

可能的原因：
1. **后端未重启** - 旧代码仍在运行
2. **多个后端实例** - 请求打到了旧实例上
3. **代码未编译** - 修改未生效，需要重新编译
4. **配置问题** - RefreshTokenService 配置有误

### 4. 验证前端是否正确接收

在浏览器控制台查看登录后的日志：
```
[Login] Full response: { code: 1, data: {...} }
[Login] Extracted data: { hasToken: true, hasUser: true, hasRefreshToken: true }
[TokenManager] Token saved. Expires in: 3600 seconds
[Login] Token auto-refresh scheduled
[TokenRefresh] Auto-refresh scheduled in 55 minutes
```

如果看到 `hasRefreshToken: false`，说明后端确实没有返回。

## 前端当前状态 ✅

前端已完成以下优化（根据后端开发者建议）：

### 1. ✅ 白名单机制
```javascript
const AUTH_WHITELIST = ['/login', '/register', '/refresh', '/public']
```

### 2. ✅ Refresh 返回 null 而不是抛错
```javascript
if (!refreshToken) {
  return null; // 不抛异常
}
```

### 3. ✅ 保存新的 refreshToken（轮换）
```javascript
const { token, expiresIn, refreshToken: newRefreshToken, refreshExpiresIn } = response.data.data
saveTokenInfo(token, expiresIn, newRefreshToken, refreshExpiresIn)
```

### 4. ✅ 401 响应处理
```javascript
if (status === 401) {
  const refreshResult = await refreshAccessToken()
  if (refreshResult && refreshResult.token) {
    // 重试
  } else {
    // 跳转登录
  }
}
```

## 下一步行动

### 方案 A：验证后端（推荐）
1. 运行上面的 PowerShell 测试命令
2. 将输出结果反馈给我
3. 我帮你诊断问题

### 方案 B：前端降级（临时）
如果后端暂时无法提供 refreshToken：
- 前端已支持降级（没有 refreshToken 时使用默认过期时间）
- Token 过期后会显示 "Log In Again" 按钮
- 用户需要手动重新登录

### 方案 C：后端支持（长期）
1. 确认后端代码已包含最新修改
2. 重新编译：`mvn clean package`
3. 重启服务
4. 运行测试命令验证

---

**修改文件**：
- `src/utils/tokenRefresh.js` - 优化 refresh 逻辑，保存新的 refreshToken
- `src/utils/request.js` - 优化 401 处理
- `src/api/login.js` - 已正确保存 refreshToken

**当前状态**：前端已完全符合后端开发者的建议，等待后端确认返回 refreshToken。
