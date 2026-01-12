# 后端图片数据集成说明

## 问题描述
接口有返回图片URL地址，但界面上 parcel 的图片控件未显示出来。

## 根本原因
后端返回的数据结构与前端组件期望的数据结构不匹配：
- **后端返回**: 分组的图片数据 `{ PACKAGE_SENDER: [], PACKAGE_RECEIVER: [], PACKAGE_LABEL: [], PACKING_LIST: [] }`
- **前端期望**: parcel 对象中的简单字段 `parcel.imgBySender`, `parcel.imgByReceiver`, `parcel.label`

## 解决方案

### 1. 修改 ParcelFileUpload.vue
**文件**: `src/components/parcel/ParcelFileUpload.vue`

**变更内容**:
- 添加 `imageData` 属性到 props，接收后端分组图片数据
  ```javascript
  imageData: { type: Object, required: false, default: () => ({}) }
  ```
- 扩展 `initializeImages()` 函数，优先处理后端返回的 `imageData`
  - 从 `imageData.PACKAGE_SENDER[]` 映射到本地 `senderImages[]`
  - 从 `imageData.PACKAGE_RECEIVER[]` 映射到本地 `receiverImages[]`
  - 从 `imageData.PACKAGE_LABEL[]` 映射到本地 `labelImages[]`
  - 支持向后兼容：如果没有 imageData，则从 `parcel` 对象的旧字段加载
- 添加对 `imageData` 的 watch，当数据变化时自动重新初始化图片

**数据转换逻辑**:
```javascript
// 后端数据格式
{ 
  imageUrl: "http://...", 
  originalName: "image.jpg",
  mimeType: "image/jpeg",
  id: 123
}

// 转换为本地格式
{ 
  url: "http://...",
  name: "image.jpg",
  type: "image/jpeg",
  id: 123,
  imageSubType: "..."
}
```

### 2. 修改 index.vue (views/parcel/index.vue)
**文件**: `src/views/parcel/index.vue`

**变更内容**:
- 添加 `imageData` ref 来存储后端返回的分组图片数据
  ```javascript
  const imageData = ref({})
  ```
- 修改 `edit()` 函数，在获取包裹详情后提取图片数据
  - 从返回的 `result.data` 中提取 `PACKAGE_SENDER`, `PACKAGE_RECEIVER`, `PACKAGE_LABEL`, `PACKING_LIST`
  - 存储到 `imageData.value` 中
  - 打印调试日志便于追踪

**修改前的流程**:
```
queryInfoApi(parcelId) → 获取包裹数据 → 设置 editingParcel → 显示对话框
```

**修改后的流程**:
```
queryInfoApi(parcelId) → 获取包裹数据 → 提取图片数据 → 
设置 editingParcel 和 imageData → 显示对话框
```

### 3. 修改 ParcelDialog.vue
**文件**: `src/components/parcel/ParcelDialog.vue`

**变更内容**:
- 添加 `imageData` 到 props 定义
  ```javascript
  imageData: {
    type: Object,
    required: false,
    default: () => ({}),
  }
  ```
- 修改 ParcelFileUpload 组件的绑定，传递 `imageData` prop
  ```vue
  <ParcelFileUpload
    :parcel="parcel"
    :image-data="imageData"
    ...
  />
  ```

## 数据流向

```
index.vue (edit 函数)
    ↓ 提取后端图片数据
    ↓ imageData.value = { PACKAGE_SENDER, PACKAGE_RECEIVER, PACKAGE_LABEL }
    ↓
ParcelDialog.vue
    ↓ :image-data="imageData" 传递
    ↓
ParcelFileUpload.vue
    ↓ 接收 imageData prop
    ↓ initializeImages() 将数据映射到本地 ref
    ↓ watch imageData 属性变化
    ↓
UI 显示 senderImages, receiverImages, labelImages
```

## 调试信息
开发者工具中会输出以下日志帮助调试：
```javascript
console.log('提取的后端图片数据:', imageDataFromBackend)
console.log('设置 imageData:', imageData.value)
```

## 兼容性说明
- **向后兼容**: 如果后端返回的数据中不包含新的分组图片数据，组件会自动降级使用 `parcel.imgBySender`, `parcel.imgByReceiver` 等旧字段
- **多图片支持**: 新的实现支持每个类型（Sender/Receiver/Label）多张图片

## 后续可能需要的调整
1. 如果后端返回的图片对象字段名称不同，需要在 `initializeImages()` 中调整映射字段
2. 如果需要与后端同步删除图片，确保 `imageManager.deleteImage()` 包含图片的 ID 标识
3. 验证 `getFullImageUrl()` 函数能正确处理后端返回的图片 URL

## 测试步骤
1. 在包裹列表中点击编辑某个包裹
2. 打开浏览器开发者工具，查看 Network 标签中 queryInfoApi 的返回数据
3. 查看 Console 标签，应该看到 "提取的后端图片数据" 日志
4. 编辑对话框中应该显示 Sender Image、Receiver Image、Label Image 三个图片框
5. 每个框中应该显示后端返回的对应图片
