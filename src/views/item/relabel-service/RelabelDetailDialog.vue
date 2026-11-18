<template>
  <el-dialog :model-value="visibleFlag" width="960px" @close="onClose">
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ $t('menu.item.dialogs.itemDetail') }}</span>
        <div class="blue-divider"></div>
      </div>
    </template>
    <el-form :model="detailData" label-width="154px" class="detail-form">
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.itemNo')"><div>{{ detailData.itemNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.newItemNo')"><div>{{ detailData.mfrPart }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.qty')"><div>{{ detailData.qty }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sellerPart')"><div>{{ detailData.sellerPart }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.receivePackageNo')"><div>{{ detailData.receivePackageNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.receivedDate')"><div>{{ detailData.receivedDate }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sendPackageNo')"><div>{{ detailData.sendPackageNo }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sendDate')"><div>{{ detailData.sendDate }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.inspectFee')"><div>{{ formatFee(detailData.inspectFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.repairFee')"><div>{{ formatFee(detailData.repairFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.keepFee')"><div>{{ formatFee(detailData.keepFee) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.packingFee')"><div>{{ formatFee(detailData.packingFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.relabelFee')"><div>{{ formatFee(detailData.otherFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.totalFee')"><div>{{ formatFee(totalFee) }}</div></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isPaid')"><div>{{ detailData.ispaid === 1 ? $t('menu.item.paidStatus.paid') : (detailData.ispaid === 0 ? $t('menu.item.paidStatus.unpaid') : '') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isLabelChanged')"><div>{{ detailData.isLabelChanged === 1 ? $t('menu.item.labelChangedStatus.completed') : (detailData.isLabelChanged === 0 ? $t('menu.item.labelChangedStatus.notCompleted') : '-') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.feeRemarks')"><div>{{ detailData.feeRemarks }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.paymentDate')"><div>{{ detailData.paymentDate }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.remark')"><div>{{ detailData.remark }}</div></el-form-item></el-col>

        <!-- Item images section -->
        <template v-if="itemImages.length > 0">
          <el-col :span="24">
            <el-form-item label="图片附件">
              <div class="images-row">
                <div v-for="(img, idx) in itemImages" :key="'item-'+idx" class="image-box-upload">
                  <el-image :src="img.url" :preview-src-list="itemPreviewList" fit="contain" class="thumbnail" />
                  <div class="orig-link"><a :href="img.url" target="_blank" rel="noopener">{{ $t('common.original') }}</a></div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </template>

        <!-- Item PDF files section -->
        <template v-if="itemPdfs.length > 0">
          <el-col :span="24">
            <el-form-item label="PDF附件">
              <div class="pdf-row">
                <div v-for="(pdf, idx) in itemPdfs" :key="'pdf-'+idx" class="pdf-item">
                  <el-button type="primary" size="small" @click="openPdf(pdf.url)">{{ pdf.name || 'PDF文件' }}</el-button>
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
          <el-button type="primary" @click="onClose">{{ $t('buttons.close') }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getGroupedImages } from '@/api/imageManage'
import { formatFee } from '@/utils/fees'

const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
  visible: { type: Boolean, default: undefined },
  detailData: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:modelValue', 'update:visible', 'close'])

const onClose = () => {
  emit('update:modelValue', false)
  emit('update:visible', false)
  emit('close')
}

const visibleFlag = computed(() => {
  if (props.modelValue !== undefined) return props.modelValue
  return props.visible
})

const totalFee = computed(() => {
  const d = props.detailData || {}
  const a = Number(d.inspectFee) || 0
  const b = Number(d.repairFee) || 0
  const c = Number(d.keepFee) || 0
  const e = Number(d.packingFee) || 0
  const f = Number(d.otherFee) || 0
  return a + b + c + e + f
})

const itemImages = ref([])
const itemPdfs = ref([])
const itemPreviewList = computed(() => itemImages.value.map(i => i.url))

const loadImages = async () => {
  itemImages.value = []
  itemPdfs.value = []
  const itemId = props.detailData?.itemId || props.detailData?.id
  if (!itemId) return
  try {
    const res = await getGroupedImages('ITEM', itemId)
    const grouped = res && (res.code === 1 || res.code === 0) && res.data ? res.data : res
    if (!grouped) return
    const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api'
    const baseUrl = API_BASE.startsWith('http') ? API_BASE : window.location.origin + API_BASE
    Object.keys(grouped).forEach((k) => {
      const imgs = grouped[k] || []
      imgs.forEach((img) => {
        let imgUrl = img.imageUrl || img.url
        if (imgUrl && imgUrl.startsWith('/api/')) {
          imgUrl = baseUrl + imgUrl.substring(4)
        } else if (imgUrl && !imgUrl.startsWith('http')) {
          imgUrl = baseUrl + imgUrl
        }
        const fileName = img.originalName || img.fileName || ''
        const fileExt = fileName.split('.').pop().toLowerCase()
        const obj = { id: img.id, url: imgUrl, name: fileName }
        if (k === 'ITEM' || k === 'ITEM_IMAGES' || k === 'ITEM_MAIN' || k === 'ITEM_IMAGE') {
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
          if (imageExtensions.includes(fileExt)) {
            itemImages.value.push(obj)
          } else if (fileExt === 'pdf') {
            itemPdfs.value.push(obj)
          }
        }
      })
    })
  } catch (e) {
    console.error('loadImages error', e)
  }
}

const openPdf = (url) => {
  window.open(url, '_blank')
}

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

.pdf-row{display:flex;gap:8px;flex-wrap:wrap}
.pdf-item{display:inline-block}

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
