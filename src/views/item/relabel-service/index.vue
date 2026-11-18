<template>
  <div>
    <h2>{{ $t('menu.services.relabelService') }}</h2>

    <div style="margin:10px 0; padding:8px 12px; background:#f5f5f5; border:1px solid #e6e6e6; border-radius:4px;">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-input v-model="q.itemNo" :placeholder="$t('menu.item.fields.itemNo')" style="width:180px" />
        <el-select v-model="q.slot" :placeholder="$t('menu.item.fields.slot')" clearable style="width:160px">
          <el-option v-for="s in slotOptions" :key="s.slot" :label="s.slot" :value="s.slot" />
        </el-select>
        <el-input v-model="q.sellerPart" :placeholder="$t('menu.item.fields.sellerPart')" style="width:180px" />
        <el-select v-model="q.ownerId" :placeholder="$t('menu.item.fields.owner')" clearable style="width:140px">
          <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
        </el-select>
        <el-input v-model="q.receivePackageNo" :placeholder="$t('menu.item.fields.receivePackageNo')" style="width:160px" />
        <el-input v-model="q.sendPackageNo" :placeholder="$t('menu.item.fields.sendPackageNo')" style="width:180px" />
      </div>
      <div style="margin-top:8px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-select v-model="q.itemStatus" :placeholder="$t('menu.item.fields.status')" clearable style="width:110px">
          <el-option :label="$t('menu.item.statuses.all')" :value="''" />
          <el-option :label="$t('menu.item.statuses.pending')" :value="0" />
          <el-option :label="$t('menu.item.statuses.received')" :value="1" />
          <el-option :label="$t('menu.item.statuses.sent')" :value="2" />
          <el-option :label="$t('menu.item.statuses.exception')" :value="9" />
        </el-select>
        <el-select v-model="q.isLabelChanged" :placeholder="$t('menu.item.fields.isLabelChanged')" clearable style="width:110px">
          <el-option :label="$t('menu.item.labelChangedStatus.all')" :value="''" />
          <el-option :label="$t('menu.item.labelChangedStatus.notCompleted')" :value="0" />
          <el-option :label="$t('menu.item.labelChangedStatus.completed')" :value="1" />
        </el-select>
        <el-button type="primary" @click="onSearch">{{ $t('menu.item.buttons.search') }}</el-button>
        <el-button type="info" @click="onClear">{{ $t('menu.item.buttons.clear') }}</el-button>
      </div>
    </div>

    <el-table :data="itemList" stripe style="width:100%" border>
      <el-table-column :label="$t('menu.item.fields.itemNo')" width="140" align="center">
        <template #default="scope">{{ scope.row.itemNo }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.newItemNo')" width="140" align="center">
        <template #default="scope">{{ scope.row.mfrPart || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.sellerPart')" width="180" align="center">
        <template #default="scope">{{ scope.row.sellerPart || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.qty')" width="80" align="center">
        <template #default="scope">{{ scope.row.qty }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.status')" width="100" align="center">
        <template #default="scope">{{ getStatusName(scope.row.itemStatus) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.isLabelChanged')" width="100" align="center">
        <template #default="scope">{{ scope.row.isLabelChanged === 1 ? $t('menu.item.labelChangedStatus.completed') : (scope.row.isLabelChanged === 0 ? $t('menu.item.labelChangedStatus.notCompleted') : '-') }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.slot')" width="100" align="center">
        <template #default="scope">{{ scope.row.slot || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.owner')" width="120" align="center">
        <template #default="scope">{{ scope.row.owner || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.warehouse')" width="120" align="center">
        <template #default="scope">{{ scope.row.keeper || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.receivePackageNo')" width="170" align="center">
        <template #default="scope">{{ scope.row.receivePackageNo || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.receivedDate')" width="120" align="center">
        <template #default="scope">{{ formatYMD(scope.row.receivedDate) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.sendPackageNo')" width="170" align="center">
        <template #default="scope">{{ scope.row.sendPackageNo || '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.sendDate')" width="120" align="center">
        <template #default="scope">{{ formatYMD(scope.row.sendDate) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.stocklife')" width="80" align="center">
        <template #default="scope">{{ computeStocklife(scope.row) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.inspectFee')" width="100" align="center">
        <template #default="scope">{{ formatFee(scope.row.inspectFee) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.repairFee')" width="100" align="center">
        <template #default="scope">{{ formatFee(scope.row.repairFee) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.keepFee')" width="100" align="center">
        <template #default="scope">{{ formatFee(scope.row.keepFee) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.packingFee')" width="100" align="center">
        <template #default="scope">{{ formatFee(scope.row.packingFee) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.relabelFee')" width="100" align="center">
        <template #default="scope">{{ formatFee(scope.row.otherFee) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.isPaid')" width="100" align="center">
        <template #default="scope">{{ scope.row.ispaid === 1 ? $t('menu.item.paidStatus.paid') : (scope.row.ispaid === 0 ? $t('menu.item.paidStatus.unpaid') : '') }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.paymentDate')" width="120" align="center">
        <template #default="scope">{{ formatYMD(scope.row.paymentDate) }}</template>
      </el-table-column>
      <el-table-column :label="$t('menu.item.fields.operation')" align="center" width="240" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="viewDetail(scope.row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">{{ $t('menu.item.actions.detail') }}</el-button>
          <el-button size="small" type="primary" @click="onEdit(scope.row)">{{ $t('menu.item.actions.edit') }}</el-button>
          <el-button size="small" @click="onRelabel(scope.row)" style="background:#fff7e6; border:1px solid #ffd966; color:#7a5a00">{{ $t('menu.item.actions.relabel') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <!-- Relabel Detail Dialog -->
    <RelabelDetailDialog
      v-model="detailVisible"
      :detail-data="detailData"
      @close="detailVisible = false"
    />

    <!-- Relabel Edit Dialog -->
    <RelabelEditDialog
      v-model="editVisible"
      :editing="editing"
      :slot-options="slotOptions"
      @save="onSaveEdit"
      @close="editVisible = false"
    />

    <!-- Relabel Scan Dialog -->
    <RelabelScanDialog
      v-model="scanVisible"
      :item-data="scanItemData"
      @close="scanVisible = false"
      @confirm="onConfirmRelabel"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUser } from '@/composables/useUser'
import { queryInfoApi, updateApi } from '@/api/item'
import { getSlotsApi } from '@/api/slot'
import { formatFee, computeTotalFee } from '@/utils/fees'
import RelabelDetailDialog from './RelabelDetailDialog.vue'
import RelabelEditDialog from './RelabelEditDialog.vue'
import RelabelScanDialog from './RelabelScanDialog.vue'

const { t } = useI18n()
const { users, currentUser, getCurrentUser, queryAllUsers, getUserName } = useUser()

const q = ref({
  itemNo: '',
  slot: '',
  sellerPart: '',
  ownerId: null,
  receivePackageNo: '',
  sendPackageNo: '',
  itemStatus: 1,
  isLabelChanged: ''
})

const itemList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const slotOptions = ref([])

const detailVisible = ref(false)
const editVisible = ref(false)
const scanVisible = ref(false)
const detailData = ref({})
const editing = ref({})
const scanItemData = ref({})

const loadSlotOptions = async () => {
  try {
    const res = await getSlotsApi()
    if (res && res.code === 1) {
      slotOptions.value = (res.data || []).sort((a, b) => (a.slot || '').localeCompare(b.slot || ''))
    } else {
      slotOptions.value = []
    }
  } catch (err) {
    console.error('loadSlotOptions error', err)
    slotOptions.value = []
  }
}

const fetchList = async () => {
  try {
    const params = {
      ...q.value,
      keeperId: currentUser.value.userId,
      needChangeLabel: 1,
      page: currentPage.value,
      pageSize: pageSize.value
    }
    const res = await request.get('/items', { params })
    if (res && res.code === 1) {
      itemList.value = res.data?.rows || res.data?.list || []
      total.value = res.data?.total || 0
    } else {
      itemList.value = []
      total.value = 0
    }
  } catch (err) {
    console.error('fetchList error', err)
    itemList.value = []
    total.value = 0
  }
}

const onSearch = async () => {
  currentPage.value = 1
  await fetchList()
}

const onClear = async () => {
  q.value = {
    itemNo: '',
    slot: '',
    sellerPart: '',
    ownerId: null,
    receivePackageNo: '',
    sendPackageNo: '',
    itemStatus: 1,
    isLabelChanged: ''
  }
  currentPage.value = 1
  await fetchList()
}

const onSizeChange = (val) => {
  pageSize.value = val
  fetchList()
}

const onCurrentChange = (val) => {
  currentPage.value = val
  fetchList()
}

const viewDetail = async (row) => {
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) {
      detailData.value = res.data || res
      detailVisible.value = true
    } else {
      ElMessage.error(t('menu.item.messages.failedToLoad') || 'Failed to load item')
    }
  } catch (err) {
    console.error('Failed to load item detail', err)
    ElMessage.error(t('menu.item.messages.failedToLoad') || 'Failed to load item')
  }
}

