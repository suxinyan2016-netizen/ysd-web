<template>
  <el-dialog
    v-model="dialogVisible"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="!isExporting"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ t('menu.parcel_search.actions.imgExport') }}</span>
        <div class="blue-divider"></div>
      </div>
    </template>
    <div class="export-content">
      <div v-if="!isExporting && !isCompleted" class="export-info">
        <p>是否导出该包裹所有图片. </p>
        <p>Export all images from this parcel to a ZIP file?</p>
        <p style="color: #909399; font-size: 12px; margin-top: 10px;">
          导出文件名 ZIP file will be named: <strong>{{ packageNo }}.zip</strong>
        </p>
        <p v-if="totalImages > 0" style="color: #409eff; font-size: 12px;">
          图片总数 Total images to export: {{ totalImages }}
        </p>
      </div>

      <div v-if="isExporting" class="export-progress">
        <el-progress
          :percentage="progressPercentage"
          :status="progressStatus"
        />
        <p style="margin-top: 10px; font-size: 14px;">
          {{ progressText }}
        </p>
      </div>

      <div v-if="isCompleted" class="export-completed">
        <el-result
          icon="success"
          title="Export Completed"
          :sub-title="`Successfully exported ${exportedCount} images`"
        />
      </div>

      <div v-if="errorMessage" class="export-error">
        <el-alert
          :title="errorMessage"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
    </div>

    <template #footer>
      <div v-if="!isExporting && !isCompleted" class="dialog-footer">
        <div class="blue-divider"></div>
        <div class="button-wrapper">
          <el-button type="primary" @click="handleCancel">取消 Cancel</el-button>
          <el-button type="primary" @click="handleConfirm">导出 Export</el-button>
        </div>
      </div>
      <div v-if="isCompleted" class="dialog-footer">
        <div class="blue-divider"></div>
        <div class="button-wrapper">
          <el-button type="primary" @click="handleClose">Close</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  packageNo: {
    type: String,
    required: true
  },
  totalImages: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update:visible', 'confirm', 'cancel']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
});

const isExporting = ref(false);
const isCompleted = ref(false);
const progressPercentage = ref(0);
const progressStatus = ref('');
const progressText = ref('');
const exportedCount = ref(0);
const errorMessage = ref('');

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
  emit('update:visible', false);
};

const handleClose = () => {
  resetState();
  emit('update:visible', false);
};

const resetState = () => {
  isExporting.value = false;
  isCompleted.value = false;
  progressPercentage.value = 0;
  progressStatus.value = '';
  progressText.value = '';
  exportedCount.value = 0;
  errorMessage.value = '';
};

const startExport = () => {
  resetState();
  isExporting.value = true;
  progressText.value = 'Preparing to export...';
};

const updateProgress = (current, total, text) => {
  progressPercentage.value = Math.round((current / total) * 100);
  progressText.value = text || `Exporting ${current} of ${total} images...`;
};

const completeExport = (count) => {
  isExporting.value = false;
  isCompleted.value = true;
  exportedCount.value = count;
  progressPercentage.value = 100;
  progressStatus.value = 'success';
};

const showError = (message) => {
  errorMessage.value = message;
  isExporting.value = false;
  progressStatus.value = 'exception';
};

defineExpose({
  startExport,
  updateProgress,
  completeExport,
  showError,
  resetState
});
</script>

<style scoped>
.export-content {
  min-height: 100px;
}

.export-info {
  text-align: center;
}

.export-progress {
  padding: 20px 0;
  text-align: center;
}

.export-completed {
  text-align: center;
}

.export-error {
  margin-top: 10px;
}

/* Dialog header styling */
.dialog-header {
  display: flex;
  flex-direction: column;
}
.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.blue-divider {
  height: 2px;
  background-color: #409EFF;
  margin-top: 8px;
}

/* Dialog footer styling */
.dialog-footer {
  display: block;
}
.dialog-footer .blue-divider {
  margin-bottom: 12px;
  width: 100%;
}
.button-wrapper {
  display: flex;
  justify-content: flex-end;
}
.button-wrapper :deep(.el-button) {
  width: auto;
  min-width: 80px;
}
</style>
