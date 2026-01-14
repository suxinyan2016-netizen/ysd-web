<template>
  <div class="file-upload-section">
    <h3>Package Images</h3>
    
    <!-- 一行三列布局：Sender、Receiver、Label -->
    <el-row :gutter="40" class="first-row">
      <!-- 发货人签名图片 -->
      <el-col :span="8">
        <div class="upload-card">
          <label class="card-title">Apperance before Sending</label>
          <div class="upload-container">
            <!-- 已上传的图片列表 -->
            <div class="image-list" v-if="senderImages.length > 0">
              <div class="image-item" v-for="(img, idx) in senderImages" :key="idx">
                <div class="image-wrapper">
                  <img :src="img.url" @click="openInNewTab(img.url)" class="thumbnail" />
                  <!-- 删除按钮 - 悬浮在右下角 -->
                  <el-button 
                    circle 
                    size="small" 
                    type="danger" 
                    @click="deleteSenderImage(idx)"
                    class="delete-btn"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            <!-- 上传icon -->
            <div class="upload-icon-wrapper" v-if="canAddMoreSender && senderImages.length === 0">
              <input 
                type="file" 
                accept="image/*" 
                @change="onFileSelected($event, 'sender')"
                ref="senderInput"
                style="display: none"
              />
              <el-icon class="upload-icon" @click="$refs.senderInput.click()">
                <Plus />
              </el-icon>
            </div>
            <!-- 已有图片时，右侧显示上传icon -->
            <div class="add-icon-wrapper" v-else-if="canAddMoreSender && senderImages.length > 0">
              <input 
                type="file" 
                accept="image/*" 
                @change="onFileSelected($event, 'sender')"
                ref="senderInput2"
                style="display: none"
              />
              <el-icon class="upload-icon-small" @click="$refs.senderInput2.click()">
                <Plus />
              </el-icon>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 收货人签名图片 -->
      <el-col :span="8">
        <div class="upload-card">
          <label class="card-title">Apperance after Received</label>
          <div class="upload-container">
            <!-- 已上传的图片列表 -->
            <div class="image-list" v-if="receiverImages.length > 0">
              <div class="image-item" v-for="(img, idx) in receiverImages" :key="idx">
                <div class="image-wrapper">
                  <img :src="img.url" @click="openInNewTab(img.url)" class="thumbnail" />
                  <!-- 删除按钮 - 悬浮在右下角 -->
                  <el-button 
                    circle 
                    size="small" 
                    type="danger" 
                    @click="deleteReceiverImage(idx)"
                    class="delete-btn"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            <!-- 上传icon -->
            <div class="upload-icon-wrapper" v-if="canAddMoreReceiver && receiverImages.length === 0">
              <input 
                type="file" 
                accept="image/*" 
                @change="onFileSelected($event, 'receiver')"
                ref="receiverInput"
                style="display: none"
              />
              <el-icon class="upload-icon" @click="$refs.receiverInput.click()">
                <Plus />
              </el-icon>
            </div>
            <!-- 已有图片时，右侧显示上传icon -->
            <div class="add-icon-wrapper" v-else-if="canAddMoreReceiver && receiverImages.length > 0">
              <input 
                type="file" 
                accept="image/*" 
                @change="onFileSelected($event, 'receiver')"
                ref="receiverInput2"
                style="display: none"
              />
              <el-icon class="upload-icon-small" @click="$refs.receiverInput2.click()">
                <Plus />
              </el-icon>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 标签图片/PDF -->
      <el-col :span="8">
        <div class="upload-card">
          <label class="card-title">Package Label (Image/PDF)</label>
          <div class="upload-container">
            <!-- 已上传的文件列表 -->
            <div class="image-list" v-if="labelImages.length > 0">
              <div class="image-item" v-for="(img, idx) in labelImages" :key="idx">
                <div class="image-wrapper">
                  <!-- 图片预览 -->
                  <img 
                    v-if="img.type && img.type.startsWith('image/')" 
                    :src="img.url" 
                    @click="openInNewTab(img.url)" 
                    class="thumbnail" 
                  />
                  <!-- PDF预览 - 使用 embed 内嵌查看 -->
                  <embed 
                    v-else-if="img.type === 'application/pdf'" 
                    :src="img.url + '#toolbar=1&navpanes=0&scrollbar=0'" 
                    type="application/pdf"
                    class="pdf-embed"
                    alt="PDF Preview"
                  />
                  <!-- 删除按钮 - 悬浮在右下角 -->
                  <el-button 
                    circle 
                    size="small" 
                    type="danger" 
                    @click="deleteLabelImage(idx)"
                    class="delete-btn"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
            <!-- 上传icon -->
            <div class="upload-icon-wrapper" v-if="canAddMoreLabel && labelImages.length === 0">
              <input 
                type="file" 
                accept="image/*,.pdf" 
                @change="onFileSelected($event, 'label')"
                ref="labelInput"
                style="display: none"
              />
              <el-icon class="upload-icon" @click="$refs.labelInput.click()">
                <Plus />
              </el-icon>
            </div>
            <!-- 已有文件时，右侧显示上传icon -->
            <div class="add-icon-wrapper" v-else :style="{ display: canAddMoreLabel ? 'flex' : 'none' }">
              <input 
                type="file" 
                accept="image/*,.pdf" 
                @change="onFileSelected($event, 'label')"
                ref="labelInput2"
                style="display: none"
              />
              <el-icon class="upload-icon-small" @click="$refs.labelInput2.click()">
                <Plus />
              </el-icon>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 第二行：Packing List 多图片上传 -->
    <el-row :gutter="20" class="second-row">
      <el-col :span="24">
        <div class="upload-card">
          <label class="card-title">Packing List (Multiple Images)</label>
          <div class="upload-container packing-list-container image-list-grid">
            <div class="image-item" v-for="(img, idx) in packingListImages" :key="idx">
              <div class="image-wrapper">
                <!-- 图片预览 -->
                <img 
                  :src="img.url" 
                  @click="openInNewTab(img.url)" 
                  class="thumbnail"
                  alt="Packing List Image"
                />
                <!-- 删除按钮 - 悬浮在右下角 -->
                <el-button 
                  circle 
                  size="small" 
                  type="danger" 
                  @click="deletePackingListImage(idx)"
                  class="delete-btn"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <!-- 上传icon（支持多图） -->
            <div class="image-item upload-card-item" v-if="canAddMorePackingList">
              <input 
                type="file" 
                accept="image/*" 
                multiple
                @change="onFileSelected($event, 'packingList')"
                ref="packingListInput"
                style="display: none"
              />
              <div class="upload-content" @click="$refs.packingListInput.click()">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <span class="upload-text">{{ packingListImages.length }}/{{ maxPackingListCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { Delete, Plus, Document } from "@element-plus/icons-vue";

const props = defineProps({
  parcel: { type: Object, required: true },
  token: { type: String, required: true },
  currentUser: { type: Object, required: true },
  uploadHandlers: { type: Object, required: true },
  getFullImageUrl: { type: Function, required: true },
  imageManager: { type: Object, required: false },  // 新增：后端返回的分组图片数据
  imageData: { 
    type: Object, 
    required: false,
    default: () => ({})
  },});

const emit = defineEmits([
  "preview-file",
  "check-image-urls",
]);

// 本地管理图片列表（支持多个）
const senderImages = ref([]);
const receiverImages = ref([]);
const labelImages = ref([]);
const packingListImages = ref([]);

// 调试：计算属性来显示当前状态
const debugPackingListInfo = computed(() => ({
  count: packingListImages.value.length,
  images: packingListImages.value,
  isEmpty: packingListImages.value.length === 0,
}));

// 图片类型配置（从后端返回的元数据）
const imageTypeConfig = ref({
  PACKAGE_SENDER: { allow_multiple: false, max_count: 1 },
  PACKAGE_RECEIVER: { allow_multiple: false, max_count: 1 },
  PACKAGE_LABEL: { allow_multiple: false, max_count: 1 },
  PACKING_LIST: { allow_multiple: true, max_count: 10 }
});

// 计算属性：判断是否能添加更多图片
const canAddMoreSender = computed(() => {
  const config = imageTypeConfig.value.PACKAGE_SENDER;
  if (!config.allow_multiple) return senderImages.value.length === 0;
  return senderImages.value.length < config.max_count;
});

const canAddMoreReceiver = computed(() => {
  const config = imageTypeConfig.value.PACKAGE_RECEIVER;
  if (!config.allow_multiple) return receiverImages.value.length === 0;
  return receiverImages.value.length < config.max_count;
});

const canAddMoreLabel = computed(() => {
  const config = imageTypeConfig.value.PACKAGE_LABEL;
  if (!config.allow_multiple) return labelImages.value.length === 0;
  return labelImages.value.length < config.max_count;
});

const maxPackingListCount = computed(() => imageTypeConfig.value.PACKING_LIST.max_count || 10);

const canAddMorePackingList = computed(() => {
  const config = imageTypeConfig.value.PACKING_LIST;
  return packingListImages.value.length < config.max_count;
});

// PDF 使用 HTML5 embed 内嵌查看，无需缩略图生成

// 初始化时从 parcel 数据或后端图片数据加载
const initializeImages = () => {
  console.log('====== initializeImages 开始 ======');
  console.log('props.imageData:', props.imageData);
  console.log('props.imageData type:', typeof props.imageData);
  
  // 检查 imageData 是否有有效的图片数据
  const hasImageData = props.imageData && (
    props.imageData.PACKAGE_SENDER ||
    props.imageData.PACKAGE_RECEIVER ||
    props.imageData.PACKAGE_LABEL ||
    props.imageData.PACKING_LIST
  );
  
  console.log('hasImageData:', hasImageData);
  
  if (hasImageData) {
    console.log('检测到后端图片数据，开始初始化...');
    
    // PACKAGE_SENDER
    if (props.imageData.PACKAGE_SENDER && Array.isArray(props.imageData.PACKAGE_SENDER)) {
      senderImages.value = props.imageData.PACKAGE_SENDER.map(img => ({
        url: props.getFullImageUrl(img.imageUrl),
        name: img.originalName || img.imageUrl.split('/').pop(),
        type: img.mimeType || 'image/*',
        id: img.id,
        imageSubType: img.imageSubType,
      }));
    }

    // PACKAGE_RECEIVER
    if (props.imageData.PACKAGE_RECEIVER && Array.isArray(props.imageData.PACKAGE_RECEIVER)) {
      receiverImages.value = props.imageData.PACKAGE_RECEIVER.map(img => ({
        url: props.getFullImageUrl(img.imageUrl),
        name: img.originalName || img.imageUrl.split('/').pop(),
        type: img.mimeType || 'image/*',
        id: img.id,
        imageSubType: img.imageSubType,
      }));
    }

    // PACKAGE_LABEL
    if (props.imageData.PACKAGE_LABEL && Array.isArray(props.imageData.PACKAGE_LABEL)) {
      labelImages.value = props.imageData.PACKAGE_LABEL.map(img => ({
        url: props.getFullImageUrl(img.imageUrl),
        name: img.originalName || img.imageUrl.split('/').pop(),
        type: img.mimeType || 'image/*',
        id: img.id,
        imageSubType: img.imageSubType,
        thumbnail: null, // 将在下面异步生成
      }));
      
      // PDF 使用 embed 内嵌查看，无需生成缩略图
    }

    // PACKING_LIST（支持多张图片）
    if (props.imageData.PACKING_LIST && Array.isArray(props.imageData.PACKING_LIST)) {
      console.log('===== PACKING_LIST 处理开始 =====');
      console.log('PACKING_LIST 原始数据:', props.imageData.PACKING_LIST);
      console.log('PACKING_LIST 长度:', props.imageData.PACKING_LIST.length);
      
      packingListImages.value = props.imageData.PACKING_LIST.map((img, idx) => {
        console.log(`处理第 ${idx} 个图片:`, img);
        const fullUrl = props.getFullImageUrl(img.imageUrl);
        console.log(`  - imageUrl: ${img.imageUrl}`);
        console.log(`  - 转换后 URL: ${fullUrl}`);
        console.log(`  - mimeType: ${img.mimeType}`);
        
        return {
          url: fullUrl,
          name: img.originalName || img.imageUrl.split('/').pop(),
          type: img.mimeType || 'image/*',
          id: img.id,
          imageSubType: img.imageSubType,
        };
      });
      
      console.log('PACKING_LIST 处理完成，packingListImages.value:', packingListImages.value);
      console.log('packingListImages.value.length:', packingListImages.value.length);
    } else {
      console.log('PACKING_LIST 不存在或格式不正确', {
        hasPACKING_LIST: !!props.imageData?.PACKING_LIST,
        isArray: Array.isArray(props.imageData?.PACKING_LIST)
      });
    }

    // 更新 parcel 对象的简化字段（保持向后兼容）
    if (senderImages.value.length > 0) {
      props.parcel.imgBySender = senderImages.value[0].url;
    }
    if (receiverImages.value.length > 0) {
      props.parcel.imgByReceiver = receiverImages.value[0].url;
    }
    if (labelImages.value.length > 0) {
      props.parcel.label = labelImages.value[0].url;
    }
  } else {
    // 降级：从 parcel 对象的简化字段加载（向后兼容）
    if (props.parcel.imgBySender) {
      const fullUrl = props.getFullImageUrl(props.parcel.imgBySender);
      senderImages.value = [{
        url: fullUrl,
        name: props.parcel.imgBySender.split('/').pop() || 'sender.jpg',
        type: 'image/*'
      }];
    }
    if (props.parcel.imgByReceiver) {
      const fullUrl = props.getFullImageUrl(props.parcel.imgByReceiver);
      receiverImages.value = [{
        url: fullUrl,
        name: props.parcel.imgByReceiver.split('/').pop() || 'receiver.jpg',
        type: 'image/*'
      }];
    }
    if (props.parcel.label) {
      const isImageType = !props.parcel.label.toLowerCase().endsWith('.pdf');
      const fullUrl = props.getFullImageUrl(props.parcel.label);
      labelImages.value = [{
        url: fullUrl,
        name: props.parcel.label.split('/').pop() || 'label',
        type: isImageType ? 'image/*' : 'application/pdf'
      }];

      // PDF 使用 embed 内嵌查看，无需生成缩略图
    }

    // Packing List 降级处理：从 parcel.packingList 回填
    if (props.parcel.packingList && Array.isArray(props.parcel.packingList) && props.parcel.packingList.length > 0) {
      packingListImages.value = props.parcel.packingList.map((pl, idx) => {
        const rawUrl = typeof pl === 'string' ? pl : (pl.url || pl.imageUrl || '');
        const fullUrl = props.getFullImageUrl(rawUrl);
        return {
          url: fullUrl,
          name: (typeof pl === 'string' ? rawUrl : (pl.name || pl.originalName || rawUrl)).split('/').pop() || `packing-${idx + 1}`,
          type: (typeof pl === 'string' ? (rawUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*') : (pl.type || pl.mimeType || 'image/*')),
          id: pl.id || `local-packing-${idx}`,
          imageSubType: pl.imageSubType || null,
        };
      });
    }
  }
};

onMounted(() => {
  console.log('ParcelFileUpload onMounted - imageData:', props.imageData);
  initializeImages();
  
  // 添加额外的延迟检查，以防止竞态条件
  setTimeout(() => {
    console.log('延迟检查 - imageData:', props.imageData);
    if (props.imageData && Object.keys(props.imageData).length > 0) {
      initializeImages();
    }
  }, 100);
});

// 监听 imageData prop 变化，重新初始化
watch(() => props.imageData, (newVal, oldVal) => {
  console.log('imageData 监听触发 - newVal:', newVal, 'oldVal:', oldVal);
  if (newVal && Object.keys(newVal).length > 0) {
    console.log('imageData.PACKING_LIST:', newVal.PACKING_LIST);
  }
  initializeImages();
}, { deep: true, immediate: true }); // 改为 immediate: true 以便立即检查初始值

// 打开新 tab 显示原图或文件
const openInNewTab = (url) => {
  console.log('打开新标签页:', url);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    console.error('URL 为空，无法打开');
    ElMessage.error('无法打开文件：URL 不存在');
  }
};

// 处理文件选择
const onFileSelected = async (event, fieldName) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  try {
    // 对于 packingList，支持多文件；对于其他字段，只处理第一个
    const filesToProcess = fieldName === 'packingList' ? Array.from(files) : [files[0]];
    
    // 检查 max_count 限制
    let targetArray = null;
    let config = null;
    
    if (fieldName === 'sender') {
      targetArray = senderImages;
      config = imageTypeConfig.value.PACKAGE_SENDER;
    } else if (fieldName === 'receiver') {
      targetArray = receiverImages;
      config = imageTypeConfig.value.PACKAGE_RECEIVER;
    } else if (fieldName === 'label') {
      targetArray = labelImages;
      config = imageTypeConfig.value.PACKAGE_LABEL;
    } else if (fieldName === 'packingList') {
      targetArray = packingListImages;
      config = imageTypeConfig.value.PACKING_LIST;
    }

    // 检查是否超过限制
    if (targetArray && config && targetArray.value.length >= config.max_count) {
      ElMessage.error(`最多只能上传 ${config.max_count} 张图片`);
      return;
    }

    // 处理每个文件
    for (const file of filesToProcess) {
      // 检查 max_count（对于多文件上传）
      if (targetArray && config && targetArray.value.length >= config.max_count) {
        ElMessage.warning(`已达到上传限制（${config.max_count}/${config.max_count}）`);
        break;
      }

      try {
        const fileType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*');
        
        // Packing List 仅支持图片文件
        if (fieldName === 'packingList' && !fileType.startsWith('image/')) {
          ElMessage.error(`文件 ${file.name} 不是有效的图片文件，已跳过`);
          continue;
        }
        
        // 上传文件并获取响应
        let uploadResponse = null;
        if (props.uploadHandlers?.upload) {
          uploadResponse = await props.uploadHandlers.upload(file, {
            moduleType: "PARCEL",
            recordId: props.parcel.parcelId || -1,
            imageType: fieldName === 'sender' ? 'PACKAGE_SENDER' 
                     : fieldName === 'receiver' ? 'PACKAGE_RECEIVER'
                     : fieldName === 'label' ? 'PACKAGE_LABEL'
                     : 'PACKING_LIST',
            tempKey: props.parcel.tempKey  // 添加 tempKey
          });
        } else if (props.imageManager?.uploadFile) {
          uploadResponse = await props.imageManager.uploadFile(file, {
            moduleType: "PARCEL",
            recordId: props.parcel.parcelId || -1,
            imageType: fieldName === 'sender' ? 'PACKAGE_SENDER' 
                     : fieldName === 'receiver' ? 'PACKAGE_RECEIVER'
                     : fieldName === 'label' ? 'PACKAGE_LABEL'
                     : 'PACKING_LIST',
            tempKey: props.parcel.tempKey  // 添加 tempKey
          });
        } else {
          // 本地预览 fallback
          uploadResponse = { url: URL.createObjectURL(file) };
        }

        if (uploadResponse) {
          const imgEntry = {
            id: uploadResponse.recordId || uploadResponse.id || null, // recordId 作为图片的唯一标识
            url: uploadResponse.imageUrl || uploadResponse.url || uploadResponse.path,  // 优先使用 imageUrl
            name: uploadResponse.originalName || file.name,
            type: fileType,
            thumbnail: null,
          };

          console.log('[ParcelFileUpload] 上传成功，图片信息:', {
            fieldName,
            id: imgEntry.id,
            url: imgEntry.url,
            name: imgEntry.name,
            recordId: uploadResponse.recordId,
            uploadResponse
          });

          // 添加到相应的列表
          if (fieldName === 'sender') {
            senderImages.value.push(imgEntry);
            props.parcel.imgBySender = imgEntry.url;
          } else if (fieldName === 'receiver') {
            receiverImages.value.push(imgEntry);
            props.parcel.imgByReceiver = imgEntry.url;
          } else if (fieldName === 'label') {
            labelImages.value.push(imgEntry);
            props.parcel.label = imgEntry.url;
          } else if (fieldName === 'packingList') {
            packingListImages.value.push(imgEntry);
          }

          emit("check-image-urls");
        }
      } catch (fileError) {
        console.error(`上传文件 ${file.name} 失败:`, fileError);
        ElMessage.error(`上传 ${file.name} 失败: ${fileError.message}`);
      }
    }

    if (filesToProcess.length > 0) {
      ElMessage.success("上传成功");
    }
  } catch (e) {
    console.error("upload failed", e);
    ElMessage.error(`上传失败: ${e.message}`);
  }

  // 重置 input
  event.target.value = "";
};

// 删除发货人图片
const deleteSenderImage = (index) => {
  senderImages.value.splice(index, 1);
  if (senderImages.value.length === 0) {
    props.parcel.imgBySender = "";
  } else {
    props.parcel.imgBySender = senderImages.value[0].url;
  }
  emit("check-image-urls");
  ElMessage.success("删除成功");
};

// 删除收货人图片
const deleteReceiverImage = (index) => {
  receiverImages.value.splice(index, 1);
  if (receiverImages.value.length === 0) {
    props.parcel.imgByReceiver = "";
  } else {
    props.parcel.imgByReceiver = receiverImages.value[0].url;
  }
  emit("check-image-urls");
  ElMessage.success("删除成功");
};

// 删除标签图片
const deleteLabelImage = (index) => {
  labelImages.value.splice(index, 1);
  if (labelImages.value.length === 0) {
    props.parcel.label = "";
  } else {
    props.parcel.label = labelImages.value[0].url;
  }
  emit("check-image-urls");
  ElMessage.success("删除成功");
};

// 删除 Packing List 图片（新增）
const deletePackingListImage = (index) => {
  packingListImages.value.splice(index, 1);
  emit("check-image-urls");
  ElMessage.success("删除成功");
};

// 同步 packingListImages 数据到 parcel.packingList
const syncPackingList = () => {
  console.log('[ParcelFileUpload] syncPackingList called');
  console.log('[ParcelFileUpload] packingListImages.value:', packingListImages.value);
  if (!props.parcel.packingList) {
    props.parcel.packingList = [];
  }
  props.parcel.packingList = packingListImages.value.map(img => ({
    id: img.id, // 关键：包含图片 ID，以便后端识别
    url: img.url,
    name: img.name,
    type: img.type,
  }));
  console.log('[ParcelFileUpload] parcel.packingList after sync:', props.parcel.packingList);
};

// 暴露 syncPackingList 函数供父组件调用
defineExpose({
  syncPackingList,
});
</script>

<style scoped>
.file-upload-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.file-upload-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

/* 分行间距 */
.first-row {
  margin-bottom: 4px;
}

.second-row {
  margin-top: 4px;
}

.upload-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  background-color: #fff;
}

.card-title {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.upload-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 50%;
  gap: 2px;
  margin: 0 auto;
  min-height: 160px;
}

/* Packing List 容器使用网格布局 */
.upload-container.packing-list-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  width: 100%;
  padding: 15px;
  justify-content: center;
  align-items: start;
}

/* 图片列表 */
.image-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Packing List 网格显示 */
.image-list-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 40px 60px;
  width: 80%;
  padding: 15px;
}

.image-item {
  position: relative;
  width: 180px; /* 固定宽度 */
  flex-shrink: 0; /* 防止缩小 */
}

.image-wrapper {
  position: relative;
  width: 160px;
  min-height: 128px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fafafa;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s;
}

.thumbnail:hover {
  transform: scale(1.05);
}

/* PDF 预览容器 */
.pdf-preview-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  cursor: pointer;
  overflow: hidden;
}

.pdf-preview-wrapper:hover {
  opacity: 0.9;
}

/* PDF 真实缩略图 */
.pdf-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* PDF 加载状态 */
.pdf-loading {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  color: white;
}

.pdf-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.pdf-text {
  font-size: 12px;
  font-weight: 500;
}

/* 保留旧的 PDF 预览样式（兼容） */
.pdf-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.pdf-preview:hover {
  transform: scale(1.05);
}

.pdf-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 60%;
}

.pdf-preview :deep(.el-icon) {
  font-size: 48px;
  margin-bottom: 8px;
}

.pdf-text {
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
}

/* 文件名显示 */
.file-name-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px;
  font-size: 11px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 删除按钮 - 悬浮在右下角 */
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

/* 上传icon容器 */
.upload-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-icon-wrapper:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.upload-icon {
  font-size: 64px;
  color: #409eff;
  cursor: pointer;
  transition: transform 0.2s;
}

.upload-icon:hover {
  transform: scale(1.1);
}

/* 已有图片时，右侧显示的小上传icon */
.add-icon-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 50px;
  min-height: 50px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.3s;
}

.add-icon-wrapper:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.upload-icon-small {
  font-size: 28px;
  color: #409eff;
  cursor: pointer;
  transition: transform 0.2s;
}

.upload-icon-small:hover {
  transform: scale(1.1);
}

/* Packing List 上传容器内容 */
.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  width: 100%;
  height: 100%;
  text-align: center;
}

/* 上传卡片项 - 与图片项相同宽度 */
.upload-card-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px; /* 与.image-item相同 */
  height: 120px; /* 减少到较小高度 */
  border: 2px dashed #ddd;
  border-radius: 4px;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-card-item:hover {
  border-color: #409eff;
  background-color: #f0f7ff;
  transform: scale(1.02);
}

/* PDF 内嵌查看器样式 */
.pdf-embed {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 4px;
  object-fit: contain;
}

.upload-text {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
}
</style>
