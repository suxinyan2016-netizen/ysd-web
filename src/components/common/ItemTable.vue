<template>
  <div style="overflow-x:auto;">
    <el-table ref="tableRef" :data="data" :row-key="rowKey" stripe style="min-width:1000px" border @selection-change="onSelectionChange">
      <el-table-column v-if="selectable" type="selection" width="50" />
      <el-table-column prop="itemNo" label="ItemNo" width="160" :fixed="fixedLeft ? 'left' : false" />
      <el-table-column prop="dictName" label="Category" width="160" />
      <el-table-column prop="sellerPart" label="SellerPart" width="280" />
      <el-table-column prop="mfrPart" label="MfrPart" width="280" />
      <el-table-column prop="qty" label="Qty" width="80" />
      <el-table-column prop="isGood" label="IsGood" width="100">
        <template #default="{row}">
          <div>{{ row.isGood === 1 ? 'good' : (row.isGood === 0 ? 'bad' : '') }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="itemStatus" label="Status" width="120">
        <template #default="{row}">
          <span v-if="row.itemStatus===0">Inspecting</span>
          <span v-else-if="row.itemStatus===1">Received</span>
          <span v-else-if="row.itemStatus===2">Sent</span>
          <span v-else-if="row.itemStatus===9">Exception</span>
        </template>
      </el-table-column>
      <el-table-column prop="isUnpacked" label="isUnpacked" width="100">
        <template #default="{row}">
          <div>{{ row.isUnpacked === 1 ? 'unpacked' : (row.isUnpacked === 0 ? 'packed' : '') }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="owner" label="Owner" width="140" />
      <el-table-column prop="keeper" label="Keeper" width="140" />
      <el-table-column prop="receivePackageNo" label="ReceivePackage" width="192" />
      <el-table-column prop="receivedDate" label="ReceivedDate" width="140" />
      <el-table-column prop="sendPackageNo" label="SendPackage" width="192" />
      <el-table-column prop="sendDate" label="SendDate" width="140" />

      <el-table-column label="Stocklife" width="120">
        <template #default="{row}">
          <div>{{ computeStocklife ? computeStocklife(row) + ' days' : '' }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="inspectFee" label="InspectFee" width="120">
        <template #default="{row}"><div>{{ formatFee(row.inspectFee) }}</div></template>
      </el-table-column>
      <el-table-column prop="repairFee" label="RepairFee" width="120">
        <template #default="{row}"><div>{{ formatFee(row.repairFee) }}</div></template>
      </el-table-column>
      <el-table-column prop="keepFee" label="KeepFee" width="120">
        <template #default="{row}"><div>{{ formatFee(row.keepFee) }}</div></template>
      </el-table-column>
      <el-table-column prop="packingFee" label="PackingFee" width="120">
        <template #default="{row}"><div>{{ formatFee(row.packingFee) }}</div></template>
      </el-table-column>
      <el-table-column prop="otherFee" label="OtherFee" width="120">
        <template #default="{row}"><div>{{ formatFee(row.otherFee) }}</div></template>
      </el-table-column>
      <el-table-column label="TotalFee" width="120">
        <template #default="{row}"><div>{{ formatFee(computeTotalFee(row)) }}</div></template>
      </el-table-column>

      <el-table-column prop="ispaid" label="Paid" width="100">
        <template #default="{row}"><div>{{ row.ispaid === 1 ? 'paid' : (row.ispaid === 0 ? 'unpaid' : '') }}</div></template>
      </el-table-column>
      <el-table-column prop="paymentDate" label="PaymentDate" width="140" />
      <el-table-column label="Operation" width="280" align="center" fixed="right">
        <template #default="{row}">
          <slot name="operation" :row="row" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { formatFee, computeTotalFee } from '@/utils/fees'

const props = defineProps({
  data: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'itemId' },
  selectable: { type: Boolean, default: false },
  computeStocklife: { type: Function, default: null },
  fixedLeft: { type: Boolean, default: true }
})
const emit = defineEmits(['selection-change'])

const tableRef = ref(null)

const onSelectionChange = (selection) => emit('selection-change', selection)

// expose method for parents expecting toggleRowSelection on ref
const toggleRowSelection = (row, selected) => {
  if (tableRef.value && tableRef.value.toggleRowSelection) tableRef.value.toggleRowSelection(row, selected)
}

defineExpose({ tableRef, toggleRowSelection })
</script>

<style scoped>
</style>
