<template>
  <el-dialog :model-value="visibleFlag" width="800px" @close="onClose">
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ $t('menu.item.dialogs.editItem') }}</span>
        <div class="blue-divider"></div>
      </div>
    </template>
    <el-form :model="editing" label-width="120px" class="edit-form">
      <el-row :gutter="12">
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.itemNo')"><div>{{ editing.itemNo }}</div></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.qty')"><div>{{ editing.qty }}</div></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.owner')"><div>{{ editing.owner }}</div></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.inspectFee')"><el-input v-model="editing.inspectFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.repairFee')"><el-input v-model="editing.repairFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.keepFee')"><el-input v-model="editing.keepFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.packingFee')"><el-input v-model="editing.packingFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.relabelFee')"><el-input v-model="editing.otherFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.totalFee')"><div style="text-align:right; font-weight:600">{{ computeEditTotal() }}</div></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.slot')"><el-select v-model="editing.slot" :placeholder="$t('menu.item.fields.slot') || 'Slot'" clearable style="width:100%">
            <el-option v-for="s in slotOptions" :key="s.slot" :label="s.slot" :value="s.slot" />
          </el-select></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.item.fields.isLabelChanged')"><el-select v-model="editing.isLabelChanged" :placeholder="$t('menu.item.fields.isLabelChanged')" clearable style="width:100%">
            <el-option :label="$t('menu.item.labelChangedStatus.notCompleted')" :value="0" />
            <el-option :label="$t('menu.item.labelChangedStatus.completed')" :value="1" />
          </el-select></el-form-item></el-col>
        <el-col :span="24"><el-form-item :label="$t('menu.item.fields.feeRemarks')"><el-input type="textarea" v-model="editing.feeRemarks" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isPaid')"><el-select v-model="editing.isPaid" :placeholder="$t('menu.item.fields.isPaid')" style="width:100%"><el-option :label="$t('menu.item.paidStatus.unpaid')" :value="0" /><el-option :label="$t('menu.item.paidStatus.paid')" :value="1" /></el-select></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.paymentDate')"><el-date-picker v-model="editing.paymentDate" type="date" :placeholder="$t('menu.item.placeholders.selectDate')" style="width:100%" /></el-form-item></el-col>
        <el-col :span="24"><el-form-item :label="$t('menu.item.fields.remark')"><div>{{ editing.remark }}</div></el-form-item></el-col>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <div class="blue-divider"></div>
        <div class="button-wrapper">
          <el-button @click="onClose">{{ $t('menu.item.buttons.cancel') }}</el-button>
          <el-button type="primary" @click="onSave">{{ $t('menu.item.buttons.save') }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatFee, computeTotalFee } from '@/utils/fees'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
  visible: { type: Boolean, default: undefined },
  editing: { type: Object, default: () => ({}) },
  slotOptions: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'update:visible', 'save', 'close'])

const onClose = () => {
  emit('update:modelValue', false)
  emit('update:visible', false)
  emit('close')
}

const visibleFlag = computed(() => {
  if (props.modelValue !== undefined) return props.modelValue
  return props.visible
})

const computeEditTotal = () => {
  return formatFee(computeTotalFee(props.editing))
}

const onSave = () => {
  emit('save')
}
</script>

<style scoped>
.fee-input :deep(.el-input__inner) {
  text-align: right;
}

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
  gap: 8px;
}

.edit-form :deep(.el-form-item) {
  margin-bottom: 12px;
}
.edit-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}
.edit-form :deep(.el-form-item__content) {
  line-height: 28px;
}
.edit-form :deep(.el-dialog__body) {
  padding: 16px 20px;
}
</style>
