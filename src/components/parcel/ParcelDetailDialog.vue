<template>
  <el-dialog
    :model-value="visible"
    :title="$t('menu.parcel.title') || 'Parcel Details'"
    width="90%"
    @update:model-value="handleVisibleChange"
  >
    <div class="detail-form">
      <!-- 基本信息 -->
      <!-- 第一行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_table.fields.packageNo') || 'Packageno' }}:</label>
            <span class="detail-value">{{ parcel.packageNo || '-' }}</span>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_table.fields.status') || 'Status' }}:</label>
            <span class="detail-value">{{ getStatusName(parcel.status) }}</span>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_search.fields.processId') || 'ProcessID' }}:</label>
            <span class="detail-value">{{ parcel.processId || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_search.fields.processDate') || 'ProcessDate' }}:</label>
            <span class="detail-value">{{ parcel.processDate || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第二行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_search.fields.owner') || 'Owner' }}:</label>
            <span class="detail-value">{{ getUserName(parcel.ownerId) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_search.fields.createDate') || 'CreateDate' }}:</label>
            <span class="detail-value">{{ parcel.createDate || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">重量:</label>
            <span class="detail-value">{{ parcel.weight ? `${parcel.weight} lbs` : '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">尺寸:</label>
            <span class="detail-value">{{ parcel.size || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第三行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_search.fields.sender') || 'Sender' }}:</label>
            <span class="detail-value">{{ parcel.senderName || getUserName(parcel.senderId) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_search.fields.sendDate') || 'SendDate' }}:</label>
            <span class="detail-value">{{ parcel.sendDate || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label class="detail-label">寄件地址:</label>
            <span class="detail-value">{{ parcel.senderAddress || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第四行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_search.fields.receiver') || 'Receiver' }}:</label>
            <span class="detail-value">{{ parcel.receiverName || getUserName(parcel.receiverId) }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_search.fields.receivedDate') || 'ReceivedDate' }}:</label>
            <span class="detail-value">{{ parcel.receivedDate || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label class="detail-label">收件地址:</label>
            <span class="detail-value">{{ parcel.receiverAddress || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第五行 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_table.fields.packageType') || 'Type' }}:</label>
            <span class="detail-value">{{ getPackageTypeName(parcel.packageType) }}</span>
          </div>
        </el-col>
        <el-col :span="18" v-if="parcel.packageType !== 3">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_table.fields.demands') || 'Demands' }}:</label>
            <span class="detail-value">{{ formatDemands(parcel.demands) }}</span>
          </div>
        </el-col>
      </el-row>

      <!-- 第六行：费用和备注 -->
      <el-row :gutter="10">
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">费用:</label>
            <span class="detail-value">{{ parcel.fee ? `$${parcel.fee}` : '-' }}</span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="detail-item">
            <label class="detail-label">{{ $t('menu.parcel_search.fields.isPaid') || '是否结算' }}:</label>
            <span class="detail-value">{{ parcel.isPaid === 1 ? '已结算' : '未结算' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label class="detail-label">备注:</label>
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
import ParcelFileDisplay from "../parcel/ParcelFileDisplay.vue";
import ParcelItemListReadonly from "../parcel/ParcelItemListReadonly.vue";

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

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const handleVisibleChange = (value) => {
  emit("update:visible", value);
};

// 获取用户姓名
const getUserName = (userId) => {
  if (!userId) return '-';
  const user = props.users.find(u => u.userId === userId);
  return user ? user.name : '-';
};

// 获取状态名称（优先使用 i18n）
const getStatusName = (status) => {
  const key = 'menu.statuses.' + status;
  const label = t(key);
  if (label && label !== key) return label;
  if (status === 0) return 'Planed';
  if (status === 1) return 'inDelivery';
  if (status === 2) return 'Received';
  if (status === 9) return 'Exception';
  return '-';
};

// 获取包裹类型名称（优先使用 i18n）
const getPackageTypeName = (type) => {
  const i18nName = t('menu.package_types.' + type);
  if (i18nName && i18nName !== ('menu.package_types.' + type)) return i18nName;
  const packageType = props.packagetype.find(pt => pt.value === type);
  return packageType ? packageType.name : '-';
};

// 格式化 demands（使用 i18n）
const formatDemands = (demands) => {
  if (!demands) return '-';
  const demandsArray = typeof demands === 'string' 
    ? demands.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
    : Array.isArray(demands) ? demands : [];

  if (demandsArray.length === 0) return '-';

  const labels = demandsArray.map(val => {
    const key = 'menu.demands.' + val;
    const label = t(key);
    if (label && label !== key) return label;
    const fallback = {1: 'Need Inspect', 2: 'Need Test', 3: 'Need Repair'}[val];
    return fallback;
  }).filter(Boolean);

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
