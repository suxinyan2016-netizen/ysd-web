<template>
  <el-dialog :model-value="visible" width="1100px" @close="close" :title="`Sent - ${parcel.packageNo || ''}`">
    <div style="margin-bottom:8px">Packageno: <strong>{{ parcel.packageNo }}</strong></div>

    <el-table :data="items" stripe style="width:100%" border>
      <el-table-column prop="itemNo" label="ItemNo" width="160" />
      <el-table-column prop="sellerPart" label="SellerPart" width="220" />
      <el-table-column prop="qty" label="Qty" width="55" />
      <el-table-column label="Status" width="80">
        <template #default="{row}">
          <span v-if="row.itemStatus==0">Inspecting</span>
          <span v-else-if="row.itemStatus==1">Received</span>
          <span v-else-if="row.itemStatus==2">Sent</span>
          <span v-else-if="row.itemStatus==9">Exception</span>
        </template>
      </el-table-column>
      <el-table-column prop="isGood" label="isGood" width="80">
        <template #default="{row}">{{ row.isGood ? 'Yes' : 'No' }}</template>
      </el-table-column>
      <el-table-column prop="isUnpacked" label="isUnpacked" width="100">
        <template #default="{row}">{{ row.isUnpacked ? 'Yes' : 'No' }}</template>
      </el-table-column>
      <el-table-column label="Owner" prop="owner" width="120">
        <template #default="{row}">
          {{ (row.owner && String(row.owner).trim() !== '') ? row.owner : (getUserName(row.ownerId) || '-') }}
        </template>
      </el-table-column>
      <el-table-column prop="receivePackageNo" label="receivePackageNo" width="165" />
      <el-table-column label="IQCResult" width="140">
        <template #default="{row}">{{ (row.iqcResult !== undefined && row.iqcResult !== null && String(row.iqcResult) !== '') ? row.iqcResult : (row.iqcresult || '-') }}</template>
      </el-table-column>

      <el-table-column label="InspectFee" width="120">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.inspectFee" placeholder="0.00" style="width:100%" @input="e => onFeeInput(row,'inspectFee', e.target.value)" @blur="() => onFeeBlur(row,'inspectFee')" />
        </template>
      </el-table-column>
      <el-table-column label="RepairFee" width="120">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.repairFee" placeholder="0.00" style="width:100%" @input="e => onFeeInput(row,'repairFee', e.target.value)" @blur="() => onFeeBlur(row,'repairFee')" />
        </template>
      </el-table-column>
      <el-table-column label="KeepFee" width="120">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.keepFee" placeholder="0.00" style="width:100%" @input="e => onFeeInput(row,'keepFee', e.target.value)" @blur="() => onFeeBlur(row,'keepFee')" />
        </template>
      </el-table-column>
      <el-table-column label="PackingFee" width="120">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.packingFee" placeholder="0.00" style="width:100%" @input="e => onFeeInput(row,'packingFee', e.target.value)" @blur="() => onFeeBlur(row,'packingFee')" />
        </template>
      </el-table-column>
      <el-table-column label="OtherFee" width="120">
        <template #default="{row}">
          <el-input class="fee-input" v-model="row.otherFee" placeholder="0.00" style="width:100%" @input="e => onFeeInput(row,'otherFee', e.target.value)" @blur="() => onFeeBlur(row,'otherFee')" />
        </template>
      </el-table-column>

      <el-table-column label="TotalFee" width="120">
        <template #default="{row}">
          <div style="text-align:right">{{ formatFee(totalFor(row)) }}</div>
        </template>
      </el-table-column>

      <el-table-column label="FeeRemarks" width="260">
        <template #default="{row}">
          <el-input type="textarea" v-model="row.feeRemarks" placeholder="Remarks" rows="2" />
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close">Cancel</el-button>
        <el-button type="primary" @click="onConfirm">Confirm</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { updateApi as updateItemApi } from '@/api/item'
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
const { getUserName } = useUser()

watch(() => props.parcel, async (p) => {
  if (p && p.parcelId && visible.value) {
    await fetchItems(p.parcelId)
  }
}, { immediate: true })

watch(visible, (v) => {
  if (v && props.parcel && props.parcel.parcelId) fetchItems(props.parcel.parcelId)
})

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

const close = () => { visible.value = false }

const onConfirm = async () => {
  if (!items.value || items.value.length === 0) { visible.value = false; emit('saved'); return }
  try {
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
      ElMessage.error('Some items failed to save')
      return
    }
    ElMessage.success('Items saved')
    visible.value = false
    emit('saved')
  } catch (err) {
    console.error('save items error', err)
    ElMessage.error('Failed to save items')
  }
}
</script>

<style scoped>
.dialog-footer { text-align: right }
.fee-input ::v-deep .el-input__inner { text-align: right }
</style>
