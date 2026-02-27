<template>
  <div class="item-list">
    <!-- 添加 Item 按钮 -->
    <el-row :gutter="10">
      <el-col :span="24">
        <el-form-item label="Items">
          <el-button type="success" size="small" @click="handleAddItem">+ Add Item</el-button>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 为每个item添加卡片容器 -->
    <div v-for="(item, index) in (parcel.items || parcel.itemList || [])" :key="index" class="item-card">
      <!-- item标题 -->
      <div class="item-header">
        <span class="item-title">Item {{ index + 1 }}</span>
        <div class="item-header-actions">
          <el-button
            type="danger"
            size="small"
            @click="handleDeleteItem(index)"
            plain
          >
            <el-icon><Delete /></el-icon> Delete Item
          </el-button>
          <span class="item-index">#{{ index + 1 }}</span>
        </div>
      </div>

      <!-- item内容 - 左右1:1分割布局 -->
      <el-row :gutter="20" class="item-content">
        <!-- 左侧：表单字段区域（约占16列，即 ~66% ） -->
        <el-col :span="16" class="left-section">
          <!-- 第一行：SellerPart#, MfrPart#, Item# -->
          <el-row :gutter="10">
            <el-col :span="8">
              <el-form-item
                size="small"
                label="SellerPart#"
                label-width="100px"
                class="item-form-item"
              >
                <el-input
                  placeholder="SellerPart#"
                  v-model="item.sellerPart"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                size="small"
                label="MfrPart#"
                label-width="90px"
                class="item-form-item"
              >
                <el-input
                  placeholder="MfrPart#"
                  v-model="item.mfrPart"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Item#"
                label-width="60px"
                class="item-form-item"
              >
                <el-input
                  placeholder="Item#"
                  v-model="item.itemNo"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第二行：Qty, Owner, Status -->
          <el-row :gutter="10">
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Qty"
                label-width="60px"
                class="item-form-item"
              >
                <el-input
                  placeholder="Qty"
                  v-model="item.qty"
                  type="number"
                  min="1"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Owner"
                label-width="70px"
                class="item-form-item"
              >
                <el-select
                  v-model="item.ownerId"
                  placeholder="Owner"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="user in users"
                    :key="user.userId"
                    :label="user.name"
                    :value="user.userId"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Status"
                label-width="70px"
                class="item-form-item"
              >
                <el-select
                  v-model="item.itemStatus"
                  placeholder="Status"
                  clearable
                  style="width: 100%"
                >
                  <el-option label="Inspecting" :value="0"></el-option>
                  <el-option label="InStock" :value="1"></el-option>
                  <el-option label="OutStock" :value="2"></el-option>
                  <el-option label="Exception" :value="9"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第三行：Received Date, Send Date, Dealer Received -->
          <el-row :gutter="10">
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Received Date"
                label-width="110px"
                class="item-form-item"
              >
                <el-date-picker
                  v-model="item.receivedDate"
                  type="date"
                  placeholder="Date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  clearable
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Send Date"
                label-width="90px"
                class="item-form-item"
              >
                <el-date-picker
                  v-model="item.sendDate"
                  type="date"
                  placeholder="Date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  clearable
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Dealer Received"
                label-width="120px"
                class="item-form-item"
              >
                <el-date-picker
                  v-model="item.dealerReceivedDate"
                  type="date"
                  placeholder="Date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  clearable
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第四行：Category, Original Order#, Original Return# -->
          <el-row :gutter="10">
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Category"
                label-width="100px"
                class="item-form-item"
              >
                <el-select v-model="item.dictId" placeholder="Category" clearable style="width:100%">
                  <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Original Order#"
                label-width="120px"
                class="item-form-item"
              >
                <el-input
                  placeholder="Original Order#"
                  v-model="item.originalOrder"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                size="small"
                label="Original Return#"
                label-width="130px"
                class="item-form-item"
              >
                <el-input
                  placeholder="Original Return#"
                  v-model="item.originalReturnNo"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第五行：Customer Feedback -->
          <el-row :gutter="10">
            <el-col :span="24">
              <el-form-item
                size="small"
                label="Customer Feedback"
                label-width="140px"
                class="item-form-item"
              >
                <el-input
                  placeholder="Customer Feedback"
                  v-model="item.customerFeedback"
                  type="textarea"
                  :rows="2"
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-col>

        <!-- 右侧：图片上传区域（约占8列，即 ~33%） -->
        <el-col :span="8" class="right-section">
          <div class="item-image-upload">
            <label>Item Images:</label>
            <div class="item-images-grid">
              <div class="image-item" v-for="(img, imgIndex) in item._images" :key="img.id ?? imgIndex">
                <div class="image-wrapper">
                  <img :src="img.url" @click="preview(img.url)" class="thumbnail" alt="Item Image" />
                  <el-button 
                    circle 
                    size="small" 
                    type="danger" 
                    @click.prevent="removeImage(index, imgIndex, img)"
                    class="delete-btn"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <!-- 上传icon（支持多图） -->
              <div class="image-item upload-icon-item">
                <input type="file" accept="image/*" multiple @change="onFilesSelected($event, item, index)" style="display: none" :ref="el => fileInputs[index] = el" />
                <div class="upload-content" @click="() => fileInputs[index]?.click()">
                  <el-icon class="upload-icon"><Plus /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { Delete, Plus } from "@element-plus/icons-vue";
