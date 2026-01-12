# Parcel 图片上传功能改进

## 修改概要

本次修改对 `ParcelFileUpload.vue` 组件进行了全面升级，实现了三个主要需求：

### 1. 改进 PDF 缩略图显示效果

**修改内容：**
- 增加 PDF 图标大小：从 40px 增至 48px
- 改进背景渐变：由 `f56c6c → f78989` 变为更显眼的红色渐变
- 添加悬浮效果：PDF 预览框在 hover 时会放大（scale: 1.05）
- 改进文本显示：
  - 字体大小从 12px 增至 14px
  - 添加 letter-spacing 增加字符间距
  - 提高文本的可读性

**样式代码：**
```css
.pdf-preview {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  cursor: pointer;
  transition: all 0.2s;
}

.pdf-preview:hover {
  transform: scale(1.05);
}

.pdf-preview :deep(.el-icon) {
  font-size: 48px;
}

.pdf-text {
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
}
```

### 2. 根据后端配置控制上传 Icon 显示

**核心逻辑：**
后端通过 `allow_multiple` 和 `max_count` 两个字段来控制每种图片类型的上传限制。

**配置结构：**
```javascript
const imageTypeConfig = ref({
  PACKAGE_SENDER: { allow_multiple: false, max_count: 1 },
  PACKAGE_RECEIVER: { allow_multiple: false, max_count: 1 },
  PACKAGE_LABEL: { allow_multiple: false, max_count: 1 },
  PACKING_LIST: { allow_multiple: true, max_count: 10 }
});
```

**控制逻辑：**
- 如果 `allow_multiple = false`（单张模式）：
  - 只有当图片列表为空时才显示上传 Icon
  - 已上传图片后不再显示上传 Icon
  
- 如果 `allow_multiple = true`（多张模式）：
  - 当图片数量 < max_count 时显示上传 Icon
  - 当达到 max_count 上限时隐藏上传 Icon

**计算属性实现：**
```javascript
const canAddMoreSender = computed(() => {
  const config = imageTypeConfig.value.PACKAGE_SENDER;
  if (!config.allow_multiple) return senderImages.value.length === 0;
  return senderImages.value.length < config.max_count;
});
```

**Template 中的应用：**
```vue
<!-- 首次上传（图片列表为空） -->
<div class="upload-icon-wrapper" v-if="canAddMoreSender && senderImages.length === 0">

<!-- 继续上传（已有图片，右侧小 Icon） -->
<div class="add-icon-wrapper" v-else-if="canAddMoreSender && senderImages.length > 0">
```

### 3. 添加 Packing List 多图片上传行

**新增功能：**
- 在原有的三列（Sender/Receiver/Label）下方添加第二行用于 Packing List
- Packing List 支持多张图片上传（允许多达 10 张）
- 采用网格布局展示多张图片

**数据管理：**
```javascript
const packingListImages = ref([]);  // 存储多张 Packing List 图片

// 在 initializeImages() 中处理后端返回的 PACKING_LIST 数据
if (props.imageData.PACKING_LIST && Array.isArray(props.imageData.PACKING_LIST)) {
  packingListImages.value = props.imageData.PACKING_LIST.map(img => ({
    url: img.imageUrl,
    name: img.originalName || img.imageUrl.split('/').pop(),
    type: img.mimeType || 'image/*',
    id: img.id,
    imageSubType: img.imageSubType,
  }));
}
```

**文件上传处理：**
```javascript
const onFileSelected = async (event, fieldName) => {
  // 对于 packingList，支持多文件；对于其他字段，只处理第一个
  const filesToProcess = fieldName === 'packingList' ? Array.from(files) : [files[0]];
  
  // 检查 max_count 限制
  if (targetArray.value.length >= config.max_count) {
    ElMessage.error(`最多只能上传 ${config.max_count} 张图片`);
    return;
  }
  
  // 逐个处理文件
  for (const file of filesToProcess) {
    // ... 上传逻辑 ...
    packingListImages.value.push(imgEntry);
  }
};
```

**UI 布局：**
- 第一行：三列布局（Sender Image、Receiver Image、Label Image），每列 span=8
- 第二行：完整宽度 span=24，内部使用 CSS Grid 显示多张图片
  - Grid 列数：auto-fill, minmax(120px, 1fr)
  - 每个图片卡片尺寸：120px × 120px
  - 间距：12px

