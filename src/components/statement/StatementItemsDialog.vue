<template>
  <el-dialog :model-value="modelValue" :title="title" :width="width" @close="close">
    <div style="max-height:60vh; overflow-y:auto; overflow-x:scroll;">
      <el-table :data="items" style="width:100%" stripe>
        <el-table-column prop="itemNo" :label="$t('menu.statement.itemsTable.itemNo')" width="160" />

        <el-table-column prop="sellerPart" :label="$t('menu.statement.itemsTable.sellerPart')" width="200" />
        <el-table-column prop="qty" :label="$t('menu.statement.itemsTable.qty')" width="80" />
        <el-table-column prop="sendPackageNo" :label="$t('menu.statement.itemsTable.sendPackage')" width="220" />

        <!-- consignment columns, hidden if none of the items are consigned -->
        <el-table-column v-if="showConsignColumns" prop="isConsigned" :label="$t('menu.item.fields.isConsigned')" width="100">
          <template #default="{row}">
            <div>{{ row.isConsigned === 1 || row.isConsigned === '1' ? $t('menu.item.consignedStatus.yes') : $t('menu.item.consignedStatus.no') }}</div>
          </template>
        </el-table-column>
        <el-table-column v-if="showConsignColumns" prop="commissionModel" :label="$t('menu.item.fields.commissionModel')" width="120">
          <template #default="{row}">{{ row.commissionModel === 1 ? $t('menu.item.commissionModel.options.proportion') : (row.commissionModel === 2 ? $t('menu.item.commissionModel.options.fixed') : '') }}</template>
        </el-table-column>
        <el-table-column v-if="showConsignColumns" prop="commissionSet" :label="$t('menu.item.fields.commissionSet')" width="120" align="right">
          <template #default="{row}">{{ formatFee(row.commissionSet) }}</template>
        </el-table-column>
        <el-table-column v-if="showConsignColumns" prop="market" :label="$t('menu.item.fields.market')" width="160">
          <template #default="{row}">{{ row.market }}</template>
        </el-table-column>
        <el-table-column v-if="showConsignColumns" prop="saleDate" :label="$t('menu.item.fields.saleDate')" width="120">
          <template #default="{row}">{{ formatYMD(row.saleDate) }}</template>
        </el-table-column>
        <el-table-column v-if="showConsignColumns" prop="salePrice" :label="$t('menu.item.fields.salePrice')" width="120" align="right">
          <template #default="{row}">{{ formatFee(row.salePrice) }}</template>
        </el-table-column>

        <el-table-column :label="$t('menu.item.fields.inspectFee')" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.inspectFee) }}</template>
        </el-table-column>
        <el-table-column :label="$t('menu.item.fields.repairFee')" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.repairFee) }}</template>
        </el-table-column>
        <el-table-column :label="$t('menu.item.fields.keepFee')" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.keepFee) }}</template>
        </el-table-column>
        <el-table-column :label="$t('menu.item.fields.packingFee')" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.packingFee) }}</template>
        </el-table-column>
        <el-table-column :label="$t('menu.item.fields.otherFee')" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.otherFee) }}</template>
        </el-table-column>

        <!-- commission fee column -->
        <el-table-column v-if="showConsignColumns" :label="$t('menu.item.fields.commissionFee')" width="120" align="right">
          <template #default="{row}">{{ formatFee(computeCommissionFee(row)) }}</template>
        </el-table-column>

        <el-table-column :label="$t('menu.statement.itemsTable.totalFee')" width="100" align="right">
          <template #default="{row}">{{ formatFee(displayTotalFee(row)) }}</template>
        </el-table-column>
        <el-table-column prop="ispaid" :label="$t('menu.statement.itemsTable.paid')" width="80">
          <template #default="{row}">{{ row.ispaid === 1 ? $t('menu.item.paidStatus.paid') : $t('menu.item.paidStatus.unpaid') }}</template>
        </el-table-column>
        <el-table-column :label="$t('menu.item.fields.paymentDate')" width="120">
          <template #default="{row}">{{ formatYMD(row.paymentDate) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <div style="text-align:right; margin-top:8px; font-weight:600">
      {{ $t('menu.statement.itemsTable.totalItems') }}: {{ totalQty }} &nbsp;&nbsp; {{ $t('menu.statement.itemsTable.totalFee') }}: {{ totalFee }}
    </div>

    <template #footer>
      <el-button type="primary" @click="exportItems">{{ $t('menu.statement.itemsTable.export') }}</el-button>
      <el-button @click="close">{{ $t('menu.buttons.close') || 'Close' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { formatFee, computeCommissionFee, computeConsignmentTotal } from '@/utils/fees'
import { exportJsonToXlsx } from '@/utils/excelExport'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  title: { type: String, default: 'Items' },
  width: { type: String, default: '1500px' }
})
const emit = defineEmits(['update:modelValue'])

const totalQty = computed(() => props.items.reduce((s, r) => s + (Number(r.qty) || 0), 0))

const showConsignColumns = computed(() => {
  return (props.items || []).some(it => it && (it.isConsigned === 1 || it.isConsigned === '1'))
})

function displayTotalFee(row) {
  const isConsigned = row && (row.isConsigned === 1 || row.isConsigned === '1')
  if (isConsigned) return Math.abs(computeConsignmentTotal(row) || 0)
  const inspect = Number(row.inspectFee || 0)
  const repair = Number(row.repairFee || 0)
  const keep = Number(row.keepFee || 0)
  const packing = Number(row.packingFee || 0)
  const other = Number(row.otherFee || 0)
  return inspect + repair + keep + packing + other
}

const totalFee = computed(() => {
  return (props.items || []).reduce((s, r) => s + (displayTotalFee(r) || 0), 0).toFixed(2)
})

function close() {
  emit('update:modelValue', false)
}

function exportItems() {
  try {
    const items = (props.items || []).map(it => ({
      itemNo: it.itemNo,
      sellerPart: it.sellerPart,
      qty: it.qty,
      sendPackageNo: it.sendPackageNo,
      inspectFee: Number(it.inspectFee || 0),
      repairFee: Number(it.repairFee || 0),
      keepFee: Number(it.keepFee || 0),
      packingFee: Number(it.packingFee || 0),
      otherFee: Number(it.otherFee || 0),
      commissionSet: Number(it.commissionSet || 0),
      commissionModel: it.commissionModel,
      market: it.market,
      salePrice: Number(it.salePrice || 0),
      saleDate: it.saleDate,
      TotalFee: Number(it.TotalFee != null ? it.TotalFee : displayTotalFee(it)),
      ispaid: it.ispaid,
      paymentDate: formatYMD(it.paymentDate)
    }))

    const safeTitle = String(props.title || 'Items').replace(/[\\/:*?"<>|]/g, '-')
    const fileName = `${safeTitle}.xlsx`
    exportJsonToXlsx(items, 'Items', fileName)
    // optional success message is handled by caller UI (global ElMessage), keep lightweight here
  } catch (e) {
    console.error('Export items failed', e)
  }
}

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
</script>

<style scoped>
</style>
