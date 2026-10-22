<template>
  <div>
    <h1>{{ $t('stocktake.title') }}</h1>

    <div style="margin:10px 0; padding:8px 12px; background:#f5f5f5; border:1px solid #e6e6e6; border-radius:4px;">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-select v-model="q.slot" :placeholder="$t('stocktake.query.slot')" clearable style="width:180px">
          <el-option v-for="s in slots" :key="s" :label="s" :value="s" />
        </el-select>
        <el-date-picker v-model="q.beginDate" type="date" :placeholder="$t('stocktake.query.beginDate')" style="width:160px" value-format="YYYY-MM-DD" />
        <el-date-picker v-model="q.endDate" type="date" :placeholder="$t('stocktake.query.endDate')" style="width:160px" value-format="YYYY-MM-DD" />
        <el-select v-model="q.status" :placeholder="$t('stocktake.query.status')" clearable style="width:120px">
          <el-option :label="$t('stocktake.status.0')" :value="0" />
          <el-option :label="$t('stocktake.status.1')" :value="1" />
          <el-option :label="$t('stocktake.status.2')" :value="2" />
        </el-select>
      </div>
      <div style="margin-top:8px; display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
        <el-button type="primary" @click="onSearch">{{ $t('stocktake.buttons.search') }}</el-button>
        <el-button type="info" @click="onClear">{{ $t('stocktake.buttons.clear') }}</el-button>
        <el-button type="primary" @click="onAdd">{{ $t('stocktake.buttons.add') }}</el-button>
      </div>
    </div>

    <el-table :data="stocktakeList" border style="width:100%">
      <el-table-column prop="stocktakeTime" :label="$t('stocktake.table.stocktakeDate')" width="160">
        <template #default="{row}">
          {{ formatDateTime(row.stocktakeTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="slot" :label="$t('stocktake.table.slot')" width="120" />
      <el-table-column prop="bookQty" :label="$t('stocktake.table.bookQty')" width="100" />
      <el-table-column prop="actualQty" :label="$t('stocktake.table.actualQty')" width="100" />
      <el-table-column prop="status" :label="$t('stocktake.table.status')" width="100">
        <template #default="{row}">
          <span v-if="row.status === 0">{{ $t('stocktake.status.0') }}</span>
          <span v-else-if="row.status === 1">{{ $t('stocktake.status.1') }}</span>
          <span v-else-if="row.status === 2">{{ $t('stocktake.status.2') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('stocktake.table.operation')" width="280">
        <template #default="{row}">
          <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">{{ $t('stocktake.buttons.detail') }}</el-button>
          <el-button v-if="row.status === 0" size="small" type="primary" @click="onStart(row)">{{ $t('stocktake.buttons.start') }}</el-button>
          <el-button v-if="row.status === 1" size="small" type="primary" @click="openCountDialog(row)">{{ $t('stocktake.buttons.count') }}</el-button>
          <el-button v-if="row.status === 0 || row.status === 1" size="small" type="danger" @click="onDelete(row)">{{ $t('stocktake.buttons.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <!-- New Stocktake Dialog -->
    <el-dialog v-model="newDialogVisible" :title="$t('stocktake.dialogs.newTitle')" width="500px" @close="onNewDialogClose">
      <el-form :model="newForm" label-width="100px">
        <el-form-item :label="$t('stocktake.dialogs.slot')">
          <el-select v-model="newForm.slot" :placeholder="$t('stocktake.dialogs.selectSlot')" style="width:100%">
            <el-option v-for="s in slots" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('stocktake.dialogs.remark')">
          <el-input v-model="newForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newDialogVisible = false">{{ $t('stocktake.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="saveNewStocktake">{{ $t('stocktake.buttons.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Count Dialog (录入) -->
    <el-dialog v-model="countDialogVisible" :title="$t('stocktake.dialogs.countTitle')" width="900px" @close="onCountDialogClose">
      <div style="margin-bottom:16px; padding:8px; background:#f5f5f5; border-radius:4px;">
        <div><strong>{{ $t('stocktake.dialogs.slot') }}：</strong>{{ currentStocktake?.slot }}</div>
        <div><strong>{{ $t('stocktake.dialogs.stocktakeDate') }}：</strong>{{ formatDateTime(currentStocktake?.stocktakeTime) }}</div>
      </div>
      <el-button type="primary" size="small" @click="addCountRow" style="margin-bottom:8px">{{ $t('stocktake.dialogs.addItem') }}</el-button>
      <el-table :data="countRows" border style="width:100%" max-height="400">
        <el-table-column :label="$t('stocktake.dialogs.sn')" width="60" type="index" />
        <el-table-column :label="$t('stocktake.dialogs.itemName')" width="400">
          <template #default="{row, $index}">
            <el-input v-model="row.itemName" :placeholder="$t('stocktake.placeholders.inputItemName')" maxlength="30" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('stocktake.dialogs.qty')" width="120">
          <template #default="{row}">
            <el-input v-model.number="row.qty" type="number" :min="0" style="width:100%" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('stocktake.dialogs.countRemark')" width="200">
          <template #default="{row}">
            <el-input v-model="row.remark" :placeholder="$t('stocktake.placeholders.inputRemark')" maxlength="20" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('stocktake.table.operation')" width="80">
          <template #default="{row, $index}">
            <el-button size="small" type="danger" @click="deleteCountRow($index)">{{ $t('stocktake.buttons.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="countDialogVisible = false">{{ $t('stocktake.buttons.close') }}</el-button>
        <el-button type="primary" @click="saveCountResults">{{ $t('stocktake.buttons.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailDialogVisible" :title="$t('stocktake.dialogs.detailTitle')" width="1200px" @close="onDetailDialogClose">
      <div style="margin-bottom:16px; padding:8px; background:#f5f5f5; border-radius:4px;">
        <div><strong>{{ $t('stocktake.dialogs.slot') }}：</strong>{{ currentStocktake?.slot }}</div>
        <div><strong>{{ $t('stocktake.dialogs.stocktakeDate') }}：</strong>{{ formatDateTime(currentStocktake?.stocktakeTime) }}</div>
      </div>
      <el-row :gutter="16">
        <el-col :span="12">
          <div style="margin-bottom:8px; font-weight:bold;">{{ $t('stocktake.dialogs.bookQty') }} <span style="font-weight:normal; margin-left:8px;">(总计: {{ snapshotTotal }})</span></div>
          <el-table :data="groupedSnapshotList" border style="width:100%" max-height="500" size="small">
            <el-table-column label="SN" width="60" type="index" />
            <el-table-column prop="sellerPart" :label="$t('stocktake.dialogs.itemName')" width="263" />
            <el-table-column prop="qty" label="当时账面数量" width="100" />
          </el-table>
        </el-col>
        <el-col :span="12">
          <div style="margin-bottom:8px; font-weight:bold;">{{ $t('stocktake.dialogs.actualQty') }} <span style="font-weight:normal; margin-left:8px;">(总计: {{ resultsTotal }})</span></div>
          <el-table :data="resultsList" border style="width:100%" max-height="500" size="small">
            <el-table-column label="SN" width="60" type="index" />
            <el-table-column prop="itemName" :label="$t('stocktake.dialogs.itemName')" width="263" />
            <el-table-column prop="qty" :label="$t('stocktake.dialogs.qty')" width="100" />
            <el-table-column prop="remark" :label="$t('stocktake.dialogs.countRemark')" width="150" />
          </el-table>
        </el-col>
      </el-row>
      <template #footer>
        <el-button @click="detailDialogVisible = false">{{ $t('stocktake.buttons.close') }}</el-button>
        <el-button v-if="currentStocktake?.status === 1" type="primary" @click="confirmStocktake">{{ $t('stocktake.buttons.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getStocktakesApi,
  createStocktakeApi,
  getStocktakeSnapshotApi,
  getStocktakeResultsApi,
  saveStocktakeResultsApi,
  confirmStocktakeApi,
  deleteStocktakesApi,
  startStocktakeApi
} from '@/api/stocktake'
import { getSlotsApi } from '@/api/slot'
import { useUser } from '@/composables/useUser'

const { t } = useI18n()
const { currentUser, getCurrentUser } = useUser()

const q = ref({
  slot: '',
  beginDate: '',
  endDate: '',
  status: ''
})

const stocktakeList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const slots = ref([])

const newDialogVisible = ref(false)
const newForm = ref({
  slot: '',
  remark: ''
})

const countDialogVisible = ref(false)
const currentStocktake = ref(null)
const countRows = ref([])

const detailDialogVisible = ref(false)
const snapshotList = ref([])
const resultsList = ref([])

const snapshotTotal = computed(() => {
  return (snapshotList.value || []).reduce((sum, item) => sum + (item.qty || 0), 0)
})

const resultsTotal = computed(() => {
  return (resultsList.value || []).reduce((sum, item) => sum + (item.qty || 0), 0)
})

const groupedSnapshotList = computed(() => {
  const grouped = {}
  ;(snapshotList.value || []).forEach(item => {
    const key = item.sellerPart || ''
    if (!grouped[key]) {
      grouped[key] = {
        sellerPart: item.sellerPart,
        qty: 0
      }
    }
    grouped[key].qty += (item.qty || 0)
  })
  return Object.values(grouped).sort((a, b) => (a.sellerPart || '').localeCompare(b.sellerPart || '', 'zh'))
})

const loadSlots = async () => {
  try {
    const res = await getSlotsApi()
    if (res && res.code === 1) {
      slots.value = (res.data || []).map(item => item.slot || item)
    }
  } catch (err) {
    console.error('Failed to load slots:', err)
  }
}

const fetchList = async () => {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    if (q.value.slot) params.slot = q.value.slot
    if (q.value.status !== '' && q.value.status !== null && q.value.status !== undefined) params.status = q.value.status
    if (q.value.beginDate) params.beginDate = q.value.beginDate
    if (q.value.endDate) params.endDate = q.value.endDate
    if (currentUser.value?.userId) params.keeperId = currentUser.value.userId

    const res = await getStocktakesApi(params)
    if (res && res.code === 1) {
      const rows = res.data?.rows || []
      total.value = res.data?.total || 0

      const enrichedRows = await Promise.all(rows.map(async (row) => {
        try {
          const [snapshotRes, resultsRes] = await Promise.all([
            getStocktakeSnapshotApi(row.stocktakeId),
            getStocktakeResultsApi(row.stocktakeId)
          ])
          const bookQty = (snapshotRes?.data || []).reduce((sum, item) => sum + (item.qty || 0), 0)
          const actualQty = (resultsRes?.data || []).reduce((sum, item) => sum + (item.qty || 0), 0)
          return {
            ...row,
            bookQty,
            actualQty
          }
        } catch (err) {
          console.error('Failed to fetch snapshot/results for stocktake:', row.stocktakeId, err)
          return row
        }
      }))

      stocktakeList.value = enrichedRows
    }
  } catch (err) {
    console.error('Failed to fetch stocktakes:', err)
  }
}

const onSearch = () => {
  currentPage.value = 1
  fetchList()
}

const onClear = () => {
  q.value = {
    slot: '',
    beginDate: '',
    endDate: '',
    status: ''
  }
  currentPage.value = 1
  fetchList()
}

const onSizeChange = () => {
  currentPage.value = 1
  fetchList()
}

const onCurrentChange = () => {
  fetchList()
}

const onAdd = () => {
  newForm.value = {
    slot: '',
    remark: ''
  }
  newDialogVisible.value = true
}

const onStart = async (row) => {
  try {
    await ElMessageBox.confirm(t('stocktake.messages.startConfirm'), t('stocktake.messages.startConfirmTitle'), {
      type: 'warning'
    })
    const res = await startStocktakeApi(row.stocktakeId)
    if (res && res.code === 1) {
      ElMessage.success(t('stocktake.messages.startSuccess'))
      fetchList()
    } else {
      ElMessage.error(res.msg || t('stocktake.messages.startFailed'))
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('Failed to start stocktake:', err)
      ElMessage.error(t('stocktake.messages.startFailed'))
    }
  }
}

const onNewDialogClose = () => {
  newDialogVisible.value = false
  newForm.value = {}
}

const saveNewStocktake = async () => {
  if (!newForm.value.slot) {
    ElMessage.warning(t('stocktake.messages.selectSlot'))
    return
  }
  try {
    const data = {
      slot: newForm.value.slot,
      remark: newForm.value.remark || '',
      keeperId: currentUser.value?.userId
    }
    const res = await createStocktakeApi(data)
    if (res && res.code === 1) {
      ElMessage.success(t('stocktake.messages.createSuccess'))
      newDialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res.msg || t('stocktake.messages.createFailed'))
    }
  } catch (err) {
    console.error('Failed to create stocktake:', err)
    ElMessage.error(t('stocktake.messages.createFailed'))
  }
}

const openCountDialog = async (row) => {
  currentStocktake.value = row
  countRows.value = []
  try {
    const res = await getStocktakeResultsApi(row.stocktakeId)
    if (res && res.code === 1) {
      countRows.value = res.data || []
    }
  } catch (err) {
    console.error('Failed to load results:', err)
  }
  countDialogVisible.value = true
}

const onCountDialogClose = () => {
  countDialogVisible.value = false
  currentStocktake.value = null
  countRows.value = []
}

const addCountRow = () => {
  countRows.value.push({
    itemName: '',
    qty: 0,
    remark: ''
  })
}

const deleteCountRow = (index) => {
  countRows.value.splice(index, 1)
}

const saveCountResults = async () => {
  if (!countRows.value || countRows.value.length === 0) {
    ElMessage.warning(t('stocktake.messages.addRecord'))
    return
  }
  for (const row of countRows.value) {
    if (!row.itemName || row.itemName.trim() === '') {
      ElMessage.warning(t('stocktake.messages.inputItemName'))
      return
    }
    if (row.qty == null || row.qty < 0) {
      ElMessage.warning(t('stocktake.messages.inputQty'))
      return
    }
  }
  try {
    const data = {
      results: countRows.value
    }
    const res = await saveStocktakeResultsApi(currentStocktake.value.stocktakeId, data)
    if (res && res.code === 1) {
      ElMessage.success(t('stocktake.messages.saveSuccess'))
      countDialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res.msg || t('stocktake.messages.saveFailed'))
    }
  } catch (err) {
    console.error('Failed to save results:', err)
    ElMessage.error(t('stocktake.messages.saveFailed'))
  }
}

const viewDetail = async (row) => {
  currentStocktake.value = row
  snapshotList.value = []
  resultsList.value = []
  try {
    const [snapshotRes, resultsRes] = await Promise.all([
      getStocktakeSnapshotApi(row.stocktakeId),
      getStocktakeResultsApi(row.stocktakeId)
    ])
    if (snapshotRes && snapshotRes.code === 1) {
      snapshotList.value = snapshotRes.data || []
    }
    if (resultsRes && resultsRes.code === 1) {
      resultsList.value = resultsRes.data || []
    }
  } catch (err) {
    console.error('Failed to load detail:', err)
  }
  detailDialogVisible.value = true
}

const onDetailDialogClose = () => {
  detailDialogVisible.value = false
  currentStocktake.value = null
  snapshotList.value = []
  resultsList.value = []
}

const confirmStocktake = async () => {
  try {
    await ElMessageBox.confirm(t('stocktake.messages.confirmStocktake'), t('stocktake.messages.confirmStocktakeTitle'), {
      type: 'warning'
    })
    const res = await confirmStocktakeApi(currentStocktake.value.stocktakeId)
    if (res && res.code === 1) {
      ElMessage.success(t('stocktake.messages.confirmSuccess'))
      detailDialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res.msg || t('stocktake.messages.confirmFailed'))
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('Failed to confirm stocktake:', err)
      ElMessage.error(t('stocktake.messages.confirmFailed'))
    }
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(t('stocktake.messages.deleteConfirm'), t('stocktake.messages.deleteConfirmTitle'), {
      type: 'warning'
    })
    const res = await deleteStocktakesApi([row.stocktakeId])
    if (res && res.code === 1) {
      ElMessage.success(t('stocktake.messages.deleteSuccess'))
      fetchList()
    } else {
      ElMessage.error(res.msg || t('stocktake.messages.deleteFailed'))
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('Failed to delete stocktake:', err)
      ElMessage.error(t('stocktake.messages.deleteFailed'))
    }
  }
}

const formatDateTime = (v) => {
  if (!v && v !== 0) return ''
  try {
    return (v || '').toString().split('T')[0]
  } catch (e) {
    return v
  }
}

onMounted(() => {
  getCurrentUser()
  loadSlots()
  fetchList()
})
</script>

<style scoped>
</style>
