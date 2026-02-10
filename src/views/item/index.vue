<template>
  <div>
    <h1>Item Management</h1>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:8px; align-items:center;">
      <el-input v-model="q.itemNo" placeholder="ItemNo" style="width:200px" />
      <el-input v-model="q.sellerPart" placeholder="Seller Part" style="width:220px" />
      <el-input v-model="q.mfrPart" placeholder="Manufacturer Part" style="width:220px" />
      <el-select v-model="q.ownerId" placeholder="Owner" clearable style="width:180px">
        <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
      </el-select>
      <el-select v-model="q.keeperId" placeholder="Keeper" clearable style="width:180px">
        <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
      </el-select>
      <el-select v-model="q.itemStatus" placeholder="Status" clearable style="width:120px">
        <el-option label="All" :value="''" />
        <el-option label="Inspecting" :value="0" />
        <el-option label="Received" :value="1" />
        <el-option label="Sent" :value="2" />
        <el-option label="Exception" :value="9" />
      </el-select>
      <el-input v-model="q.minStocklife" placeholder="Stocklife>" type="number" style="width:140px" />
      <el-select v-model="q.ispaid" placeholder="Paid" clearable style="width:120px">
        <el-option label="All" :value="''" />
        <el-option label="Unpaid" :value="0" />
        <el-option label="Paid" :value="1" />
      </el-select>
      <el-button type="primary" @click="onSearch">Search</el-button>
      <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">Clear</el-button>
      <el-button type="primary" @click="onAdd">+ Add Item</el-button>
      <el-button type="danger" @click="onDeleteSelected">- Delete</el-button>
    </div>

    <div style="overflow-x:auto;">
      <el-table :data="itemList" stripe style="min-width:1500px" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="itemNo" label="ItemNo" width="160" fixed="left">
          <template #default="{row}">
            <span>{{ row.itemNo }}</span>
          </template>
        </el-table-column>
      <el-table-column prop="sellerPart" label="SellerPart" width="200" />
      <el-table-column prop="mfrPart" label="MfrPart" width="200" />
      <el-table-column prop="qty" label="Qty" width="80" />
      <el-table-column prop="itemStatus" label="Status" width="120">
        <template #default="{row}">
          <span v-if="row.itemStatus===0">Inspecting</span>
          <span v-else-if="row.itemStatus===1">Received</span>
          <span v-else-if="row.itemStatus===2">Sent</span>
          <span v-else-if="row.itemStatus===9">Exception</span>
        </template>
      </el-table-column>
      <el-table-column prop="owner" label="Owner" width="140" />
      <el-table-column prop="keeper" label="Keeper" width="140" />
        <el-table-column prop="receivePackageNo" label="ReceivePackage" width="192" />
        <el-table-column prop="receivedDate" label="ReceivedDate" width="140" />
        <el-table-column prop="sendPackageNo" label="SendPackage" width="192" />
        <el-table-column prop="sendDate" label="SendDate" width="140" />
        <el-table-column label="Stocklife" width="120">
            <template #default="{row}">
              <div>{{ computeStocklife(row) }} days</div>
            </template>
        </el-table-column>
        <el-table-column prop="inspectFee" label="InspectFee" width="120">
          <template #default="{row}">
            <div>{{ (Number(row.inspectFee) || 0).toFixed(2) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="repairFee" label="RepairFee" width="120">
          <template #default="{row}">
            <div>{{ (Number(row.repairFee) || 0).toFixed(2) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="keepFee" label="KeepFee" width="120">
          <template #default="{row}">
            <div>{{ (Number(row.keepFee) || 0).toFixed(2) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="packingFee" label="PackingFee" width="120">
          <template #default="{row}">
            <div>{{ (Number(row.packingFee) || 0).toFixed(2) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="otherFee" label="OtherFee" width="120">
          <template #default="{row}">
            <div>{{ (Number(row.otherFee) || 0).toFixed(2) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="TotalFee" width="120">
          <template #default="{row}">
            <div>{{ ((Number(row.inspectFee)||0) + (Number(row.repairFee)||0)+ (Number(row.keepFee)||0) + (Number(row.packingFee)||0) + (Number(row.otherFee)||0)).toFixed(2) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="ispaid" label="Paid" width="100">
          <template #default="{row}">
            <div>{{ row.ispaid === 1 ? 'paid' : (row.ispaid === 0 ? 'unpaid' : '') }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Operation" width="260" align="center" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="viewDetail(row)" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">Detail</el-button>
            <el-button size="small" type="primary" @click="onEdit(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="onDelete(row.itemId)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <!-- Detail / Edit Dialog -->
    <!-- Read-only Detail Dialog (opened by clicking ItemNo) -->
    <el-dialog :model-value="detailVisible" title="Item Detail" width="960px" @close="detailVisible=false">
      <el-form :model="detailData" label-width="154px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="ItemNo"><div>{{ detailData.itemNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="SellerPart"><div>{{ detailData.sellerPart }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="MfrPart"><div>{{ detailData.mfrPart }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Qty"><div>{{ detailData.qty }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="ReceivePackageNo"><div>{{ detailData.receivePackageNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="ReceivedDate"><div>{{ detailData.receivedDate }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="SendPackageNo"><div>{{ detailData.sendPackageNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="SendDate"><div>{{ detailData.sendDate }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="DealerReceivedDate"><div>{{ detailData.dealerReceivedDate }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OriginalOrder"><div>{{ detailData.originalOrder }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="OriginalReturnNo"><div>{{ detailData.originalReturnNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="CustomerFeedback"><div>{{ detailData.customerFeedback }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="IQCResult"><div>{{ detailData.iqcResult }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Unpacked"><div>{{ detailData.isUnpacked === 1 ? 'packed' : (detailData.isUnpacked === 0 ? 'unpacked' : '') }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="InspectFee"><div>{{ detailData.inspectFee }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="repairFee"><div>{{ detailData.repairFee }}</div></el-form-item></el-col>
          
          <el-col :span="12"><el-form-item label="KeepFee"><div>{{ detailData.keepFee }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PackingFee"><div>{{ detailData.packingFee }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="OtherFee"><div>{{ detailData.otherFee }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Paid"><div>{{ detailData.ispaid === 1 ? 'paid' : (detailData.ispaid === 0 ? 'unpaid' : '') }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="FeeRemarks"><div>{{ detailData.feeRemarks }}</div></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">Close</el-button>
      </template>
    </el-dialog>
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="864px" @close="onDialogClose">
    <el-form :model="editing" label-width="132px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="ItemNo"><el-input v-model="editing.itemNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="SellerPart"><el-input v-model="editing.sellerPart" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="MfrPart"><el-input v-model="editing.mfrPart" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Qty"><el-input-number v-model="editing.qty" :min="1" style="width:100%" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="Status"><el-select v-model="editing.itemStatus" placeholder="Select status"><el-option label="Inspecting" :value="0" /><el-option label="Received" :value="1" /><el-option label="Sent" :value="2" /><el-option label="Unknown" :value="9" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Owner"><el-input v-model="editing.owner" disabled /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="Keeper"><el-select v-model="editing.keeperId" placeholder="Select Keeper">
            <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
          </el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="ReceivePackageNo"><el-input v-model="editing.receivePackageNo" disabled /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="SendPackageNo"><el-input v-model="editing.sendPackageNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="ReceivedDate"><el-date-picker v-model="editing.receivedDate" type="date" placeholder="Pick date" style="width:100%" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="SendDate"><el-date-picker v-model="editing.sendDate" type="date" placeholder="Pick date" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="DealerReceivedDate"><el-date-picker v-model="editing.dealerReceivedDate" type="date" placeholder="Pick date" style="width:100%" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="CustomerFeedback"><el-input type="textarea" v-model="editing.customerFeedback" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="IQCResult"><el-input v-model="editing.iqcResult" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="OriginalOrder"><el-input v-model="editing.originalOrder" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OriginalReturnNo"><el-input v-model="editing.originalReturnNo" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="Unpacked"><el-select v-model="editing.isUnpacked"><el-option label="unpacked" :value="0" /><el-option label="packed" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="InspectFee"><el-input-number v-model="editing.inspectFee" :min="0" style="width:100%" /></el-form-item></el-col>
          
          <el-col :span="12"><el-form-item label="repairFee"><el-input-number v-model="editing.repairFee" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="KeepFee"><el-input-number v-model="editing.keepFee" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PackingFee"><el-input-number v-model="editing.packingFee" :min="0" style="width:100%" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="OtherFee"><el-input-number v-model="editing.otherFee" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Paid"><el-select v-model="editing.isPaid"><el-option label="unpaid" :value="0" /><el-option label="paid" :value="1" /></el-select></el-form-item></el-col>

          <el-col :span="24"><el-form-item label="FeeRemarks"><el-input type="textarea" v-model="editing.feeRemarks" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="Remark"><el-input type="textarea" v-model="editing.remark" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="onDialogClose">Cancel</el-button>
        <el-button type="primary" @click="saveItem">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryInfoApi, addApi, updateApi, deleteApi } from '@/api/item'
import { useUser } from '@/composables/useUser'

const q = ref({ itemNo: '', sellerPart: '', mfrPart: '', ispaid: '', ownerId: null, keeperId: null, itemStatus: '', minStocklife: null })
const itemList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedIds = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const editing = ref({})
const detailVisible = ref(false)
const detailData = ref({})
const { users, currentUser, getCurrentUser, queryAllUsers, getUserName } = useUser()

const fetchList = async () => {
  const params = {
    page: currentPage.value,
    pageSize: pageSize.value
  }
  if (q.value.itemNo) params.itemNo = q.value.itemNo
  if (q.value.sellerPart) params.sellerPart = q.value.sellerPart
  if (q.value.mfrPart) params.mfrPart = q.value.mfrPart
  if (q.value.ownerId) params.ownerId = q.value.ownerId
  if (q.value.keeperId) params.keeperId = q.value.keeperId
  if (q.value.ispaid !== '') params.ispaid = q.value.ispaid
  // include itemStatus even when value is 0 (so check against empty string/undefined)
  if (q.value.itemStatus !== '' && q.value.itemStatus !== undefined) params.itemStatus = q.value.itemStatus

  try {
    const res = await request.get('/items', { params })
    if (res && res.code === 1) {
      let rows = res.data?.rows || []
      // compute stocklife for each row and attach as _stocklife
      rows = rows.map(r => ({ ...r, _stocklife: computeStocklife(r) }))
      // apply client-side filter for minStocklife if provided
      if (q.value.minStocklife != null && q.value.minStocklife !== '') {
        rows = rows.filter(r => (Number(r._stocklife) || 0) > Number(q.value.minStocklife))
      }
      // sort items client-side by itemNo, receivePackageNo, sendPackageNo
      rows.sort((a, b) => {
        const i = (a.itemNo || '').localeCompare(b.itemNo || '')
        if (i !== 0) return i
        const r = (a.receivePackageNo || '').localeCompare(b.receivePackageNo || '')
        if (r !== 0) return r
        return (a.sendPackageNo || '').localeCompare(b.sendPackageNo || '')
      })
      itemList.value = rows
      total.value = rows.length
    } else {
      itemList.value = []
      total.value = 0
      ElMessage.error(res.msg || 'Failed to load items')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('Failed to load items')
  }
}

const onSearch = async () => { currentPage.value = 1; await fetchList() }
const onClear = async () => { q.value = { itemNo:'', sellerPart:'', mfrPart:'', ispaid:'', ownerId:null, keeperId:null, minStocklife: null }; await fetchList() }

const onSizeChange = (size) => { pageSize.value = size; fetchList() }
const onCurrentChange = (page) => { currentPage.value = page; fetchList() }

const onSelectionChange = (selection) => { selectedIds.value = selection.map(s => s.itemId) }

const onAdd = () => {
  dialogTitle.value = 'Add Item'
  editing.value = {
    isUnpacked: 0,
    isPaid: 0,
    ownerId: currentUser.value.userId || null,
    owner: currentUser.value.name || ''
  }
  dialogVisible.value = true
}

const viewDetail = async (row) => {
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) {
      detailData.value = res.data || res
      detailVisible.value = true
    } else {
      ElMessage.error('Failed to load item')
    }
  } catch (err) { ElMessage.error('Failed to load item') }
}

const onEdit = async (row) => {
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) {
      // map API fields to editing model
      const d = res.data || res
      editing.value = { ...d }
      // map ispaid -> isPaid
      editing.value.isPaid = d.ispaid == null ? 0 : d.ispaid
      // isUnpacked field from API may be isUnpacked
      editing.value.isUnpacked = d.isUnpacked == null ? 0 : d.isUnpacked
      // ensure owner set to current user
      editing.value.ownerId = currentUser.value.userId || d.ownerId || null
      editing.value.owner = currentUser.value.name || d.owner || ''
      // ensure keeper selection exists as userId
      editing.value.keeperId = d.keeperId || null

      dialogTitle.value = 'Edit Item'
      dialogVisible.value = true
    } else {
      ElMessage.error('Failed to load item')
    }
  } catch (err) { ElMessage.error('Failed to load item') }
}

const preparePayload = (data) => {
  const payload = { ...data }
  payload.ispaid = data.isPaid == null ? 0 : data.isPaid
  payload.isUnpacked = data.isUnpacked == null ? 0 : data.isUnpacked
  payload.ownerId = currentUser.value.userId || payload.ownerId
  return payload
}

const saveItem = async () => {
  try {
    const payload = preparePayload(editing.value)
    if (editing.value.itemId) {
      const res = await updateApi(payload)
      if (res && res.code === 1) { ElMessage.success('Saved'); dialogVisible.value = false; fetchList() }
      else ElMessage.error(res.msg || 'Save failed')
    } else {
      const res = await addApi(payload)
      if (res && res.code === 1) { ElMessage.success('Added'); dialogVisible.value = false; fetchList() }
      else ElMessage.error(res.msg || 'Add failed')
    }
  } catch (err) { ElMessage.error('Save failed') }
}

const onDelete = async (id) => {
  try {
    await ElMessageBox.confirm('Confirm delete?','Warning')
    const res = await deleteApi(id)
    if (res && res.code === 1) { ElMessage.success('Deleted'); fetchList() }
    else ElMessage.error(res.msg || 'Delete failed')
  } catch (err) {}
}

const onDeleteSelected = async () => {
  if (!selectedIds.value.length) { ElMessage.info('No selection'); return }
  try {
    await ElMessageBox.confirm('Confirm delete selected?','Warning')
    const res = await deleteApi(selectedIds.value)
    if (res && res.code === 1) { ElMessage.success('Deleted'); fetchList(); selectedIds.value = [] }
    else ElMessage.error(res.msg || 'Delete failed')
  } catch (err) {}
}

onMounted(() => { fetchList(); getCurrentUser(); queryAllUsers() })

const onDialogClose = () => {
  dialogVisible.value = false
  editing.value = {}
}
const computeStocklife = (row) => {
  try {
    const received = row.receivedDate ? new Date(row.receivedDate) : null
    if (!received) return 0
    const end = row.sendDate ? new Date(row.sendDate) : new Date()
    const diff = Math.floor((end - received) / (1000 * 60 * 60 * 24))
    return diff >= 0 ? diff : 0
  } catch (err) {
    return 0
  }
}

</script>

<style scoped>
.container { margin: 10px 0 }
</style>
