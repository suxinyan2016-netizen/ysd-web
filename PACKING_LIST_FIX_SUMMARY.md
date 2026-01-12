# Packing List 图片保存问题 - 完整修复方案

## 问题总结
在 Packing List 中新增图片，点击 parcel 的 save，显示保存成功，但后台数据库 `image_attachment` 表未插入新的图片记录。

## 根本原因
1. **数据同步问题**：ParcelFileUpload 组件中上传的图片数据（packingListImages）未同步到 parcel 对象的 packingList 字段
2. **ID 丢失**：上传图片时返回的 ID 未被保存，后端无法识别这些图片
3. **发送格式问题**：useParcel.js 中 saveParcel 函数只发送 URL，丢弃了 ID 信息

## 修复方案详情

### 修复 1：ParcelFileUpload.vue - 上传时保留 ID
**文件**：`src/components/parcel/ParcelFileUpload.vue` (第 520-570 行)

**问题**：
```javascript
// 原来的代码
const imgEntry = {
  url: imageUrl,
  name: file.name,
  type: fileType,
  thumbnail: null,
};
```

**修复**：
```javascript
// 修改后的代码
const uploadResponse = null;
if (props.uploadHandlers?.upload) {
  uploadResponse = await props.uploadHandlers.upload(...);
} else if (props.imageManager?.uploadFile) {
  uploadResponse = await props.imageManager.uploadFile(...);
}

const imgEntry = {
  id: uploadResponse.id || uploadResponse.imageId || null, // 保存返回的 ID
  url: uploadResponse.url || uploadResponse.path || ...,
  name: file.name,
  type: fileType,
  thumbnail: null,
};
```

**作用**：确保上传接口返回的图片 ID 被保存到前端数据结构中

### 修复 2：ParcelFileUpload.vue - 添加数据同步方法
**文件**：`src/components/parcel/ParcelFileUpload.vue` (第 650-675 行)

**新增代码**：
```javascript
// 同步 packingListImages 数据到 parcel.packingList
const syncPackingList = () => {
  console.log('[ParcelFileUpload] syncPackingList called');
  console.log('[ParcelFileUpload] packingListImages.value:', packingListImages.value);
  if (!props.parcel.packingList) {
    props.parcel.packingList = [];
  }
  props.parcel.packingList = packingListImages.value.map(img => ({
    id: img.id, // 关键：包含图片 ID
    url: img.url,
    name: img.name,
    type: img.type,
  }));
  console.log('[ParcelFileUpload] parcel.packingList after sync:', props.parcel.packingList);
};

defineExpose({
  syncPackingList,
});
```

**作用**：提供一个方法供父组件调用，将本地的 packingListImages 数据同步到 parcel 对象

### 修复 3：ParcelDialog.vue - 调用同步方法
**文件**：`src/components/parcel/ParcelDialog.vue`

**修改 1**（第 181 行）：
```vue
<!-- 添加 ref -->
<ParcelFileUpload
  ref="parcelFileUploadRef"
  ...
/>
```

**修改 2**（第 293 行）：
```javascript
const parcelFileUploadRef = ref();

const handleSave = () => {
  if (!formRef.value) return;

  formRef.value.validate((valid) => {
    if (valid) {
      // 保存前同步 packingList 数据
      if (parcelFileUploadRef.value?.syncPackingList) {
        console.log('[ParcelDialog] Calling syncPackingList before emit save');
        parcelFileUploadRef.value.syncPackingList();
      }
      emit("save");
    }
  });
};
```

**作用**：在保存前调用 syncPackingList，确保最新的图片数据被同步到 parcel 对象

### 修复 4：useParcel.js - 保留 packingList 中的 ID
**文件**：`src/composables/useParcel.js` (第 85-110 行)

**问题**：
```javascript
// 原来的代码
packingList: parcelData.packingList
  ? parcelData.packingList.map((file) => file.url) // 只发送 URL！
  : [],
```

**修复**：
```javascript
// 修改后的代码
packingList: parcelData.packingList
  ? parcelData.packingList.map((file) => ({
      id: file.id || null, // 保留 ID 以便后端识别
      url: file.url || file, // 兼容 URL 字符串和对象
      name: file.name,
      type: file.type,
    }))
  : [],
```