import { getGroupedImages } from "@/api/imageManage";
import { uuidv4 } from '@/utils/uuid';
import { findByGroupApi } from '@/api/dict'

const fileInputs = ref({});

const dictOptions = ref([])

const loadDictOptions = async () => {
  try {
    let res = await findByGroupApi('Hardware')
    let list = []
    if (res && res.code === 1) list = res.data || []
    else if (Array.isArray(res)) list = res
    if ((!list || list.length === 0)) {
      const res2 = await findByGroupApi(2)
      if (res2 && res2.code === 1) list = res2.data || []
      else if (Array.isArray(res2)) list = res2
    }
    dictOptions.value = (list || []).map(d => ({ dictId: d.dictId ?? d.id ?? d.value, dictName: d.dictName ?? d.name ?? d.label }))
  } catch (err) {
    console.error('loadDictOptions error', err)
    dictOptions.value = []
  }
}

const props = defineProps({
  parcel: { type: Object, required: true },
  users: { type: Array, required: true },
  token: { type: String, required: false },
  currentUser: { type: Object, required: false },
  uploadHandlers: { type: Object, required: false },
  getFullImageUrl: { type: Function, required: false },
  imageManager: { type: Object, required: false },
});

const emit = defineEmits([
  "add-item",
  "delete-item",
  "preview-file",
  "check-image-urls",
  "delete-image",
]);

// 加载 item 图片
const loadItemImages = async () => {
  const itemList = props.parcel.items || props.parcel.itemList || [];
  
  console.log('[ParcelItemList] 开始加载 item 图片, item 数量:', itemList.length);
  
  for (const item of itemList) {
    // 初始化 _images 数组
    if (!item._images) {
      item._images = [];
    }
    
    // 如果 item 没有 itemId（新创建的 item），跳过
    if (!item.itemId || item.itemId === -1) {
      console.log('[ParcelItemList] Item 没有 itemId，跳过加载图片:', item);
      continue;
    }
    
    // 如果已经加载过图片（使用标志位），跳过
    if (item._imagesLoaded) {
      console.log('[ParcelItemList] Item 图片已加载，跳过，itemId:', item.itemId);
      continue;
    }
    
    try {
      console.log('[ParcelItemList] 加载 item 图片，itemId:', item.itemId);
      
      // 标记为正在加载，防止重复请求
      item._imagesLoaded = true;
      
      // 调用 API 获取分组图片
      const response = await getGroupedImages('ITEM', item.itemId);
      
      console.log('[ParcelItemList] 获取图片响应:', response);
      
      if (response && (response.code === 1 || response.code === 0) && response.data) {
        const groupedImages = response.data;
        
        // 清空现有的 _images（防止重复）
        item._images = [];
        
        // 遍历所有图片类型分组
        Object.keys(groupedImages).forEach(imageType => {
          const images = groupedImages[imageType];
          
          if (Array.isArray(images) && images.length > 0) {
            images.forEach(img => {
              // 添加到 _images 用于 UI 显示
              const imgEntry = {
                id: img.id,
                url: img.imageUrl || img.url,
                name: img.originalName || img.fileName || 'Item Image',
                type: img.imageType || imageType
              };
              
              item._images.push(imgEntry);
            });
          }
        });
        
        console.log('[ParcelItemList] Item 图片加载完成，itemId:', item.itemId, '图片数量:', item._images.length);
      }
    } catch (error) {
      console.error('[ParcelItemList] 加载 item 图片失败，itemId:', item.itemId, 'error:', error);
      // 加载失败时重置标志位，允许重试
      item._imagesLoaded = false;
    }
  }
};

