<template>
  <div class="parcel-inspect-item-step">
    <!-- 步骤指示 -->
    <div class="step-indicator">
      商品 {{ itemIndex + 1 }} / 共 {{ totalItems }} 件
    </div>

    <!-- 第一行：itemNo（不可编辑）, qty（可编辑） -->
    <el-row :gutter="10" class="form-row">
      <el-col :span="12">
        <div class="form-item">
          <label>商品号：</label>
          <span class="value">{{ item.itemNo || "-" }}</span>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="form-item">
          <label>数量：</label>
          <el-input
            v-model.number="formData.qty"
            type="number"
            min="1"
            placeholder="请输入数量"
            size="small"
          ></el-input>
        </div>
      </el-col>
    </el-row>

    <!-- 第二行：Customer Feedback -->
    <el-row :gutter="10" class="form-row">
      <el-col :span="24">
        <div class="form-item">
          <label>客户反馈：</label>
          <el-input
            v-model="formData.customerFeedback"
            placeholder="Enter customer feedback"
            readonly
            class="readonly-input"
          ></el-input>
        </div>
      </el-col>
    </el-row>

    <!-- 第三行：isUnpacked（Radio 控件） -->
    <el-row :gutter="10" class="form-row">
      <el-col :span="24">
        <div class="form-item">
          <label>是否拆包：</label>
          <el-radio-group v-model="formData.isUnpacked" size="small">
            <el-radio :label="0">未拆包</el-radio>
            <el-radio :label="1">已拆包</el-radio>
          </el-radio-group>
        </div>
      </el-col>
    </el-row>

    <!-- 新增一行：Category 下拉 -->
    <el-row :gutter="10" class="form-row">
      <el-col :span="24">
        <div class="form-item">
          <label>类别：</label>
          <el-select v-model="formData.dictId" placeholder="Category" clearable size="small" style="width:220px">
            <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
          </el-select>
        </div>
      </el-col>
    </el-row>

    <!-- 第四行：IQC Result -->
    <el-row :gutter="10" class="form-row">
      <el-col :span="24">
        <div class="form-item">
          <label>检验结果：</label>
          <el-input
            v-model="formData.iqcResult"
            placeholder="默认：无缺陷"
            size="small"
          ></el-input>
        </div>
      </el-col>
    </el-row>

    <!-- 第五行：Item 图片上传 -->
    <el-row :gutter="10" class="form-row">
      <el-col :span="24">
        <div class="form-item">
          <label>商品图片：</label>
          <div class="images-upload">
            <!-- 已上传的图片 -->
            <div
              v-for="(img, idx) in itemImages"
              :key="`item-img-${idx}`"
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
                @click="removeItemImage(idx)"
                class="delete-btn"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <!-- 上传按钮 -->
            <div class="image-box-upload upload-icon" @click="itemFileInput?.click()">
              <input
                type="file"
                accept="image/*"
                multiple
                @change="onItemImageSelected"
                ref="itemFileInput"
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
      <el-button type="primary" @click="handlePrevious">上一步</el-button>
      <template v-if="itemIndex < totalItems - 1">
        <el-button type="primary" @click="handleNext">下一步</el-button>
      </template>
      <template v-else>
        <el-button type="success" @click="handleSave">保存</el-button>
        <el-button type="warning" @click="handleSubmit">提交</el-button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { Plus, Delete } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getGroupedImages } from "@/api/imageManage";
import { findByGroupApi } from '@/api/dict'

const props = defineProps({
  parcel: { type: Object, required: true },
  item: { type: Object, required: true },
  itemIndex: { type: Number, required: true },
  totalItems: { type: Number, required: true },
  users: { type: Array, required: true },
  token: { type: String, required: true },
  currentUser: { type: Object, required: true },
  uploadHandlers: { type: Object, required: true },
  imageManager: { type: Object, required: false },
});

const emit = defineEmits(["previous", "next", "save", "submit", "cancel"]);

const itemFileInput = ref(null);
const itemImages = ref([]);
const formData = reactive({
  qty: null,
  customerFeedback: "",
  isUnpacked: 1, // 默认为 1 = unPacked
  iqcResult: "No Defects",
  dictId: null,
});

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

