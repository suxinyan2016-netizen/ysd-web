# ParcelFileUpload 组件快速参考

## 核心功能

### 1. PDF 缩略图显示
- ✅ 显示红色渐变背景（#f56c6c → #f78989）
- ✅ 大型 PDF 图标（48px）
- ✅ Hover 时放大效果（scale: 1.05）
- ✅ 文件名显示在底部

### 2. 上传 Icon 智能控制

根据配置决定是否显示上传 Icon：

```javascript
// 配置示例
{
  PACKAGE_SENDER: { allow_multiple: false, max_count: 1 },
  PACKAGE_RECEIVER: { allow_multiple: false, max_count: 1 },
  PACKAGE_LABEL: { allow_multiple: false, max_count: 1 },
  PACKING_LIST: { allow_multiple: true, max_count: 10 }
}
```

**规则：**
- `allow_multiple: false` + `max_count: 1` → 只能上传1张，上传后隐藏 Icon
- `allow_multiple: true` + `max_count: N` → 可上传多张，上传至 N 张时隐藏 Icon

### 3. Packing List 多图片支持

| 特性 | 说明 |
|-----|-----|
| 最多上传 | 10 张 |
| 布局方式 | CSS Grid（响应式） |
| 图片尺寸 | 120px × 120px |
| 支持格式 | 图片 + PDF |
| 显示进度 | "3/10" |

## 主要数据结构

### 后端返回格式

```javascript
{
  code: 1,
  data: {
    PACKAGE_SENDER: [
      {
        imageUrl: "http://...",
        originalName: "sender.jpg",
        mimeType: "image/jpeg",
        id: 123,
        imageSubType: "SIGNATURE"
      }
    ],
    PACKAGE_RECEIVER: [...],
    PACKAGE_LABEL: [...],
    PACKING_LIST: [...]
  },
  msg: "success"
}
```

### 前端 ref 管理

```javascript
const senderImages = ref([]);          // Sender 图片列表
const receiverImages = ref([]);        // Receiver 图片列表  
const labelImages = ref([]);           // Label 图片列表
const packingListImages = ref([]);     // Packing List 图片列表

// 图片对象格式
{
  url: string,           // 图片 URL
  name: string,          // 文件名
  type: string,          // MIME 类型
  id: string | number,   // 后端返回的 ID
  imageSubType: string   // 图片子类型
}
```

## 关键计算属性

```javascript
// 是否能添加更多图片
canAddMoreSender       // Sender 字段
canAddMoreReceiver     // Receiver 字段
canAddMoreLabel        // Label 字段
canAddMorePackingList  // Packing List 字段

// Packing List 的最大数量
maxPackingListCount    // 返回配置的 max_count（通常为 10）
```

## 主要方法

### 初始化图片
```javascript
initializeImages()
// - 从后端 imageData prop 加载分组图片
// - 映射数据格式
// - 支持向后兼容（旧格式）
```

### 文件上传
```javascript
onFileSelected(event, fieldName)
// fieldName: 'sender' | 'receiver' | 'label' | 'packingList'
// - 支持单文件和多文件上传
// - 检查 max_count 限制
// - 上传完成后添加到对应列表
```

### 删除图片
```javascript
deleteSenderImage(index)      // 删除 Sender 图片
deleteReceiverImage(index)    // 删除 Receiver 图片
deleteLabelImage(index)       // 删除 Label 图片
deletePackingListImage(index) // 删除 Packing List 图片
```

### 打开图片/PDF
```javascript
openInNewTab(url)
// 在新浏览器标签页打开原图或 PDF
```

## 样式类

| 类名 | 用途 |
|-----|-----|
| `.file-upload-section` | 整体容器 |
| `.upload-card` | 单个上传卡片 |
| `.upload-container` | 上传区域容器 |
| `.packing-list-container` | Packing List 网格容器 |
| `.image-list` | 单行图片列表 |
| `.image-list-grid` | 网格图片列表 |
| `.image-wrapper` | 单个图片容器 |
| `.thumbnail` | 图片预览 |
| `.pdf-preview` | PDF 缩略图 |
| `.pdf-icon-wrapper` | PDF 图标容器 |
| `.file-name-overlay` | 文件名覆盖层 |
| `.delete-btn` | 删除按钮 |
| `.upload-icon-wrapper` | 上传 Icon 容器（首次上传） |
| `.add-icon-wrapper` | 上传 Icon 容器（继续上传） |
| `.upload-content` | 上传内容区 |

## Props

| 属性 | 类型 | 必需 | 说明 |
|-----|------|------|------|
| `parcel` | Object | ✅ | 包裹信息对象 |
| `token` | String | ✅ | 认证令牌 |
| `currentUser` | Object | ✅ | 当前用户信息 |
| `uploadHandlers` | Object | ✅ | 上传处理器 |
| `getFullImageUrl` | Function | ✅ | 获取完整图片 URL 函数 |
| `imageManager` | Object | ❌ | 图片管理器 |
| `imageData` | Object | ❌ | 后端返回的分组图片数据 |

## Emits

| 事件 | 参数 | 说明 |
|-----|------|------|
| `preview-file` | (url) | 预览文件事件 |
| `check-image-urls` | - | 检查图片 URL 事件 |

## 常见问题

### Q: 为什么 Icon 没有显示？
A: 检查 `canAddMore*` 计算属性的返回值，确保 `max_count` 和图片数量的关系正确。

### Q: 如何禁用某个字段的上传？
A: 在 `imageTypeConfig` 中设置 `allow_multiple: false` 和 `max_count: 0`。

### Q: PDF 预览不显示？
A: 确保文件类型正确识别为 `application/pdf`，或检查 `img.type` 的值。

### Q: 上传的文件无法显示？
A: 确认后端返回的 `imageUrl` 路径正确，且可被浏览器访问。

### Q: 如何获取已上传的图片列表？
A: 通过访问 `senderImages.value`, `receiverImages.value`, `labelImages.value`, `packingListImages.value`。

## 集成步骤

1. **引入组件**
   ```vue
   import ParcelFileUpload from '@/components/parcel/ParcelFileUpload.vue'
   ```

2. **传递 Props**
   ```vue
   <ParcelFileUpload
     :parcel="editingParcel"
     :image-data="imageData"
     :token="token"
     :current-user="currentUser"
     :upload-handlers="uploadHandlers"
     :get-full-image-url="getFullImageUrl"
     :image-manager="imageManager"
     @preview-file="handlePreviewFile"
     @check-image-urls="handleCheckImageUrls"
   />
   ```

3. **处理事件**
   ```javascript
   const handlePreviewFile = (url) => {
     // 处理文件预览
   }
   
   const handleCheckImageUrls = () => {
     // 验证图片 URL
   }
   ```

## 性能建议

- 限制单次上传文件大小（< 5MB）
- 使用图片压缩减少网络传输
- 延迟加载缩略图
- 使用虚拟滚动处理大量图片列表

## 浏览器兼容性

- ✅ Chrome / Edge (最新版)
- ✅ Firefox (最新版)
- ✅ Safari (最新版)
- ⚠️ IE 11 (不支持)
