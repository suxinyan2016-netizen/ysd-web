# Packing List 图片上传参数修正 - 最终修复清单

## 问题概述
前端发送给后台 `/upload` 接口的参数不符合后台期望的格式。

### 错误参数：
```javascript
{
  ownerType: "PACKAGE",
  ownerId: parcelId
}
```

### 正确参数：
```javascript
{
  moduleType: "PARCEL",
  recordId: parcelId,
  imageType: "PACKING_LIST" | "PACKAGE_SENDER" | "PACKAGE_RECEIVER" | "PACKAGE_LABEL"
}
```

---

## 修改清单

### ✅ 修改 1：ParcelFileUpload.vue
**文件路径**：`src/components/parcel/ParcelFileUpload.vue`
**修改位置**：第 530-550 行

**修改内容**：
- 修改参数名称：`ownerType` → `moduleType`, `ownerId` → `recordId`
- 更新模块类型：`"PACKAGE"` → `"PARCEL"`
- 新增图片类型判断逻辑，根据 `fieldName` 设置正确的 `imageType`

**修改前后对比**：
```javascript
// 修改前 ❌
uploadResponse = await props.uploadHandlers.upload(file, {
  ownerType: "PACKAGE",
  ownerId: props.parcel.parcelId,
});

// 修改后 ✅
uploadResponse = await props.uploadHandlers.upload(file, {
  moduleType: "PARCEL",
  recordId: props.parcel.parcelId,
  imageType: fieldName === 'sender' ? 'PACKAGE_SENDER' 
           : fieldName === 'receiver' ? 'PACKAGE_RECEIVER'
           : fieldName === 'label' ? 'PACKAGE_LABEL'
           : 'PACKING_LIST',
});
```

---

### ✅ 修改 2：useFileUpload.js - 导入调整
**文件路径**：`src/composables/useFileUpload.js`
**修改位置**：第 1-3 行

**修改内容**：
- 改为使用项目的 `request` 工具，而不是直接使用 `axios`
- 这样可以自动应用请求拦截器（包括 token 处理）

**修改前后**：
```javascript
// 修改前 ❌
import axios from 'axios'

// 修改后 ✅
import request from '@/utils/request'
```

---

### ✅ 修改 3：useFileUpload.js - 添加 upload 方法
**文件路径**：`src/composables/useFileUpload.js`
**修改位置**：第 12-22 行

**修改内容**：
在 `uploadHandlers` computed 中添加通用的 `upload` 方法

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

**作用**：
- 为 ParcelFileUpload 组件提供一个统一的上传入口
- 使用 `uploadFile` 函数处理实际的上传逻辑

---

### ✅ 修改 4：useFileUpload.js - 实现 uploadFile 函数
**文件路径**：`src/composables/useFileUpload.js`
**修改位置**：第 28-69 行

**新增函数**：
```javascript
const uploadFile = async (file, options) => {
  try {
    // 1. 构建 FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('moduleType', options.moduleType || 'PARCEL')
    formData.append('recordId', options.recordId || -1)
    formData.append('imageType', options.imageType || 'PACKAGE_SENDER')

    // 2. 日志输出请求参数
    console.log('[useFileUpload] uploadFile - 请求参数:', {
      moduleType: options.moduleType,
      recordId: options.recordId,
      imageType: options.imageType,
      fileName: file.name
    });

    // 3. 发起 POST 请求
    const response = await request.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    // 4. 日志输出响应
    console.log('[useFileUpload] uploadFile 响应:', response);
    
    // 5. 处理响应数据
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

**关键点**：
- 使用 `FormData` 构建请求体
- 将参数作为表单字段添加
- 使用 `request.post()` 自动处理认证和拦截
- 正确处理后台响应中的 `data` 字段

---

## 测试验证步骤

### 1️⃣ 浏览器控制台验证

**步骤**：
1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 在 Packing List 中上传一张图片

**预期输出**：
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
  fileName: "test.jpg"
}

[useFileUpload] uploadFile 响应: {
  code: 1,
  msg: "上传成功",
  data: {
    imageUrl: "/upload/...",
    originalName: "test.jpg",
    ...
  }
}
```

### 2️⃣ Network 标签验证

**步骤**：
1. 打开 Network 标签
2. 上传图片
3. 找到 `/upload` 请求

