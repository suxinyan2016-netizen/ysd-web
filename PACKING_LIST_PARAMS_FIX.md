# Packing List 参数修正 - 前端适配后台接口

## 问题描述
前端发送的参数格式与后台接口不匹配。

## 参数映射关系

### 后台接口期望的参数
```java
@PostMapping("/upload")
public Result upload(
    @RequestParam("moduleType") String moduleType,    // 模块类型
    @RequestParam("recordId") Long recordId,          // 关联记录ID
    @RequestParam("imageType") String imageType,      // 图片类型编码
    @RequestParam("file") MultipartFile file          // 文件
)
```

### 前端修改前的参数（错误）
```javascript
{
  ownerType: "PACKAGE",      // ❌ 错误字段名
  ownerId: parcelId          // ❌ 错误字段名
}
```

### 前端修改后的参数（正确）
```javascript
{
  moduleType: "PARCEL",                              // ✅ 正确字段名
  recordId: parcelId,                                // ✅ 正确字段名
  imageType: 'PACKAGE_SENDER' |                      // ✅ 根据上传类型
            'PACKAGE_RECEIVER' |                     
            'PACKAGE_LABEL' |
            'PACKING_LIST'
}
```

---

## 修改的文件

### 1. ParcelFileUpload.vue
**位置**：`src/components/parcel/ParcelFileUpload.vue` (第 530-550 行)

**修改内容**：
```javascript
// 修改前
uploadResponse = await props.uploadHandlers.upload(file, {
  ownerType: "PACKAGE",
  ownerId: props.parcel.parcelId,
});

// 修改后
uploadResponse = await props.uploadHandlers.upload(file, {
  moduleType: "PARCEL",
  recordId: props.parcel.parcelId,
  imageType: fieldName === 'sender' ? 'PACKAGE_SENDER' 
           : fieldName === 'receiver' ? 'PACKAGE_RECEIVER'
           : fieldName === 'label' ? 'PACKAGE_LABEL'
           : 'PACKING_LIST',
});
```

**关键变化**：
- `ownerType` → `moduleType` (值从 "PACKAGE" 改为 "PARCEL")
- `ownerId` → `recordId`
- 新增 `imageType` 参数，根据上传的图片类型动态设置

### 2. useFileUpload.js
**位置**：`src/composables/useFileUpload.js`

**修改 1**：导入 request 工具
```javascript
// 修改前
import axios from 'axios'

// 修改后
import request from '@/utils/request'
```

**修改 2**：添加通用 upload 方法
```javascript
const uploadHandlers = computed(() => {
  console.log('创建上传处理器, parcel:', parcel.value)
  return {
    ...imageManager.createUploadHandlers(),
    // 添加通用的 upload 方法，用于直接上传
    upload: async (file, options) => {
      console.log('[useFileUpload] upload called with options:', options);
      return uploadFile(file, options)
    }
  }
})
```

**修改 3**：实现 uploadFile 函数
```javascript
const uploadFile = async (file, options) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('moduleType', options.moduleType || 'PARCEL')
    formData.append('recordId', options.recordId || -1)
    formData.append('imageType', options.imageType || 'PACKAGE_SENDER')

    console.log('[useFileUpload] uploadFile - 请求参数:', {
      moduleType: options.moduleType,
      recordId: options.recordId,
      imageType: options.imageType,
      fileName: file.name
    });

    const response = await request.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('[useFileUpload] uploadFile 响应:', response);
    
    // 根据后台接口，成功响应应该包含 code === 1 或 0
    if (response && (response.code === 1 || response.code === 0 || response.data)) {
      const responseData = response.data || response;
      return {
        id: responseData?.id,
        url: responseData?.imageUrl || responseData?.url,
        imageUrl: responseData?.imageUrl,
        path: responseData?.imageUrl,
        ...responseData
      }
    } else {
      throw new Error(response?.msg || '上传失败')
    }
  } catch (error) {
    console.error('[useFileUpload] uploadFile 错误:', error);
    throw error
  }
}
```

---

## 图片类型枚举

| 前端字段值 | 含义 | 用途 |
|-----------|------|------|
| PACKAGE_SENDER | 发货前图片 | 包裹发货前照片 |
| PACKAGE_RECEIVER | 收货后图片 | 包裹收货后照片 |
| PACKAGE_LABEL | 包裹标签 | 包裹标签或面单 |
| PACKING_LIST | 装箱清单 | 打包清单图片（可多张） |

---

## 完整的请求流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ParcelFileUpload - 用户选择图片                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. onFileSelected() 触发上传                                │
│    调用 uploadHandlers.upload(file, options)                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. useFileUpload.uploadFile()                               │
│    创建 FormData 并包含正确的参数：                         │
│    - moduleType: "PARCEL"                                   │
│    - recordId: parcelId                                     │
│    - imageType: 图片类型                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. request.post('/upload', formData)                        │
│    发送 POST 请求到后台                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ▼ 后台接口 /upload ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. UploadController.upload()                                │
│    接收参数：moduleType, recordId, imageType, file         │
│    处理流程：                                               │
│    1. 检查图片数量限制                                      │
│    2. 保存文件到磁盘                                        │
│    3. 保存元数据到数据库 (image_attachment)                │
│    4. 返回上传结果                                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. 后台响应                                                 │
│    {                                                        │
│      "code": 1,                                             │
│      "msg": "上传成功",                                     │
│      "data": {                                              │
│        "imageUrl": "/upload/uuid.jpg",                      │
│        "originalName": "filename.jpg",                      │
│        "fileSize": 1024,                                    │
│        "imageType": "PACKAGE_SENDER",                       │
│        "moduleType": "PARCEL",                              │
│        "recordId": 123                                      │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. useFileUpload - 处理响应                                │
│    返回 { id, url, imageUrl, ... }                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. ParcelFileUpload - 保存到本地状态                        │
│    imgEntry = { id, url, name, type }                      │
│    packingListImages.push(imgEntry)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 验证修复

### 浏览器控制台日志检查

**上传时应该看到**：
```
[useFileUpload] upload called with options: {
  moduleType: "PARCEL",
  recordId: 123,
  imageType: "PACKING_LIST"
}

[useFileUpload] uploadFile - 请求参数: {
  moduleType: "PARCEL",
  recordId: 123,
  imageType: "PACKING_LIST",
  fileName: "file.jpg"
}

[useFileUpload] uploadFile 响应: {
  code: 1,
  msg: "上传成功",
  data: { imageUrl: "/upload/...", ... }
}
```

### Network 标签检查

**上传请求**：
- URL: `/upload` (或 `/api/upload`)
- 方法: `POST`
- Content-Type: `multipart/form-data`
- 参数：
  ```
  moduleType: PARCEL
  recordId: 123
  imageType: PACKING_LIST
  file: [文件对象]
  ```

**上传响应**：
- Status: `200`
- Body: 应包含 `imageUrl` 字段

---

## 后续检查

1. ✅ 参数格式已修正
2. ⏳ 后台接口是否正确接收这些参数？
3. ⏳ 后台是否成功在 `image_attachment` 表中创建记录？
4. ⏳ 是否需要处理既有的 `imageManager.uploadFile` 方式？

---

## 注意事项

1. **FormData 方式**：现在使用 FormData 来发送文件和参数，确保 Content-Type 为 `multipart/form-data`

2. **参数验证**：后台接口期望 `recordId` 为 `Long` 类型，前端发送的是数字，应该没问题

3. **错误处理**：uploadFile 函数包含了错误捕获和日志输出，便于调试

4. **兼容性**：保持了对 `imageManager.uploadFile` 的支持，但现在优先使用 `uploadHandlers.upload`

