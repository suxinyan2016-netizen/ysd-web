<template>
  <el-dialog
    :model-value="visible"
    title="Inspect Parcel"
    width="90%"
    @update:model-value="handleVisibleChange"
    :close-on-click-modal="false"
  >
    <!-- 第一步：包裹信息 -->
    <ParcelInspectStep1
      v-if="currentStep === 1"
      :parcel="parcel"
      :token="token"
      :current-user="currentUser"
      :upload-handlers="uploadHandlers"
      :image-manager="imageManager"
      @next="nextStep"
      @cancel="handleCancel"
    />

    <!-- Item步骤 -->
    <ParcelInspectItemStep
      v-else-if="currentItem"
      :parcel="parcel"
      :item="currentItem"
      :item-index="currentItemIndex"
      :total-items="itemCount"
      :users="users"
      :token="token"
      :current-user="currentUser"
      :upload-handlers="uploadHandlers"
      :image-manager="imageManager"
      @previous="previousStep"
      @next="nextStep"
      @save="handleSave"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <!-- 如果没有items，显示提示 -->
    <div v-else class="no-items-message">
      <el-empty description="No items to inspect" />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ParcelInspectStep1 from "./ParcelInspectStep1.vue";
import ParcelInspectItemStep from "./ParcelInspectItemStep.vue";
import { getParcelDetail, updateItem, updateParcel } from "@/api/parcel";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  parcel: {
    type: Object,
    required: true,
  },
  users: {
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
  imageManager: {
    type: Object,
    required: false,
  },
});

const emit = defineEmits(["update:visible", "refresh"]);

const currentStep = ref(1);
const currentItemIndex = ref(0);

const itemCount = computed(() => {
  const itemList = props.parcel.items || props.parcel.itemList || [];
  return itemList.length;
});

const currentItem = computed(() => {
  const itemList = props.parcel.items || props.parcel.itemList || [];
  return itemList[currentItemIndex.value];
});

const handleVisibleChange = (value) => {
  if (!value) {
    handleCancel();
  }
};

const nextStep = async () => {
  if (currentStep.value === 1) {
    // 验证是否有items
    if (itemCount.value === 0) {
      ElMessage.warning("No items to inspect");
      return;
    }
    // 从第一步进入第二步（第一个item）
    currentStep.value = 2;
    currentItemIndex.value = 0;
  } else {
    // 从item步骤进入下一个item
    if (currentItemIndex.value < itemCount.value - 1) {
      currentItemIndex.value++;
    }
  }
};

const previousStep = () => {
  if (currentStep.value > 2) {
    // 返回上一个item
    currentItemIndex.value--;
  } else if (currentStep.value === 2) {
    // 返回第一步
    currentStep.value = 1;
  }
};

const handleSave = async (itemData) => {
  try {
    // 二次确认
    await ElMessageBox.confirm(
      "Are you sure to save this item?",
      "Confirm Save",
      {
        confirmButtonText: "Save",
        cancelButtonText: "Cancel",
        type: "warning",
      }
    );

    // 保存当前item数据
    await saveItemData(itemData);
    ElMessage.success("Item saved successfully");

    // 如果不是最后一个item，进入下一个
    if (currentItemIndex.value < itemCount.value - 1) {
      currentItemIndex.value++;
    }
  } catch (error) {
    if (error === "cancel") {
      // 用户取消确认
      return;
    }
    console.error("Save error:", error);
    ElMessage.error("Failed to save item: " + error.message);
  }
};

const handleSubmit = async (itemData) => {
  try {
    // 二次确认
    await ElMessageBox.confirm(
      "Are you sure to submit? This will mark parcel as Received.",
      "Confirm Submit",
      {
        confirmButtonText: "Submit",
        cancelButtonText: "Cancel",
        type: "warning",
      }
    );

    // 保存当前item数据
    await saveItemData(itemData);

    // 更新所有items的itemStatus为1
    const itemList = props.parcel.items || props.parcel.itemList || [];
    for (const item of itemList) {
      if (item.itemStatus !== 1) {
        const updateData = {
          itemId: item.itemId,
          itemStatus: 1, // 标记为已检查
        };

        // 设置owner信息
        if (!item.ownerId) {
          updateData.ownerId = props.parcel.ownerId;
        }

        // 设置keeper信息（当前用户）
        if (!item.keeperId) {
          updateData.keeperId = props.currentUser.userId;
        }

        // 设置receive信息
        if (!item.receiveParcelId) {
          updateData.receiveParcelId = props.parcel.parcelId;
          updateData.receivePackageNo = props.parcel.packageNo;
        }

        // 设置receivedDate
        if (!item.receivedDate) {
          const today = new Date().toISOString().split("T")[0];
          updateData.receivedDate = today;
        }

        await updateItem(updateData);
      }
    }

    // 更新parcel状态为Received (status = 2)
    const updateData = {
      parcelId: props.parcel.parcelId,
      status: 2, // Received
    };
    await updateParcel(updateData);

    ElMessage.success("Parcel received successfully");
    emit("refresh");
    emit("update:visible", false);
  } catch (error) {
    if (error === "cancel") {
      // 用户取消确认
      return;
    }
    console.error("Submit error:", error);
    ElMessage.error("Failed to submit: " + error.message);
  }
};

const saveItemData = async (itemData) => {
  try {
    // 准备item更新数据
    const item = currentItem.value;
    const updateData = {
      itemId: item.itemId,
      qty: itemData.qty,
      customerFeedback: itemData.customerFeedback,
      isUnpacked: itemData.isUnpacked,
      iqcResult: itemData.iqcResult,
      itemStatus: 1, // 标记为已检查
    };

    // 设置owner信息
    if (!item.ownerId) {
      updateData.ownerId = props.parcel.ownerId;
    }

    // 设置keeper信息（当前用户）
    if (!item.keeperId) {
      updateData.keeperId = props.currentUser.userId;
    }

    // 设置receive信息
    if (!item.receiveParcelId) {
      updateData.receiveParcelId = props.parcel.parcelId;
      updateData.receivePackageNo = props.parcel.packageNo;
    }

    // 设置receivedDate
    if (!item.receivedDate) {
      const today = new Date().toISOString().split("T")[0];
      updateData.receivedDate = today;
    }

    // 调用API更新item
    await updateItem(updateData);

    // 处理图片上传（如果有新图片）
    if (itemData.newImages && itemData.newImages.length > 0) {
      for (const image of itemData.newImages) {
        if (props.uploadHandlers?.upload) {
          await props.uploadHandlers.upload(image, {
            moduleType: "ITEM",
            recordId: item.itemId,
            imageType: "ITEM_IMAGE",
          });
        }
      }
    }

    // 更新本地数据
    Object.assign(item, updateData);
  } catch (error) {
    throw error;
  }
};

const handleCancel = () => {
  // 重置状态
  currentStep.value = 1;
  currentItemIndex.value = 0;
  emit("update:visible", false);
};

// 监听visible变化，重置状态
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      currentStep.value = 1;
      currentItemIndex.value = 0;
    }
  }
);
</script>

<style scoped>
.no-items-message {
  padding: 40px 20px;
  text-align: center;
}

:deep(.el-dialog__body) {
  padding: 20px 20px 5px;
  max-height: calc(85vh - 140px);
  overflow-y: auto;
}

:deep(.el-dialog) {
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}
</style>
