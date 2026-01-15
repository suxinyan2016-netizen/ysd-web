<template>
  <div class="parcel-table">
    <el-table
      :data="filteredParcels"
      stripe
      style="width: 100%"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" align="center" fixed />
      
      <el-table-column
        label="Packageno"
        width="175"
        align="left"
        fixed
      >
        <template #default="scope">
          <el-button
            type="primary"
            link
            @click="handleViewDetail(scope.row)"
            style="padding: 0; height: auto;"
          >
            {{ scope.row.packageNo }}
          </el-button>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="Status" width="100" align="center">
        <template #default="scope">
          <span v-if="scope.row.status == 0">Planed</span>
          <span v-else-if="scope.row.status == 1">inDelivery</span>
          <span v-else-if="scope.row.status == 2">Received</span>
          <span v-else-if="scope.row.status == 9">Exception</span>
        </template>
      </el-table-column>

      <el-table-column
        prop="processId"
        label="Processid"
        width="100"
        align="left"
      />

      <!-- 显示 owner 姓名 -->
      <el-table-column label="Owner" width="120" align="center">
        <template #default="scope">
          {{ getUserName(scope.row.ownerId) }}
        </template>
      </el-table-column>

      <!-- 显示 demands -->
      <el-table-column label="Demands" width="260" align="center">
        <template #default="scope">
          {{ formatDemands(scope.row.demands) }}
        </template>
      </el-table-column>

      <!-- 显示 sender 姓名 -->
      <el-table-column label="Sender" width="120" align="center">
        <template #default="scope">
          {{ scope.row.senderName || '-' }}
        </template>
      </el-table-column>

      <!-- 显示 receiver 姓名 -->
      <el-table-column label="Receiver" width="110" align="center">
        <template #default="scope">
          {{ scope.row.receiverName || '-' }}
        </template>
      </el-table-column>

      <el-table-column label="isPaid" width="100" align="center">
        <template #default="scope">
          {{ scope.row.isPaid === 1 ? 'paid' : 'unpaid' }}
        </template>
      </el-table-column>

      <el-table-column label="Operation" align="center" width="360" fixed="right">
        <template #default="scope">
          <!-- 只有有权限时才显示操作按钮 -->
          <template v-if="hasViewPermission(scope.row)">
            <!-- Edit按钮 -->
            <el-button
              v-if="hasEditPermission(scope.row)"
              type="primary"
              size="small"
              @click="handleEdit(scope.row.parcelId)"
            >
              <el-icon><EditPen /></el-icon> Edit
            </el-button>

            <!-- Delete按钮 -->
            <el-button
              v-if="hasDeletePermission(scope.row)"
              type="danger"
              size="small"
              @click="handleDelete(scope.row.parcelId)"
            >
              <el-icon><Delete /></el-icon> Delete
            </el-button>

            <!-- Export Images按钮 -->
            <el-button
              type="success"
              size="small"
              @click="handleExportImages(scope.row)"
            >
              <el-icon><Download /></el-icon> Img Export
            </el-button>

            <!-- Inspect按钮 (仅在status=1 InDelivery且packageType=1或2时显示) -->
            <el-button
              v-if="scope.row.status === 1 && (scope.row.packageType === 1 || scope.row.packageType === 2)"
              type="warning"
              size="small"
              @click="handleInspect(scope.row)"
            >
              <el-icon><Edit /></el-icon> Inspect
            </el-button>

            <!-- 如果没有操作权限，显示提示 -->
            <span
              v-if="
                !hasEditPermission(scope.row) && !hasDeletePermission(scope.row)
              "
              style="color: #909399; font-size: 12px"
            >
              No permission
            </span>
          </template>
          <template v-else>
            <span style="color: #909399; font-size: 12px">No permission</span>
          </template>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- Image Export Dialog -->
  <ImageExportDialog
    v-model:visible="exportDialogVisible"
    :package-no="exportParcel?.packageNo || ''"
    :total-images="totalExportImages"
    @confirm="confirmExport"
    @cancel="cancelExport"
    ref="exportDialogRef"
  />
  
  <!-- Parcel Detail Dialog -->
  <ParcelDetailDialog
    v-model:visible="detailDialogVisible"
    :parcel="detailParcel"
    :image-data="{}"
    :users="users"
    :status-list="statusList"
    :packagetype="packagetype"
    @preview-file="handlePreviewFile"
  />

  <!-- Parcel Inspect Dialog -->
  <ParcelInspect
    v-model:visible="inspectDialogVisible"
    :parcel="inspectParcel"
    :users="users"
    :token="token"
    :current-user="currentUser"
    :upload-handlers="uploadHandlers"
    :image-manager="imageManager"
    @refresh="emit('refresh')"
  />
