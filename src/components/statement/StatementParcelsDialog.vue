<template>
  <el-dialog :model-value="modelValue" :title="title" :width="width" @close="close">
    <div style="max-height:60vh; overflow-y:auto; overflow-x:scroll;">
      <div style="margin-bottom:8px; font-weight:600">{{ headerDate }}</div>
      <el-table :data="parcels" style="width:100%" stripe>
        <el-table-column prop="packageNo" :label="$t('menu.parcel_table.fields.packageNo')" width="220" />
        <el-table-column prop="ownerName" :label="$t('menu.item.fields.owner')" width="120" />
        <el-table-column prop="paidBy" :label="$t('menu.parcel_dialog.labels.paidBy')" width="120">
          <template #default="{row}">{{ row.paidByLabel }}</template>
        </el-table-column>
        <el-table-column prop="payerName" :label="$t('menu.statement.table.payto')" width="160" />
        <el-table-column prop="fee" :label="$t('menu.parcel_dialog.labels.fee')" width="120" align="right">
          <template #default="{row}">{{ formatFee(row.fee) }}</template>
        </el-table-column>
        <el-table-column prop="isPaid" :label="$t('menu.item.fields.isPaid')" width="100">
          <template #default="{row}">{{ row.isPaid === 1 || row.isPaid === '1' ? $t('menu.item.paidStatus.paid') : $t('menu.item.paidStatus.unpaid') }}</template>
        </el-table-column>
      </el-table>
    </div>

    <div style="text-align:right; margin-top:8px; font-weight:600;">
      {{ $t('menu.statement.itemsTable.totalItems') }}: {{ parcels.length }} &nbsp;&nbsp; {{ $t('menu.statement.itemsTable.totalFee') }}: {{ formatFee(totalFee) }}
    </div>

    <template #footer>
      <el-button type="primary" @click="exportParcels">{{ $t('menu.statement.itemsTable.export') }}</el-button>
      <el-button @click="close">{{ $t('menu.buttons.close') || 'Close' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { formatFee } from '@/utils/fees'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  title: { type: String, default: 'Parcels' },
  width: { type: String, default: '1000px' },
  headerDate: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

// Group items by packageNo (use sendPackageNo or receivePackageNo)
  const parcels = computed(() => {
  const map = {}
  ;(props.items || []).forEach(it => {
    const packageNo = it.sendPackageNo || it.receivePackageNo || it.packageNo || it.PackageNo || ''
    if (!packageNo) return
    if (!map[packageNo]) map[packageNo] = { packageNo, ownerName: it.ownerName || it.owner || '', paidBy: it.paidBy ?? it.paidby ?? 0, payerName: '', fee: 0, isPaid: it.isPaid ?? it.ispaid ?? 0 }
    // accumulate fees
    if (it && (it.fee !== undefined && it.fee !== null)) {
      map[packageNo].fee += Number(it.fee || 0)
    } else {
      map[packageNo].fee += Number(it.inspectFee || 0) + Number(it.repairFee || 0) + Number(it.keepFee || 0) + Number(it.packingFee || 0) + Number(it.otherFee || 0)
    }
    // prefer ownerName if present
    if (!map[packageNo].ownerName) map[packageNo].ownerName = it.ownerName || it.owner || ''
    // set isPaid if any item indicates paid
    map[packageNo].isPaid = map[packageNo].isPaid || (it.isPaid ?? it.ispaid ?? 0)
    // capture sender/receiver names for payer label
    map[packageNo].senderName = map[packageNo].senderName || it.senderName || it.sender || ''
    map[packageNo].receiverName = map[packageNo].receiverName || it.receiverName || it.receiver || ''
  })
  // finalize array
  return Object.values(map).map(p => ({
    packageNo: p.packageNo,
    ownerName: p.ownerName,
    paidBy: Number(p.paidBy) || 0,
    paidByLabel: (Number(p.paidBy) === 1 ? (p.senderName || '发件方') : (Number(p.paidBy) === 2 ? (p.receiverName || '收件方') : '')),
    payerName: Number(p.paidBy) === 1 ? (p.senderName || '') : (Number(p.paidBy) === 2 ? (p.receiverName || '') : ''),
    fee: p.fee || 0,
    isPaid: p.isPaid
  }))
})

const totalFee = computed(() => (parcels.value || []).reduce((s, p) => s + (Number(p.fee) || 0), 0))

function close() { emit('update:modelValue', false) }

function exportParcels() {
  // placeholder for export
}
</script>

<style scoped>
</style>
