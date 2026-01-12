# 前端上传参数优化 - 与后端接口同步

## 修改完成项

### 1. useFileUpload.js - uploadFile 函数优化
**修改内容**:
- 更新请求参数日志，包含 fileSize
- 修正响应处理逻辑，正确检测返回的 code === 0
- 完整提取后端返回数据：imageUrl, originalName, fileSize, imageType, moduleType, recordId
- 规范化返回值结构

**关键代码** (行 30-65):
```javascript
const uploadFile = async (file, options) => {
  // 后端返回结构: { code: 0, data: { imageUrl, originalName, fileSize, ... }, msg: "..." }
  if (response && response.code === 0 && response.data) {
    const data = response.data;
    return {
      id: data.id,
      url: data.imageUrl,
      imageUrl: data.imageUrl,
      path: data.imageUrl,
      originalName: data.originalName,
      fileSize: data.fileSize,
      imageType: data.imageType,
      moduleType: data.moduleType,
      recordId: data.recordId
    }
  }
}
```

### 2. ParcelFileUpload.vue - 响应处理优化
**修改内容**:
- 优先使用 imageUrl 而不是 url（匹配后端返回字段）
- 使用 originalName 而不是 file.name
- 添加详细日志记录上传结果

**关键代码** (行 557-580):
```javascript
const imgEntry = {
  id: uploadResponse.id || null,
  url: uploadResponse.imageUrl || uploadResponse.url || uploadResponse.path,
  name: uploadResponse.originalName || file.name,
  type: fileType,
  thumbnail: null,
};
```

### 3. ParcelItemList.vue - 响应处理优化
**修改内容**:
- 统一使用 imageUrl、originalName、id 字段
- 添加详细日志记录

**关键代码** (行 336-356):
```javascript
if (uploadResponse) {
  imgEntry.id = uploadResponse.id || null;
  imgEntry.url = uploadResponse.imageUrl || uploadResponse.url;
  imgEntry.name = uploadResponse.originalName || file.name;
  
  if (imgEntry.id) {
    item.itemImages.push({
      id: imgEntry.id,
      url: imgEntry.url,
      name: imgEntry.name,
      type: 'ITEM_IMAGE'
    });
  }
}
```

## 后端返回数据结构

根据后端代码，上传成功后返回：

```json
{
  "code": 0,
  "data": {
    "imageUrl": "/upload/xxxxxxxxxxxxx.jpg",
    "originalName": "filename.jpg",
    "fileSize": 123456,
    "imageType": "PACKAGE_SENDER|PACKAGE_RECEIVER|PACKAGE_LABEL|PACKING_LIST|ITEM_IMAGE",
    "moduleType": "PARCEL|ITEM",
    "recordId": 12345
  },
  "msg": "上传成功"
}
```

## ⚠️ 重要问题：ID 字段缺失

**问题**: 后端返回的数据中 **没有** `id` 字段（数据库自动生成的主键）。

**影响**: 前端无法获得图片在数据库中的唯一标识符 (ID)，这会导致：
- 图片删除时无法确定删除哪张图片
- 图片关联跟踪困难
- 后续的图片管理（如编辑、排序）受限

### 需要后端修复

后端 UploadController 应该修改为：

```java
@PostMapping("/upload")
public Result upload(
        @RequestParam("moduleType") String moduleType,
        @RequestParam("recordId") Long recordId,
        @RequestParam("imageType") String imageType,
        @RequestParam("file") MultipartFile file) throws IOException {
    
    // ... 现有代码 ...
    
    // 修改：获取保存后的图片ID
    Long imageId = imageAttachmentService.saveImage(
            moduleType, recordId, imageType,
            imageUrl, originalFilename, file.getSize(),
            file.getContentType(), currentUser
    );
    
    log.info("图片信息保存到数据库成功，ID：{}", imageId);
    
    // 返回包含ID的数据
    return Result.success("上传成功", Map.of(
            "id", imageId,                    // ← 添加此行
            "imageUrl", imageUrl,
            "originalName", originalFilename,
            "fileSize", file.getSize(),
            "imageType", imageType,
            "moduleType", moduleType,
            "recordId", recordId
    ));
}
```

## 数据流对比

