<template>
  <div>
    <el-table :data="rows" style="width: 100%">
      <el-table-column prop="paymentdate" :label="$t('menu.statement.table.paymentDate')" width="160">
        <template #default="{ row }">
          <el-link type="primary" @click.prevent="onDateClick(row)">{{ row.paymentdate }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="paidby" :label="$t('menu.statement.table.paidby')" />
      <el-table-column prop="payto" :label="$t('menu.statement.table.payto')" />
      <el-table-column prop="Items" :label="$t('menu.statement.table.items')" width="100" align="right" />
      <el-table-column prop="Amount" :label="$t('menu.statement.table.amount')" width="120" align="right">
        <template #default="{ row }">{{ formatFee(row.Amount) }}</template>
      </el-table-column>
    </el-table>

    <div style="text-align: right; margin-top: 8px; font-weight: 600;">
      {{ $t('menu.statement.table.totalItems') }}: {{ totalItems }} &nbsp;&nbsp; {{ $t('menu.statement.table.totalAmount') }}: {{ totalAmount }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatFee } from '@/utils/fees'

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
