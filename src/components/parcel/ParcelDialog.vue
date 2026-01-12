<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="90%"
    @update:model-value="handleVisibleChange"
  >
    <el-form :model="parcel" :rules="rules" ref="formRef" label-width="80px">
      <!-- 基本信息 -->
      <!-- 第一行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="packageno" prop="packageNo">
            <el-input
              v-model="parcel.packageNo"
              placeholder="input packageNo"
            ></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="status">
            <el-select
              v-model="parcel.status"
              placeholder="choose status"
              style="width: 100%"
            >
              <el-option
                v-for="j in statusList"
                :key="j.value"
                :label="j.name"
                :value="j.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第二行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="processid" prop="processId">
            <el-input
              v-model="parcel.processId"
              placeholder="input processid"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="processdate">
            <el-date-picker
              v-model="parcel.processDate"
              type="date"
              style="width: 100%"
              placeholder="setdate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第三行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="owner">
            <el-select
              v-model="parcel.ownerId"
              placeholder="choose owner"
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
        <el-col :span="12">
          <el-form-item label="createdate">
            <el-date-picker
              v-model="parcel.createDate"
              type="date"
              style="width: 100%"
              placeholder="setdate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第四行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="from">
            <el-select
              v-model="parcel.senderId"
              placeholder="choose sender"
              style="width: 100%"
            >
              <el-option
                v-for="d in users"
                :key="d.userId"
                :label="d.name"
                :value="d.userId"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="senddate">
            <el-date-picker
              v-model="parcel.sendDate"
              type="date"
              style="width: 100%"
              placeholder="setdate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第五行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="to">
            <el-select
              v-model="parcel.receiverId"
              placeholder="choose receiver"
              style="width: 100%"
            >
              <el-option
                v-for="d in users"
                :key="d.userId"
                :label="d.name"
                :value="d.userId"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="receiveddate">
            <el-date-picker
              v-model="parcel.receivedDate"
              type="date"
              style="width: 100%"
              placeholder="setdate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第六行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="weight" prop="weight">
            <el-input
              v-model.number="parcel.weight"
              placeholder="input weight in lbs"
              type="number"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="size" prop="size">
            <el-input
              v-model="parcel.size"
              placeholder="input size LWH in inch"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 文件上传区域 -->
      <ParcelFileUpload
        ref="parcelFileUploadRef"
        :parcel="parcel"
        :image-data="imageData"
        :token="token"
        :current-user="currentUser"
        :upload-handlers="uploadHandlers"
        :get-full-image-url="getFullImageUrl"
        :image-manager="imageManager"
        @preview-file="handlePreviewFile"
        @check-image-urls="handleCheckImageUrls"
      />

      <!-- 商品明细区域 -->
      <ParcelItemList
        :parcel="parcel"
        :users="users"
        :token="token"
        :current-user="currentUser"
        :upload-handlers="uploadHandlers"
        :get-full-image-url="getFullImageUrl"
        :image-manager="imageManager"
        @add-item="handleAddItem"
        @delete-item="handleDeleteItem"
        @preview-file="handlePreviewFile"
        @check-image-urls="handleCheckImageUrls"
        @delete-image="handleDeleteImage"
      />
    </el-form>

    <!-- 底部按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">Cancel</el-button>
        <el-button type="primary" @click="handleSave">Save</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import ParcelFileUpload from "./ParcelFileUpload.vue";
import ParcelItemList from "./ParcelItemList.vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  parcel: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  imageData: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  users: {
    type: Array,
    required: true,
    default: () => [],
  },
  statusList: {
    type: Array,
    required: true,
    default: () => [],
  },
  token: {
    type: String,
    required: true,
  },
  currentUser: {
    type: Object,
    required: true,
  },
  uploadHandlers: {
    type: Object,
    required: true,
  },
  getFullImageUrl: {
    type: Function,
    required: true,
  },
  
  rules: {
    type: Object,
    required: true,
  },
  imageManager: {
    type: Object,
    required: false,
  },
});

const emit = defineEmits([
  "update:visible",
  "save",
  "cancel",
  "preview-file",
  "check-image-urls",
  "add-item",
  "delete-item",
  "delete-image",
]);
// 添加处理 visible 变化的方法
const handleVisibleChange = (value) => {
  emit("update:visible", value);
};

const formRef = ref();
const parcelFileUploadRef = ref();

