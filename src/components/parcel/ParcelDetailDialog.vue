<template>
  <el-dialog
    :model-value="visible"
    title="Parcel Details"
    width="90%"
    @update:model-value="handleVisibleChange"
  >
    <div class="detail-form">
      <!-- 基本信息 -->
      <!-- 第一行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">packageno:</label>
            <span class="detail-value">{{ parcel.packageNo || '-' }}</span>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">status:</label>
            <span class="detail-value">{{ getStatusName(parcel.status) }}</span>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">processid:</label>
            <span class="detail-value">{{ parcel.processId || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">processdate:</label>
            <span class="detail-value">{{ parcel.processDate || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第二行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">owner:</label>
            <span class="detail-value">{{ getUserName(parcel.ownerId) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">createdate:</label>
            <span class="detail-value">{{ parcel.createDate || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">weight:</label>
            <span class="detail-value">{{ parcel.weight ? `${parcel.weight} lbs` : '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">size:</label>
            <span class="detail-value">{{ parcel.size || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第三行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">from:</label>
            <span class="detail-value">{{ parcel.senderName || getUserName(parcel.senderId) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">senddate:</label>
            <span class="detail-value">{{ parcel.sendDate || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label class="detail-label">address:</label>
            <span class="detail-value">{{ parcel.senderAddress || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第四行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">to:</label>
            <span class="detail-value">{{ parcel.receiverName || getUserName(parcel.receiverId) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">receiveddate:</label>
            <span class="detail-value">{{ parcel.receivedDate || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label class="detail-label">address:</label>
            <span class="detail-value">{{ parcel.receiverAddress || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第五行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">type:</label>
            <span class="detail-value">{{ getPackageTypeName(parcel.packageType) }}</span>
          </div>
        </el-col>
        <el-col :span="18" v-if="parcel.packageType !== 3">
          <div class="detail-item">
            <label class="detail-label">demands:</label>
            <span class="detail-value">{{ formatDemands(parcel.demands) }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第六行：费用和备注 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">fee:</label>
            <span class="detail-value">{{ parcel.fee ? `$${parcel.fee}` : '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">isPaid:</label>
            <span class="detail-value">{{ parcel.isPaid === 1 ? 'paid' : 'unpaid' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label class="detail-label">remarks:</label>
            <span class="detail-value">{{ parcel.remarks || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 图片显示区域 -->
      <ParcelFileDisplay
        :parcel="parcel"
        :image-data="imageData"
        :visible="visible"
        @preview-file="handlePreviewFile"
      />

      <!-- 商品明细区域（只读） -->
      <ParcelItemListReadonly
        :parcel="parcel"
        :users="users"
        :visible="visible"
        @preview-file="handlePreviewFile"
      />
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from "vue";
import ParcelFileDisplay from "./ParcelFileDisplay.vue";
import ParcelItemListReadonly from "./ParcelItemListReadonly.vue";

const props = defineProps({
  visible: {
    type: Boolean,
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
  packagetype: {
    type: Array,
    required: true,
    default: () => [],
  },
});

const emit = defineEmits([
  "update:visible",
  "preview-file",
]);

const handleVisibleChange = (value) => {
  emit("update:visible", value);
};

// 获取用户姓名
const getUserName = (userId) => {
  if (!userId) return '-';
  const user = props.users.find(u => u.userId === userId);
  return user ? user.name : '-';
};

// 获取状态名称
const getStatusName = (status) => {
  if (status === 0) return 'Planed';
  if (status === 1) return 'inDelivery';
  if (status === 2) return 'Received';
  if (status === 9) return 'Exception';
  return '-';
};

// 获取包裹类型名称
const getPackageTypeName = (type) => {
  const packageType = props.packagetype.find(t => t.value === type);
  return packageType ? packageType.name : '-';
};

// 格式化 demands
const formatDemands = (demands) => {
  if (!demands) return '-';
  const demandsArray = typeof demands === 'string' 
    ? demands.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
    : Array.isArray(demands) ? demands : [];
  
  const labels = [];
  if (demandsArray.includes(1)) labels.push('Need Inspect');
  if (demandsArray.includes(2)) labels.push('Need Test');
  if (demandsArray.includes(3)) labels.push('Need Repair');
  
  return labels.length > 0 ? labels.join(', ') : '-';
};

const handlePreviewFile = (url, type) => {
  emit("preview-file", url, type);
};
</script>

<style scoped>
.detail-form {
  padding: 10px;
}

.detail-item {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
}

.detail-label {
  font-weight: 500;
  color: #606266;
  margin-right: 12px;
  min-width: 80px;
  text-align: right;
  flex-shrink: 0;
}

.detail-value {
  color: #303133;
  word-break: break-word;
  flex: 1;
}

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
</style>
