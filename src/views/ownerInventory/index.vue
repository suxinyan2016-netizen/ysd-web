<template>
  <div>
    <h1>物主库存</h1>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:8px; align-items:center;">
      <el-input v-model="q.itemNo" placeholder="ItemNo" style="width:200px" />
      <el-input v-model="q.sellerPart" placeholder="Seller Part" style="width:220px" />
      <el-input v-model="q.mfrPart" placeholder="Manufacturer Part" style="width:220px" />
      <el-input v-model="q.receivePackageNo" placeholder="ReceivePackageNo" style="width:200px" />
      <el-input v-model="q.sendPackageNo" placeholder="SendPackageNo" style="width:200px" />
      <el-select v-model="q.keeperId" placeholder="Keeper" clearable style="width:180px">
        <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
      </el-select>
        <el-select v-model="q.ispaid" placeholder="Paid" clearable style="width:120px">
          <el-option label="All" :value="''" />
        <el-option label="Unpaid" :value="0" />
        <el-option label="Paid" :value="1" />
      </el-select>
      <el-button type="primary" @click="onSearch">Search</el-button>
      <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">Clear</el-button>
      <el-button type="info" @click="onAddSelectedToParcel" style="background:#e6f7ff; border:1px solid #b3e5ff; color:#006c9c">Add Parcel</el-button>
    </div>

    <div style="overflow-x:auto;">
      <el-table ref="tableRef" :data="itemList" row-key="itemId" stripe style="min-width:1500px" border @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="itemNo" label="ItemNo" width="160" fixed="left" />
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
        <el-table-column prop="sendPackageNo" label="SendPackage" width="192" />
        <el-table-column prop="inspectFee" label="InspectFee" width="120">
          <template #default="{row}">
            <div>{{ (Number(row.inspectFee) || 0).toFixed(2) }}</div>
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
            <div>{{ ((Number(row.inspectFee)||0) + (Number(row.keepFee)||0) + (Number(row.packingFee)||0) + (Number(row.otherFee)||0)).toFixed(2) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="ispaid" label="Paid" width="100">
          <template #default="{row}">
            <div>{{ row.ispaid === 1 ? 'paid' : (row.ispaid === 0 ? 'unpaid' : '') }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Operation" width="320" align="center" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">Detail</el-button>
            <el-button v-if="row.itemStatus===0" size="small" type="primary" @click="onEdit(row)">Edit</el-button>
            <el-button v-if="row.itemStatus===1 && row.qty>1" size="small" @click="onSplit(row)" style="background:#fff7e6; border:1px solid #ffd966; color:#7a5a00">Split</el-button>
            <el-button v-if="row.itemStatus===1" size="small" @click="onAddToParcel(row)" style="background:#e6f7ff; border:1px solid #b3e5ff; color:#006c9c">Add to Parcel</el-button>
            <el-button v-if="row.itemStatus===1" size="small" @click="onAbandon(row)" style="background:#fff1f0; border:1px solid #ffb3b3; color:#a80000">Abandon</el-button>
            <el-button v-if="row.itemStatus===0" size="small" type="danger" @click="onDelete(row.itemId)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <!-- Detail Dialog reused from item page -->
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
          <el-col :span="12"><el-form-item label="CustomerFeedback"><div>{{ detailData.customerFeedback }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="IQCResult"><div>{{ detailData.iqcResult }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Unpacked"><div>{{ detailData.isUnpacked === 1 ? 'packed' : (detailData.isUnpacked === 0 ? 'unpacked' : '') }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="InspectFee"><div>{{ (Number(detailData.inspectFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="KeepFee"><div>{{ (Number(detailData.keepFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PackingFee"><div>{{ (Number(detailData.packingFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OtherFee"><div>{{ (Number(detailData.otherFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="TotalFee"><div>{{ ((Number(detailData.inspectFee)||0) + (Number(detailData.keepFee)||0) + (Number(detailData.packingFee)||0) + (Number(detailData.otherFee)||0)).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Paid"><div>{{ detailData.ispaid === 1 ? 'paid' : (detailData.ispaid === 0 ? 'unpaid' : '') }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="FeeRemarks"><div>{{ detailData.feeRemarks }}</div></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">Close</el-button>
      </template>
    </el-dialog>

    <!-- Split Dialog -->
    <el-dialog :model-value="splitVisible" title="Split Item" width="420px" @close="splitVisible=false">
      <div>Current Qty: {{ splitInfo.qty }}</div>
      <el-form>
        <el-form-item label="Split Qty">
          <el-input-number v-model="splitInfo.splitQty" :min="1" :max="splitInfo.qty-1" :precision="0" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="splitVisible=false">Cancel</el-button>
        <el-button type="primary" @click="confirmSplit">Confirm</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog (minimal, reused fields) -->
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="864px" @close="onDialogClose">
      <el-form :model="editing" label-width="132px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="ItemNo"><el-input v-model="editing.itemNo" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Owner"><el-input v-model="editing.owner" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Keeper"><el-select v-model="editing.keeperId" placeholder="Select Keeper">
            <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
          </el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="ReceivePackageNo"><el-input v-model="editing.receivePackageNo" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="ReceivedDate"><el-date-picker v-model="editing.receivedDate" type="date" placeholder="Received" style="width:100%" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="SendPackageNo"><el-input v-model="editing.sendPackageNo" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="SendDate"><el-date-picker v-model="editing.sendDate" type="date" placeholder="Send" style="width:100%" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Qty"><el-input-number v-model="editing.qty" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Status"><el-select v-model="editing.itemStatus" placeholder="Select status"><el-option label="Inspecting" :value="0" /><el-option label="Received" :value="1" /><el-option label="Sent" :value="2" /><el-option label="Unknown" :value="9" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Unpacked"><el-select v-model="editing.isUnpacked"><el-option label="unpacked" :value="0" /><el-option label="packed" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Paid"><el-select v-model="editing.isPaid"><el-option label="unpaid" :value="0" /><el-option label="paid" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OriginalOrder"><el-input v-model="editing.originalOrder" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OriginalReturnNo"><el-input v-model="editing.originalReturnNo" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="CustomerFeedback"><el-input type="textarea" v-model="editing.customerFeedback" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="Remark"><el-input type="textarea" v-model="editing.remark" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="onDialogClose">Cancel</el-button>
        <el-button type="primary" @click="saveItem">Save</el-button>
      </template>
    </el-dialog>

    <!-- Add to Parcel Dialog -->
    <ParcelDialog
      v-model:visible="parcelDialogVisible"
      :title="parcelDialogTitle"
      :parcel="parcelObj"
      :users="users"
      :status-list="statusList"
      :token="token"
      :upload-handlers="uploadHandlers"
      :get-full-image-url="getFullImageUrl"
      :image-manager="imageManager"
      :rules="{}"
      :packagetype="packagetype"
      :is-edit-mode="false"
      :get-user-by-id="getUserById"
      @update:visible="(v) => parcelDialogVisible = v"
      @save="handleParcelSave"
      @cancel="parcelDialogVisible = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryInfoApi, addApi, updateApi, deleteApi } from '@/api/item'
import { addApi as addParcelApi } from '@/api/parcel'
import ParcelDialog from '@/components/parcel/ParcelDialog.vue'
import { useFileUpload } from '@/composables/useFileUpload'
import { useUser } from '@/composables/useUser'

const { users, currentUser, getCurrentUser, queryAllUsers } = useUser()

const q = ref({ itemNo: '', sellerPart: '', mfrPart: '', ispaid: '', keeperId: null, receivePackageNo: '', sendPackageNo: '' })
const itemList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedMap = ref({}) // persistent selected rows across pages: { [itemId]: row }
const tableRef = ref(null)

const detailVisible = ref(false)
const detailData = ref({})
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editing = ref({})

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
      if (res && res.code === 1) { ElMessage.success('Saved'); dialogVisible.value = false; await fetchList() }
      else ElMessage.error(res.msg || 'Save failed')
    } else {
      const res = await addApi(payload)
      if (res && res.code === 1) { ElMessage.success('Added'); dialogVisible.value = false; await fetchList() }
      else ElMessage.error(res.msg || 'Add failed')
    }
  } catch (err) { ElMessage.error('Save failed') }
}

const onDialogClose = () => {
  dialogVisible.value = false
  editing.value = {}
}

const splitVisible = ref(false)
const splitInfo = ref({ itemId: null, qty: 0, splitQty: 1 })

// Parcel dialog state
const parcelDialogVisible = ref(false)
const parcelDialogTitle = ref('Add To Parcel')
const parcelObj = ref({})
const token = ref(getCurrentUser())
const packagetype = ref([
  { name: 'return from a customer', value: 1 },
  { name: 'warehouse to warehouse', value: 2 },
  { name: 'delivery to a customer', value: 3 }
])
const statusList = ref([
  { name: 'Planing', value: 0 },
  { name: 'inDelivery', value: 1 },
  { name: 'Received', value: 2 },
  { name: 'Exception', value: 9 }
])

const { uploadHandlers, getFullImageUrl, imageManager } = useFileUpload(parcelObj, token, currentUser)

const getToday = () => new Date().toISOString().split('T')[0]

const onAddToParcel = (row) => {
  if (!row) return
  // build minimal parcel object matching ParcelDialog expectations
  parcelObj.value = {
    packageNo: '',
    status: 0,
    processId: '',
    processDate: '',
    createDate: getToday(),
    ownerId: currentUser.value.userId || null,
    packageType: 3,
    demands: '',
    senderId: row.keeperId || null,
    sendDate: '',
    senderAddress: '',
    receiverId: null,
    receivedDate: '',
    receiverAddress: '',
    weight: '',
    size: '',
    imgBySender: '',
    imgByReceiver: '',
    label: '',
    packingList: [],
    itemList: [
      {
        ...row,
        itemImages: row.itemImages || [],
        _images: row._images || []
      }
    ]
  }
  parcelDialogTitle.value = 'Add To Parcel'
  parcelDialogVisible.value = true
}

const handleParcelSave = async () => {
  try {
    const p = { ...parcelObj.value }
    // normalize packingList (may be array of files or urls)
    p.packingList = p.packingList || []
    // normalize itemList images
    if (p.itemList && Array.isArray(p.itemList)) {
      p.itemList = p.itemList.map(item => ({
        ...item,
        itemImages: (item.itemImages && Array.isArray(item.itemImages)) ? item.itemImages.map(img => (typeof img === 'string' ? img : (img.url || img.path || img))) : []
      }))
    }

    const res = await addParcelApi(p)
    if (res && res.code === 1) {
      ElMessage.success('Parcel created')
      parcelDialogVisible.value = false
      await fetchList()
    } else {
      ElMessage.error(res.msg || 'Create parcel failed')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('Create parcel failed')
  }
}

const fetchList = async () => {
  const params = {
    page: currentPage.value,
    pageSize: pageSize.value,
    ownerId: currentUser.value.userId
  }
  if (q.value.itemNo) params.itemNo = q.value.itemNo
  if (q.value.sellerPart) params.sellerPart = q.value.sellerPart
  if (q.value.mfrPart) params.mfrPart = q.value.mfrPart
  if (q.value.keeperId) params.keeperId = q.value.keeperId
    if (q.value.ispaid !== '') params.ispaid = q.value.ispaid
  if (q.value.receivePackageNo) params.receivePackageNo = q.value.receivePackageNo
  if (q.value.sendPackageNo) params.sendPackageNo = q.value.sendPackageNo

  try {
    const res = await request.get('/items', { params })
    if (res && res.code === 1) {
      itemList.value = res.data?.rows || []
      // sort items client-side by itemNo, receivePackageNo, sendPackageNo
      itemList.value.sort((a, b) => {
        const i = (a.itemNo || '').localeCompare(b.itemNo || '')
        if (i !== 0) return i
        const r = (a.receivePackageNo || '').localeCompare(b.receivePackageNo || '')
        if (r !== 0) return r
        return (a.sendPackageNo || '').localeCompare(b.sendPackageNo || '')
      })
      total.value = res.data?.total || 0
      // restore selection for rows on this page if user previously selected them
      await restoreSelectionOnPage()
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
const onClear = async () => { q.value = { itemNo:'', sellerPart:'', mfrPart:'', ispaid:'', keeperId:null, receivePackageNo:'', sendPackageNo:'' }; await fetchList() }


const onSizeChange = (size) => { pageSize.value = size; fetchList() }
const onCurrentChange = (page) => { currentPage.value = page; fetchList() }

const onSelectionChange = (selection) => {
  // keep selections across pages: add selected rows, remove rows from current page that were unselected
  const currentPageIds = itemList.value.map(r => r.itemId)
  const selectedIdsOnPage = selection.map(s => s.itemId)

  // add newly selected rows from this page
  selection.forEach((row) => {
    if (row && row.itemId) selectedMap.value[row.itemId] = row
  })

  // remove rows from this page that are not currently selected
  currentPageIds.forEach((id) => {
    if (!selectedIdsOnPage.includes(id) && selectedMap.value[id]) {
      delete selectedMap.value[id]
    }
  })
}

const restoreSelectionOnPage = async () => {
  // after itemList is populated, re-select rows that were stored in selectedMap
  await nextTick()
  if (!tableRef.value) return
  itemList.value.forEach(row => {
    if (row && row.itemId && selectedMap.value[row.itemId]) {
      try { tableRef.value.toggleRowSelection(row, true) } catch (err) { /* ignore */ }
    }
  })
}

const onAddSelectedToParcel = () => {
  const ids = Object.keys(selectedMap.value || {})
  if (!ids || ids.length === 0) { ElMessage.error('No items selected'); return }
  const items = ids.map(id => selectedMap.value[id]).filter(Boolean)
  if (!items || items.length === 0) { ElMessage.error('No items selected'); return }
  // validate keeperId consistency
  const keeperId = items[0].keeperId
  const inconsistent = items.some(it => it.keeperId !== keeperId)
  if (inconsistent) {
    ElMessage.error('these items are not from a same keeper, please check.')
    return
  }

  // build parcel object with multiple items
  parcelObj.value = {
    packageNo: '',
    status: 0,
    processId: '',
    processDate: '',
    createDate: getToday(),
    ownerId: currentUser.value.userId || null,
    packageType: 3,
    demands: '',
    senderId: keeperId || null,
    sendDate: '',
    senderAddress: '',
    receiverId: null,
    receivedDate: '',
    receiverAddress: '',
    weight: '',
    size: '',
    imgBySender: '',
    imgByReceiver: '',
    label: '',
    packingList: [],
    itemList: items.map(row => ({ ...row, itemImages: row.itemImages || [], _images: row._images || [] }))
  }
  parcelDialogTitle.value = 'Add To Parcel'
  parcelDialogVisible.value = true
}

onMounted(async () => { getCurrentUser(); await queryAllUsers(); await fetchList() })

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
      const d = res.data || res
      // populate editing model
      editing.value = { ...d }
      editing.value.isPaid = d.ispaid == null ? 0 : d.ispaid
      editing.value.isUnpacked = d.isUnpacked == null ? 0 : d.isUnpacked
      editing.value.ownerId = currentUser.value.userId || d.ownerId || null
      editing.value.owner = currentUser.value.name || d.owner || ''
      editing.value.keeperId = d.keeperId || null
      dialogTitle.value = 'Edit Item'
      dialogVisible.value = true
    } else {
      ElMessage.error('Failed to load item')
    }
  } catch (err) { ElMessage.error('Failed to load item') }
}

const onDelete = async (id) => {
  try {
    await ElMessageBox.confirm('Confirm delete?','Warning')
    const res = await deleteApi(id)
    if (res && res.code === 1) { ElMessage.success('Deleted'); fetchList() }
    else ElMessage.error(res.msg || 'Delete failed')
  } catch (err) {}
}

const onAbandon = async (row) => {
  if (!row || !row.itemId) return
  if (!row.keeperId) { ElMessage.error('No keeper assigned'); return }
  try {
    await ElMessageBox.confirm('Abandon this item to keeper','Confirm', { confirmButtonText: 'Confirm', cancelButtonText: 'Cancel' })
    const payload = { itemId: row.itemId, ownerId: row.keeperId }
    const res = await updateApi(payload)
    if (res && res.code === 1) { ElMessage.success('Abandoned'); await fetchList() }
    else ElMessage.error(res.msg || 'Abandon failed')
  } catch (err) {
    // user cancelled or error
  }
}

// Split flow
const onSplit = (row) => {
  splitInfo.value = { itemId: row.itemId, qty: row.qty, splitQty: 1 }
  splitVisible.value = true
}

const confirmSplit = async () => {
  const info = splitInfo.value
  if (!info.splitQty || info.splitQty < 1 || info.splitQty >= info.qty) { ElMessage.error('Split Qty must be a positive integer less than current Qty'); return }
  try {
    // 1) update current item qty
    const updateRes = await updateApi({ itemId: info.itemId, qty: info.qty - info.splitQty })
    if (!(updateRes && updateRes.code === 1)) { ElMessage.error('Failed to update original item'); return }
    // 2) get original item data
    const res = await queryInfoApi(info.itemId)
    if (!(res && res.code === 1)) { ElMessage.error('Failed to read item'); return }
    const orig = res.data || res
    // build new item copying fields except the excluded ones
    const copy = { ...orig }
    delete copy.itemId
    delete copy.sendPackageNo
    delete copy.sendParcelId
    delete copy.inspectFee
    delete copy.keepFee
    delete copy.packingFee
    delete copy.otherFee
    delete copy.ispaid
    delete copy.feeRemarks
    // set qty to splitQty
    copy.qty = info.splitQty
    // now call addApi
    const addRes = await addApi(copy)
    if (addRes && addRes.code === 1) {
      ElMessage.success('Split successful')
      splitVisible.value = false
      splitInfo.value = { itemId: null, qty: 0, splitQty: 1 }
      await fetchList()
      // double-fetch to ensure backend write is visible in list
      await new Promise((r) => setTimeout(r, 300))
      await fetchList()
    } else {
      ElMessage.error(addRes.msg || 'Failed to create split item')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('Split failed')
  }
}

</script>

<style scoped>
.container { margin: 10px 0 }
</style>