// 组件挂载时加载 item 图片
onMounted(async () => {
  console.log('[ParcelItemList] onMounted - 开始加载 item 图片');
  await loadItemImages();
  await loadDictOptions();
});

// 监听 parcel.items 数组的变化（仅在数组本身变化时触发，不监听深层变化）
watch(() => props.parcel.items || props.parcel.itemList, async (newItems, oldItems) => {
  // 只有在 items 数组长度变化或者是首次加载时才重新加载
  if (newItems && (!oldItems || newItems.length !== oldItems.length)) {
    console.log('[ParcelItemList] items 数组变化，重新加载 item 图片');
    await loadItemImages();
  }
}, { immediate: false });

// 处理文件选择：本地预览并上传到服务器
const onFilesSelected = async (event, item, itemIndex) => {
  const files = Array.from(event.target.files || []);
  if (!item._images) item._images = [];
  if (!item.itemImages) item.itemImages = [];
  
  for (const file of files) {
    const tmpUrl = URL.createObjectURL(file);
    const imgEntry = { url: tmpUrl, uploading: true };
    item._images.push(imgEntry);

    try {
      // 使用 uploadHandlers.upload 上传文件
      let uploadResponse = null;
      if (props.uploadHandlers?.upload) {
        uploadResponse = await props.uploadHandlers.upload(file, {
          moduleType: "ITEM",
          recordId: item.itemId || -1,  // itemId 作为 recordId
          imageType: "ITEM_IMAGE",       // imageType
          tempKey: item.tempKey          // 添加 item 的 tempKey
        });
      } else if (props.imageManager?.uploadItemImage) {
        // 备选方案：使用 imageManager.uploadItemImage
        uploadResponse = await props.imageManager.uploadItemImage(
          file,
          item.itemId || -1,
          'ITEM_IMAGE'
        );
      } else if (props.imageManager?.uploadSingleImage) {
        // 备选方案：使用通用的 uploadSingleImage 方法
        uploadResponse = await props.imageManager.uploadSingleImage(
          file,
          'ITEM',
          item.itemId || -1,
          'ITEM_IMAGE'
        );
      } else {
        // 本地预览 fallback
        uploadResponse = { url: tmpUrl };
      }

      if (uploadResponse) {
        imgEntry.id = uploadResponse.recordId || uploadResponse.id || null;  // recordId 作为图片的唯一标识
        imgEntry.url = uploadResponse.imageUrl || uploadResponse.url || uploadResponse.path;
        imgEntry.name = uploadResponse.originalName || file.name;
        
        console.log('[ParcelItemList] 上传成功，图片信息:', {
          itemId: item.itemId,
          id: imgEntry.id,
          url: imgEntry.url,
          name: imgEntry.name,
          recordId: uploadResponse.recordId,
          uploadResponse
        });
        
        // 将上传成功的图片信息保存到 item.itemImages
        if (imgEntry.id) {
          item.itemImages.push({
            id: imgEntry.id,
            url: imgEntry.url,
            name: imgEntry.name,
            type: 'ITEM_IMAGE'
          });
        }
      }
    } catch (e) {
      console.error("item image upload failed:", e);
      item._images = item._images.filter(img => img !== imgEntry);
    } finally {
      imgEntry.uploading = false;
      emit("check-image-urls");
    }
  }
  // 清空选择，防止重复选择同一文件无触发
  event.target.value = "";
};

