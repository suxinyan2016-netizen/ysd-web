<template>
  <el-dialog :model-value="visibleFlag" width="500px" @close="onClose">
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ $t('menu.item.actions.relabel') }}</span>
        <div class="blue-divider"></div>
      </div>
    </template>
    <el-form label-width="120px" class="scan-form" @submit.prevent>
      <el-form-item :label="$t('menu.item.fields.itemNo')">
        <div>{{ itemData.itemNo }}</div>
      </el-form-item>
      <el-form-item :label="$t('menu.item.fields.newItemNo')">
        <div>{{ itemData.mfrPart }}</div>
      </el-form-item>
      <el-form-item :label="$t('menu.item.fields.qty')">
        <div>{{ itemData.qty }}</div>
      </el-form-item>
      <el-form-item :label="$t('menu.item.fields.scanLabel')">
        <el-input
          ref="scanInputRef"
          v-model="scanValue"
          :placeholder="$t('menu.item.fields.scanLabel')"
          @keyup.enter="handleScan"
          clearable
        />
      </el-form-item>
      <el-form-item>
        <div class="count-info">
          <span>{{ $t('menu.item.fields.scannedCount') }}: <strong>{{ scannedCount }}</strong></span>
          <span style="margin-left: 20px">{{ $t('menu.item.fields.totalCount') }}: <strong>{{ itemData.qty }}</strong></span>
        </div>
      </el-form-item>
      <el-alert
        v-if="showCompletedAlert"
        type="success"
        :title="$t('menu.item.fields.relabelCompleted')"
        :closable="false"
        show-icon
      />
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <div class="blue-divider"></div>
        <div class="button-wrapper">
          <el-button @click="onClose">{{ $t('cancel') }}</el-button>
          <el-button type="primary" :disabled="!canConfirm" @click="onConfirm">{{ $t('confirm') }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

const { t } = useI18n()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  itemData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'confirm'])

const visibleFlag = computed({
  get: () => props.visible,
  set: (val) => {
    if (!val) emit('close')
  }
})

const scanValue = ref('')
const scannedCount = ref(0)
const showCompletedAlert = ref(false)
const scanInputRef = ref(null)

const canConfirm = computed(() => {
  return scannedCount.value >= props.itemData.qty
})

const handleScan = () => {
  const targetLabel = props.itemData.mfrPart
  if (!targetLabel) {
    ElMessage.warning(t('menu.item.messages.newItemNoEmpty') || '新料号为空，无法扫描')
    return
  }

  if (scannedCount.value >= props.itemData.qty) {
    scanValue.value = ''
    nextTick(() => {
      scanInputRef.value?.focus()
    })
    return
  }

  if (scanValue.value.trim() === targetLabel.trim()) {
    scannedCount.value++
    scanValue.value = ''
    nextTick(() => {
      scanInputRef.value?.focus()
    })

    if (scannedCount.value >= props.itemData.qty) {
      showCompletedAlert.value = true
    }
  } else {
    scanValue.value = ''
    nextTick(() => {
      scanInputRef.value?.focus()
    })
  }
}

const onConfirm = () => {
  if (!canConfirm.value) {
    ElMessage.warning(t('menu.item.messages.completeScan') || '请完成所有标签扫描')
    return
  }
  emit('confirm', props.itemData)
}

const onClose = () => {
  scannedCount.value = 0
  scanValue.value = ''
  showCompletedAlert.value = false
  emit('close')
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    scannedCount.value = 0
    scanValue.value = ''
    showCompletedAlert.value = false
    nextTick(() => {
      scanInputRef.value?.focus()
    })
  }
})
</script>

<style scoped>
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
  background: linear-gradient(90deg, #409eff 0%, #409eff 100%);
  margin-top: 8px;
}
.dialog-footer {
  display: flex;
  flex-direction: column;
}
.button-wrapper {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
.scan-form {
  padding: 10px 0;
}
.count-info {
  font-size: 14px;
  color: #606266;
}
</style>
