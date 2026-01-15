# Token Refresh API Requirements

## 概述
为了实现完整的token过期自动刷新和UI交互优化，前端需要后端提供以下接口和功能。

## 1. 登录接口增强

### 现有接口：`POST /login`

**当前返回：**
```json
{
  "code": 1,
  "msg": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "userId": 1,
      "name": "Admin",
      "role": "admin"
    }
  }
}
```

**需要改进为（新增字段）：**
```json
{
  "code": 1,
  "msg": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "expiresIn": 3600,           // ✅ 新增：token有效期（秒）
    "refreshToken": "refresh_...", // ✅ 新增：用于刷新token的凭证
    "refreshExpiresIn": 604800,   // ✅ 新增：refresh token有效期（秒，通常较长，如7天）
    "user": {
      "userId": 1,
      "name": "Admin",
      "role": "admin"
    }
  }
}
```

**字段说明：**
- `expiresIn`: access token的有效期，建议值：1-2小时（3600-7200秒）
- `refreshToken`: 用于刷新access token的令牌，应与access token分离
- `refreshExpiresIn`: refresh token的有效期，建议值：7天-30天（604800-2592000秒）

---

## 2. Token刷新接口（新增）

### 接口：`POST /refresh`

**功能说明：**
使用refresh token获取新的access token，用于在原token过期时续期。

**请求头：**
```
POST /refresh HTTP/1.1
Content-Type: application/json
```

**请求体：**
```json
{
  "refreshToken": "refresh_eyJhbGc..."
}
```

**成功响应 (200)：**
```json
{
  "code": 1,
  "msg": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGc_new...",
    "expiresIn": 3600,
    "refreshToken": "refresh_eyJhbGc_new...",  // 可选：可以返回新的refresh token
    "refreshExpiresIn": 604800
  }
}
```

**失败响应 (401)：**
```json
{
  "code": 0,
  "msg": "Invalid or expired refresh token",
  "status": 401
}
```

**关键要求：**
1. ✅ **不需要**access token就可以调用此接口（无需在请求头中验证）
2. ✅ 验证refresh token的有效性和过期时间
3. ✅ 返回新的access token和对应的有效期
4. ✅ 可选：同时返回新的refresh token（实现token轮换机制）
5. ✅ 如果refresh token过期或无效，返回401错误

---

## 3. 登出接口增强（可选）

### 接口：`POST /logout`

**功能说明：**
使refresh token失效，完全注销用户session。

**请求头：**
```
POST /logout HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json
```

**请求体：**
```json
{
  "refreshToken": "refresh_eyJhbGc..."
}
```

**响应：**
```json
{
  "code": 1,
  "msg": "Logged out successfully"
}
```

---

## 4. 实现细节建议

### Token验证逻辑

```java
// 伪代码示例
@PostMapping("/refresh")
public ResponseEntity<?> refresh(@RequestBody RefreshTokenRequest request) {
    String refreshToken = request.getRefreshToken();
    
    // 1. 检查refresh token是否存在且未过期
    if (refreshToken == null || isTokenExpired(refreshToken)) {
        return ResponseEntity.status(401)
            .body(new ApiResponse(0, "Invalid or expired refresh token"));
    }
    
    // 2. 从refresh token中解析用户ID
    Long userId = extractUserIdFromToken(refreshToken);
    
    // 3. 生成新的access token
    String newAccessToken = generateToken(userId, EXPIRY_TIME_1_HOUR);
    
    // 4. 可选：生成新的refresh token（实现token轮换）
    String newRefreshToken = generateToken(userId, EXPIRY_TIME_7_DAYS);
    
    // 5. 返回新token
    return ResponseEntity.ok(new ApiResponse(1, "Success", 
        new TokenResponse(newAccessToken, 3600, newRefreshToken, 604800)));
}
```

### Token存储建议

**后端存储方案（二选一）：**

1. **JWT方案（推荐）：**
   - Token本身包含过期信息
   - 无需数据库查询，性能好
   - 需要实现token黑名单机制（可选）

