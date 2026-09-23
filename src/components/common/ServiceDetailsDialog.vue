<script setup>
import { defineEmits, defineProps } from 'vue'
import { useI18n } from 'vue-i18n'
import i18n from '@/i18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  services: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  width: { type: String, default: '800px' }
})
const emits = defineEmits(['update:modelValue'])

const close = () => emits('update:modelValue', false)

const { t } = useI18n()

const getTypeLabel = (row) => {
  const id = row && (row.dictId ?? row.value)
  if (id == null) return row?.dictName || row?.name || ''
  const key = `dict.group.3.${id}`
  try {
    const has = i18n.global && i18n.global.te ? i18n.global.te(key) : false
    if (has) return t(key)
  } catch (e) {}
  // fallback explicit mappings
  const sid = String(id)
  const idToZh = {
    '16': '增值服务',
    '17': '出入库服务',
    '18': '修理服务',
    '19': '运输服务',
    '20': '仓储服务'
  }
  const idToEn = {
    '16': 'additional service',
    '17': 'warehouse service',
    '18': 'repair service',
    '19': 'transport service',
    '20': 'storage service'
  }
  const currentLocaleRaw = i18n.global?.locale?.value || 'zh'
  const s = (typeof currentLocaleRaw === 'string') ? currentLocaleRaw.toLowerCase() : String(currentLocaleRaw).toLowerCase()
  const isZh = s.indexOf('zh') === 0
  const isEn = s.indexOf('en') === 0
  if (isZh && idToZh[sid]) return idToZh[sid]
  if (isEn && idToEn[sid]) return idToEn[sid]

  return row?.dictName || row?.name || id
}
</script>

<template>
  <el-dialog :model-value="props.modelValue" :width="props.width" @update:model-value="(v) => emits('update:modelValue', v)">
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ props.title }}</span>
        <div class="blue-divider"></div>
      </div>
    </template>
    <div>
      <div v-if="(props.services || []).length === 0">(No services)</div>
      <el-table v-else :data="props.services" :loading="props.loading" style="width:100%">
        <el-table-column prop="dictId" label="类型" width="220">
          <template #default="{ row }">{{ getTypeLabel(row) }}</template>
        </el-table-column>
        <el-table-column prop="serviceName" label="服务项目" width="320" />
        <el-table-column prop="unit" label="单位" width="100" />
        <el-table-column prop="price" label="价格" width="120">
          <template #default="{ row }">{{ row.price == null ? '' : Number(row.price).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="currency" label="币种" width="100" />
        <el-table-column prop="remark" label="说明" />
      </el-table>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <div class="blue-divider"></div>
        <div class="button-wrapper">
          <el-button type="primary" @click="close">关闭</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
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
  width: 80px;
  min-width: 80px;
  max-width: 80px;
}
</style>
