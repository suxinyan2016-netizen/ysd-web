# TempKey 模式图片上传实现总结

## 概述
已成功将图片上传从直接关联 recordId 模式改为 tempKey 临时附件模式。

## 实现的功能

### 1. UUID 生成工具
**文件**: `src/utils/uuid.js`
- 创建了 `uuidv4()` 函数，用于生成 UUID v4 标识符
- 使用浏览器的 `crypto.getRandomValues()` 生成随机值

### 2. Parcel TempKey 生成
**文件**: `src/views/parcel/index.vue`
- **位置**: `handlePackageTypeConfirm()` 函数
- **功能**: 
  - 用户点击 Add Parcel 并选择 packageType 后生成 parcel 的 tempKey
  - tempKey 存储在 `editingParcel.value.tempKey` 中
  - 整个对话框生命周期内保持该 tempKey

### 3. Item TempKey 生成
**文件**: `src/components/parcel/ParcelItemList.vue`
- **位置**: `handleAddItem()` 函数
- **功能**:
  - 每次添加新 item 时为其生成独立的 tempKey
  - tempKey 存储在 `item.tempKey` 中
  - 确保每个 item 的附件可以独立关联

### 4. 上传逻辑更新

#### Parcel 附件上传
**文件**: `src/components/parcel/ParcelFileUpload.vue`
- **修改**: `onFileSelected()` 函数
- **变化**:
  - 上传时 `recordId` 设为 `parcel.parcelId || -1`（新建时为 -1）
  - 添加 `tempKey: props.parcel.tempKey` 参数
  - 支持的图片类型: PACKAGE_SENDER, PACKAGE_RECEIVER, PACKAGE_LABEL, PACKING_LIST

#### Item 附件上传
**文件**: `src/components/parcel/ParcelItemList.vue`
- **修改**: `handleUploadImage()` 函数中的上传调用
- **变化**:
  - 上传时 `recordId` 设为 `item.itemId || -1`（新建时为 -1）
  - 添加 `tempKey: item.tempKey` 参数
  - moduleType: "ITEM"
  - imageType: "ITEM_IMAGE"

#### 通用上传函数
**文件**: `src/composables/useFileUpload.js`
- **修改**: `uploadFile()` 函数
- **变化**:
  - FormData 中添加对 `tempKey` 的支持
  - 如果 `options.tempKey` 存在，则追加到 FormData
  - 添加详细的日志输出 tempKey 信息

### 5. 保存逻辑
**文件**: `src/views/parcel/index.vue`
- **位置**: `handleSave()` 函数
- **功能**:
  - 整个 `editingParcel.value` 对象会被发送到后端
  - 包含 parcel 的 `tempKey`
  - 包含 `itemList`，其中每个 item 都有自己的 `tempKey`
  - 后端根据 tempKey 关联之前上传的临时附件

## 数据流程

### Add Parcel 流程
1. 用户点击 "Add Parcel" → 弹出 PackageTypeSelector
2. 用户选择 packageType → `handlePackageTypeConfirm()` 生成 `parcel.tempKey`
3. 打开 ParcelDialog，tempKey 随 parcel 对象传递
4. 用户上传 parcel 附件 → 调用 `/api/uploads/`，携带:
   ```javascript
   {
     moduleType: 'PARCEL',
     recordId: -1,
     imageType: 'PACKAGE_SENDER',
     tempKey: parcel.tempKey,
     file: <file>
   }
   ```
5. 用户点击 "Add Item" → `handleAddItem()` 生成 `item.tempKey`
6. 用户上传 item 附件 → 调用 `/api/uploads/`，携带:
   ```javascript
   {
     moduleType: 'ITEM',
     recordId: -1,
     imageType: 'ITEM_IMAGE',
     tempKey: item.tempKey,
     file: <file>
   }
   ```
7. 用户点击 "Save" → 提交到 `/api/parcels`，payload 包含:
   ```javascript
   {
     ...parcelData,
     tempKey: parcel.tempKey,
     itemList: [
       {
         ...itemData,
         tempKey: item.tempKey
       }
     ]
   }
   ```
8. 后端接收后:
   - 插入 parcel 记录，获得 parcelId
   - 调用 `reassignAttachmentsByTempKey("PARCEL", parcel.tempKey, parcelId)`
   - 遍历 itemList，插入 item 记录，获得 itemId
   - 为每个 item 调用 `reassignAttachmentsByTempKey("ITEM", item.tempKey, itemId)`

### Edit Parcel 流程
1. 用户点击 "Edit" → 加载现有 parcel 数据（包含 parcelId）
2. 现有附件直接显示，不需要 tempKey
3. 如果用户添加新 item → 生成新的 `item.tempKey`
4. 上传新 item 的附件 → 使用 `item.tempKey` 和 `recordId: -1`
5. 如果用户上传新的 parcel 附件:
   - 可以生成新的 tempKey（或复用现有逻辑）
   - 使用 `recordId: parcelId`（如果有）
6. 保存时后端更新记录并关联新的临时附件

## 关键点

### 1. TempKey 生命周期
- **生成**: 打开对话框时（Add Parcel）或添加 item 时（Add Item）
- **使用**: 上传附件时作为关联标识
- **提交**: 保存 parcel/item 时发送给后端
- **清除**: 用户完成或取消流程后（对话框关闭时）

### 2. RecordId 使用规则
- **新建 (Add)**: `recordId = -1`
- **编辑 (Edit)**: `recordId = parcelId` 或 `itemId`（如果已存在）

### 3. 后端期望
后端需要实现:
- 接收 `tempKey` 参数并存储临时附件关联
- 提供 `reassignAttachmentsByTempKey(moduleType, tempKey, realId)` 方法
- 在保存 parcel/item 后调用该方法将临时附件转为正式附件

## 测试要点

### 功能测试
- [ ] Add Parcel 生成 tempKey
- [ ] 上传 parcel 附件携带 tempKey
- [ ] Add Item 生成独立的 tempKey
- [ ] 上传 item 附件携带正确的 tempKey
- [ ] 保存时 payload 包含所有 tempKey
- [ ] Edit 模式下新增 item 也有 tempKey
- [ ] 取消对话框后 tempKey 被清除

### 边界测试
- [ ] 多个 item 的 tempKey 不重复
- [ ] 上传失败不影响 tempKey 逻辑
- [ ] 刷新页面后 tempKey 重新生成

## 注意事项

1. **TempKey 安全性**: 使用 UUID v4，碰撞概率极低
2. **前后端约定**: 确保后端正确处理 `tempKey` 和 `recordId = -1` 的情况
3. **日志记录**: 所有上传操作都有详细日志，便于调试
4. **向后兼容**: Edit 模式下已有附件不受影响

## 相关文件清单

1. `src/utils/uuid.js` - UUID 生成工具
2. `src/views/parcel/index.vue` - Parcel tempKey 生成和保存逻辑
3. `src/components/parcel/ParcelDialog.vue` - 对话框主组件
4. `src/components/parcel/ParcelFileUpload.vue` - Parcel 附件上传
5. `src/components/parcel/ParcelItemList.vue` - Item 管理和 tempKey 生成
6. `src/composables/useFileUpload.js` - 通用上传逻辑

## 后续优化建议

1. **TempKey 过期机制**: 前端可以添加本地存储清理逻辑
2. **批量上传**: 优化多文件上传性能
3. **进度显示**: 添加上传进度条
4. **错误重试**: 上传失败自动重试机制