**验证项**：
- ✅ URL: `/upload`
- ✅ Method: `POST`
- ✅ Headers 中 Content-Type: `multipart/form-data`
- ✅ Form Data 中包含：
  - `moduleType`: PARCEL
  - `recordId`: [parcelId]
  - `imageType`: PACKING_LIST
  - `file`: [文件对象]
- ✅ Response 状态码: 200
- ✅ Response body 包含 `imageUrl`

### 3️⃣ 保存验证

**步骤**：
1. 上传几张图片到 Packing List
2. 点击 Save 保存包裹
3. 检查控制台日志

**预期行为**：
```
[ParcelDialog] Calling syncPackingList before emit save
[ParcelFileUpload] syncPackingList called
[ParcelFileUpload] parcel.packingList after sync: [
  { id: null, url: "/upload/...", name: "...", type: "..." }
]
[useParcel] saveParcel - 处理后 saveData.packingList: [...]
```

### 4️⃣ 数据库验证

**步骤**：
1. 保存成功后，检查数据库

**查询**：
```sql
SELECT * FROM image_attachment 
WHERE moduleType = 'PARCEL' 
AND imageType = 'PACKING_LIST'
ORDER BY id DESC LIMIT 10;
```

**预期结果**：
应该能看到新上传的图片记录

---

## 数据流总览

```
ParcelFileUpload (用户选择文件)
        ↓
onFileSelected (file, fieldName)
        ↓
uploadHandlers.upload(file, {
  moduleType: "PARCEL",
  recordId: parcelId,
  imageType: 根据fieldName判断
})
        ↓
useFileUpload.uploadFile(file, options)
        ↓
构建FormData:
  - moduleType: "PARCEL"
  - recordId: [number]
  - imageType: "PACKING_LIST"|"PACKAGE_SENDER"|...
  - file: [File]
        ↓
request.post('/upload', formData)
        ↓
后台接口 UploadController.upload()
  ✓ 检查参数
  ✓ 保存文件
  ✓ 保存到数据库
  ✓ 返回响应
        ↓
响应处理:
  {
    code: 1,
    data: { imageUrl, originalName, ... }
  }
        ↓
返回 { url, id, imageUrl, ... }
        ↓
packingListImages.push(imgEntry)
        ↓
保存: parcel.packingList
        ↓
发送到后台保存
```

---

## 关键改进点

| 项目 | 原有问题 | 修复方案 | 效果 |
|------|---------|--------|------|
| 参数名 | `ownerType` | → `moduleType` | ✅ 与后台接口匹配 |
| 参数值 | `"PACKAGE"` | → `"PARCEL"` | ✅ 符合后台期望 |
| 参数名 | `ownerId` | → `recordId` | ✅ 与后台接口匹配 |
| 缺失参数 | 无 `imageType` | → 添加 `imageType` | ✅ 后台能识别图片类型 |
| HTTP 工具 | 直接 axios | → 使用 request 工具 | ✅ 自动处理 token |
| 请求方式 | 不清楚 | → 使用 FormData + multipart | ✅ 符合标准文件上传方式 |

---

## 故障排查

### 问题：上传返回 400 错误
**原因**：参数格式错误或缺失
**解决**：
1. 检查 Console 中的请求参数日志
2. 对比 Network 标签中的 Form Data
3. 确认 `moduleType`, `recordId`, `imageType` 都已传送

### 问题：上传成功但后台未保存
**原因**：后台未正确处理新的参数格式
**解决**：
1. 检查后台日志中的请求日志
2. 验证后台是否接收到 `moduleType`, `recordId`, `imageType`
3. 确认后台是否创建了 `image_attachment` 记录

### 问题：图片 URL 为空
**原因**：响应处理不正确
**解决**：
1. 检查 Console 中的响应日志
2. 验证响应中是否包含 `imageUrl` 字段
3. 检查 `uploadFile` 函数的响应处理逻辑

---

## 总结

通过这次修复，前端已经完全适配后台接口：

✅ 参数格式正确（moduleType, recordId, imageType）  
✅ 请求方式正确（FormData + multipart）  
✅ 响应处理正确（获取 imageUrl）  
✅ 错误日志完整（便于调试）  

现在上传的图片应该能被后台正确接收并保存到 `image_attachment` 表中。

