<template>
  <div>
    <h1>{{ $t('menu.services.testService') }}</h1>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px;">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-input v-model="q.itemNo" :placeholder="$t('menu.item.fields.itemNo')" style="width:200px" />
        <el-select v-model="q.dictId" :placeholder="$t('menu.item.fields.category')" clearable style="width:180px">
          <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
        </el-select>
        <el-input v-model="q.sellerPart" :placeholder="$t('menu.item.fields.sellerPart')" style="width:220px" />
        <el-select v-model="q.ownerId" :placeholder="$t('menu.item.fields.owner')" clearable style="width:180px">
          <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
        </el-select>
        <el-input v-model="q.receivePackageNo" :placeholder="$t('menu.item.fields.receivePackageNo')" style="width:200px" />
        <el-input v-model="q.sendPackageNo" :placeholder="$t('menu.item.fields.sendPackageNo')" style="width:200px" />
      </div>
      <div style="margin-top:8px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-select v-model="q.itemStatus" :placeholder="$t('menu.item.fields.status')" clearable style="width:120px">
          <el-option :label="$t('menu.item.statuses.all')" :value="''" />
          <el-option :label="$t('menu.item.statuses.pending')" :value="0" />
          <el-option :label="$t('menu.item.statuses.received')" :value="1" />
          <el-option :label="$t('menu.item.statuses.sent')" :value="2" />
          <el-option :label="$t('menu.item.statuses.exception')" :value="9" />
        </el-select>

        <!-- 去掉 是否结算 查询条件，新增 测试完成 筛选 -->
        <el-select v-model="q.isTested" :placeholder="$t('menu.item.fields.isTested')" clearable style="width:140px">
          <el-option :label="$t('menu.item.statuses.all')" :value="''" />
          <el-option :label="$t('menu.item.labels.notCompleted')" :value="0" />
          <el-option :label="$t('menu.item.labels.completed')" :value="1" />
        </el-select>

        <el-button type="primary" @click="onSearch">{{ $t('menu.item.buttons.search') }}</el-button>
        <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">{{ $t('menu.item.buttons.clear') }}</el-button>
      </div>
    </div>

    <ItemTable ref="tableRef" :data="itemList" :row-key="'itemId'" :selectable="true" :compute-stocklife="computeStocklife" :fixed-left="true" columns-mode="compact" @selection-change="onSelectionChange">
      <template #beforeInspectFee>
        <!-- 按需求在表格中新增 测试相关列 -->
        <el-table-column prop="needTest" :label="$t('menu.item.fields.needTest')" width="100">
          <template #default="{row}">{{ row.needTest === 1 ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="testResult" :label="$t('menu.item.fields.testResult')" width="270" />
        <el-table-column prop="isTested" :label="$t('menu.item.fields.isTested')" width="120">
          <template #default="{row}">{{ row.isTested === 1 ? $t('menu.item.labels.completed') : $t('menu.item.labels.notCompleted') }}</template>
        </el-table-column>
      </template>

      <template #operation="{row}">
        <el-button size="small" type="primary" @click="openRecord(row)">记录</el-button>
      </template>
    </ItemTable>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <el-dialog v-model="recordDialogVisible" :title="$t('menu.services.testService') + ' - 记录'" width="1368px">
      <el-form label-position="top" :model="recordForm">
        <el-row :gutter="12">
          <!-- First row: 商品号, 商品名, 类别, 数量 -->
          <el-col :span="6">
            <el-form-item label="商品号">
              <div>{{ recordForm.itemNo }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="商品名">
              <div>{{ recordForm.sellerPart }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="类别">
              <div>{{ recordForm.dictName }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="数量">
              <div>{{ recordForm.qty }}</div>
            </el-form-item>
          </el-col>

          <!-- Second row: 货主, 收货运单号, 客户反馈 (占2栏) -->
          <el-col :span="6">
            <el-form-item label="货主">
              <div>{{ recordForm.owner }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="收货运单号">
              <div>{{ recordForm.receivePackageNo }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户反馈">
              <div style="white-space:pre-wrap">{{ recordForm.customerFeedback }}</div>
            </el-form-item>
          </el-col>

          <!-- Third row: 测试步骤 (占2栏), 测试要求 (占2栏) -->
          <el-col :span="12">
            <el-form-item label="测试步骤">
              <div style="white-space:pre-wrap">{{ recordForm.testProcedure }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="测试要求">
              <div style="white-space:pre-wrap">{{ recordForm.testDemands }}</div>
            </el-form-item>
          </el-col>

          <!-- Fourth row: 是否良品, 测试是否完成, 测试费用, 测试结果 -->
          <el-col :span="6">
            <el-form-item label="是否良品">
              <el-radio-group v-model="recordForm.isGood">
                <el-radio :label="1">良品</el-radio>
                <el-radio :label="0">次品</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="测试是否完成">
              <el-radio-group v-model="recordForm.isTested">
                <el-radio :label="0">未完成</el-radio>
                <el-radio :label="1">已完成</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="测试费用">
              <el-input class="fee-input" v-model="recordForm.inspectFee" placeholder="0.00" style="width:100%; text-align:right" @input="e => onFeeInput('inspectFee', e.target.value)" @blur="() => onFeeBlur('inspectFee')" />
            </el-form-item>
          </el-col>
          <el-col :span="9">
            <el-form-item label="测试结果">
              <el-input v-model="recordForm.testResult" />
            </el-form-item>
          </el-col>

          <!-- Last row: 测试图片 -->
          <el-col :span="24">
            <el-form-item label="测试图片">
              <ImageUploader ref="imageUploaderRef" :module-type="'ITEM'" :record-id="recordForm.itemId" image-type="ITEM_TEST" :max-count="8" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ref, onMounted, nextTick } from 'vue'
import request from '@/utils/request'
import { useI18n } from 'vue-i18n'
import ItemTable from '@/components/common/ItemTable.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { useUser } from '@/composables/useUser'
import { useItemsList } from '@/composables/useItemsList'
import { findByGroupApi } from '@/api/dict'
import { queryInfoApi, updateApi } from '@/api/item'
import { ElMessage } from 'element-plus'

const { users, currentUser, getCurrentUser } = useUser()
const { t } = useI18n()

const dictOptions = ref([])
const loadDictOptions = async () => {
  try {
    let res = await findByGroupApi('Hardware')
    let list = []
    if (res && res.code === 1) list = res.data || []
    else if (Array.isArray(res)) list = res
    dictOptions.value = (list || []).map(d => ({ dictId: d.dictId ?? d.id ?? d.value, dictName: d.dictName ?? d.name ?? d.label }))
  } catch (err) { dictOptions.value = [] }
}

const tableRef = ref(null)
const selectedMap = ref({})
const onSelectionChange = (selection) => {
  const currentPageIds = itemList.value.map(r => r.itemId)
  const selectedIdsOnPage = selection.map(s => s.itemId)
  selection.forEach((row) => { if (row && row.itemId) selectedMap.value[row.itemId] = row })
  currentPageIds.forEach((id) => { if (!selectedIdsOnPage.includes(id) && selectedMap.value[id]) delete selectedMap.value[id] })
}

const {
  q,
  itemList,
  total,
  currentPage,
  pageSize,
  fetchList,
  onClear,
  onSizeChange,
  onCurrentChange,
  computeStocklife
} = useItemsList({ initialQ: { itemNo: '', dictId: '', sellerPart: '', ownerId: '', receivePackageNo: '', sendPackageNo: '', itemStatus: 1, isTested: '', needTest: 1 }, getFixedParams: () => ({ keeperId: currentUser.value.userId }) })

const fetchListLocal = async () => {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...q.value
    }
    // force keeperId to current user for every request
    params.keeperId = currentUser.value?.userId
    // Ensure we send needTest rather than isConsigned
    if (params.isConsigned != null) delete params.isConsigned
    params.needTest = 1
    const res = await request.get('/items', { params })
    if (res && res.code === 1) {
      const rows = res.data?.rows || res.data || []
      itemList.value = rows.map(r => ({ ...r, _stocklife: computeStocklife(r) }))
      total.value = res.data?.total ?? itemList.value.length
    } else {
      itemList.value = []
      total.value = 0
    }
  } catch (err) {
    console.error('fetchListLocal failed', err)
  }
}

// override onSearch to use local fetch
const onSearch = async () => { currentPage.value = 1; await fetchListLocal() }

const viewDetail = async (row) => {
  // reuse existing item detail behavior from other pages if needed
}

const canOperateItem = (row) => {
  const uid = currentUser.value?.userId
  if (!row) return false
  return String(uid) === String(row.keeperId)
}

const onEdit = async (row) => {
  // fallback: open detail for now
  await viewDetail(row)
}

// Record dialog state and form
const recordDialogVisible = ref(false)
const recordForm = reactive({
  itemId: null,
  itemNo: '',
  dictName: '',
  sellerPart: '',
  qty: 0,
  owner: '',
  receivePackageNo: '',
  customerFeedback: '',
  testProcedure: '',
  testDemands: '',
  isGood: 1,
  testResult: '',
  inspectFee: 0,
  isTested: 0
})

const imageUploaderRef = ref(null)

const openRecord = async (row) => {
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) {
      const data = res.data
      recordForm.itemId = data.itemId
      recordForm.itemNo = data.itemNo
      recordForm.dictName = data.dictName
      recordForm.sellerPart = data.sellerPart
      recordForm.qty = data.qty
      recordForm.owner = data.owner
      recordForm.receivePackageNo = data.receivePackageNo
      recordForm.customerFeedback = data.customerFeedback || ''
      recordForm.testProcedure = data.testProcedure || ''
      recordForm.testDemands = data.testDemands || ''
      recordForm.isGood = data.isGood ?? 1
      recordForm.testResult = data.testResult || ''
      recordForm.inspectFee = formatFeeString(data.inspectFee ?? 0)
      recordForm.isTested = data.isTested ?? 0
      // ensure uploader is cleared and loads fresh images from server before showing dialog
      await nextTick()
      if (imageUploaderRef.value && imageUploaderRef.value.clearImages) imageUploaderRef.value.clearImages()
      if (imageUploaderRef.value && imageUploaderRef.value.loadImages) await imageUploaderRef.value.loadImages()
      recordDialogVisible.value = true
    } else {
      ElMessage.error('无法加载商品信息')
    }
  } catch (err) {
    console.error('openRecord failed', err)
    ElMessage.error('无法加载商品信息')
  }
}

const saveRecord = async () => {
  try {
    // prepare payload with editable fields
    const payload = {
      itemId: recordForm.itemId,
      isGood: Number(recordForm.isGood),
      testResult: recordForm.testResult,
      inspectFee: parseFloat(Number(recordForm.inspectFee).toFixed(2)) || 0,
      isTested: Number(recordForm.isTested)
    }
    const res = await updateApi(payload)
    if (res && res.code === 1) {
      ElMessage.success('保存成功')
      recordDialogVisible.value = false
      await fetchListLocal()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (err) {
    console.error('saveRecord failed', err)
    ElMessage.error('保存失败')
  }
}

const formatFeeString = (v) => { const n = Number(v); return isNaN(n) ? '0.00' : n.toFixed(2) }

const onFeeInput = (field, val) => {
  if (val === undefined || val === null) { recordForm[field] = ''; return }
  let s = String(val).replace(/[^\d.]/g, '')
  const parts = s.split('.')
  if (parts.length > 1) {
    parts[1] = parts[1].slice(0,2)
    s = parts[0] + '.' + parts[1]
  }
  recordForm[field] = s
}

const onFeeBlur = (field) => {
  recordForm[field] = formatFeeString(recordForm[field])
}

onMounted(async () => { await loadDictOptions(); getCurrentUser(); await fetchListLocal() })
</script>

<style scoped>
.fee-input ::v-deep .el-input__inner { text-align: right }
</style>