### ParcelFileUpload 上传流程
```
User Upload File
    ↓
uploadHandlers.upload(file, {
  moduleType: "PARCEL",
  recordId: parcelId,
  imageType: "PACKAGE_SENDER|PACKAGE_RECEIVER|PACKAGE_LABEL|PACKING_LIST"
})
    ↓
Backend POST /upload
    ↓
返回: { code: 0, data: { id, imageUrl, originalName, ... }, msg: "..." }
    ↓
前端 imgEntry = { id, url: imageUrl, name: originalName, ... }
    ↓
保存到 senderImages/receiverImages/labelImages/packingListImages
    ↓
User Save Parcel
    ↓
syncPackingList() (仅对 packingListImages)
    ↓
emit("save") 发送整个 parcel 对象
    ↓
Backend 保存 parcel (包含 packingList 数组)
```

### ParcelItemList 上传流程
```
User Upload File to Item
    ↓
uploadHandlers.upload(file, {
  moduleType: "ITEM",
  recordId: itemId,
  imageType: "ITEM_IMAGE"
})
    ↓
Backend POST /upload
    ↓
返回: { code: 0, data: { id, imageUrl, originalName, ... }, msg: "..." }
    ↓
前端 imgEntry = { id, url: imageUrl, name: originalName, ... }
    ↓
保存到 item._images (UI display) 和 item.itemImages (persistent)
    ↓
User Save Parcel
    ↓
syncItemImages() (从 _images 同步到 itemImages)
    ↓
emit("save") 发送整个 parcel 对象
    ↓
Backend 保存 parcel (包含 itemList 数组，每个 item 包含 itemImages)
```

## 参数映射总结

| 场景 | moduleType | recordId | imageType |
|------|-----------|----------|-----------|
| Parcel 发货人照片 | PARCEL | parcelId | PACKAGE_SENDER |
| Parcel 收货人照片 | PARCEL | parcelId | PACKAGE_RECEIVER |
| Parcel 标签照片 | PARCEL | parcelId | PACKAGE_LABEL |
| Parcel 打包单 | PARCEL | parcelId | PACKING_LIST |
| Item 图片 | ITEM | itemId | ITEM_IMAGE |

## 前端修改验证

### 修改前检查项
- [ ] useFileUpload.js 中的 uploadFile 函数正确处理 code === 0
- [ ] 正确提取后端返回的 data 对象
- [ ] imageUrl 作为优先 URL 字段
- [ ] originalName 作为优先 name 字段
- [ ] 添加 id 字段到返回对象

### 修改后验证步骤
1. 打开浏览器开发者工具 (F12)
2. 进入 Console 标签
3. 上传一张图片
4. 查看日志：
   - `[useFileUpload] uploadFile - 请求参数:` - 验证参数正确
   - `[useFileUpload] uploadFile 响应:` - 验证后端返回格式
   - `[useFileUpload] 上传成功，返回数据:` - 验证提取的数据
   - `[ParcelFileUpload] 上传成功，图片信息:` 或 `[ParcelItemList] 上传成功，图片信息:` - 验证前端处理

### 网络标签验证
1. 打开开发者工具 Network 标签
2. 上传图片
3. 找到 POST /upload 请求
4. 验证：
   - **Request**: multipart/form-data 包含 moduleType, recordId, imageType, file
   - **Response**: { code: 0, data: { imageUrl, originalName, fileSize, ... } }

## 测试检查清单

- [ ] Parcel 发货人图片上传成功
- [ ] Parcel 收货人图片上传成功
- [ ] Parcel 标签图片上传成功
- [ ] Parcel 打包单图片上传成功
- [ ] Item 图片上传成功
- [ ] 后端接收到正确的 moduleType 和 imageType
- [ ] 后端返回正确的 imageUrl
- [ ] 前端正确提取 imageUrl 作为 url
- [ ] 前端正确提取 originalName 作为 name
- [ ] **待修复**: 后端返回图片在数据库中的 ID

## 待办事项

### 立即修复（后端）
- [ ] 修改 UploadController 返回图片 ID
- [ ] 修改 ImageAttachmentService.saveImage 返回保存后的图片 ID
- [ ] 测试返回的 ID 是否有效

### 立即修复（前端）
- [x] 修改 useFileUpload.js 正确处理返回数据
- [x] 修改 ParcelFileUpload.vue 使用 imageUrl
- [x] 修改 ParcelItemList.vue 使用 imageUrl

### 后续验证
- [ ] 验证上传图片数据流
- [ ] 验证保存图片元数据
- [ ] 验证删除图片功能
- [ ] 验证图片加载显示

## 相关文件

- useFileUpload.js - 上传处理函数
- ParcelFileUpload.vue - Parcel 级别图片上传
- ParcelItemList.vue - Item 级别图片上传
- UploadController - 后端上传接口

