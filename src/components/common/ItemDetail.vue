<template>
  <el-dialog :model-value="visibleFlag" :width="width" @close="onClose">
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ title }}</span>
        <div class="blue-divider"></div>
      </div>
    </template>
    <el-form :model="detailData" :label-width="labelWidth" class="detail-form">
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.itemNo')"><div>{{ detailData.itemNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.category')"><div>{{ detailData.dictName || detailData.category || (detailData.dict && detailData.dict.dictName) || '-' }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sellerPart')"><div>{{ detailData.sellerPart }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.mfrPart')"><div>{{ detailData.mfrPart }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.qty')"><div>{{ detailData.qty }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.receivePackageNo')"><div>{{ detailData.receivePackageNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.receivedDate')"><div>{{ detailData.receivedDate }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sendPackageNo')"><div>{{ detailData.sendPackageNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sendDate')"><div>{{ detailData.sendDate }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.parcel_dialog.labels.dealerReceivedDate')"><div>{{ detailData.dealerReceivedDate }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.customerFeedback')"><div>{{ detailData.customerFeedback }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.iqcResult')"><div>{{ detailData.iqcResult }}</div></el-form-item></el-col>

        <!-- allow pages to inject consign-related fields here: (above inspectFee, below inspectResult) -->
        <slot />

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isUnpacked')"><div>{{ detailData.isUnpacked === 1 ? $t('menu.item.unpackedStatus.unpacked') : (detailData.isUnpacked === 0 ? $t('menu.item.unpackedStatus.packed') : '') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isGood')"><div>{{ detailData.isGood === 1 ? $t('menu.item.goodStatus.good') : (detailData.isGood === 0 ? $t('menu.item.goodStatus.bad') : '') }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.inspectFee')"><div>{{ formatFee(detailData.inspectFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.repairFee')"><div>{{ formatFee(detailData.repairFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.keepFee')"><div>{{ formatFee(detailData.keepFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.packingFee')"><div>{{ formatFee(detailData.packingFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.otherFee')"><div>{{ formatFee(detailData.otherFee) }}</div></el-form-item></el-col>

        <el-col v-if="detailData && (detailData.isConsigned === 1 || detailData.isConsigned === '1')" :span="12"><el-form-item :label="$t('menu.item.fields.commissionFee')"><div>{{ formatFee(computeCommissionFee(detailData)) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="(detailData && (detailData.isConsigned === 1 || detailData.isConsigned === '1')) ? $t('menu.item.dialogs.amount') : $t('menu.item.fields.totalFee')"><div>{{ formatFee(totalFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isPaid')"><div>{{ detailData.ispaid === 1 ? $t('menu.item.paidStatus.paid') : (detailData.ispaid === 0 ? $t('menu.item.paidStatus.unpaid') : '') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.feeRemarks')"><div>{{ detailData.feeRemarks }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.paymentDate')"><div>{{ detailData.paymentDate }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.remark')"><div>{{ detailData.remark }}</div></el-form-item></el-col>

        <!-- Test record section -->
        <template v-if="detailData && (detailData.needTest === 1 || detailData.needTest === '1')">
            <el-col :span="24">
            <div style="margin:12px 0; border-top:1px solid #e9edf0; padding-top:12px; font-weight:600">{{ $t('menu.item.dialogs.testRecords') }}</div>
          </el-col>

          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isTested')"><div>{{ detailData.isTested === 1 || detailData.isTested === '1' ? $t('menu.item.testStatus.done') : $t('menu.item.testStatus.notDone') }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.testProcedure')"><div>{{ detailData.testProcedure }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.testDemands')"><div>{{ detailData.testDemands }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.testResult')"><div>{{ detailData.testResult }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.dialogs.testImages')">
            <div class="images-row">
              <div v-for="(img, idx) in testImages" :key="'test-'+idx" class="image-box-upload">
                <el-image :src="img.url" :preview-src-list="testPreviewList" fit="contain" class="thumbnail" />
                <div class="orig-link"><a :href="img.url" target="_blank" rel="noopener">原图</a></div>
              </div>
              <div v-if="testImages.length===0">{{ $t('menu.parcel_dialog.images.noImage') }}</div>
            </div>
          </el-form-item></el-col>
        </template>

        <!-- Repair record section -->
        <template v-if="detailData && (detailData.needRepair === 1 || detailData.needRepair === '1')">
          <el-col :span="24">
            <div style="margin:12px 0; border-top:1px solid #e9edf0; padding-top:12px; font-weight:600">{{ $t('menu.item.dialogs.repairRecords') }}</div>
          </el-col>

          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isRepaired')"><div>{{ detailData.isRepaired === 1 || detailData.isRepaired === '1' ? $t('menu.item.testStatus.done') : $t('menu.item.testStatus.notDone') }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.repairProcedure')"><div>{{ detailData.repairProcedure }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.repairDemands')"><div>{{ detailData.repairDemands }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.repairResult')"><div>{{ detailData.repairResult }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.dialogs.repairImages')">
            <div class="images-row">
              <div v-for="(img, idx) in repairImages" :key="'repair-'+idx" class="image-box-upload">
                <el-image :src="img.url" :preview-src-list="repairPreviewList" fit="contain" class="thumbnail" />
                <div class="orig-link"><a :href="img.url" target="_blank" rel="noopener">{{ $t('common.original') }}</a></div>
              </div>
              <div v-if="repairImages.length===0">{{ $t('menu.parcel_dialog.images.noImage') }}</div>
            </div>
          </el-form-item></el-col>
        </template>

        <!-- Item images section -->
        <template v-if="itemImages.length > 0">
          <el-col :span="24">
            <el-form-item>
              <div class="images-row">
                <div v-for="(img, idx) in itemImages" :key="'item-'+idx" class="image-box-upload">
                  <el-image :src="img.url" :preview-src-list="itemPreviewList" fit="contain" class="thumbnail" />
                  <div class="orig-link"><a :href="img.url" target="_blank" rel="noopener">{{ $t('common.original') }}</a></div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </template>
      </el-row>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <div class="blue-divider"></div>
        <div class="button-wrapper">
          <slot name="footer">
            <el-button type="primary" @click="onClose">{{ $t('buttons.close') }}</el-button>
          </slot>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { getGroupedImages } from '@/api/imageManage'
import { computeConsignmentTotal, computeCommissionFee, formatFee } from '@/utils/fees'
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

const totalFee = computed(() => {
  const d = props.detailData || {}
  const isConsigned = d && (d.isConsigned === 1 || d.isConsigned === '1')
  if (isConsigned) {
    return Math.abs(computeConsignmentTotal(d) || 0)
  }
  const a = Number(d.inspectFee) || 0
  const b = Number(d.repairFee) || 0
  const c = Number(d.keepFee) || 0
  const e = Number(d.packingFee) || 0
  const f = Number(d.otherFee) || 0
  return a + b + c + e + f
})

const testImages = ref([])
const repairImages = ref([])
const itemImages = ref([])
const testPreviewList = computed(() => testImages.value.map(i => i.url))
const repairPreviewList = computed(() => repairImages.value.map(i => i.url))
const itemPreviewList = computed(() => itemImages.value.map(i => i.url))

const loadImages = async () => {
  testImages.value = []
  repairImages.value = []
  itemImages.value = []
  const itemId = props.detailData?.itemId || props.detailData?.id || props.detailData?.itemId
  if (!itemId) return
  try {
    const res = await getGroupedImages('ITEM', itemId)
    const grouped = res && (res.code === 1 || res.code === 0) && res.data ? res.data : res
    if (!grouped) return
    // Get API base URL for image paths
    const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api'
    const baseUrl = API_BASE.startsWith('http') ? API_BASE : window.location.origin + API_BASE
    // ITEM_TEST, ITEM_REPAIR, and ITEM keys expected
    Object.keys(grouped).forEach((k) => {
      const imgs = grouped[k] || []
      imgs.forEach((img) => {
        let imgUrl = img.imageUrl || img.url
        // Convert relative path to full URL
        if (imgUrl && imgUrl.startsWith('/api/')) {
          imgUrl = baseUrl + imgUrl.substring(4) // remove /api prefix since baseUrl already includes it
        } else if (imgUrl && !imgUrl.startsWith('http')) {
          imgUrl = baseUrl + imgUrl
        }
        const obj = { id: img.id, url: imgUrl, name: img.originalName || img.fileName }
        if (k === 'ITEM_TEST' || k === 'ITEM_TESTS' || k === 'ITEM_TEST_IMAGES') testImages.value.push(obj)
        if (k === 'ITEM_REPAIR' || k === 'ITEM_REPAIRS' || k === 'ITEM_REPAIR_IMAGES') repairImages.value.push(obj)
        if (k === 'ITEM' || k === 'ITEM_IMAGES' || k === 'ITEM_MAIN' || k === 'ITEM_IMAGE') itemImages.value.push(obj)
      })
    })
  } catch (e) {
    console.error('loadImages error', e)
  }
}

const previewImage = (url) => {
  if (!url) return
  window.open(url, '_blank')
}

onMounted(() => {
  if (props.detailData) {
    loadImages()
  }
})

watch(() => props.detailData && (props.detailData.itemId || props.detailData.id), (newVal) => {
  if (newVal) loadImages()
})
</script>

<style scoped>
.images-row{display:flex;gap:12px;flex-wrap:wrap}
.image-box-upload{position:relative;width:150px;height:150px;border:1px solid #ddd;border-radius:4px;overflow:hidden;background-color:#fafafa}
.image-box-upload img{width:100%;height:100%;object-fit:contain;cursor:pointer}
.orig-link{ text-align:center; margin-top:6px }
.image-box-upload .el-image__inner{ width:100%; height:100%; display:block }

/* Dialog header styling */
.dialog-header {
  display: flex;
  flex-direction: column;
}
.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.blue-divider {
  height: 2px;
  background-color: #409EFF;
  margin-top: 8px;
}

/* Dialog footer styling */
.dialog-footer {
  display: block;
}
.dialog-footer .blue-divider {
  margin-bottom: 12px;
  width: 100%;
}
.button-wrapper {
  display: flex;
  justify-content: flex-end;
}
.button-wrapper :deep(.el-button) {
  width: 80px;
  min-width: 80px;
  max-width: 80px;
}

/* Compact form styling */
.detail-form :deep(.el-form-item) {
  margin-bottom: 8px;
}
.detail-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}
.detail-form :deep(.el-form-item__content) {
  line-height: 24px;
  padding: 0 8px;
}
.detail-form :deep(.el-dialog__body) {
  padding: 16px 20px;
}
</style>