const onEdit = async (row) => {
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) {
      const d = res.data || res
      editing.value = { ...d }
      editing.value.isPaid = d.ispaid == null ? 0 : d.ispaid
      editVisible.value = true
    } else {
      ElMessage.error(t('menu.item.messages.failedToLoad') || 'Failed to load item')
    }
  } catch (err) {
    console.error('Failed to load item', err)
    ElMessage.error('Failed to load item')
  }
}

const onRelabel = async (row) => {
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) {
      scanItemData.value = res.data || res
      scanVisible.value = true
    } else {
      ElMessage.error(t('menu.item.messages.failedToLoad') || 'Failed to load item')
    }
  } catch (err) {
    console.error('onRelabel error', err)
    ElMessage.error(t('menu.item.messages.failedToLoad') || 'Failed to load item')
  }
}

const onConfirmRelabel = async (item) => {
  try {
    const res = await updateApi({
      itemId: item.itemId,
      isLabelChanged: 1
    })
    if (res && res.code === 1) {
      ElMessage.success(t('menu.item.messages.saveSuccess') || 'Save success')
      scanVisible.value = false
      await fetchList()
    } else {
      ElMessage.error(res.msg || t('menu.item.messages.saveFailed') || 'Save failed')
    }
  } catch (err) {
    console.error('onConfirmRelabel error', err)
    ElMessage.error(t('menu.item.messages.saveFailed') || 'Save failed')
  }
}

