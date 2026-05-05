<template>
  <div class="file-display">
    <!-- 图片显示区域 -->
    <el-row :gutter="10">
      <el-col :span="6">
        <div class="image-section">
          <label class="section-label">{{ $t('menu.parcel_dialog.images.senderAppearance') }}：</label>
          <div class="image-preview" v-if="hasPackageSendImages">
            <div v-for="(img, index) in packageSendImages" :key="index" class="image-item">
              <img :src="img.url" @click="preview(img.url)" class="thumbnail" :alt="t('menu.parcel_dialog.images.senderAppearance') + ' ' + (index + 1)" />
            </div>
          </div>
          <div v-else class="no-image">{{ $t('menu.parcel_dialog.images.noImage') }}</div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="image-section">
          <label class="section-label">{{ $t('menu.parcel_dialog.images.receiverAppearance') }}：</label>
          <div class="image-preview" v-if="hasPackageReceiverImages">
            <div v-for="(img, index) in packageReceiverImages" :key="index" class="image-item">
              <img :src="img.url" @click="preview(img.url)" class="thumbnail" :alt="t('menu.parcel_dialog.images.receiverAppearance') + ' ' + (index + 1)" />
            </div>
          </div>
          <div v-else class="no-image">{{ $t('menu.parcel_dialog.images.noImage') }}</div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="image-section">
          <label class="section-label">{{ $t('menu.parcel_dialog.images.label') }}：</label>
          <div class="image-preview" v-if="hasPackageLabelImages">
            <div v-for="(img, index) in packageLabelImages" :key="index" class="image-item">
              <!-- 图片预览 -->
              <img 
                v-if="img.type && img.type.startsWith('image/')"
                :src="img.url" 
                @click="preview(img.url)" 
                class="thumbnail" 
                :alt="`标签 ${index + 1}`" 
              />
              <!-- PDF预览 - 使用 embed 内嵌查看 -->
              <embed 
                v-else-if="img.type === 'application/pdf'"
                :src="img.url + '#toolbar=1&navpanes=0&scrollbar=0'" 
                type="application/pdf"
                class="pdf-embed"
                alt="PDF 预览"
              />
            </div>
          </div>
          <div v-else class="no-image">{{ $t('menu.parcel_dialog.images.noImage') }}</div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="image-section">
          <label class="section-label">{{ $t('menu.parcel_dialog.images.packingList') }}：</label>
          <div class="image-preview" v-if="hasPackingListImages">
            <div v-for="(img, index) in packingListImages" :key="index" class="image-item">
              <img :src="img.url" @click="preview(img.url)" class="thumbnail" :alt="`Packing List ${index + 1}`" />
            </div>
          </div>
          <div v-else class="no-image">{{ $t('menu.parcel_dialog.images.noImage') }}</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from 'vue-i18n'
import { getGroupedImages } from "@/api/imageManage";

