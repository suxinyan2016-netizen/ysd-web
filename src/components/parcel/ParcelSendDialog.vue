<template>
  <el-dialog :model-value="visible" width="1300px" @close="close">
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">寄出</span>
        <div class="blue-divider"></div>
      </div>
    </template>
    <div style="margin-bottom:16px; display:flex; gap:16px; align-items:center; padding:12px; background-color:#f5f7fa; border-radius:4px">
      <div style="display:flex; align-items:center; gap:8px">
        <span>运单号：</span>
        <span v-if="paidBy === 0"><strong>{{ editablePackageNo }}</strong></span>
        <el-input v-else v-model="editablePackageNo" placeholder="请输入运单号" style="width:160px" />
      </div>
      <div style="display:flex; align-items:center; gap:8px; flex:1">
        <span>收件人：</span>
        <el-input v-model="editableReceiverName" placeholder="请输入收件人" style="width:160px" />
      </div>
      <div style="display:flex; align-items:center; gap:8px; flex:2">
        <span>收件地址：</span>
        <el-input v-model="editableReceiverAddress" placeholder="请输入收件地址" style="width:400px" />
      </div>
      <div style="display:flex; align-items:center; gap:8px; width:200px">
        <span>购买标签费用：</span>
        <el-input v-model="editableFee" placeholder="0.00" style="width:80px" @input="onParcelFeeInput" @blur="onParcelFeeBlur" />
      </div>
    </div>

    <el-table ref="tableRef" :data="items" stripe style="width:100%" border>
      <el-table-column fixed="left" prop="itemNo" label="商品号" width="160" />
      <el-table-column fixed="left" prop="sellerPart" label="商品名" width="220" />
      <el-table-column prop="qty" label="数量" width="55" />
      <el-table-column label="状态" width="80">
        <template #default="{row}">
          <span>{{ getItemStatusLabel(row.itemStatus) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="isGood" label="良品" width="60">
        <template #default="{row}">{{ row.isGood === 1 ? '是' : (row.isGood === 0 ? '否' : '') }}</template>
      </el-table-column>
      <el-table-column prop="isUnpacked" label="已拆" width="60">
        <template #default="{row}">{{ row.isUnpacked ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="货主" prop="owner" width="120">
        <template #default="{row}">
          {{ (row.owner && String(row.owner).trim() !== '') ? row.owner : (getUserName(row.ownerId) || '-') }}
        </template>
      </el-table-column>
      <el-table-column prop="receivePackageNo" label="收货运单号" width="174" />

      <el-table-column label="检验费" width="100" align="right">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.inspectFee" placeholder="0.00" style="width:100%; text-align:right" @input="e => onFeeInput(row,'inspectFee', e.target.value)" @blur="() => onFeeBlur(row,'inspectFee')" />
        </template>
      </el-table-column>
      <el-table-column label="维修费" width="100" align="right">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.repairFee" placeholder="0.00" style="width:100%; text-align:right" @input="e => onFeeInput(row,'repairFee', e.target.value)" @blur="() => onFeeBlur(row,'repairFee')" />
        </template>
      </el-table-column>
      <el-table-column label="保管费" width="100" align="right">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.keepFee" placeholder="0.00" style="width:100%; text-align:right" @input="e => onFeeInput(row,'keepFee', e.target.value)" @blur="() => onFeeBlur(row,'keepFee')" />
        </template>
      </el-table-column>
      <el-table-column label="装箱费" width="100" align="right">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.packingFee" placeholder="0.00" style="width:100%; text-align:right" @input="e => onFeeInput(row,'packingFee', e.target.value)" @blur="() => onFeeBlur(row,'packingFee')" />
        </template>
      </el-table-column>
      <el-table-column label="其他费用" width="100" align="right">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.otherFee" placeholder="0.00" style="width:100%; text-align:right" @input="e => onFeeInput(row,'otherFee', e.target.value)" @blur="() => onFeeBlur(row,'otherFee')" />
        </template>
      </el-table-column>

      <el-table-column label="总费用" width="100" align="right">
        <template #default="{row}">
          <div style="text-align:right">{{ formatFee(totalFor(row)) }}</div>
        </template>
      </el-table-column>

      <el-table-column :label="$t('menu.item.fields.feeRemarks')" width="200">
        <template #default="{row}">
          <el-input type="textarea" v-model="row.feeRemarks" placeholder="Remarks" rows="2" />
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <div class="dialog-footer">
        <div class="blue-divider"></div>
        <div class="button-wrapper">
          <el-button @click="close">取消</el-button>
          <el-button type="primary" @click="onConfirm">确认寄出</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { updateApi as updateItemApi } from '@/api/item'
import { updateApi as updateParcelApi } from '@/api/parcel'
import { useUser } from '@/composables/useUser'

const props = defineProps({
  visible: { type: Boolean, default: false },
  parcel: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:visible','saved'])

const visible = ref(props.visible)
watch(() => props.visible, (v) => visible.value = v)
watch(visible, (v) => emit('update:visible', v))

const items = ref([])
const tableRef = ref()
const { getUserName } = useUser()

// Editable parcel fields
const editablePackageNo = ref('')
const editableReceiverName = ref('')
const editableReceiverAddress = ref('')
const editableFee = ref('')

// Computed paidBy value (handle both paidBy and paidby field names)
const paidBy = computed(() => {
  const val = props.parcel?.paidBy !== undefined ? props.parcel.paidBy : props.parcel?.paidby
  return val !== undefined ? Number(val) : 0
})

watch(() => props.parcel, async (p) => {
  if (p && p.parcelId && visible.value) {
    await fetchItems(p.parcelId)
  }
}, { immediate: true })

watch(visible, async (v) => {
  if (v && props.parcel && props.parcel.parcelId) {
    await fetchItems(props.parcel.parcelId)
    await fetchParcelDetails(props.parcel.parcelId)
    // 延迟滚动，等待表格渲染完成
    setTimeout(() => {
      scrollToFeeArea()
    }, 100)
  }
})

const scrollToFeeArea = () => {
  if (tableRef.value) {
    const bodyWrapper = tableRef.value.$el.querySelector('.el-table__body-wrapper')
    if (bodyWrapper) {
      // 计算费用列的起始位置：商品号(160) + 商品名(220) + 数量(55) + 状态(80) + 良品(60) + 已拆(60) + 货主(120) + 收货运单号(174) = 929px
      // 滚动到检验费列的位置
      bodyWrapper.scrollLeft = 929
    }
  }
}

const fetchItems = async (parcelId) => {
  try {
    const res = await request.get('/items', { params: { sendParcelId: parcelId, pageSize: 1000 } })
      if (res && res.code === 1) {
        items.value = (res.data?.rows || []).map(it => ({
          ...it,
          inspectFee: formatFeeString(it.inspectFee),
          repairFee: formatFeeString(it.repairFee),
          keepFee: formatFeeString(it.keepFee),
          packingFee: formatFeeString(it.packingFee),
          otherFee: formatFeeString(it.otherFee),
          feeRemarks: it.feeRemarks || ''
        }))
    } else {
      items.value = []
    }
  } catch (err) {
    console.error('fetchItems error', err)
    items.value = []
  }
}

const fetchParcelDetails = async (parcelId) => {
  try {
    const res = await request.get(`/parcels/${parcelId}`)
    if (res && res.code === 1 && res.data) {
      const parcelData = res.data
      editablePackageNo.value = parcelData.packageNo || ''
      editableReceiverName.value = parcelData.receiverName || ''
      editableReceiverAddress.value = parcelData.receiverAddress || ''
      editableFee.value = formatFeeString(parcelData.fee)
    }
  } catch (err) {
    console.error('fetchParcelDetails error', err)
  }
}

const numeric = (v) => { const n = Number(v); return isNaN(n) ? 0 : Number(n.toFixed(2)) }

const formatFeeString = (v) => { const n = Number(v); return isNaN(n) ? '0.00' : n.toFixed(2) }

const onFeeInput = (row, field, val) => {
  if (val === undefined || val === null) { row[field] = '' ; return }
  // allow only digits and dot, single dot
  let s = String(val).replace(/[^\d.]/g, '')
  const parts = s.split('.')
  if (parts.length > 1) {
    parts[1] = parts[1].slice(0,2)
    s = parts[0] + '.' + parts[1]
  }
  row[field] = s
}

const onParcelFeeInput = (val) => {
  if (val === undefined || val === null) { editableFee.value = '' ; return }
  let s = String(val).replace(/[^\d.]/g, '')
  const parts = s.split('.')
  if (parts.length > 1) {
    parts[1] = parts[1].slice(0,2)
    s = parts[0] + '.' + parts[1]
  }
  editableFee.value = s
}

const onParcelFeeBlur = () => {
  editableFee.value = formatFeeString(editableFee.value)
}

const onFeeBlur = (row, field) => {
  row[field] = formatFeeString(row[field])
}

const totalFor = (row) => {
  const a = Number(row.inspectFee) || 0
  const b = Number(row.repairFee) || 0
  const c = Number(row.keepFee) || 0
  const d = Number(row.packingFee) || 0
  const e = Number(row.otherFee) || 0
  return Number((a + b + c + d + e).toFixed(2))
}

const formatFee = (v) => {
  return (Number(v) || 0).toFixed(2)
}

const { t } = useI18n()

const getItemStatusLabel = (status) => {
  // support both numeric status codes and i18n key strings like 'item.statuses.sent'
  if (status === undefined || status === null || String(status).trim() === '') return '-'

  // if status already looks like an i18n key, try to translate it; if missing, try with 'menu.' prefix
  if (typeof status === 'string' && status.indexOf('.') !== -1) {
    const translated = t(status)
    if (translated && translated !== status) return translated
    const menuPrefixed = t('menu.' + status)
    if (menuPrefixed && menuPrefixed !== 'menu.' + status) return menuPrefixed
    return String(status)
  }

  switch (Number(status)) {
    case 0:
      return t('menu.item.statuses.pending')
    case 1:
      return t('menu.item.statuses.received')
    case 2:
      return t('menu.item.statuses.sent')
    case 9:
      return t('menu.item.statuses.exception')
    default:
      return String(status ?? '-')
  }
}

const close = () => { visible.value = false }

const onConfirm = async () => {
  if (!items.value || items.value.length === 0) { visible.value = false; emit('saved'); return }
  try {
    // Update parcel fields
    const parcelPayload = {
      parcelId: props.parcel.parcelId,
      packageNo: editablePackageNo.value,
      receiverName: editableReceiverName.value,
      receiverAddress: editableReceiverAddress.value,
      fee: numeric(editableFee.value)
    }
    const parcelRes = await updateParcelApi(parcelPayload)
    if (!(parcelRes && parcelRes.code === 1)) {
      ElMessage.error('包裹信息保存失败')
      return
    }

    // Update item fees
    const updates = items.value.map(it => {
      const payload = {
        itemId: it.itemId,
        inspectFee: numeric(it.inspectFee),
        repairFee: numeric(it.repairFee),
        keepFee: numeric(it.keepFee),
        packingFee: numeric(it.packingFee),
        otherFee: numeric(it.otherFee),
        feeRemarks: it.feeRemarks || ''
      }
      return updateItemApi(payload)
    })
    const resArr = await Promise.all(updates)
    const failed = resArr.some(r => !(r && r.code === 1))
    if (failed) {
      ElMessage.error('部分商品保存失败')
      return
    }
    ElMessage.success('保存成功')
    visible.value = false
    emit('saved')
  } catch (err) {
    console.error('save error', err)
    ElMessage.error('保存失败')
  }
}
</script>

<style scoped>
.dialog-footer { text-align: right }
.fee-input :deep(.el-input__inner) { text-align: right }

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

/* 横向滚动条样式优化 */
:deep(.el-table__body-wrapper) {
  scrollbar-width: thin;
  scrollbar-color: #409EFF #f0f0f0;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar) {
  height: 12px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-track) {
  background: #f0f0f0;
  border-radius: 6px;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb) {
  background: #409EFF;
  border-radius: 6px;
  border: 2px solid #f0f0f0;
}

:deep(.el-table__body-wrapper::-webkit-scrollbar-thumb:hover) {
  background: #66b1ff;
}
</style>