const onSaveEdit = async () => {
  try {
    const payload = { ...editing.value }
    payload.ispaid = editing.value.isPaid
    const res = await updateApi(payload)
    if (res && res.code === 1) {
      ElMessage.success(t('menu.item.messages.saveSuccess') || 'Saved successfully')
      editVisible.value = false
      await fetchList()
    } else {
      ElMessage.error(res.msg || t('menu.item.messages.saveFailed') || 'Save failed')
    }
  } catch (err) {
    ElMessage.error(t('menu.item.messages.saveFailed') || 'Save failed')
  }
}

const getStatusName = (status) => {
  const map = {0: t('menu.item.statuses.pending'), 1: t('menu.item.statuses.received'), 2: t('menu.item.statuses.sent'), 9: t('menu.item.statuses.exception')}
  return map[status] || '-'
}

const computeStocklife = (row) => {
  if (!row.receivedDate) return '-'
  const received = new Date(row.receivedDate)
  const now = new Date()
  const diff = Math.floor((now - received) / (1000 * 60 * 60 * 24))
  return diff >= 0 ? diff : '-'
}

function formatYMD(v) {
  if (!v && v !== 0) return ''
  try { return (v || '').toString().split('T')[0] } catch (e) { return v }
}

onMounted(async () => {
  await getCurrentUser()
  queryAllUsers()
  loadSlotOptions()
  fetchList()
})
</script>

<style scoped>
.fee-input :deep(.el-input__inner) {
  text-align: right;
}
</style>