const loadItemImages = async () => {
  if (!props.item || !props.item.itemId) return;

  try {
    const response = await getGroupedImages("ITEM", props.item.itemId);

    if (response && (response.code === 1 || response.code === 0) && response.data) {
      const groupedImages = response.data;

      itemImages.value = [];
      Object.keys(groupedImages).forEach((imageType) => {
        const images = groupedImages[imageType];
        if (Array.isArray(images) && images.length > 0) {
          images.forEach((img) => {
            itemImages.value.push({
              id: img.id,
              url: img.imageUrl || img.url,
              name: img.originalName || img.fileName,
              uploaded: true,
            });
          });
        }
      });
    }
  } catch (error) {
    console.error("加载item图片失败:", error);
  }
};

const initFormData = () => {
  if (!props.item) return;
  formData.qty = props.item.qty || null;
  formData.customerFeedback = props.item.customerFeedback || "";
  formData.isUnpacked = props.item.isUnpacked !== undefined ? props.item.isUnpacked : 1;
  formData.iqcResult = props.item.iqcResult || "No Defects";
  formData.dictId = props.item.dictId ?? null;
};

const onItemImageSelected = async (event) => {
  if (!props.item || !props.item.itemId) {
    ElMessage.warning("Item information is missing");
    return;
  }

  const files = Array.from(event.target.files || []);

  for (const file of files) {
    const tmpUrl = URL.createObjectURL(file);
    const imgEntry = { url: tmpUrl, uploading: true, file };
    itemImages.value.push(imgEntry);
    // 不再添加到 formData.newImages，因为图片已经直接上传到后台

    try {
      // 上传文件（直接上传到后台）
      let uploadResponse = null;
      if (props.uploadHandlers?.upload) {
        uploadResponse = await props.uploadHandlers.upload(file, {
          moduleType: "ITEM",
          recordId: props.item.itemId,
          imageType: "ITEM_IMAGE",
        });
      }

      if (uploadResponse) {
        imgEntry.id = uploadResponse.recordId || uploadResponse.id;
        imgEntry.url = uploadResponse.imageUrl || uploadResponse.url;
        imgEntry.uploaded = true;
      }
      } catch (e) {
      console.error("上传失败:", e);
      itemImages.value.splice(itemImages.value.indexOf(imgEntry), 1);
      ElMessage.error("上传图片失败");
    } finally {
      imgEntry.uploading = false;
    }
  }

  // 清空选择
  if (event.target) {
    event.target.value = "";
  }
};

const removeItemImage = async (idx) => {
  const img = itemImages.value[idx];

  try {
    // 如果是已上传的图片，调用删除API
    if (img.id && props.imageManager?.deleteImage) {
      await props.imageManager.deleteImage(img.id, true);
    }

    itemImages.value.splice(idx, 1);
    } catch (error) {
    console.error("删除失败:", error);
    ElMessage.error("删除图片失败");
  }
};

const previewImage = (url) => {
  window.open(url, "_blank");
};

const handlePrevious = () => {
  emit("previous");
};

const handleNext = () => {
  emit("next");
};

const handleSave = () => {
  if (!formData.qty) {
    ElMessage.warning("Please enter quantity");
    return;
  }

  emit("save", formData);
};

const handleSubmit = () => {
  if (!formData.qty) {
    ElMessage.warning("Please enter quantity");
    return;
  }

  emit("submit", formData);
};

const handleCancel = () => {
  emit("cancel");
};

onMounted(() => {
  if (props.item) {
    initFormData();
    loadItemImages();
    loadDictOptions();
  }
});

// 监听item变化，重新加载数据
watch(
  () => props.item?.itemId,
  (newItemId) => {
    if (newItemId !== undefined) {
      initFormData();
      loadItemImages();
    }
  }
);
</script>

<style scoped>
.parcel-inspect-item-step {
  padding: 20px 0;
}

.step-indicator {
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
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

.images-upload {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.image-box-upload {
  position: relative;
  width: 150px;
  height: 150px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  background-color: #fafafa;
}

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

.readonly-input :deep(.el-input__wrapper) {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.readonly-input :deep(.el-input__inner) {
  cursor: not-allowed;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}

.button-group {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 手机端适配 */
@media (max-width: 768px) {
  .form-row {
    margin-bottom: 20px;
    padding-bottom: 15px;
  }

  .image-box-upload {
    width: 120px;
    height: 120px;
  }

  .button-group {
    flex-wrap: nowrap;
    justify-content: space-between;
    gap: 6px;
  }

  .button-group :deep(.el-button) {
    flex: 1;
    min-width: 70px;
    padding: 8px 4px;
    font-size: 13px;
  }
}
</style>