2. **数据库方案：**
   - 在数据库中存储refresh token及其过期时间
   - 支持手动撤销token
   - 需要数据库查询，性能相对较低

---

## 5. 前端集成流程

前端已实现的自动流程：

```
用户请求
  ↓
[request拦截器] 检查token状态
  ├─ token有效 → 正常请求
  ├─ token已过期 → 自动调用POST /refresh刷新
  └─ token即将过期 → 在后台计划刷新
  ↓
发送请求
  ↓
[response拦截器] 检查响应状态
  ├─ 401 → 如果未重试过，调用POST /refresh → 重试原请求
  └─ 其他错误 → 显示错误信息
```

---

## 6. 测试用例

建议后端实现测试用例验证：

```java
@Test
public void testRefreshTokenSuccess() {
    // 1. 登录获取token
    // 2. 等待access token过期（或模拟过期）
    // 3. 调用POST /refresh
    // 4. 验证返回新的有效token
    // 5. 使用新token访问受保护资源
}

@Test
public void testRefreshTokenExpired() {
    // 1. 使用过期的refresh token调用POST /refresh
    // 2. 验证返回401错误
}

@Test
public void testConcurrentRefresh() {
    // 1. 同时发送多个刷新请求
    // 2. 验证不会重复生成token
}
```

---

## 7. 前端已实现的功能

✅ Token过期检测
✅ Token自动刷新
✅ Token即将过期提醒
✅ 后台主动刷新
✅ 重试机制
✅ UI状态显示（TokenStatusBar组件）
✅ 错误处理和用户提示

---

## 8. 后续优化空间

1. **Token轮换机制**：每次刷新时都返回新的refresh token
2. **Token黑名单**：登出时将token加入黑名单
3. **多设备登录管理**：支持同时登录多个设备，每个设备有独立的refresh token
4. **访问日志**：记录token刷新日志便于审计
5. **IP白名单**：额外的安全措施

---

## 9. 前端依赖

前端已创建以下文件，后端实现接口时前端会自动集成：

- `src/utils/tokenManager.js` - Token信息管理
- `src/utils/tokenRefresh.js` - Token刷新逻辑
- `src/utils/request.js` - HTTP拦截器（已更新）
- `src/api/login.js` - 登录API（已更新）
- `src/components/common/TokenStatusBar.vue` - Token状态UI显示

---

## 10. 快速开始集成

### 步骤1：后端修改登录接口

在现有登录接口基础上，添加token过期时间字段：

```java
// 返回示例
{
    "code": 1,
    "msg": "Login successful",
    "data": {
        "token": "新的access token",
        "expiresIn": 3600,          // 添加这一行
        "refreshToken": "新的refresh token",  // 添加这一行
        "refreshExpiresIn": 604800,  // 添加这一行
        "user": {...}
    }
}
```

### 步骤2：后端实现POST /refresh接口

```java
@PostMapping("/refresh")
public ResponseEntity<?> refresh(@RequestBody TokenRefreshRequest request) {
    // 验证和刷新逻辑
    // 返回新token
}
```

### 步骤3：前端测试

1. 重启开发服务器
2. 访问登录页
3. 使用TokenStatusBar查看token倒计时
4. 测试token过期自动刷新

---

## 11. 常见问题

**Q: Token过期时间应该设置多长？**
A: 建议access token 1-2小时，refresh token 7-30天。时间越短安全性越高，但用户体验会下降。

**Q: 需要在数据库中保存refresh token吗？**
A: 如果使用JWT，可以不保存。如果需要在后端撤销token，则需要保存。

**Q: 多个请求同时到达时怎么处理？**
A: 前端已实现防重复刷新机制，只有第一个请求会触发刷新，其他请求会等待结果。

**Q: 用户在token即将过期时关闭浏览器怎么办？**
A: 用户下次登录时会重新获取新token，现有机制已处理。

---

## 联系方式

如有问题或需要调整接口，请联系前端团队。
