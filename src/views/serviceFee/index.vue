<template>
  <div>
    <h1>{{ $t('menu.services.serviceFee.title') }}</h1>

    <div style="margin:10px 0; padding:8px 12px; background:#f5f5f5; border:1px solid #e6e6e6; border-radius:4px;">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-select v-model="q.buyerId" :placeholder="$t('menu.services.serviceFee.placeholders.selectBuyer')" clearable style="width:180px">
          <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
        </el-select>
        <el-select v-model="q.sellerId" :placeholder="$t('menu.services.serviceFee.placeholders.selectSeller')" clearable style="width:180px">
          <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
        </el-select>
        <el-select v-model="q.isPaid" :placeholder="$t('menu.services.serviceFee.placeholders.selectIsPaid')" clearable style="width:120px">
          <el-option label="未结算" :value="0" />
          <el-option label="已结算" :value="1" />
        </el-select>
        <el-input v-model="q.serviceName" :placeholder="$t('menu.services.serviceFee.placeholders.inputServiceName')" style="width:200px" />
      </div>
      <div style="margin-top:8px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:4px;">
          <span>{{ $t('menu.services.serviceFee.serviceDate') }}:</span>
          <el-date-picker v-model="serviceDateRange" type="daterange" range-separator="至" :start-placeholder="$t('common.startDate')" :end-placeholder="$t('common.endDate')" style="width:260px" />
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <span>{{ $t('menu.services.serviceFee.paymentDate') }}:</span>
          <el-date-picker v-model="paymentDateRange" type="daterange" range-separator="至" :start-placeholder="$t('common.startDate')" :end-placeholder="$t('common.endDate')" style="width:260px" />
        </div>
        <el-button type="primary" @click="onSearch">{{ $t('menu.services.serviceFee.buttons.search') }}</el-button>
        <el-button type="info" @click="onClear">{{ $t('menu.services.serviceFee.buttons.clear') }}</el-button>
        <el-button type="primary" @click="onAdd">{{ $t('menu.services.serviceFee.buttons.add') }}</el-button>
        <el-button type="danger" @click="onDeleteSelected">{{ $t('menu.services.serviceFee.buttons.delete') }}</el-button>
      </div>
    </div>

    <el-table :data="serviceFeeList" style="width:100%" @selection-change="onSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column type="index" :label="$t('menu.services.serviceFee.sn')" width="60" />
      <el-table-column :label="$t('menu.services.serviceFee.buyer')" width="120">
        <template #default="{row}">
          {{ getUserName(row.buyerId) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('menu.services.serviceFee.seller')" width="120">
        <template #default="{row}">
          {{ getUserName(row.sellerId) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('menu.services.serviceFee.serviceName')" prop="serviceName" width="200">
        <template #default="{row}">
          <el-tooltip :content="row.serviceDesc || ''" placement="top">
            <span>{{ row.serviceName }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column :label="$t('menu.services.serviceFee.serviceFee')" width="100">
        <template #default="{row}">
          {{ formatFee(row.serviceFee) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('menu.services.serviceFee.serviceDate')" width="120">
        <template #default="{row}">
          {{ formatYMD(row.serviceDate) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('menu.services.serviceFee.isPaid')" width="80">
        <template #default="{row}">
          {{ row.isPaid === 1 ? $t('menu.services.serviceFee.status.yes') : $t('menu.services.serviceFee.status.no') }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('menu.services.serviceFee.paymentDate')" width="120">
        <template #default="{row}">
          {{ formatYMD(row.paymentDate) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('menu.services.serviceFee.operation')" width="280" fixed="right">
        <template #default="{row}">
          <el-button size="small" @click="viewDetail(row)">{{ $t('menu.services.serviceFee.buttons.detail') }}</el-button>
          <el-button v-if="row.isPaid !== 1" size="small" type="primary" @click="onEdit(row)">{{ $t('menu.services.serviceFee.buttons.edit') }}</el-button>
          <el-button v-if="row.isPaid !== 1" size="small" type="danger" @click="onDelete(row)">{{ $t('menu.services.serviceFee.buttons.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" :title="$t('menu.services.serviceFee.dialogs.detailTitle')" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('menu.services.serviceFee.buyer')">{{ getUserName(detailData.buyerId) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('menu.services.serviceFee.seller')">{{ getUserName(detailData.sellerId) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('menu.services.serviceFee.serviceName')">{{ detailData.serviceName }}</el-descriptions-item>
        <el-descriptions-item :label="$t('menu.services.serviceFee.serviceFee')">{{ formatFee(detailData.serviceFee) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('menu.services.serviceFee.serviceDate')">{{ formatYMD(detailData.serviceDate) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('menu.services.serviceFee.isPaid')">{{ detailData.isPaid === 1 ? $t('menu.services.serviceFee.status.yes') : $t('menu.services.serviceFee.status.no') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('menu.services.serviceFee.paymentDate')" :span="2">{{ formatYMD(detailData.paymentDate) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('menu.services.serviceFee.serviceDesc')" :span="2">{{ detailData.serviceDesc }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">{{ $t('menu.services.serviceFee.buttons.close') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="onDialogClose">
      <el-form :model="editing" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('menu.services.serviceFee.buyer')">
              <el-select v-model="editing.buyerId" :placeholder="$t('menu.services.serviceFee.placeholders.selectBuyer')" style="width:100%">
                <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('menu.services.serviceFee.seller')">
              <el-select v-model="editing.sellerId" :placeholder="$t('menu.services.serviceFee.placeholders.selectSeller')" style="width:100%" disabled>
                <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('menu.services.serviceFee.serviceName')">
              <el-input v-model="editing.serviceName" maxlength="64" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('menu.services.serviceFee.serviceFee')">
              <el-input-number v-model="editing.serviceFee" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('menu.services.serviceFee.serviceDate')">
              <el-date-picker v-model="editing.serviceDate" type="date" :placeholder="$t('menu.services.serviceFee.placeholders.selectServiceDate')" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('menu.services.serviceFee.isPaid')">
              <span>{{ editing.isPaid === 1 ? $t('menu.services.serviceFee.status.paid') : $t('menu.services.serviceFee.status.unpaid') }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('menu.services.serviceFee.paymentDate')">
              <span>{{ formatYMD(editing.paymentDate) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('menu.services.serviceFee.serviceDesc')">
              <el-input v-model="editing.serviceDesc" type="textarea" :rows="3" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="onDialogClose">{{ $t('menu.services.serviceFee.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="saveServiceFee">{{ $t('menu.services.serviceFee.buttons.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { pageApi, addApi, updateApi, deleteApi, queryInfoApi } from '@/api/serviceFee'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryAllApi } from '@/api/user'
import { useUser } from '@/composables/useUser'

const { users, currentUser, getCurrentUser, queryAllUsers, getUserName } = useUser()
const { t } = useI18n()

const q = ref({
  buyerId: null,
  sellerId: null,
  isPaid: null,
  serviceName: '',
  serviceDateBegin: '',
  serviceDateEnd: '',
  paymentDateBegin: '',
  paymentDateEnd: ''
})

const serviceDateRange = ref([])
const paymentDateRange = ref([])

const serviceFeeList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const detailVisible = ref(false)
const detailData = ref({})
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editing = ref({})
const isEditMode = ref(false)
const selectedIds = ref([])

const fetchList = async () => {
  try {
    // Build params
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (q.value.buyerId) params.buyerId = q.value.buyerId
    if (q.value.sellerId) params.sellerId = q.value.sellerId
    if (q.value.isPaid !== null && q.value.isPaid !== '') params.isPaid = q.value.isPaid
    if (q.value.serviceName) params.serviceName = q.value.serviceName
    
    // Handle service date range
    if (serviceDateRange.value && serviceDateRange.value.length === 2) {
      params.serviceDateBegin = formatDate(serviceDateRange.value[0])
      params.serviceDateEnd = formatDate(serviceDateRange.value[1])
    }
    
    // Handle payment date range
    if (paymentDateRange.value && paymentDateRange.value.length === 2) {
      params.paymentDateBegin = formatDate(paymentDateRange.value[0])
      params.paymentDateEnd = formatDate(paymentDateRange.value[1])
    }

    const res = await pageApi(params)
    if (res && res.code === 1) {
      // Filter by permission: only show records where current user is buyer or seller
      const currentUserId = currentUser.value?.userId
      serviceFeeList.value = (res.data?.rows || []).filter(row => 
        row.buyerId === currentUserId || row.sellerId === currentUserId
      )
      total.value = serviceFeeList.value.length
    } else {
      ElMessage.error(res?.msg || t('menu.services.serviceFee.messages.loadFailed'))
    }
  } catch (err) {
    console.error('fetchList error', err)
    ElMessage.error(t('menu.services.serviceFee.messages.loadFailed'))
  }
}

const onSearch = () => {
  currentPage.value = 1
  fetchList()
}

const onClear = () => {
  q.value = {
    buyerId: null,
    sellerId: null,
    isPaid: null,
    serviceName: '',
    serviceDateBegin: '',
    serviceDateEnd: '',
    paymentDateBegin: '',
    paymentDateEnd: ''
  }
  serviceDateRange.value = []
  paymentDateRange.value = []
  currentPage.value = 1
  fetchList()
}

const onSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchList()
}

const onCurrentChange = (val) => {
  currentPage.value = val
  fetchList()
}

const onSelectionChange = (selection) => {
  selectedIds.value = selection.map(s => s.id)
}

const viewDetail = async (row) => {
  try {
    const res = await queryInfoApi(row.id)
    if (res && res.code === 1) {
      detailData.value = res.data
      detailVisible.value = true
    } else {
      ElMessage.error(t('menu.services.serviceFee.messages.getDetailFailed'))
    }
  } catch (err) {
    console.error('viewDetail error', err)
    ElMessage.error(t('menu.services.serviceFee.messages.getDetailFailed'))
  }
}

const onAdd = () => {
  dialogTitle.value = t('menu.services.serviceFee.dialogs.addTitle')
  isEditMode.value = false
  editing.value = {
    buyerId: null,
    sellerId: currentUser.value?.userId || null,
    serviceName: '',
    serviceFee: 0,
    serviceDate: new Date(),
    isPaid: 0,
    paymentDate: null,
    serviceDesc: ''
  }
  dialogVisible.value = true
}

const onEdit = async (row) => {
  try {
    const res = await queryInfoApi(row.id)
    if (res && res.code === 1) {
      dialogTitle.value = t('menu.services.serviceFee.dialogs.editTitle')
      isEditMode.value = true
      editing.value = { ...res.data }
      dialogVisible.value = true
    } else {
      ElMessage.error(t('menu.services.serviceFee.messages.getDetailFailed'))
    }
  } catch (err) {
    console.error('onEdit error', err)
    ElMessage.error(t('menu.services.serviceFee.messages.getDetailFailed'))
  }
}

const saveServiceFee = async () => {
  try {
    // Format dates
    const data = { ...editing.value }
    if (data.serviceDate) {
      data.serviceDate = formatDate(data.serviceDate)
    }
    if (data.paymentDate) {
      data.paymentDate = formatDateTime(data.paymentDate)
    }

    let res
    if (isEditMode.value) {
      res = await updateApi(editing.value.id, data)
    } else {
      res = await addApi(data)
    }

    if (res && res.code === 1) {
      ElMessage.success(t('menu.services.serviceFee.messages.saveSuccess'))
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res?.msg || t('menu.services.serviceFee.messages.saveFailed'))
    }
  } catch (err) {
    console.error('saveServiceFee error', err)
    ElMessage.error(t('menu.services.serviceFee.messages.saveFailed'))
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(t('menu.services.serviceFee.messages.deleteConfirm'), t('common.deleteConfirmTitle'), { type: 'warning' })
    const res = await deleteApi(row.id)
    if (res && res.code === 1) {
      ElMessage.success(t('menu.services.serviceFee.messages.deleteSuccess'))
      fetchList()
    } else {
      ElMessage.error(res?.msg || t('menu.services.serviceFee.messages.deleteFailed'))
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('onDelete error', err)
      ElMessage.error(t('menu.services.serviceFee.messages.deleteFailed'))
    }
  }
}

const onDeleteSelected = async () => {
  if (!selectedIds.value.length) {
    ElMessage.info(t('menu.services.serviceFee.messages.selectToDelete'))
    return
  }
  try {
    await ElMessageBox.confirm(t('menu.services.serviceFee.messages.deleteSelectedConfirm', { count: selectedIds.value.length }), t('common.deleteConfirmTitle'), { type: 'warning' })
    const res = await deleteApi(selectedIds.value.join(','))
    if (res && res.code === 1) {
      ElMessage.success(t('menu.services.serviceFee.messages.deleteSuccess'))
      fetchList()
      selectedIds.value = []
    } else {
      ElMessage.error(res?.msg || t('menu.services.serviceFee.messages.deleteFailed'))
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('onDeleteSelected error', err)
      ElMessage.error(t('menu.services.serviceFee.messages.deleteFailed'))
    }
  }
}

const onDialogClose = () => {
  dialogVisible.value = false
  editing.value = {}
}

// Format date to yyyy-MM-dd
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format datetime to yyyy-MM-ddTHH:mm:ss
const formatDateTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

// Format date from ISO string to yyyy-MM-dd
const formatYMD = (v) => {
  if (!v && v !== 0) return ''
  try {
    return (v || '').toString().split('T')[0]
  } catch (e) {
    return v
  }
}

// Format fee to 0.00
const formatFee = (v) => {
  if (v == null || v === '') return '0.00'
  return Number(v).toFixed(2)
}

onMounted(() => {
  getCurrentUser()
  queryAllUsers()
  fetchList()
})
</script>

<style scoped>
</style>
