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
      <el-row :gutter="10">
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_table.fields.packageNo') || 'Packageno'" prop="packageNo">
            <el-input
              v-model="parcel.packageNo"
              placeholder="input packageNo"
            ></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_table.fields.status') || 'Status'">
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

        <el-col v-if="parcel.packageType !== 3" :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.processId') || 'ProcessID'" prop="processId">
            <el-input
              v-model="parcel.processId"
              placeholder="input processid"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col v-if="parcel.packageType !== 3" :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.processDate') || 'ProcessDate'">
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

      <!-- 第二行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.owner') || 'Owner'">
            <el-select
              v-model="parcel.ownerId"
              placeholder="choose owner"
              filterable
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
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.createDate') || 'CreateDate'">
            <el-date-picker
              v-model="parcel.createDate"
              type="date"
              style="width: 100%"
              placeholder="setdate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled="isEditMode"
            ></el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_dialog.labels.weight')" prop="weight">
            <el-input
              v-model.number="parcel.weight"
              :placeholder="$t('menu.parcel_dialog.placeholders.inputWeight')"
              type="number"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_dialog.labels.size')" prop="size">
            <el-input
              v-model="parcel.size"
              :placeholder="$t('menu.parcel_dialog.placeholders.inputSize')"
            ></el-input>
          </el-form-item>
        </el-col>
        
      </el-row>


      <!-- 第三行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.sender') || 'Sender'">
            <!-- packageType = 1: 显示文本输入框 -->
            <el-input
              v-if="parcel.packageType === 1"
              v-model="parcel.senderName"
              placeholder="input sender name"
            ></el-input>
            <!-- 其他: 显示下拉选择框 -->
            <el-select
              v-else
              v-model="parcel.senderId"
              placeholder="choose sender"
              filterable
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
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.sendDate') || 'SendDate'">
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
        <el-col :span="12">
          <el-form-item :label="$t('menu.parcel_dialog.labels.senderAddress')" prop="senderAddress">
            <el-input
              v-model="parcel.senderAddress"
              :placeholder="$t('menu.parcel_dialog.placeholders.inputSenderAddress')"
            ></el-input>
          </el-form-item>
        </el-col>
        
      </el-row>

      <!-- 第四行 -->
      <el-row :gutter="10">
        
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.receiver') || 'Receiver'">
            <!-- packageType = 3: 显示文本输入框 -->
            <el-input
              v-if="parcel.packageType === 3"
              v-model="parcel.receiverName"
              placeholder="input receiver name"
            ></el-input>
            <!-- 其他: 显示下拉选择框 -->
            <el-select
              v-else
              v-model="parcel.receiverId"
              placeholder="choose receiver"
              filterable
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
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.receivedDate') || 'ReceivedDate'">
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
        <el-col :span="12">
          <el-form-item :label="$t('menu.parcel_dialog.labels.receiverAddress')" prop="receiverAddress">
            <el-input
              v-model="parcel.receiverAddress"
              :placeholder="$t('menu.parcel_dialog.placeholders.inputReceiverAddress')"
            ></el-input>
          </el-form-item>
        </el-col>
        
      </el-row>

      <!-- 第五行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.packageType') || 'Type'">
            <el-select
              v-model="parcel.packageType"
              :placeholder="$t('menu.parcel_search.placeholders.choosePackageType') || 'choose package type'"
              style="width: 100%"
              :disabled="isEditMode"
            >
              <el-option
                v-for="type in packagetype"
                :key="type.value"
                :label="$t('menu.package_types.' + type.value) || type.name"
                :value="type.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <!-- 只在packageType不是3时显示demands -->
        <el-col :span="18" v-if="parcel.packageType !== 3">
          <el-form-item :label="$t('menu.parcel_table.fields.demands') || 'Demands'">
            <el-checkbox-group v-model="demandsArray">
              <el-checkbox :label="1">{{ $t('menu.parcel_dialog.demands.needInspect') }}</el-checkbox>
              <el-checkbox :label="2">{{ $t('menu.parcel_dialog.demands.needTest') }}</el-checkbox>
              <el-checkbox :label="3">{{ $t('menu.parcel_dialog.demands.needRepair') }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-col>
        
      </el-row>
      <!-- 第六行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_dialog.labels.fee')" prop="fee">
            <el-input
              v-model.number="parcel.fee"
              :placeholder="$t('menu.parcel_dialog.placeholders.inputFee')"
              type="number"
              step="0.01"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.isPaid') || 'IsPaid'">
            <el-select
              v-model="parcel.ispaid"
              :placeholder="$t('menu.parcel_dialog.placeholders.chooseIsPaid')"
              style="width: 100%"
            >
              <el-option
                v-for="j in isPaidList"
                :key="j.value"
                :label="j.name"
                :value="j.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="$t('menu.parcel_dialog.labels.remarks')" prop="remarks">
            <el-input
              v-model.number="parcel.remarks"
              :placeholder="$t('menu.parcel_dialog.placeholders.inputRemarks')"             
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
        <el-button @click="handleCancel">{{ $t('cancel') || 'Cancel' }}</el-button>
        <el-button type="primary" @click="handleSave">{{ $t('confirm') || 'Save' }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
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
  isPaidList: {
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
  packagetype: {
    type: Array,
    required: true,
    default: () => [],
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  getUserById: {
    type: Function,
    required: true,
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

// demands 多选处理
const demandsArray = ref([]);

// 监听 parcel.demands 变化，解析为数组
watch(() => props.parcel.demands, (newVal) => {
  if (newVal && typeof newVal === 'string') {
    // 解析逗号分隔的字符串
    demandsArray.value = newVal.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
  } else if (Array.isArray(newVal)) {
    demandsArray.value = newVal;
  } else {
    demandsArray.value = [];
  }
}, { immediate: true });

// 监听 demandsArray 变化，更新 parcel.demands
watch(demandsArray, (newVal) => {
  if (newVal && newVal.length > 0) {
    props.parcel.demands = newVal.join(',');
  } else {
    props.parcel.demands = '';
  }
});

// 监听 packageType 变化，清空相关字段
watch(() => props.parcel.packageType, (newVal) => {
  if (newVal === 1) {
    // packageType = 1: 清空 senderId，保留 senderName
    props.parcel.senderId = null;
  } else if (newVal === 3) {
    // packageType = 3: 清空 receiverId，保留 receiverName
    props.parcel.receiverId = null;
  }
});

// 监听 receiverId 变化，自动填充 receiverName 和 receiverAddress
watch(() => props.parcel.receiverId, (newVal) => {
  // 只有当 packageType 不是 3 时才自动填充（packageType=3时使用 receiverName）
  if (newVal && props.parcel.packageType !== 3) {
    const user = props.getUserById(newVal);
    console.log('receiverId changed:', newVal, 'packageType:', props.parcel.packageType, 'user:', user);
    if (user) {
      // 自动填充 receiverName
      props.parcel.receiverName = user.name;
      const addressParts = [user.address, user.zipcode, user.phone].filter(Boolean);
      props.parcel.receiverAddress = addressParts.join(' ');
      console.log('Auto-filled receiverName:', props.parcel.receiverName, 'receiverAddress:', props.parcel.receiverAddress);
    }
  } else if (newVal) {
    console.log('receiverId changed but packageType is 3, skipping auto-fill');
  }
});

// 监听 senderId 变化，自动填充 senderName 和 senderAddress
watch(() => props.parcel.senderId, (newVal) => {
  // 只有当 packageType 不是 1 时才自动填充（packageType=1时使用 senderName 手工输入）
  if (newVal && props.parcel.packageType !== 1) {
    const user = props.getUserById(newVal);
    console.log('senderId changed:', newVal, 'packageType:', props.parcel.packageType, 'user:', user);
    if (user) {
      // 自动填充 senderName
      props.parcel.senderName = user.name;
      const addressParts = [user.address, user.zipcode, user.phone].filter(Boolean);
      props.parcel.senderAddress = addressParts.join(' ');
      console.log('Auto-filled senderName:', props.parcel.senderName, 'senderAddress:', props.parcel.senderAddress);
    }
  }
});

// When dialog becomes visible, ensure addresses are populated if sender/receiver ids exist
watch(() => props.visible, (visible) => {
  if (!visible) return;
  // fill senderAddress if missing
  try {
    if (props.parcel && props.parcel.senderId && !props.parcel.senderAddress && props.parcel.packageType !== 1) {
      const user = props.getUserById(props.parcel.senderId);
      if (user) {
        props.parcel.senderName = user.name;
        const addressParts = [user.address, user.zipcode, user.phone].filter(Boolean);
        props.parcel.senderAddress = addressParts.join(' ');
        console.log('Auto-filled senderAddress on open:', props.parcel.senderAddress);
      }
    }

    // fill receiverAddress if missing
    if (props.parcel && props.parcel.receiverId && !props.parcel.receiverAddress && props.parcel.packageType !== 3) {
      const ruser = props.getUserById(props.parcel.receiverId);
      if (ruser) {
        props.parcel.receiverName = ruser.name;
        const raddr = [ruser.address, ruser.zipcode, ruser.phone].filter(Boolean).join(' ');
        props.parcel.receiverAddress = raddr;
        console.log('Auto-filled receiverAddress on open:', props.parcel.receiverAddress);
      }
    }
  } catch (err) {
    console.error('Error auto-filling addresses on dialog open', err);
  }
}, { immediate: false });

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
  // ParcelItemList 已经处理了添加逻辑，这里只转发事件
  emit("add-item");
};

const handleDeleteItem = (index) => {
  // ParcelItemList 已经处理了删除逻辑，这里只转发事件
  emit("delete-item", index);
};
</script>

<style scoped>
:deep(.el-dialog__body) {
  padding: 10px 10px 5px;
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

/* 减少表单项的margin-bottom */
:deep(.el-form-item) {
  margin-bottom: 6px;
}
</style>
