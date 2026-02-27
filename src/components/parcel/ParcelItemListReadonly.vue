<template>
  <div class="item-list-readonly">
    <div class="section-header">
      <label class="section-label">商品：</label>
    </div>

    <!-- 为每个item添加卡片容器 -->
    <div v-for="(item, index) in (parcel.items || parcel.itemList || [])" :key="index" class="item-card">
      <!-- item标题 -->
      <div class="item-header">
        <span class="item-title">商品 {{ index + 1 }}</span>
        <span class="item-index">#{{ index + 1 }}</span>
      </div>

      <!-- item内容 - 左右1:1分割布局 -->
      <el-row :gutter="20" class="item-content">
        <!-- 左侧：表单字段区域（占16列，即约66%） -->
        <el-col :span="16" class="left-section">
          <!-- 第一行：SellerPart#, MfrPart#, Item# -->
          <el-row :gutter="10">
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">商品名：</label>
                <span class="detail-value">{{ item.sellerPart || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">厂商料号：</label>
                <span class="detail-value">{{ item.mfrPart || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">商品号：</label>
                <span class="detail-value">{{ item.itemNo || '-' }}</span>
              </div>
            </el-col>
          </el-row>

          <!-- 第二行：Qty, Owner, Status -->
          <el-row :gutter="10">
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">数量：</label>
                <span class="detail-value">{{ item.qty || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">物主：</label>
                <span class="detail-value">{{ getUserName(item.ownerId) }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">状态：</label>
                <span class="detail-value">{{ getItemStatusName(item.itemStatus) }}</span>
              </div>
            </el-col>
          </el-row>

          <!-- 第三行：Received Date, Send Date, Dealer Received -->
          <el-row :gutter="10">
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">收货日期：</label>
                <span class="detail-value">{{ item.receivedDate || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">寄出日期：</label>
                <span class="detail-value">{{ item.sendDate || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">经销商接收日期：</label>
                <span class="detail-value">{{ item.dealerReceivedDate || '-' }}</span>
              </div>
            </el-col>
          </el-row>

          <!-- 第四行：Category, Original Order#, Original Return# -->
          <el-row :gutter="10">
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">类别：</label>
                <span class="detail-value">{{ getDictName(item.dictId) }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">原订单号：</label>
                <span class="detail-value">{{ item.originalOrder || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label class="detail-label">原退货单号：</label>
                <span class="detail-value">{{ item.originalReturnNo || '-' }}</span>
              </div>
            </el-col>
          </el-row>

          <!-- 第五行：Customer Feedback -->
          <el-row :gutter="10">
            <el-col :span="24">
              <div class="detail-item">
                <label class="detail-label">客户反馈：</label>
                <span class="detail-value">{{ item.customerFeedback || '-' }}</span>
              </div>
            </el-col>
          </el-row>
        </el-col>

        <!-- 右侧：图片显示区域（占8列，即约33%） -->
        <el-col :span="8" class="right-section">
            <div class="item-image-display">
            <label class="section-sublabel">商品图片：</label>
            <div class="item-images-scroll-container" v-if="item._images && item._images.length > 0">
              <div class="item-images-scroll">
                <div class="image-item" v-for="(img, imgIndex) in item._images" :key="img.id ?? imgIndex">
                  <div class="image-wrapper">
                    <img :src="img.url" @click="preview(img.url)" class="thumbnail" alt="Item Image" />
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-image">无图片</div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from "vue";
import { getGroupedImages } from "@/api/imageManage";
import { findByGroupApi } from '@/api/dict'

const props = defineProps({
  parcel: { type: Object, required: true },
  users: { type: Array, required: true },
  visible: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(["preview-file"]);

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

const getDictName = (id) => {
  if (!id) return '-'
  const d = dictOptions.value.find(x => x.dictId === id)
  return d ? d.dictName : '-'
}

// 获取用户姓名
const getUserName = (userId) => {
  if (!userId) return '-';
  const user = props.users.find(u => u.userId === userId);
  return user ? user.name : '-';
};

// 获取 item 状态名称（中文）
const getItemStatusName = (status) => {
  if (status === 0) return '验收中';
  if (status === 1) return '在库';
  if (status === 2) return '出库';
  if (status === 9) return '异常';
  return '-';
};

// 加载 item 图片
const loadItemImages = async () => {
  const itemList = props.parcel.items || props.parcel.itemList || [];
  
  console.log('[ParcelItemListReadonly] 开始加载 item 图片, item 数量:', itemList.length);
  
  for (const item of itemList) {
    // 初始化 _images 数组
    if (!item._images) {
      item._images = [];
    }
    
    // 如果 item 没有 itemId，跳过
    if (!item.itemId || item.itemId === -1) {
      console.log('[ParcelItemListReadonly] Item 没有 itemId，跳过加载图片:', item);
      continue;
    }
    
    // 如果已经加载过图片，跳过
    if (item._imagesLoaded) {
      console.log('[ParcelItemListReadonly] Item 图片已加载，跳过，itemId:', item.itemId);
      continue;
    }
    
    try {
      console.log('[ParcelItemListReadonly] 加载 item 图片，itemId:', item.itemId);
      
      item._imagesLoaded = true;
      
      const response = await getGroupedImages('ITEM', item.itemId);
      
      console.log('[ParcelItemListReadonly] 获取图片响应:', response);
      
      if (response && (response.code === 1 || response.code === 0) && response.data) {
        const groupedImages = response.data;
        
        item._images = [];
        
        // 遍历所有图片类型分组
        Object.keys(groupedImages).forEach(imageType => {
          const images = groupedImages[imageType];
          
          if (Array.isArray(images) && images.length > 0) {
            images.forEach(img => {
              item._images.push({
                id: img.id,
                url: img.imageUrl || img.url,
                name: img.originalName || img.fileName || 'Item Image',
                type: img.imageType || imageType
              });
            });
          }
        });
        
        console.log('[ParcelItemListReadonly] Item 图片加载完成，itemId:', item.itemId, '图片数量:', item._images.length);
      }
    } catch (error) {
      console.error('[ParcelItemListReadonly] 加载 item 图片失败，itemId:', item.itemId, 'error:', error);
      item._imagesLoaded = false;
    }
  }
};

// 组件挂载时加载 item 图片 和 dict options
onMounted(async () => {
  console.log('[ParcelItemListReadonly] onMounted, parcel:', props.parcel);
  await loadItemImages();
  await loadDictOptions();
});

// 监听 parcel.parcelId 变化，重新加载图片（不使用 deep watch 避免无限循环）
watch(() => props.parcel.parcelId, async (newParcelId, oldParcelId) => {
  if (newParcelId && newParcelId !== oldParcelId) {
    console.log('[ParcelItemListReadonly] parcelId 变化，重新加载 item 图片');
    // 重置所有 item 的加载状态
    const itemList = props.parcel.items || props.parcel.itemList || [];
    itemList.forEach(item => {
      item._imagesLoaded = false;
    });
    await loadItemImages();
  }
}, { immediate: false });

// 监听 visible 变化，当dialog打开时重新加载图片
watch(() => props.visible, async (newVisible) => {
  if (newVisible && props.parcel.parcelId) {
    console.log('[ParcelItemListReadonly] Dialog opened, reloading item images for parcelId:', props.parcel.parcelId);
    // 重置所有 item 的加载状态
    const itemList = props.parcel.items || props.parcel.itemList || [];
    itemList.forEach(item => {
      item._imagesLoaded = false;
    });
    await loadItemImages();
  }
}, { immediate: false });

// 预览图片
const preview = (url) => {
  emit("preview-file", url, "image");
};
</script>

<style scoped>
.item-list-readonly {
  margin-top: 20px;
  padding: 10px;
}

.section-header {
  margin-bottom: 15px;
}

.section-label {
  font-weight: bold;
  color: #303133;
  font-size: 16px;
}

.item-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
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

.detail-item {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
}

.detail-label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  min-width: 110px;
  text-align: left;
  flex-shrink: 0;
  font-size: 13px;
}

.detail-value {
  color: #303133;
  word-break: break-word;
  flex: 1;
  font-size: 13px;
}

.item-image-display {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-sublabel {
  display: block;
  margin-bottom: 12px;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
}

.item-images-scroll-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fff;
  padding: 10px;
}

.item-images-scroll {
  display: flex;
  gap: 12px;
  min-width: min-content;
}

.image-item {
  flex: 0 0 calc(33.333% - 8px);
  min-width: 150px;
  max-width: 200px;
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

.no-image {
  color: #909399;
  font-style: italic;
  padding: 20px;
  text-align: center;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
}
</style>
