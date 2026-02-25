<template>
  <el-dialog :model-value="visibleFlag" :title="title" :width="width" @close="onClose">
    <el-form :model="detailData" :label-width="labelWidth">
      <el-row :gutter="16">
        <el-col :span="12"><el-form-item label="ItemNo"><div>{{ detailData.itemNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="Category"><div>{{ detailData.dictName || detailData.category || (detailData.dict && detailData.dict.dictName) || '-' }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="SellerPart"><div>{{ detailData.sellerPart }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="MfrPart"><div>{{ detailData.mfrPart }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="Qty"><div>{{ detailData.qty }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="ReceivePackageNo"><div>{{ detailData.receivePackageNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="ReceivedDate"><div>{{ detailData.receivedDate }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="SendPackageNo"><div>{{ detailData.sendPackageNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="SendDate"><div>{{ detailData.sendDate }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="DealerReceivedDate"><div>{{ detailData.dealerReceivedDate }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="CustomerFeedback"><div>{{ detailData.customerFeedback }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="IQCResult"><div>{{ detailData.iqcResult }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="Unpacked"><div>{{ detailData.isUnpacked === 1 ? 'unpacked' : (detailData.isUnpacked === 0 ? 'packed' : '') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="IsGood"><div>{{ detailData.isGood === 1 ? 'good' : (detailData.isGood === 0 ? 'bad' : '') }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="InspectFee"><div>{{ formatFee(detailData.inspectFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="RepairFee"><div>{{ formatFee(detailData.repairFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="KeepFee"><div>{{ formatFee(detailData.keepFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="PackingFee"><div>{{ formatFee(detailData.packingFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="OtherFee"><div>{{ formatFee(detailData.otherFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="TotalFee"><div>{{ formatFee(totalFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="Paid"><div>{{ detailData.ispaid === 1 ? 'paid' : (detailData.ispaid === 0 ? 'unpaid' : '') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="FeeRemarks"><div>{{ detailData.feeRemarks }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="PaymentDate"><div>{{ detailData.paymentDate }}</div></el-form-item></el-col>
        <!-- allow pages to inject additional fields -->
        <slot />
      </el-row>
    </el-form>
    <template #footer>
      <slot name="footer">
        <el-button type="primary" @click="onClose">Close</el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
  visible: { type: Boolean, default: undefined },
  title: { type: String, default: 'Item Detail' },
  detailData: { type: Object, default: () => ({}) },
  width: { type: String, default: '960px' },
  labelWidth: { type: String, default: '154px' }
})
const emit = defineEmits(['update:modelValue', 'update:visible'])

const onClose = () => {
  // emit both to support either binding style
  emit('update:modelValue', false)
  emit('update:visible', false)
}

const visibleFlag = computed(() => {
  // prefer modelValue (standard v-model) but fall back to visible (v-model:visible)
  if (props.modelValue !== undefined) return props.modelValue
  return props.visible
})

const formatFee = (v) => {
  const n = Number(v) || 0
  return n.toFixed(2)
}

const totalFee = computed(() => {
  const d = props.detailData || {}
  const a = Number(d.inspectFee) || 0
  const b = Number(d.repairFee) || 0
  const c = Number(d.keepFee) || 0
  const e = Number(d.packingFee) || 0
  const f = Number(d.otherFee) || 0
  return a + b + c + e + f
})
</script>

<style scoped>
</style>