</template>

<script setup>
import { ref, computed } from "vue";
import { EditPen, Delete, Download } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ImageExportDialog from "./ImageExportDialog.vue";
import ParcelDetailDialog from "./ParcelDetailDialog.vue";
import ParcelInspect from "./ParcelInspect.vue";
import { getGroupedImages } from "@/api/imageManage";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const props = defineProps({
  parcels: {
    type: Array,
    required: true,
    default: () => [],
  },
  users: {
    type: Array,
    required: true,
    default: () => [],
  },
  currentUser: {
    type: Object,
    required: true,
  },
  token: {
    type: String,
    required: false,
    default: "",
  },
  getParcelDetail: {
    type: Function,
    required: false,
    default: null,
  },
  uploadHandlers: {
    type: Object,
    required: false,
    default: null,
  },
  imageManager: {
    type: Object,
    required: false,
    default: null,
  },
  statusList: {
    type: Array,
    required: false,
    default: () => [
      { name: 'Planed', value: 0 },
      { name: 'inDelivery', value: 1 },
      { name: 'Received', value: 2 },
      { name: 'Exception', value: 9 }
    ],
  },
  packagetype: {
    type: Array,
    required: false,
    default: () => [
      { name: 'return from a customer', value: 1 },
      { name: 'send to a dealer', value: 2 },
      { name: 'send to a customer', value: 3 }
    ],
  },
});

const emit = defineEmits(["edit", "delete", "selection-change", "refresh"]);

// Image export state
const exportDialogVisible = ref(false);
const exportDialogRef = ref(null);
const exportParcel = ref(null);
const totalExportImages = ref(0);

// Detail dialog state
const detailDialogVisible = ref(false);
const detailParcel = ref({});

// Inspect dialog state
const inspectDialogVisible = ref(false);
const inspectParcel = ref({});

// 权限检查函数
const hasViewPermission = (parcel) => {
  if (!props.currentUser) return false;
  // user_id = 1 不受限制
  if (props.currentUser.userId === 1) return true;

  const userId = props.currentUser.userId;
  return (
    parcel &&
    (parcel.ownerId === userId ||
      parcel.senderId === userId ||
      parcel.receiverId === userId)
  );
};

const hasDeletePermission = (parcel) => {
  if (!props.currentUser) return false;
  // user_id = 1 有删除权限
  if (props.currentUser.userId === 1) return true;

  // 只有owner可以删除
  if (!parcel) return false;
  return parcel.ownerId === props.currentUser.userId && parcel.status !== 2;
};

const hasEditPermission = (parcel) => {
  if (!props.currentUser) return false;
  // user_id = 1 有编辑权限
  if (props.currentUser.userId === 1) return true;

  // status = 2 (Received)时，普通用户不能编辑
  if (parcel.status === 2) return false;

  // 当前用户是owner、sender或receiver时有编辑权限
  const userId = props.currentUser.userId;
  return (
    parcel.ownerId === userId ||
    parcel.senderId === userId ||
    parcel.receiverId === userId
  );
};

// 过滤当前用户有权限查看的数据
const filteredParcels = computed(() => {
  if (!props.currentUser) return [];
  // 如果当前用户是 user_id = 1，则显示所有记录
  if (props.currentUser.userId === 1) {
    return props.parcels;
  }
  // 否则只显示有权限的记录
  return props.parcels.filter((parcel) => hasViewPermission(parcel));
});

// 通用方法：根据 userId 获取用户姓名
const getUserName = (userId) => {
  if (!userId) return "-";
  const user = props.users.find((user) => user.userId === userId);
  return user ? user.name : "Unknown";
};

// 将 demands 值转换为 label
const formatDemands = (demands) => {
  if (!demands) return '-';
  
  const demandMap = {
    1: 'Need Inspect',
    2: 'Need Test',
    3: 'Need Repair'
  };
  
  // 解析逗号分隔的字符串
  const demandValues = demands.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
  
  if (demandValues.length === 0) return '-';
  
  // 获取对应的label
  const labels = demandValues.map(val => demandMap[val]).filter(label => label);
  
  return labels.length > 0 ? labels.join(', ') : '-';
};

const handleEdit = (parcelId) => {
  emit("edit", parcelId);
};

const handleDelete = (parcelId) => {
  emit("delete", parcelId);
};

const handleSelectionChange = (selection) => {
  emit("selection-change", selection);
};

