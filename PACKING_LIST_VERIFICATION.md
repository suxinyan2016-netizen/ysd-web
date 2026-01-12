# Packing List 图片保存修复 - 验证检查表

## 前端修复验证 ✅

### 1. ParcelFileUpload.vue 修复验证

#### 修复点：上传时保存 ID
- [x] 位置：第 520-570 行
- [x] 修改内容：
  - 上传图片时，imgEntry 对象现在包含 `id` 字段
  - ID 来自上传接口响应：`uploadResponse.id || uploadResponse.imageId`
  - 兼容多个字段名：`url || path || id || imageUrl`

#### 修复点：同步 packingList 数据
- [x] 位置：第 650-675 行（查找 `syncPackingList`）
- [x] 修改内容：
  - 新增 `syncPackingList()` 方法
  - 将 `packingListImages` 中的图片映射到 `parcel.packingList`
  - **关键**：包含 `id` 字段在映射中
  - 通过 `defineExpose` 暴露方法供父组件调用

### 2. ParcelDialog.vue 修复验证

#### 修复点：添加 ref 和调用 sync
- [x] 位置：第 181 行（ParcelFileUpload 组件）
  - 添加 `ref="parcelFileUploadRef"`
  
- [x] 位置：第 293 行（handleSave 函数）
  - 添加 `const parcelFileUploadRef = ref()`
  - 在 `handleSave` 中添加调用：
    ```javascript
    if (parcelFileUploadRef.value?.syncPackingList) {
      parcelFileUploadRef.value.syncPackingList();
    }
    ```

### 3. useParcel.js 修复验证

#### 修复点：保留 packingList 中的 ID
- [x] 位置：第 85-110 行
- [x] 修改内容：
  - 原来：`packingList.map((file) => file.url)` - 仅保留 URL
  - 现在：`packingList.map((file) => ({ id: file.id, url: file.url, name, type }))` 
  - **关键改进**：保留 ID，使后端能识别新上传的图片

## 修复工作流程

```
用户上传图片
    ↓
[ParcelFileUpload] 上传接口返回 { id, url, ... }
    ↓
[imgEntry] 保存到 packingListImages 中，包含 id 字段
    ↓
用户点击 Save
    ↓
[ParcelDialog] handleSave 调用 parcelFileUploadRef.syncPackingList()
    ↓
[ParcelFileUpload] syncPackingList 将数据映射到 parcel.packingList
    ↓
[useParcel] saveParcel 发送数据到后端，包含 packingList 和 ID
    ↓
后端接收并处理（需要后端支持）
    ↓
image_attachment 表中创建新记录
```

## 后端需要的支持

### 接收 packingList 格式

现在前端发送的格式为：
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

### 后端处理逻辑

对于 `parcel.packingList` 中的每个项目：

1. **如果 `id` 不为空**：这是既有的图片，更新关联
2. **如果 `id` 为 null**：这是新上传的图片，需要：
   - 在 `image_attachment` 表中创建新记录
   - 设置字段：
     - `moduleType = 'PARCEL'`
     - `recordId = parcelId`
     - `imageType = 'PACKING_LIST'`
     - `imageUrl = url`
     - `originalName = name`
     - `mimeType = type`

### 检查点

在后端保存逻辑中添加日志：
```java
logger.info("Processing packingList: {}", parcel.getPackingList());
for (PackingListItem item : parcel.getPackingList()) {
    logger.info("Item - id: {}, url: {}, name: {}", 
        item.getId(), item.getUrl(), item.getName());
}
```

## 浏览器调试步骤

1. **打开浏览器开发者工具** (F12)

2. **进入 Network 标签**
   - 上传 Packing List 图片
   - 查看上传接口响应，确认包含 `id` 字段
   - 记录返回的 ID 值

3. **进入 Console 标签**
   - 点击 Save
   - 查看日志输出，确认以下内容：
     ```
     [ParcelFileUpload] Calling syncPackingList before emit save
     [ParcelFileUpload] syncPackingList called
     [ParcelFileUpload] parcel.packingList after sync: [...]
     [useParcel] saveParcel - 原始 parcelData.packingList: [...]
     [useParcel] saveParcel - 处理后 saveData.packingList: [...]
     ```

4. **进入 Network 标签**
   - 找到 `/parcels` 的 POST 或 PUT 请求
   - 查看 Request Payload，确认 `packingList` 包含完整的对象（包含 ID）

5. **后端日志**
   - 检查后端是否收到 `packingList` 数据
   - 检查是否成功创建 `image_attachment` 记录

## 常见问题

### Q: 图片上传成功但仍无法在数据库中看到记录
**A:** 
1. 检查上传接口是否返回了 ID
2. 检查浏览器 Console 中的 `parcel.packingList after sync` 日志
3. 检查后端是否正确处理了 packingList

### Q: syncPackingList 未被调用
**A:** 
1. 检查 ParcelDialog 中是否添加了 `ref="parcelFileUploadRef"`
2. 检查 handleSave 中是否有调用 `syncPackingList` 的代码
3. 在浏览器 Console 中查看是否有错误日志

### Q: 编辑现有 parcel 时，原有的 Packing List 图片显示正常吗？
**A:** 
- 这些应该从后端加载，不受此修复影响
- 如果有问题，可能是后端在加载既有图片时出错

## 下一步

如果修复后仍有问题，请收集：
1. 浏览器 Console 的完整日志
2. Network 标签中的上传和保存请求/响应
3. 后端日志中对应的处理日志
4. 数据库查询结果：`SELECT * FROM image_attachment WHERE imageType = 'PACKING_LIST'`