// 暴露表单引用给父组件
defineExpose({
  resetFields: () => {
    if (formRef.value) {
      formRef.value.resetFields();
    }
  },
  validate: (callback) => {
    if (formRef.value) {
      formRef.value.validate(callback);
    }
  },
});

const handleSave = () => {
  if (!formRef.value) return;

  formRef.value.validate((valid) => {
    if (valid) {
      // 保存前同步 packingList 数据
      if (parcelFileUploadRef.value && parcelFileUploadRef.value.syncPackingList) {
        console.log('[ParcelDialog] Calling syncPackingList before emit save');
        parcelFileUploadRef.value.syncPackingList();
      }
      
      // 保存前同步 itemImages 数据
      syncItemImages();
      
      emit("save");
    }
  });
};

const handleCancel = () => {
  emit("update:visible", false);
  emit("cancel");
};

const handlePreviewFile = (url, type) => {
  console.debug('ParcelDialog - handlePreviewFile', { url, type });
  emit("preview-file", url, type);
};

// 同步 itemImages 数据：将 item._images 同步到 item.itemImages
const syncItemImages = () => {
  const itemList = props.parcel.items || props.parcel.itemList;
  if (itemList && Array.isArray(itemList)) {
    itemList.forEach((item) => {
      if (item._images && Array.isArray(item._images)) {
        // 从 _images 中过滤出已成功上传的图片（有 id 的）
        item.itemImages = item._images
          .filter(img => img.id) // 只保留有 id 的（已上传的）
          .map(img => ({
            id: img.id,
            url: img.url,
            name: img.name || '',
            type: 'ITEM_IMAGE'
          }));
        console.log(`[ParcelDialog] Synced itemImages for item ${item.itemId}:`, item.itemImages);
      }
    });
  }
};

// 修改删除图片函数
// 调整 handleDeleteImage 以兼容 item 层的删除事件（payload 可能是 { itemIndex, imageId }）
const handleDeleteImage = async (payload) => {
  try {
    // item 级删除（payload 为对象且包含 imageId）
    if (payload && payload.imageId) {
      if (props.imageManager?.deleteImage) {
        await props.imageManager.deleteImage(payload.imageId, true);
      }
      emit("delete-image", payload);
      return;
    }

    // 向后兼容：传入字段名（原有逻辑）
    const fieldName = payload;
    const images =
      props.imageManager?.getImagesByType?.(getImageTypeFromField(fieldName)) ||
      [];

    if (images.length > 0) {
      const imageId = images[0].id;
      await props.imageManager.deleteImage(imageId, true);
      emit("delete-image", { fieldName, imageId });
    } else {
      props.parcel[fieldName] = "";
      console.log("图片已删除:", fieldName);
      emit("delete-image", { fieldName });
    }
  } catch (error) {
    ElMessage.error(`删除失败: ${error.message}`);
  }
};

// 辅助函数：根据字段名获取图片类型
const getImageTypeFromField = (fieldName) => {
  const mapping = {
    imgBySender: "PACKAGE_SENDER",
    imgByReceiver: "PACKAGE_RECEIVER",
    label: "PACKAGE_LABEL",
  };
  return mapping[fieldName] || fieldName;
};

const handleCheckImageUrls = () => {
  emit("check-image-urls");
};

const handleAddItem = () => {
  // 兼容 items 和 itemList 字段名
  const itemList = props.parcel.items || props.parcel.itemList;
  if (itemList) {
    itemList.push({
      sellerPart: "",
      mfrPart: "",
      itemNo: "",
      qty: 1,
      itemStatus: 0,
      ownerId: props.parcel.ownerId,
      receivedDate: "",
      keeperId: "",
      receiveParcelId: null,
      sendDate: null,
      dealerReceivedDate: null,
      originalOrder: "",
      originalReturnNo: "",
      customerFeedback: "",
      _images: [],
      itemImages: [],
    });
  }
  emit("add-item");
};

const handleDeleteItem = (index) => {
  // 兼容 items 和 itemList 字段名
  const itemList = props.parcel.items || props.parcel.itemList;
  if (itemList) {
    itemList.splice(index, 1);
  }
  emit("delete-item", index);
};
</script>

<style scoped>
:deep(.el-dialog__body) {
  padding: 20px 20px 10px;
}

:deep(.el-dialog) {
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

:deep(.el-dialog__body) {
  flex: 1;
  overflow-y: auto;
  max-height: calc(85vh - 140px);
}
</style>