添加调试日志：
```javascript
console.log('[useParcel] saveParcel - 原始 parcelData.packingList:', parcelData.packingList);
console.log('[useParcel] saveParcel - 处理后 saveData.packingList:', saveData.packingList);
```

**作用**：确保 packingList 中的 ID 被完整发送到后端，而不是仅发送 URL

## 完整的数据流

```
1. 用户上传图片到 Packing List
   ↓
2. [ParcelFileUpload.onFileSelected]
   - 调用上传接口
   - 接收响应包含 { id, url, ... }
   - 保存到 packingListImages 中：{ id, url, name, type }
   ↓
3. 用户点击 Save 按钮
   ↓
4. [ParcelDialog.handleSave]
   - 验证表单
   - 调用 parcelFileUploadRef.syncPackingList()
   - 同步 packingListImages → parcel.packingList
   - 现在 parcel.packingList = [{ id, url, name, type }]
   ↓
5. [useParcel.saveParcel]
   - 接收 parcel 对象
   - 保留 packingList 中的 ID 和其他字段
   - 发送到后端：packingList = [{ id, url, name, type }]
   ↓
6. 后端接收
   - 如果 id 为 null：创建新的 image_attachment 记录
   - 如果 id 存在：关联既有记录
   ↓
7. 数据库 image_attachment 表中出现新记录 ✓
```

## 后端需要的支持

后端需要在保存 parcel 时，处理 packingList 数组中的新图片：

```java
// 伪代码示例
if (parcel.getPackingList() != null) {
    for (PackingListItem item : parcel.getPackingList()) {
        if (item.getId() == null && item.getUrl() != null) {
            // 新增图片 - 创建 image_attachment 记录
            ImageAttachment attachment = new ImageAttachment();
            attachment.setModuleType("PARCEL");
            attachment.setRecordId(parcel.getParcelId());
            attachment.setImageType("PACKING_LIST");
            attachment.setImageUrl(item.getUrl());
            attachment.setOriginalName(item.getName());
            attachment.setMimeType(item.getType());
            imageAttachmentRepository.save(attachment);
        }
    }
}
```

## 验证修复是否生效

### 浏览器控制台
1. 上传图片，查看是否有日志：`[ParcelFileUpload] packingListImages.value: [...]` 包含 ID
2. 点击 Save，查看是否有日志：`[ParcelFileUpload] parcel.packingList after sync: [...]` 包含 ID
3. 查看是否有日志：`[useParcel] saveParcel - 处理后 saveData.packingList` 包含 ID

### Network 标签
1. 上传图片时，响应中是否包含 `id` 字段
2. 保存 parcel 时，Request Body 中的 `packingList` 是否包含完整对象（包含 ID）

### 数据库
保存后检查：
```sql
SELECT * FROM image_attachment 
WHERE moduleType = 'PARCEL' AND imageType = 'PACKING_LIST' 
ORDER BY id DESC LIMIT 10;
```

## 已修改的文件列表

| 文件 | 行号 | 修改类型 | 说明 |
|------|------|---------|------|
| ParcelFileUpload.vue | 520-570 | 修改 | 上传时保留 ID |
| ParcelFileUpload.vue | 650-675 | 新增 | syncPackingList 方法 |
| ParcelDialog.vue | 181 | 修改 | 添加 ref 绑定 |
| ParcelDialog.vue | 293-310 | 修改 | 调用 syncPackingList |
| useParcel.js | 85-110 | 修改 | 保留 packingList 中的 ID |
| useParcel.js | 108-109 | 新增 | 调试日志 |

## 总结

这个修复解决了"图片上传后无法在数据库中看到记录"的问题，通过：

1. ✅ 在上传时保存图片 ID
2. ✅ 在保存前同步 packingListImages 数据到 parcel.packingList
3. ✅ 在发送到后端时保留 ID 信息

后端只需要对应的处理逻辑，就能完整地将上传的 Packing List 图片保存到 `image_attachment` 表中。

