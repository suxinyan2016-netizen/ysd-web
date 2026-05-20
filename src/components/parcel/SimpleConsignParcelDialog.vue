<template>
  <el-dialog :model-value="visible" :title="title" width="1080px" @close="close" append-to-body :modal="true" :z-index="2100">
    <el-form class="parcel-compact" :model="parcel" label-width="120px">
      <el-row :gutter="12">
        <el-col :span="8"><el-form-item :label="$t('menu.parcel_table.fields.packageNo')"><el-input v-model="localParcel.packageNo" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.parcel_table.fields.status')"><div>{{ statusLabel(localParcel.status) }}</div></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.parcel_table.fields.owner')"><el-input :value="ownerName" disabled /></el-form-item></el-col>

        <el-col :span="8"><el-form-item :label="$t('menu.parcel_search.fields.createDate')"><div>{{ localParcel.createDate || today }}</div></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.parcel_dialog.labels.weight')"><el-input v-model="localParcel.weight" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.parcel_dialog.labels.size')"><el-input v-model="localParcel.size" /></el-form-item></el-col>

        <el-col :span="8"><el-form-item :label="$t('menu.parcel_search.fields.sender')"><el-input v-model="localParcel.senderName" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.parcel_search.fields.sendDate')"><el-date-picker v-model="localParcel.sendDate" type="date" style="width:100%" :teleported="true" popper-class="consign-datepicker-popper" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.parcel_dialog.labels.senderAddress')"><el-input v-model="localParcel.senderAddress" /></el-form-item></el-col>

        <el-col :span="8"><el-form-item :label="$t('menu.parcel_search.fields.receiver')"><el-input v-model="localParcel.receiverName" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.parcel_search.fields.receivedDate')"><el-date-picker v-model="localParcel.receivedDate" type="date" style="width:100%" :teleported="true" popper-class="consign-datepicker-popper" /></el-form-item></el-col>
        <el-col :span="8"><el-form-item :label="$t('menu.parcel_dialog.labels.receiverAddress')"><el-input v-model="localParcel.receiverAddress" /></el-form-item></el-col>

        <el-col :span="6"><el-form-item :label="$t('menu.parcel_search.fields.packageType')"><el-input :value="packageTypeLabel" disabled /></el-form-item></el-col>
        <el-col :span="18"><el-form-item :label="$t('menu.parcel_dialog.labels.remarks')"><el-input v-model="localParcel.remark" /></el-form-item></el-col>
      </el-row>
    </el-form>

    <div style="margin-top:12px;">
        <el-row :gutter="8">
          <el-col :span="24" v-for="(row, idx) in localItems" :key="row.itemId || idx" style="margin-bottom:8px">
            <el-card shadow="hover">
              <div style="display:flex; gap:12px; align-items:flex-start;">
                <div style="flex:1">
                  <div style="font-weight:600">{{ row.sellerPart || '' }} <small style="color:#888">/ {{ row.partNo || '' }} / {{ row.itemNo || '' }}</small></div>
                  <div style="margin-top:6px; display:flex; gap:12px; align-items:center;">
                    <div>{{ $t('menu.item.fields.qty') }}: {{ row.qty }}</div>
                    <div>{{ $t('menu.item.fields.owner') }}: {{ row.ownerName || row.owner || '' }}</div>
                    <div>{{ $t('menu.item.fields.status') }}: {{ itemStatusLabel(row.itemStatus) }}</div>
                    <div>{{ $t('menu.item.fields.isConsigned') }}: {{ (row.isConsigned === 1 || row.isConsigned === '1') ? $t('menu.item.consignedStatus.yes') : $t('menu.item.consignedStatus.no') }}</div>
                    <div>{{ $t('menu.item.fields.commissionModel') }}: {{ row.commissionModel === 1 ? $t('menu.item.commissionModel.options.proportion') : (row.commissionModel === 2 ? $t('menu.item.commissionModel.options.fixed') : '') }}</div>
                    <div>{{ $t('menu.item.fields.commissionSet') }}: {{ formatFee(row.commissionSet) }}</div>
                  </div>

                  <div style="margin-top:8px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                    <div style="min-width:200px">{{ $t('menu.item.fields.market') }}: <el-input v-model="row.market" style="width:160px"/></div>
                    <div style="min-width:220px; text-align:right">{{ $t('menu.item.fields.salePrice') }}: <el-input-number v-model.number="row.salePrice" :precision="2" :step="0.01" :controls="false" style="width:120px; text-align:right"/></div>
                    <div>{{ $t('menu.item.fields.saleDate') }}: <el-date-picker v-model="row.saleDate" type="date" style="width:140px" :teleported="true" popper-class="consign-datepicker-popper"/></div>
                  </div>

                  <div style="margin-top:8px">{{ $t('menu.statement.itemsTable.totalFee') }} :</div>
                  <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:6px; align-items:center;">
                    <div style="text-align:right; min-width:100px">{{ $t('menu.item.fields.inspectFee') }}: <el-input-number v-model.number="row.inspectFee" :precision="2" :step="0.01" :controls="false" style="width:80px; text-align:right"/></div>
                    <div style="text-align:right; min-width:100px">{{ $t('menu.item.fields.repairFee') }}: <el-input-number v-model.number="row.repairFee" :precision="2" :step="0.01" :controls="false" style="width:80px; text-align:right"/></div>
                    <div style="text-align:right; min-width:100px">{{ $t('menu.item.fields.keepFee') }}: <el-input-number v-model.number="row.keepFee" :precision="2" :step="0.01" :controls="false" style="width:80px; text-align:right"/></div>
                    <div style="text-align:right; min-width:100px">{{ $t('menu.item.fields.packingFee') }}: <el-input-number v-model.number="row.packingFee" :precision="2" :step="0.01" :controls="false" style="width:80px; text-align:right"/></div>
                    <div style="text-align:right; min-width:100px">{{ $t('menu.item.fields.otherFee') }}: <el-input-number v-model.number="row.otherFee" :precision="2" :step="0.01" :controls="false" style="width:80px; text-align:right"/></div>
                    <div style="text-align:right; min-width:100px">{{ $t('menu.item.fields.commissionFee') }}: <el-input-number :model-value="Number(computeCommissionFee(row) || 0)" :precision="2" :step="0.01" :controls="false" disabled style="width:100px; text-align:right"/></div>
                    <div style="text-align:right; min-width:100px">{{ $t('menu.item.fields.totalFee') }}: <el-input-number :model-value="Number(computeConsignmentTotal(row) || 0)" :precision="2" :step="0.01" :controls="false" disabled style="width:100px; text-align:right"/></div>
                    
                    
                  </div>

                  
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <div style="text-align:right; margin-top:8px; font-weight:600">{{ totalLabel }}: {{ formatFeeLocal(totalAmount) }}</div>
      </div>

    <template #footer>
      <el-button @click="close">{{ $t('menu.item.buttons.cancel') }}</el-button>
      <el-button type="primary" @click="onSave">{{ $t('menu.item.buttons.confirm') }}</el-button>
      <el-button type="success" @click="onSend">{{ $t('menu.parcel_search.actions.send') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatFee as formatFeeUtil, computeConsignmentTotal as computeConsignmentTotalUtil, computeCommissionFee as computeCommissionFeeUtil } from '@/utils/fees'

const props = defineProps({ visible: { type: Boolean, default: false }, title: { type: String, default: 'Add To Parcel' }, parcel: { type: Object, default: () => ({}) }, items: { type: Array, default: () => [] }, ownerName: { type: String, default: '' } })
const emit = defineEmits(['update:visible', 'save', 'send'])

// create local editable copy of items
const localItems = ref((props.items || []).map(i => ({
  ...i,
  salePrice: Number(i?.salePrice || 0),
  inspectFee: Number(i?.inspectFee || 0),
  repairFee: Number(i?.repairFee || 0),
  keepFee: Number(i?.keepFee || 0),
  packingFee: Number(i?.packingFee || 0),
  otherFee: Number(i?.otherFee || 0)
})))
watch(() => props.items, (v) => { localItems.value = (v || []).map(i => ({ ...i, salePrice: Number(i?.salePrice || 0), inspectFee: Number(i?.inspectFee || 0), repairFee: Number(i?.repairFee || 0), keepFee: Number(i?.keepFee || 0), packingFee: Number(i?.packingFee || 0), otherFee: Number(i?.otherFee || 0) })) }, { deep: true })
const { t } = useI18n()
const totalLabel = computed(() => {
  const key = 'menu.statement.itemsTable.totalAmount'
  const v = t(key)
  if (v && v !== key) return v
  return t('menu.statement.itemsTable.totalFeeLabel')
})
const packageTypeLabel = computed(() => {
  const pt = localParcel.value?.packageType ?? (props.parcel?.packageType ?? 3)
  const key = 'menu.package_types.' + pt
  const label = t(key)
  return (label && label !== key) ? label : String(pt)
})
const today = new Date().toISOString().slice(0,10)

const localParcel = ref({ ...(props.parcel || {}) })
watch(() => props.parcel, (p) => { localParcel.value = { ...(p || {}) } }, { deep: true })

function formatYMD(v) { if (!v) return ''; try { const d = new Date(v); if (isNaN(d)) return String(v).slice(0,10); return d.toISOString().slice(0,10) } catch (e) { return String(v).slice(0,10) } }
function formatFee(v) { return formatFeeUtil(Number(v || 0)) }
function formatFeeLocal(v) { return formatFeeUtil(Number(v || 0)) }
function itemStatusLabel(s) {
  const key = s === 0 ? 'menu.item.statuses.pending' : (s === 1 ? 'menu.item.statuses.received' : (s === 2 ? 'menu.item.statuses.sent' : (s === 9 ? 'menu.item.statuses.exception' : null)))
  if (key) {
    const v = t(key)
    if (v && v !== key) return v
  }
  return String(s)
}

function statusLabel(s) {
  const key = 'menu.statuses.' + (s === undefined || s === null ? '' : String(s))
  const v = t(key)
  return (v && v !== key) ? v : String(s)
}

const computeConsignmentTotal = computeConsignmentTotalUtil
const computeCommissionFee = computeCommissionFeeUtil
const totalAmount = computed(() => (localItems.value || []).reduce((sum, r) => sum + (Number(computeConsignmentTotal(r) || 0)), 0))

function close() { emit('update:visible', false) }
function onSave() { emit('save', { parcel: localParcel.value, items: (localItems.value || []).map(i => ({ ...i })) }) }
function onSend() { emit('send', { parcel: localParcel.value, items: (localItems.value || []).map(i => ({ ...i })) }) }

const ownerName = props.ownerName
</script>

<style scoped>
/* Compact spacing for the parcel form (reduce ~50% line-height/spacing) */
.parcel-compact .el-form-item {
  margin-bottom: 8px !important;
}
.parcel-compact .el-form-item__label {
  padding-bottom: 0 !important;
  line-height: 1 !important;
}
.parcel-compact .el-form-item__content {
  margin-top: 0 !important;
}
.parcel-compact .el-row {
  margin-bottom: 6px !important;
}
.parcel-compact .el-col {
  padding-bottom: 6px !important;
}

/* Ensure datepicker popper appears above dialog/card */
.consign-datepicker-popper {
  z-index: 99999 !important;
}
</style>