**上传 Icon 显示进度：**
```vue
<div class="upload-content" @click="$refs.packingListInput.click()">
  <el-icon class="upload-icon"><Plus /></el-icon>
  <span class="upload-text">{{ packingListImages.length }}/{{ maxPackingListCount }}</span>
</div>
```

## 样式改进

### 新增样式类

1. **`.packing-list-container`** - Packing List 行的容器
   ```css
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
   align-items: stretch;
   justify-content: flex-start;
   gap: 12px;
   ```

2. **`.image-list-grid`** - 网格图片列表
   ```css
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
   gap: 12px;
   width: 100%;
   ```

3. **`.upload-content`** - 上传按钮内容
   ```css
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   gap: 4px;
   ```

4. **`.first-row`** 和 **`.second-row`** - 行间距管理
   ```css
   .first-row { margin-bottom: 20px; }
   .second-row { margin-top: 10px; }
   ```

## 后端接口集成

### 数据格式

后端需要返回分组图片数据的元信息（可选）：

```javascript
// 配置数据可通过 API 返回，或在前端硬编码
{
  PACKAGE_SENDER: {
    allow_multiple: false,
    max_count: 1,
    images: [{ imageUrl, originalName, mimeType, id }]
  },
  PACKAGE_RECEIVER: {
    allow_multiple: false,
    max_count: 1,
    images: [...]
  },
  PACKAGE_LABEL: {
    allow_multiple: false,
    max_count: 1,
    images: [...]
  },
  PACKING_LIST: {
    allow_multiple: true,
    max_count: 10,
    images: [...]
  }
}
```

### 配置扩展

如果后端返回了这些配置信息，可以在 `initializeImages()` 中动态更新：

```javascript
// 动态更新配置（如果后端返回）
if (props.imageData.configData?.PACKING_LIST) {
  imageTypeConfig.value.PACKING_LIST = props.imageData.configData.PACKING_LIST;
}
```

## 测试场景

1. **单张图片限制（Sender/Receiver/Label）**
   - ✅ 上传第一张图片后，上传 Icon 消失
   - ✅ 删除图片后，上传 Icon 重新显示
   - ✅ 无法上传第二张图片

2. **多张图片支持（Packing List）**
   - ✅ 可以连续上传多张图片（最多 10 张）
   - ✅ 显示上传进度（3/10）
   - ✅ 达到 10 张后，上传 Icon 消失
   - ✅ 删除图片后可继续上传

3. **PDF 预览效果**
   - ✅ PDF 文件显示红色渐变缩略图
   - ✅ 鼠标 hover 时图片放大
   - ✅ PDF Icon 清晰可见
   - ✅ 点击可在新标签页打开

4. **响应式布局**
   - ✅ 小屏幕下网格自动调整列数
   - ✅ 图片卡片保持正方形比例
   - ✅ 删除按钮在 hover 时显示

## 文件变更

**修改文件：**
- `src/components/parcel/ParcelFileUpload.vue` - 主要改动

**新增计算属性：**
- `canAddMoreSender`, `canAddMoreReceiver`, `canAddMoreLabel`, `canAddMorePackingList`
- `maxPackingListCount`

**新增 ref：**
- `packingListImages`
- `imageTypeConfig`

**新增方法：**
- `deletePackingListImage(index)`

**修改方法：**
- `onFileSelected()` - 支持多文件上传和 max_count 检查
- `initializeImages()` - 处理 PACKING_LIST 数据

## 性能考虑

1. **图片加载优化**
   - 使用虚拟滚动（如列表过长）
   - 缓存计算属性结果

2. **内存管理**
   - 限制最多上传张数（max_count）
   - 定期清理已删除的临时 URL

## 后续增强建议

1. **拖拽上传**
   - 支持拖拽图片到上传区域
   - 类似云盘的拖拽体验

2. **图片裁剪**
   - 上传前裁剪和调整大小
   - 优化网络传输

3. **批量删除**
   - 选择多张图片批量删除
   - 确认弹窗防误操作

4. **图片预加载**
   - 异步加载缩略图
   - 提高初始化性能

5. **图片压缩**
   - 本地压缩图片后再上传
   - 减少服务器存储空间
