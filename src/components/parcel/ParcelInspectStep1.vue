<template>
  <div class="parcel-inspect-step1">
    <!-- 第一行：packageno, status, processid（不可编辑） -->
    <el-row :gutter="24" class="form-row">
      <el-col :span="12">
          <div class="form-item">
            <label>运单号：</label>
            <span class="value">{{ parcel.packageNo }}</span>
            <div style="margin-top:6px; display:flex; align-items:center">
              <div style="font-weight:600; margin-right:8px">货主要求：</div>
              <div style="color:#606266">{{ formatDemands(parcel.demands) }}</div>
            </div>
          </div>
        </el-col>
      <el-col :span="12">
        <div class="form-item">
          <label>处理ID：</label>
          <span class="value">{{ parcel.processId || "-" }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- 第二行：Appearance after Received 图片（可编辑） -->
    <el-row :gutter="10" class="form-row">
      <el-col :span="24">
        <div class="form-item">
            <label>收货后外观：</label>
          <div class="images-upload">
            <div
              v-for="(img, idx) in receiverImages"
              :key="`recv-${idx}`"
              class="image-box-upload"
            >
              <img
                :src="img.url"
                @click="previewImage(img.url)"
                class="thumbnail"
              />
              <el-button
                circle
                size="small"
                type="danger"
                @click="removeReceiverImage(idx)"
                class="delete-btn"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>

            <div class="image-box-upload upload-icon" @click="receiverFileInput?.click()">
              <input
                type="file"
                accept="image/*"
                multiple
                @change="onReceiverImageSelected"
                ref="receiverFileInput"
                style="display: none"
              />
              <el-icon class="upload-plus-icon"><Plus /></el-icon>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 第三行：Packing List 图片上传（可编辑） -->
    <el-row :gutter="10" class="form-row">
      <el-col :span="24">
        <div class="form-item">
            <label>装箱单：</label>
          <div class="images-upload">
            <!-- 已上传的图片 -->
            <div
              v-for="(img, idx) in packingListImages"
              :key="`packing-${idx}`"
              class="image-box-upload"
            >
              <img
                :src="img.url"
                @click="previewImage(img.url)"
                class="thumbnail"
              />
              <el-button
                circle
                size="small"
                type="danger"
                @click="removePackingImage(idx)"
                class="delete-btn"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <!-- 上传按钮 -->
            <div class="image-box-upload upload-icon" @click="packingFileInput?.click()">
              <input
                type="file"
                accept="image/*"
                multiple
                @change="onPackingImageSelected"
                ref="packingFileInput"
                style="display: none"
              />
              <el-icon class="upload-plus-icon"><Plus /></el-icon>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 底部按钮 -->
      <div class="button-group">
        <el-button type="primary" :disabled="hasStoreAsIs" @click="handleNext">下一步</el-button>
        <el-button type="success" @click="handleSave">保存</el-button>
        <el-button v-if="hasStoreAsIs" type="warning" @click="handleReceive">收货</el-button>
      </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { Plus, Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getGroupedImages } from "@/api/imageManage";
import { updateParcel } from '@/api/parcel'
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  parcel: { type: Object, required: true },
  token: { type: String, required: true },
  currentUser: { type: Object, required: true },
  uploadHandlers: { type: Object, required: true },
  imageManager: { type: Object, required: false },
});

const emit = defineEmits(["next", "cancel", "save"]);

const packingFileInput = ref(null);
const receiverImages = ref([]);
const packingListImages = reactive([]);
const receiverFileInput = ref(null);

const getStatusName = (status) => {
  if (status === 0) return "Planed";
  if (status === 1) return "inDelivery";
  if (status === 2) return "Received";
  if (status === 4) return "Closed";
  if (status === 9) return "Exception";
  return "-";
};

const loadImages = async () => {
  if (!props.parcel.parcelId) return;

  try {
    const response = await getGroupedImages("PARCEL", props.parcel.parcelId);

    if (
      response &&
      (response.code === 1 || response.code === 0) &&
      response.data
    ) {
      const groupedImages = response.data;

      // 加载 Appearance after Received
      if (
        groupedImages.PACKAGE_RECEIVER &&
        Array.isArray(groupedImages.PACKAGE_RECEIVER)
      ) {
        receiverImages.value = groupedImages.PACKAGE_RECEIVER.map((img) => ({
          id: img.id,
          url: img.imageUrl || img.url,
          name: img.originalName || img.fileName,
        }));
      }

      // 加载 Packing List
      if (
        groupedImages.PACKING_LIST &&
        Array.isArray(groupedImages.PACKING_LIST)
      ) {
        packingListImages.length = 0;
        groupedImages.PACKING_LIST.forEach((img) => {
          packingListImages.push({
            id: img.id,
            url: img.imageUrl || img.url,
            name: img.originalName || img.fileName,
            uploaded: true,
          });
        });
      }
    }
  } catch (error) {
    console.error("加载图片失败:", error);
  }
};

// 解析 demands 字符串为数组
const parseDemandsArray = (demands) => {
  if (!demands) return []
  if (Array.isArray(demands)) return demands.map(v => parseInt(v))
  return ('' + demands).split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
}

