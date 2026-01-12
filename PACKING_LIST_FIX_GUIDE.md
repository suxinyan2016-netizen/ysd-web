# Packing List 图片保存问题诊断和修复指南

## 问题描述
在 Packing List 中新增图片，点击 parcel 的 save，提示保存成功，但后台数据库 `image_attachment` 未插入新的图片记录。

## 根本原因分析

### 前端问题（已修复）
1. **数据同步问题**：ParcelFileUpload 组件中的 `packingListImages` 数据没有同步到 `parcel.packingList`
   - 上传的图片存储在本地组件状态中
   - 保存时，parcel.packingList 可能为空或不包含新上传的图片

2. **图片 ID 丢失**：上传时返回的图片 ID 没有被保存，只保存了 URL
   - 后端需要 ID 来关联图片记录
   - 仅有 URL 时，后端无法识别这些图片

### 已应用的修复

#### 修复 1：ParcelFileUpload.vue - 上传时保存 ID
**文件**：[src/components/parcel/ParcelFileUpload.vue](src/components/parcel/ParcelFileUpload.vue#L520)

上传图片时，同时保存返回的 ID：
```javascript
const imgEntry = {
  id: uploadResponse.id || uploadResponse.imageId || null, // 保存上传返回的 ID
  url: uploadResponse.url || uploadResponse.path || uploadResponse.id || uploadResponse.imageUrl,
  name: file.name,
  type: fileType,
  thumbnail: null,
};
```

#### 修复 2：ParcelFileUpload.vue - 添加 syncPackingList 方法
**文件**：[src/components/parcel/ParcelFileUpload.vue](src/components/parcel/ParcelFileUpload.vue#L660)

新增 `syncPackingList` 方法，用于在保存前将图片数据同步到 parcel 对象：
```javascript
const syncPackingList = () => {
  props.parcel.packingList = packingListImages.value.map(img => ({
    id: img.id, // 关键：包含图片 ID
    url: img.url,
    name: img.name,
    type: img.type,
  }));
};

defineExpose({
  syncPackingList,
});
```

#### 修复 3：ParcelDialog.vue - 添加 ref 并在保存前调用 sync
**文件**：[src/components/parcel/ParcelDialog.vue](src/components/parcel/ParcelDialog.vue#L181)

1. 为 ParcelFileUpload 添加 ref：
```vue
<ParcelFileUpload
  ref="parcelFileUploadRef"
  ...
/>
```

2. 在 handleSave 中调用 syncPackingList：
```javascript
const parcelFileUploadRef = ref();

const handleSave = () => {
  if (!formRef.value) return;

  formRef.value.validate((valid) => {
    if (valid) {
      // 保存前同步 packingList 数据
      if (parcelFileUploadRef.value?.syncPackingList) {
        parcelFileUploadRef.value.syncPackingList();
      }
      emit("save");
    }
  });
};
```

## 后端需要的调整

虽然前端已修复，但还需要后端配合以下逻辑：

### 1. 处理 packingList 数组中的图片
当后端接收到如下格式的 parcel 数据时：
```json
{
  "parcelId": 123,
  "packageNo": "PKG001",
  "packingList": [
    {
      "id": 456,
      "url": "http://...",
      "name": "file1.jpg",
      "type": "image/jpeg"
    },
    {
      "id": null,
      "url": "http://...",
      "name": "file2.jpg", 
      "type": "image/jpeg"
    }
  ]
}
```

后端需要：

#### 方案 A：自动创建 image_attachment 记录（推荐）
对于 `packingList` 中每个 ID 为 null 的图片：
1. 在 `image_attachment` 表中创建新记录
2. 设置 `moduleType = 'PARCEL'`
3. 设置 `recordId = parcelId`
4. 设置 `imageType = 'PACKING_LIST'`
5. 保存 URL 到 `imageUrl` 字段

伪代码：
```java
for (PackingListItem item : parcel.getPackingList()) {
    if (item.getId() == null && item.getUrl() != null) {
        // 新增图片
        ImageAttachment attachment = new ImageAttachment();
        attachment.setModuleType("PARCEL");
        attachment.setRecordId(parcel.getParcelId());
        attachment.setImageType("PACKING_LIST");
        attachment.setImageUrl(item.getUrl());
        attachment.setOriginalName(item.getName());
        attachment.setMimeType(item.getType());
        imageAttachmentRepository.save(attachment);
    } else if (item.getId() != null) {
        // 更新现有记录关联
        // ... 处理逻辑
    }
}
```

#### 方案 B：前端获取上传后的 ID（需要前端调整）
如果目前前端无法从上传接口获取 ID，需要：
1. 确保上传接口返回图片的 ID
2. 修改 `imageManager` 或 `uploadHandlers` 确保返回 ID
3. ParcelFileUpload 应该能接收到这个 ID

## 测试检查清单

- [ ] 上传 Packing List 图片时，检查浏览器 Network 标签，上传接口返回的响应中是否包含 `id` 字段
- [ ] 点击保存前，在浏览器控制台检查日志：`[ParcelFileUpload] parcel.packingList after sync`，确认包含 ID
- [ ] 检查后端日志，`/parcels` PUT/POST 接口是否接收到 `packingList` 数据
- [ ] 确认后端是否成功创建了 `image_attachment` 记录
- [ ] 验证页面刷新后，Packing List 图片是否仍然显示（说明数据库已保存）

## 调试命令

在浏览器控制台测试 syncPackingList：
```javascript
// 获取 ParcelDialog 组件实例（如果需要）
// 这取决于你的测试环境如何暴露组件实例
```

## 文件变更汇总

| 文件 | 变更 | 目的 |
|-----|------|------|
| ParcelFileUpload.vue | 上传时保存 ID | 确保图片 ID 被保留 |
| ParcelFileUpload.vue | 添加 syncPackingList 方法 | 在保存前同步数据 |
| ParcelDialog.vue | 添加 parcelFileUploadRef | 获取子组件引用 |
| ParcelDialog.vue | 在 handleSave 前调用 sync | 确保数据被同步 |

