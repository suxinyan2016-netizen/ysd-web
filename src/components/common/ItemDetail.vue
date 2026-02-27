<template>
  <el-dialog :model-value="visibleFlag" :title="title" :width="width" @close="onClose">
    <el-form :model="detailData" :label-width="labelWidth">
      <el-row :gutter="16">
        <el-col :span="12"><el-form-item label="商品号"><div>{{ detailData.itemNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="类别"><div>{{ detailData.dictName || detailData.category || (detailData.dict && detailData.dict.dictName) || '-' }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="商品名"><div>{{ detailData.sellerPart }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="厂商料号"><div>{{ detailData.mfrPart }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="数量"><div>{{ detailData.qty }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="收货包裹号"><div>{{ detailData.receivePackageNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="收货日期"><div>{{ detailData.receivedDate }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="寄出包裹号"><div>{{ detailData.sendPackageNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="寄出日期"><div>{{ detailData.sendDate }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="经销商接收日期"><div>{{ detailData.dealerReceivedDate }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="客户反馈"><div>{{ detailData.customerFeedback }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="检验结果"><div>{{ detailData.iqcResult }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="是否拆包"><div>{{ detailData.isUnpacked === 1 ? '已拆包' : (detailData.isUnpacked === 0 ? '未拆包' : '') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="良品"><div>{{ detailData.isGood === 1 ? '良品' : (detailData.isGood === 0 ? '次品' : '') }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="检验费"><div>{{ formatFee(detailData.inspectFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="维修费"><div>{{ formatFee(detailData.repairFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="保管费"><div>{{ formatFee(detailData.keepFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="装箱费"><div>{{ formatFee(detailData.packingFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="其他费用"><div>{{ formatFee(detailData.otherFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="总费用"><div>{{ formatFee(totalFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item label="是否结算"><div>{{ detailData.ispaid === 1 ? '已结算' : (detailData.ispaid === 0 ? '未结算' : '') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="费用备注"><div>{{ detailData.feeRemarks }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="付款日期"><div>{{ detailData.paymentDate }}</div></el-form-item></el-col>
        <!-- allow pages to inject additional fields -->
        <slot />
      </el-row>
    </el-form>
    <template #footer>
      <slot name="footer">
        <el-button type="primary" @click="onClose">关闭</el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
  visible: { type: Boolean, default: undefined },
  title: { type: String, default: '商品详情' },
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