const { t } = useI18n()
const formatDemands = (demands) => {
  const values = parseDemandsArray(demands)
  if (values.length === 0) return '-'
  const labels = values.map(val => {
    const key = 'menu.demands.' + val
    const label = t(key)
    if (label && label !== key) return label
    const fallback = {0: '原包寄存',1: '验货拍照',2: '测试',3: '维修',4: '加固',5: '分箱'}[val]
    return fallback
  }).filter(Boolean)
  return labels.join(', ')
}

// 如果 demands 中包含 0 (原包寄存)，则禁止下一步
const hasStoreAsIs = computed(() => {
  try {
    const vals = parseDemandsArray(props.parcel.demands)
    return vals.includes(0)
  } catch (e) { return false }
})

const onPackingImageSelected = async (event) => {
  const files = Array.from(event.target.files || []);

  for (const file of files) {
    const tmpUrl = URL.createObjectURL(file);
    const imgEntry = { url: tmpUrl, uploading: true, file };
    packingListImages.push(imgEntry);

    try {
      // 上传文件
      let uploadResponse = null;
      if (props.uploadHandlers?.upload) {
        uploadResponse = await props.uploadHandlers.upload(file, {
          moduleType: "PARCEL",
          recordId: props.parcel.parcelId,
          imageType: "PACKING_LIST",
        });
      }

      if (uploadResponse) {
        imgEntry.id = uploadResponse.recordId || uploadResponse.id;
        imgEntry.url = uploadResponse.imageUrl || uploadResponse.url;
        imgEntry.uploaded = true;
      }
    } catch (e) {
      console.error("上传失败:", e);
      packingListImages.splice(packingListImages.indexOf(imgEntry), 1);
      ElMessage.error("Failed to upload image");
    } finally {
      imgEntry.uploading = false;
    }
  }

  // 清空选择
  if (event.target) {
    event.target.value = "";
  }
};

const onReceiverImageSelected = async (event) => {
  const files = Array.from(event.target.files || [])

  for (const file of files) {
    const tmpUrl = URL.createObjectURL(file)
    const imgEntry = { url: tmpUrl, uploading: true, file }
    receiverImages.value.push(imgEntry)

    try {
      let uploadResponse = null
      if (props.uploadHandlers?.upload) {
        uploadResponse = await props.uploadHandlers.upload(file, {
          moduleType: 'PARCEL',
          recordId: props.parcel.parcelId,
          imageType: 'PACKAGE_RECEIVER'
        })
      }

      if (uploadResponse) {
        imgEntry.id = uploadResponse.recordId || uploadResponse.id
        imgEntry.url = uploadResponse.imageUrl || uploadResponse.url
        imgEntry.uploaded = true
      }
    } catch (e) {
      console.error('上传失败:', e)
      receiverImages.value.splice(receiverImages.value.indexOf(imgEntry), 1)
      ElMessage.error('上传图片失败')
    } finally {
      imgEntry.uploading = false
    }
  }

  if (event.target) event.target.value = ''
}

const removeReceiverImage = async (idx) => {
  const img = receiverImages.value[idx]
  try {
    if (img.id && props.imageManager?.deleteImage) {
      await props.imageManager.deleteImage(img.id, true)
    }
    receiverImages.value.splice(idx, 1)
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除图片失败')
  }
}

const removePackingImage = async (idx) => {
  const img = packingListImages[idx];

  try {
    // 如果是已上传的图片，调用删除API
    if (img.id && props.imageManager?.deleteImage) {
      await props.imageManager.deleteImage(img.id, true);
    }

    packingListImages.splice(idx, 1);
  } catch (error) {
    console.error("删除失败:", error);
      ElMessage.error("删除图片失败");
  }
};

const previewImage = (url) => {
  window.open(url, "_blank");
};

const handleNext = () => {
  emit("next");
};

const handleCancel = () => {
  emit("cancel");
};

const handleSave = () => {
  emit('save');
};

const handleReceive = async () => {
  try {
    await ElMessageBox.confirm('确认收货并标记为已收货吗？', '确认收货', { confirmButtonText: '收货', cancelButtonText: '取消', type: 'warning' })
    const today = new Date().toISOString().split('T')[0]
    const payload = { parcelId: props.parcel.parcelId, status: 2, receivedDate: today }
    await updateParcel(payload)
    ElMessage.success('包裹已收货')
    emit('received')
  } catch (err) {
    if (err === 'cancel') return
    console.error('收货失败', err)
    ElMessage.error('收货失败')
  }
}

onMounted(() => {
  loadImages();
});
</script>

<style scoped>
.parcel-inspect-step1 {
  padding: 20px 0;
}

.form-row {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9edf0;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item label {
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  font-size: 13px;
}

.form-item .value {
  color: #606266;
  padding: 6px;
  background-color: #f5f7fa;
  border-radius: 4px;
  min-height: 28px;
  display: flex;
  align-items: center;
}

.images-display {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.images-upload {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.image-box,
.image-box-upload {
  position: relative;
  width: 150px;
  height: 150px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fafafa;
}

.image-box img,
.image-box-upload img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
}

.image-box-upload.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ddd;
}

.image-box-upload.upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #dcdfe6;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fafafa;
}

.image-box-upload.upload-icon:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.upload-plus-icon {
  font-size: 32px;
  color: #8c939d;
}

.image-box-upload.upload-icon:hover .upload-plus-icon {
  color: #409eff;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}

.no-image {
  color: #909399;
  font-style: italic;
  padding: 20px;
  text-align: center;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
  flex: 1;
  min-width: 150px;
}

.button-group {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
