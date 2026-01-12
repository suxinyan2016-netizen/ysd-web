# Packing List 上传参数修正 - 快速参考

## 修改总结

| 文件 | 修改内容 | 行号 |
|------|---------|------|
| ParcelFileUpload.vue | 修改上传参数：ownerType→moduleType, ownerId→recordId, 新增imageType | 530-550 |
| useFileUpload.js | 导入 request 替代 axios | 1-3 |
| useFileUpload.js | uploadHandlers 中添加 upload 方法 | 12-22 |
| useFileUpload.js | 新增 uploadFile 函数 | 28-69 |

---

## 参数对照表

### 后台期望参数
```
GET/POST /upload
├─ moduleType (String): "PARCEL"
├─ recordId (Long): 123
├─ imageType (String): "PACKING_LIST" | "PACKAGE_SENDER" | "PACKAGE_RECEIVER" | "PACKAGE_LABEL"
└─ file (MultipartFile): 文件对象
```

### 前端发送格式（修改后）
```javascript
FormData {
  moduleType: "PARCEL",
  recordId: parcelId,           // 包裹ID
  imageType: "PACKING_LIST",    // 根据图片类型
  file: File
}
```

---

## 代码片段速查

### ParcelFileUpload.vue（修改位置）
```javascript
// 第 536-545 行
uploadResponse = await props.uploadHandlers.upload(file, {
  moduleType: "PARCEL",
  recordId: props.parcel.parcelId,
  imageType: fieldName === 'sender' ? 'PACKAGE_SENDER' 
           : fieldName === 'receiver' ? 'PACKAGE_RECEIVER'
           : fieldName === 'label' ? 'PACKAGE_LABEL'
           : 'PACKING_LIST',
});
```

### useFileUpload.js（新增代码）
```javascript
// uploadHandlers 中添加
upload: async (file, options) => {
  return uploadFile(file, options)
}

// uploadFile 函数
const uploadFile = async (file, options) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('moduleType', options.moduleType || 'PARCEL')
  formData.append('recordId', options.recordId || -1)
  formData.append('imageType', options.imageType || 'PACKAGE_SENDER')
  
  const response = await request.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  
  return { url: response.data?.imageUrl, ...response.data }
}
```

---

## 图片类型常量

| imageType | 说明 | 用途 |
|-----------|------|------|
| PACKAGE_SENDER | 发货前 | 包裹发货前照片 |
| PACKAGE_RECEIVER | 收货后 | 包裹收货后照片 |
| PACKAGE_LABEL | 标签 | 包裹标签/面单 |
| PACKING_LIST | 装箱清单 | 打包清单（可多张） |

---

## 调试命令

### 浏览器控制台测试
```javascript
// 查看上传参数
console.log('[useFileUpload] uploadFile - 请求参数: {...}')

// 查看上传响应
console.log('[useFileUpload] uploadFile 响应: {...}')

// 查看同步后的 packingList
console.log('[ParcelFileUpload] parcel.packingList after sync: {...}')
```

### Network 检查清单
- [ ] URL: `/upload`
- [ ] Method: `POST`
- [ ] Content-Type: `multipart/form-data`
- [ ] Form Data 包含: moduleType, recordId, imageType, file
- [ ] Response Status: 200
- [ ] Response 包含: imageUrl

---

## 常见错误与解决

| 错误 | 原因 | 解决方案 |
|------|------|--------|
| 400 Bad Request | 参数格式错误 | 检查 moduleType/recordId/imageType |
| 参数不被识别 | 仍然发送旧参数 | 清空缓存，重新加载 |
| 图片 URL 为空 | 响应处理错误 | 检查 response.data.imageUrl |
| 上传后无记录 | 后台未创建 image_attachment | 检查后台日志 |

---

## 验证清单

上传图片后检查：
- [ ] 浏览器 Console 显示正确的请求参数
- [ ] Network 标签显示 FormData 包含 moduleType="PARCEL"
- [ ] Network 标签显示 imageType 正确（如 "PACKING_LIST"）
- [ ] 响应状态码为 200，包含 imageUrl
- [ ] 图片 URL 格式正确（如 "/upload/xxxx.jpg"）
- [ ] 保存成功后，查询数据库有新的 image_attachment 记录

---

## 快速测试

```bash
# 1. 打开浏览器 F12

# 2. Console 标签输入（查看当前配置）
localStorage.getItem('loginUser')

# 3. 上传图片，观察 Console 输出

# 4. Network 标签查看 /upload 请求的 Form Data

# 5. 点击 Save，查看 parcel.packingList 是否有数据

# 6. 数据库查询验证
# SELECT * FROM image_attachment WHERE moduleType='PARCEL' ORDER BY id DESC;
```