const props = defineProps({
  parcel: {
    type: Object,
    required: true,
  },
  imageData: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  visible: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const emit = defineEmits(["preview-file"]);

const { t } = useI18n();

const packageSendImages = ref([]);
const packageReceiverImages = ref([]);
const packageLabelImages = ref([]);
const packingListImages = ref([]);

const hasPackageSendImages = computed(() => packageSendImages.value.length > 0);
const hasPackageReceiverImages = computed(() => packageReceiverImages.value.length > 0);
const hasPackageLabelImages = computed(() => packageLabelImages.value.length > 0);
const hasPackingListImages = computed(() => packingListImages.value.length > 0);

// 加载图片数据
const loadImages = async () => {
  if (!props.parcel.parcelId) {
    console.log('[ParcelFileDisplay] No parcelId, skipping image load');
    return;
  }

  try {
    console.log('[ParcelFileDisplay] Loading images for parcelId:', props.parcel.parcelId);
    const response = await getGroupedImages('PARCEL', props.parcel.parcelId);
    
    console.log('[ParcelFileDisplay] API response:', response);
    
    if (response) {
      // response may be { code, data } or already the data object depending on request helper
      let payload = response;
      if ((response.code === 1 || response.code === 0) && response.data) payload = response.data;

      // prefer props.imageData when provided and non-empty
      const source = Object.keys(props.imageData || {}).length ? props.imageData : payload;

      // Normalize keys (case-insensitive) to expected types
      const normalized = {};
      const wanted = ['PACKAGE_SENDER', 'PACKAGE_RECEIVER', 'PACKAGE_LABEL', 'PACKING_LIST'];
      Object.keys(source || {}).forEach(k => {
        const up = String(k).toUpperCase().trim();
        if (wanted.includes(up)) normalized[up] = source[k];
      });

      console.log('[ParcelFileDisplay] Normalized grouped images keys:', Object.keys(normalized));
      
      // 提取不同类型的图片
      if (normalized.PACKAGE_SENDER && Array.isArray(normalized.PACKAGE_SENDER)) {
        packageSendImages.value = normalized.PACKAGE_SENDER.map(img => ({
          id: img.id,
          url: img.thumbnailUrl || img.imageUrl || img.url,
          name: img.originalName || img.fileName
        }));
        console.log('[ParcelFileDisplay] PACKAGE_SENDER images:', packageSendImages.value);
      } else {
        packageSendImages.value = [];
      }
      
      if (normalized.PACKAGE_RECEIVER && Array.isArray(normalized.PACKAGE_RECEIVER)) {
        packageReceiverImages.value = normalized.PACKAGE_RECEIVER.map(img => ({
          id: img.id,
          url: img.thumbnailUrl || img.imageUrl || img.url,
          name: img.originalName || img.fileName
        }));
        console.log('[ParcelFileDisplay] PACKAGE_RECEIVER images:', packageReceiverImages.value);
      } else {
        packageReceiverImages.value = [];
      }
      
      if (normalized.PACKAGE_LABEL && Array.isArray(normalized.PACKAGE_LABEL)) {
        packageLabelImages.value = normalized.PACKAGE_LABEL.map(img => ({
          id: img.id,
          url: img.thumbnailUrl || img.imageUrl || img.url,
          name: img.originalName || img.fileName,
          type: img.mimeType || img.type
        }));
        console.log('[ParcelFileDisplay] PACKAGE_LABEL images:', packageLabelImages.value);
      } else {
        packageLabelImages.value = [];
      }
      
      if (normalized.PACKING_LIST && Array.isArray(normalized.PACKING_LIST)) {
        packingListImages.value = normalized.PACKING_LIST.map(img => ({
          id: img.id,
          url: img.thumbnailUrl || img.imageUrl || img.url,
          name: img.originalName || img.fileName
        }));
        console.log('[ParcelFileDisplay] PACKING_LIST images:', packingListImages.value);
      } else {
        packingListImages.value = [];
      }
    } else {
      console.log('[ParcelFileDisplay] Invalid response or no data');
    }
  } catch (error) {
    console.error('[ParcelFileDisplay] 加载图片失败:', error);
  }
};

onMounted(async () => {
  console.log('[ParcelFileDisplay] onMounted, parcel:', props.parcel);
  await loadImages();
});

// 监听 parcel.parcelId 变化或 visible 变化，重新加载图片
watch(() => props.parcel.parcelId, async (newParcelId, oldParcelId) => {
  if (newParcelId && newParcelId !== oldParcelId) {
    console.log('[ParcelFileDisplay] parcelId changed, reloading images');
    await loadImages();
  }
}, { immediate: false });

// 监听 visible 变化，当dialog打开时重新加载图片
watch(() => props.visible, async (newVisible) => {
  if (newVisible && props.parcel.parcelId) {
    console.log('[ParcelFileDisplay] Dialog opened, reloading images for parcelId:', props.parcel.parcelId);
    await loadImages();
  }
}, { immediate: false });

const preview = (url) => {
  emit("preview-file", getFullImageUrl(url), "image");
};

// Ensure URL is absolute (prefix origin when path starts with '/')
const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  // If url already includes the API base (e.g. /api/...), prefix with current origin
  if (url.startsWith('/')) {
    return window.location.origin + url;
  }
  // otherwise treat as relative path
  return window.location.origin + '/' + url;
};
</script>

<style scoped>
.file-display {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fafafa;
}

.image-section {
  margin-bottom: 15px;
}

.section-label {
  display: block;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
  font-size: 14px;
}

.image-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.image-item {
  position: relative;
  width: 100%;
  padding-top: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fff;
}

.image-item img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: transform 0.2s;
}

.image-item img:hover {
  transform: scale(1.05);
}

.pdf-embed {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: none;
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
