<template>
  <div>
    <el-table :data="rows" style="width: 100%">
      <el-table-column prop="paymentdate" label="PaymentDate" width="160">
        <template #default="{ row }">
          <el-link type="primary" @click.prevent="onDateClick(row)">{{ row.paymentdate }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="paidby" label="paidby" />
      <el-table-column prop="payto" label="payto" />
      <el-table-column prop="Items" label="Items" width="100" />
      <el-table-column prop="Amount" label="Amount" width="120" />
    </el-table>

    <div style="text-align: right; margin-top: 8px; font-weight: 600;">
      TotalItems: {{ totalItems }} &nbsp;&nbsp; TotalAmount: {{ totalAmount }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Array, default: () => [] }
})
const emit = defineEmits(['date-click'])

const totalItems = computed(() => {
  return props.rows.reduce((s, r) => s + (Number(r.Items) || 0), 0)
})
const totalAmount = computed(() => {
  return props.rows.reduce((s, r) => s + (Number(r.Amount) || 0), 0).toFixed(2)
})

function onDateClick(row) {
  emit('date-click', row)
}
</script>
