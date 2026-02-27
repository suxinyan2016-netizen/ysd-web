<template>
  <div style="overflow-x:auto;">
    <el-table ref="tableRef" :data="data" :row-key="rowKey" stripe style="min-width:1000px" border @selection-change="onSelectionChange">
      <el-table-column v-if="selectable" type="selection" width="50" />
      <el-table-column prop="itemNo" :label="$t('menu.item.fields.itemNo')" width="160" :fixed="fixedLeft ? 'left' : false" />
      <el-table-column prop="dictName" :label="$t('menu.item.fields.category')" width="160" />
      <el-table-column prop="sellerPart" :label="$t('menu.item.fields.sellerPart')" width="280" />
      <el-table-column prop="mfrPart" :label="$t('menu.item.fields.mfrPart')" width="280" />
      <el-table-column prop="qty" :label="$t('menu.item.fields.qty')" width="80" />
      <el-table-column prop="isGood" :label="$t('menu.item.fields.isGood')" width="100">
        <template #default="{row}">
          <div>{{ row.isGood === 1 ? $t('menu.item.goodStatus.good') : (row.isGood === 0 ? $t('menu.item.goodStatus.bad') : '') }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="itemStatus" :label="$t('menu.item.fields.status')" width="120">
        <template #default="{row}">
          <span v-if="row.itemStatus===0">{{ $t('menu.item.statuses.pending') }}</span>
          <span v-else-if="row.itemStatus===1">{{ $t('menu.item.statuses.received') }}</span>
          <span v-else-if="row.itemStatus===2">{{ $t('menu.item.statuses.sent') }}</span>
          <span v-else-if="row.itemStatus===9">{{ $t('menu.item.statuses.exception') }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="isUnpacked" :label="$t('menu.item.fields.isUnpacked')" width="100">
        <template #default="{row}">
          <div>{{ row.isUnpacked === 1 ? $t('menu.item.unpackedStatus.unpacked') : (row.isUnpacked === 0 ? $t('menu.item.unpackedStatus.packed') : '') }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="owner" :label="$t('menu.item.fields.owner')" width="140" />
      <el-table-column prop="keeper" :label="$t('menu.item.fields.keeper')" width="140" />
      <el-table-column prop="receivePackageNo" :label="$t('menu.item.fields.receivePackageNo')" width="192" />
      <el-table-column prop="receivedDate" :label="$t('menu.item.fields.receivedDate')" width="140" />
      <el-table-column prop="sendPackageNo" :label="$t('menu.item.fields.sendPackageNo')" width="192" />
      <el-table-column prop="sendDate" :label="$t('menu.item.fields.sendDate')" width="140" />

      <el-table-column :label="$t('menu.item.fields.stocklife')" width="120">
        <template #default="{row}">
          <div>{{ computeStocklife ? computeStocklife(row) + ' days' : '' }}</div>
        </template>
      </el-table-column>

      <el-table-column prop="inspectFee" :label="$t('menu.item.fields.inspectFee')" width="120" align="right">
        <template #default="{row}"><div style="text-align:right">{{ formatFee(row.inspectFee) }}</div></template>
      </el-table-column>
      <el-table-column prop="repairFee" :label="$t('menu.item.fields.repairFee')" width="120" align="right">
        <template #default="{row}"><div style="text-align:right">{{ formatFee(row.repairFee) }}</div></template>
      </el-table-column>
      <el-table-column prop="keepFee" :label="$t('menu.item.fields.keepFee')" width="120" align="right">
        <template #default="{row}"><div style="text-align:right">{{ formatFee(row.keepFee) }}</div></template>
      </el-table-column>
      <el-table-column prop="packingFee" :label="$t('menu.item.fields.packingFee')" width="120" align="right">
        <template #default="{row}"><div style="text-align:right">{{ formatFee(row.packingFee) }}</div></template>
      </el-table-column>
      <el-table-column prop="otherFee" :label="$t('menu.item.fields.otherFee')" width="120" align="right">
        <template #default="{row}"><div style="text-align:right">{{ formatFee(row.otherFee) }}</div></template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.totalFee')" width="120" align="right">
        <template #default="{row}"><div style="text-align:right">{{ formatFee(computeTotalFee(row)) }}</div></template>
      </el-table-column>

      <el-table-column prop="ispaid" :label="$t('menu.item.fields.isPaid')" width="100">
        <template #default="{row}"><div>{{ row.ispaid === 1 ? $t('menu.item.paidStatus.paid') : (row.ispaid === 0 ? $t('menu.item.paidStatus.unpaid') : '') }}</div></template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.paymentDate')" width="140">
        <template #default="{row}">
          <div>{{ formatYMD(row.paymentDate) }}</div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.operation')" width="280" align="center" fixed="right">
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

function formatYMD(v) {
  if (!v) return ''
  try {
    const d = new Date(v)
    if (isNaN(d)) return String(v).slice(0,10)
    return d.toISOString().slice(0,10)
  } catch (e) {
    return String(v).slice(0,10)
  }
}

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
