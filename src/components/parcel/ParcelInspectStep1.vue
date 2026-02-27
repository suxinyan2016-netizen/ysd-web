<template>
  <div class="parcel-inspect-step1">
    <!-- 第一行：packageno, status, processid（不可编辑） -->
    <el-row :gutter="24" class="form-row">
      <el-col :span="12">
        <div class="form-item">
          <label>包裹号：</label>
          <span class="value">{{ parcel.packageNo }}</span>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="form-item">
          <label>处理ID：</label>
          <span class="value">{{ parcel.processId || "-" }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- 第二行：Appearance after Received 图片（只读显示） -->
    <el-row :gutter="10" class="form-row">
      <el-col :span="24">
        <div class="form-item">
            <label>收货后外观：</label>
          <div class="images-display">
            <div
              v-for="(img, idx) in receiverImages"
              :key="idx"
              class="image-box"
            >
              <img
                :src="img.url"
                @click="previewImage(img.url)"
                class="thumbnail"
              />
            </div>
            <div v-if="receiverImages.length === 0" class="no-image">
              无图片
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
        <el-button type="primary" @click="handleNext">下一步</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { Plus, Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getGroupedImages } from "@/api/imageManage";

const props = defineProps({
  parcel: { type: Object, required: true },
  token: { type: String, required: true },
  currentUser: { type: Object, required: true },
  uploadHandlers: { type: Object, required: true },
  imageManager: { type: Object, required: false },
});

const emit = defineEmits(["next", "cancel"]);

const packingFileInput = ref(null);
const receiverImages = ref([]);
const packingListImages = reactive([]);

const getStatusName = (status) => {
  if (status === 0) return "Planed";
  if (status === 1) return "inDelivery";
  if (status === 2) return "Received";
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

onMounted(() => {
  loadImages();
});
</script>

<style scoped>
.parcel-inspect-step1 {
  padding: 20px 0;
}

.form-row {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item label {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-item .value {
  color: #606266;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  min-height: 32px;
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