// 查看详情
const handleViewDetail = async (parcel) => {
  try {
    // 如果有 getParcelDetail 函数，获取完整详情
    if (props.getParcelDetail && typeof props.getParcelDetail === 'function') {
      const fullDetail = await props.getParcelDetail(parcel.parcelId);
      detailParcel.value = fullDetail || parcel;
    } else {
      // 否则使用当前的 parcel 数据
      detailParcel.value = parcel;
    }
    
    detailDialogVisible.value = true;
  } catch (error) {
    console.error('Error loading parcel detail:', error);
    ElMessage.error('Failed to load parcel details');
  }
};

// 预览文件
const handlePreviewFile = (url, type) => {
  // 创建一个新窗口打开图片
  window.open(url, '_blank');
};

// 处理检查 (Inspect)
const handleInspect = async (parcel) => {
  try {
    // 如果有 getParcelDetail 函数，获取完整详情
    if (props.getParcelDetail && typeof props.getParcelDetail === 'function') {
      const fullDetail = await props.getParcelDetail(parcel.parcelId);
      inspectParcel.value = fullDetail || parcel;
    } else {
      // 否则使用当前的 parcel 数据
      inspectParcel.value = parcel;
    }
    
    inspectDialogVisible.value = true;
  } catch (error) {
    console.error('Error loading parcel for inspection:', error);
    ElMessage.error('Failed to load parcel for inspection');
  }
};

// 处理图片导出
const handleExportImages = async (parcel) => {
  try {
    // 检查 getParcelDetail 是否存在
    if (!props.getParcelDetail || typeof props.getParcelDetail !== 'function') {
      console.error('getParcelDetail is not a function:', props.getParcelDetail);
      ElMessage.error('Export function is not available');
      return;
    }
    
    // 1. 获取 parcel 的图片（PACKAGE_SEND, PACKAGE_RECEIVER, PACKING_LIST）
    const parcelImagesResult = await getGroupedImages('PARCEL', parcel.parcelId);
    
    if (parcelImagesResult.code !== 1) {
      ElMessage.error('Failed to load parcel images');
      return;
    }
    
    const parcelImages = parcelImagesResult.data || {};
    
    // 2. 获取完整的 parcel 详情以获取 itemList
    const parcelDetail = await props.getParcelDetail(parcel.parcelId);
    
    if (!parcelDetail) {
      ElMessage.error('Failed to load parcel details');
      return;
    }
    
    // 3. 获取所有 item 的图片
    const itemImagesList = [];
    if (parcelDetail.itemList && Array.isArray(parcelDetail.itemList)) {
      for (const item of parcelDetail.itemList) {
        if (item.itemId) {
          try {
            const itemImagesResult = await getGroupedImages('ITEM', item.itemId);
            if (itemImagesResult.code === 1 && itemImagesResult.data) {
              itemImagesList.push({
                itemNo: item.itemNo || 'Item',
                images: itemImagesResult.data
              });
            }
          } catch (error) {
            console.warn(`Failed to load images for item ${item.itemId}:`, error);
          }
        }
      }
    }
    
    // 4. 收集所有图片
    const imageUrls = collectImageUrlsFromApi(parcelImages, itemImagesList);
    totalExportImages.value = imageUrls.length;
    
    // 5. 检查图片数量
    if (totalExportImages.value > 50) {
      ElMessage.error({
        message: 'Too many images in this parcel, cannot export. Please download on the page one by one.',
        duration: 5000
      });
      return;
    }
    
    if (totalExportImages.value === 0) {
      ElMessage.warning('No images found in this parcel');
      return;
    }
    
    // 6. 保存数据以供导出使用
    exportParcel.value = {
      packageNo: parcel.packageNo,
      parcelImages,
      itemImagesList
    };
    
    // 7. 显示导出对话框
    exportDialogVisible.value = true;
    
  } catch (error) {
    console.error('Error loading parcel images:', error);
    ElMessage.error('Failed to load parcel images: ' + error.message);
  }
};

