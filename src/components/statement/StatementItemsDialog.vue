<template>
  <el-dialog :model-value="modelValue" :title="title" :width="width" @close="close">
    <div style="max-height:60vh; overflow-y:auto; overflow-x:scroll;">
      <el-table :data="items" style="width:100%" stripe>
        <el-table-column prop="itemNo" label="ItemNo" width="160" />

        <el-table-column prop="sellerPart" label="SellerPart" width="200" />
        <el-table-column prop="qty" label="Qty" width="80" />
        <el-table-column prop="sendPackageNo" label="SendPackage" width="220" />

        <el-table-column label="InspectFee" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.inspectFee) }}</template>
        </el-table-column>
        <el-table-column label="RepairFee" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.repairFee) }}</template>
        </el-table-column>
        <el-table-column label="KeepFee" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.keepFee) }}</template>
        </el-table-column>
        <el-table-column label="PackingFee" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.packingFee) }}</template>
        </el-table-column>
        <el-table-column label="OtherFee" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.otherFee) }}</template>
        </el-table-column>
        <el-table-column label="TotalFee" width="100" align="right">
          <template #default="{row}">{{ formatFee(row.TotalFee) }}</template>
        </el-table-column>
        <el-table-column prop="ispaid" label="Paid" width="80">
          <template #default="{row}">{{ row.ispaid === 1 ? 'paid' : 'unpaid' }}</template>
        </el-table-column>
        <el-table-column label="PaymentDate" width="120">
          <template #default="{row}">{{ formatYMD(row.paymentDate) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <div style="text-align:right; margin-top:8px; font-weight:600">
      TotalItems: {{ totalQty }} &nbsp;&nbsp; TotalFee: {{ totalFee }} &nbsp;&nbsp; TotalAmount: {{ totalFee }}
    </div>

    <template #footer>
      <el-button @click="close">Close</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { formatFee } from '@/utils/fees'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  title: { type: String, default: 'Items' },
  width: { type: String, default: '1500px' }
})
const emit = defineEmits(['update:modelValue'])

const totalQty = computed(() => props.items.reduce((s, r) => s + (Number(r.qty) || 0), 0))
const totalFee = computed(() => props.items.reduce((s, r) => s + (Number(r.TotalFee || (Number(r.inspectFee||0) + Number(r.repairFee||0) + Number(r.keepFee||0) + Number(r.packingFee||0) + Number(r.otherFee||0))) || 0), 0).toFixed(2))

function close() {
  emit('update:modelValue', false)
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