// 预览图片（委托给父组件）
const preview = (url) => {
  emit("preview-file", url, "image");
};

// 删除图片：若有 image id 则调用 imageManager.deleteImage，再从 item._images 移除并通知上层
const removeImage = async (itemIndex, imgIndex, img) => {
  try {
    const itemList = parcel.items || parcel.itemList;
    const item = itemList?.[itemIndex];
    
    if (img.id && props.imageManager?.deleteImage) {
      // 调用后端删除图片
      await props.imageManager.deleteImage(img.id, true);
      emit("delete-image", { itemIndex, imageId: img.id });
    }
    
    // 从 _images 中移除（UI 预览）
    if (item && item._images) {
      item._images.splice(imgIndex, 1);
    }
    
    // 从 itemImages 中移除（数据持久化）
    if (item && item.itemImages && img.id) {
      item.itemImages = item.itemImages.filter(img_item => img_item.id !== img.id);
    }
    
    emit("delete-image", { itemIndex, imageId: img.id });
  } catch (e) {
    console.error("删除 item 图片失败", e);
  }
};

const handleAddItem = () => {
  const itemList = props.parcel.items || props.parcel.itemList;
  if (itemList) {
    // 为每个 item 生成独立的 tempKey
    const itemTempKey = uuidv4();
    
    itemList.push({
      sellerPart: "",
      mfrPart: "",
      itemNo: "",
        dictId: null,
      qty: 1,
        itemStatus: 0,
        ownerId: props.parcel.ownerId || props.currentUser?.userId,
        receivedDate: "",
        keeperId: "",
        // If this component is editing an existing parcel, pre-fill the new item's receiveParcelId
        receiveParcelId: props.parcel?.parcelId ?? null,
      sendDate: null,
      dealerReceivedDate: null,
      originalOrder: "",
      originalReturnNo: "",
      customerFeedback: "",
      _images: [],
      itemImages: [],
      _imagesLoaded: false, // 标记为未加载
      tempKey: itemTempKey  // 添加 item 的 tempKey
    });
  }
  emit("add-item");
};

const handleDeleteItem = (index) => {
  const itemList = props.parcel.items || props.parcel.itemList;
  if (itemList) {
    itemList.splice(index, 1);
  }
  emit("delete-item", index);
};
</script>

<style scoped>
.item-list {
  margin-top: 20px;
  padding: 10px;
}

.item-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.item-card:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
  transition: all 0.3s ease;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e4e7ed;
}

.item-title {
  font-weight: 600;
  color: #303133;
  font-size: 16px;
}

.item-index {
  color: #606266;
  font-size: 14px;
  background: #e4e7ed;
  padding: 4px 10px;
  border-radius: 12px;
}
header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-
.item-form-item {
  margin-bottom: 10px;
}

.item-form-item :deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

.item-content {
  padding: 0 5px;
}

.left-section {
  padding-right: 10px;
  border-right: 1px solid #e4e7ed;
}

.right-section {
  padding-left: 10px;
  display: flex;
  flex-direction: column;
}

.item-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  padding-top: 15px;
  background-color: #f9f9f9;
}

.item-image-upload {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-image-upload label {
  display: block;
  margin-bottom: 12px;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
}

.item-images-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  flex: 1;
}

.image-item {
  position: relative;
  width: 100%;
}

.image-wrapper {
  position: relative;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fafafa;
  padding-top: 50%;
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s;
}

.image-wrapper img:hover {
  transform: scale(1.05);
}

.delete-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-wrapper:hover .delete-btn {
  opacity: 1;
}

.upload-icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding-top: 50%;
  position: relative;
}

.upload-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ddd;
  border-radius: 4px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-content:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.upload-icon {
  font-size: 32px;
  color: #409eff;
}
</style>