// 从 API 返回的数据中收集图片 URL
const collectImageUrlsFromApi = (parcelImages, itemImagesList) => {
  const images = [];
  
  // 1. Appearance before Sending (PACKAGE_SEND)
  if (parcelImages.PACKAGE_SEND && Array.isArray(parcelImages.PACKAGE_SEND)) {
    parcelImages.PACKAGE_SEND.forEach((img, index) => {
      if (img.imageUrl) {
        images.push({
          url: img.imageUrl,
          name: 'Appearance before Sending',
          index: index
        });
      }
    });
  }
  
  // 2. Appearance after Received (PACKAGE_RECEIVER)
  if (parcelImages.PACKAGE_RECEIVER && Array.isArray(parcelImages.PACKAGE_RECEIVER)) {
    parcelImages.PACKAGE_RECEIVER.forEach((img, index) => {
      if (img.imageUrl) {
        images.push({
          url: img.imageUrl,
          name: 'Appearance after Received',
          index: index
        });
      }
    });
  }
  
  // 3. Packing List (PACKING_LIST)
  if (parcelImages.PACKING_LIST && Array.isArray(parcelImages.PACKING_LIST)) {
    parcelImages.PACKING_LIST.forEach((img, index) => {
      if (img.imageUrl) {
        images.push({
          url: img.imageUrl,
          name: 'Packing List',
          index: index + 1
        });
      }
    });
  }
  
  // 4. Item Images
  itemImagesList.forEach((itemData) => {
    // Item 的图片类型可能是 ITEM_IMAGE 或其他
    Object.keys(itemData.images).forEach((imageType) => {
      const itemImages = itemData.images[imageType];
      if (Array.isArray(itemImages)) {
        itemImages.forEach((img, index) => {
          if (img.imageUrl) {
            images.push({
              url: img.imageUrl,
              name: itemData.itemNo,
              index: index + 1
            });
          }
        });
      }
    });
  });
  
  return images;
};

// 确认导出
const confirmExport = async () => {
  if (!exportParcel.value) return;
  
  const dialogRef = exportDialogRef.value;
  if (!dialogRef) return;
  
  dialogRef.startExport();
  
  try {
    // 从保存的数据中收集图片
    const images = collectImageUrlsFromApi(
      exportParcel.value.parcelImages,
      exportParcel.value.itemImagesList
    );
    
    if (images.length === 0) {
      dialogRef.showError('No images to export');
      return;
    }
    
    const zip = new JSZip();
    let exportedCount = 0;
    const imageCounters = {}; // 用于跟踪每个类型图片的序号
    
    // 下载并添加图片到ZIP
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      try {
        // 更新进度
        dialogRef.updateProgress(i + 1, images.length, `Downloading image ${i + 1} of ${images.length}...`);
        
        // 下载图片
        const response = await fetch(image.url);
        
        // 检查响应是否成功
        if (!response.ok) {
          console.warn(`Failed to download image: ${image.url}`);
          continue; // 跳过这张图片
        }
        
        const blob = await response.blob();
        
        // 检查是否是有效的图片类型
        if (!blob.type.startsWith('image/')) {
          console.warn(`Invalid image type: ${blob.type} for ${image.url}`);
          continue; // 跳过这张图片
        }
        
        // 获取文件扩展名
        const extension = getFileExtension(image.url, blob.type);
        
        // 生成文件名
        let fileName;
        if (image.name === 'Appearance before Sending' || image.name === 'Appearance after Received') {
          fileName = `${image.name}${extension}`;
        } else if (image.name === 'Packing List') {
          // 为Packing List添加序号
          if (!imageCounters['Packing List']) {
            imageCounters['Packing List'] = 0;
          }
          imageCounters['Packing List']++;
          fileName = `Packing List-${imageCounters['Packing List']}${extension}`;
        } else {
          // Item images
          const itemKey = image.name;
          if (!imageCounters[itemKey]) {
            imageCounters[itemKey] = 0;
          }
          imageCounters[itemKey]++;
          fileName = `${image.name}-${imageCounters[itemKey]}${extension}`;
        }
        
        // 添加到ZIP
        zip.file(fileName, blob);
        exportedCount++;
        
      } catch (error) {
        console.error(`Error processing image ${image.url}:`, error);
        // 继续处理下一张图片
      }
    }
    
    if (exportedCount === 0) {
      dialogRef.showError('No valid images found to export');
      return;
    }
    
    // 生成ZIP文件
    dialogRef.updateProgress(images.length, images.length, 'Generating ZIP file...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // 保存ZIP文件
    const zipFileName = `${exportParcel.value.packageNo}.zip`;
    saveAs(zipBlob, zipFileName);
    
    // 完成导出
    dialogRef.completeExport(exportedCount);
    
  } catch (error) {
    console.error('Export error:', error);
    exportDialogRef.value?.showError('Export failed: ' + error.message);
  }
};

// 取消导出
const cancelExport = () => {
  exportParcel.value = null;
  totalExportImages.value = 0;
};

// 获取文件扩展名
const getFileExtension = (url, mimeType) => {
  // 首先尝试从URL获取扩展名
  const urlMatch = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  if (urlMatch) {
    return `.${urlMatch[1]}`;
  }
  
  // 根据MIME类型返回扩展名
  const mimeMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp'
  };
  
  return mimeMap[mimeType] || '.jpg';
};
</script>

<style scoped>
.parcel-table {
  margin-top: 20px;
}
</style>
