<template>
  <div>
    <h1>物主库存</h1>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:8px; align-items:center;">
      <el-input v-model="q.itemNo" placeholder="ItemNo" style="width:200px" />
      <el-select v-model="q.dictId" placeholder="Category" clearable style="width:180px">
        <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
      </el-select>
      <el-input v-model="q.sellerPart" placeholder="Seller Part" style="width:220px" />
      <el-input v-model="q.mfrPart" placeholder="Manufacturer Part" style="width:220px" />
      <el-input v-model="q.receivePackageNo" placeholder="ReceivePackageNo" style="width:200px" />
      <el-input v-model="q.sendPackageNo" placeholder="SendPackageNo" style="width:200px" />
      <el-input v-model="q.minStocklife" placeholder="Stocklife>" type="number" style="width:140px" />
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
        <el-select v-model="q.ispaid" placeholder="Paid" clearable style="width:120px">
          <el-option label="All" :value="''" />
        <el-option label="Unpaid" :value="0" />
        <el-option label="Paid" :value="1" />
      </el-select>
      <el-button type="primary" @click="onSearch">Search</el-button>
      <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">Clear</el-button>
      <el-button type="info" @click="onAddSelectedToParcel" style="background:#e6f7ff; border:1px solid #b3e5ff; color:#006c9c">Add Parcel</el-button>
      <el-button type="primary" @click="onCheckout" style="margin-left:6px">Checkout</el-button>
    </div>

    <ItemTable ref="tableRef" :data="itemList" :row-key="'itemId'" :selectable="true" :compute-stocklife="computeStocklife" :fixed-left="true" @selection-change="onSelectionChange">
      <template #operation="{row}">
        <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">Detail</el-button>
        <el-button v-if="row.itemStatus===0" size="small" type="primary" @click="onEdit(row)">Edit</el-button>
        <el-button v-if="row.itemStatus===1 && row.qty>1" size="small" @click="onSplit(row)" style="background:#fff7e6; border:1px solid #ffd966; color:#7a5a00">Split</el-button>
        <el-button v-if="row.itemStatus===1" size="small" @click="onAddToParcel(row)" style="background:#e6f7ff; border:1px solid #b3e5ff; color:#006c9c">Add to Parcel</el-button>
        <el-button v-if="row.itemStatus===1" size="small" @click="onAbandon(row)" style="background:#fff1f0; border:1px solid #ffb3b3; color:#a80000">Abandon</el-button>
        <el-button v-if="row.itemStatus===0" size="small" type="danger" @click="onDelete(row.itemId)">Delete</el-button>
      </template>
    </ItemTable>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <ItemDetail v-model="detailVisible" title="Item Detail" :detail-data="detailData" width="960px" label-width="154px">
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">Close</el-button>
      </template>
    </ItemDetail>

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
          <el-col :span="12"><el-form-item label="Unpacked"><el-select v-model="editing.isUnpacked"><el-option label="packed" :value="0" /><el-option label="unpacked" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="isGood"><el-select v-model="editing.isGood"><el-option label="bad" :value="0" /><el-option label="good" :value="1" /></el-select></el-form-item></el-col>
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
      :current-user="currentUser"
      @update:visible="(v) => parcelDialogVisible = v"
      @save="handleParcelSave"
      @cancel="parcelDialogVisible = false"
    />

    <!-- Checkout Dialog -->
    <el-dialog :model-value="checkoutVisible" title="Checkout Items" width="1350px" @close="checkoutVisible=false">
      <div>
        <el-table :data="checkoutItems" stripe style="min-width:820px" border>
          <el-table-column prop="itemNo" label="ItemNo" width="140" />
          <el-table-column prop="sellerPart" label="SellerPart" width="220" />
          <el-table-column prop="itemStatus" label="Status" width="120">
            <template #default="{row}">
              <span v-if="row.itemStatus===0">Inspecting</span>
              <span v-else-if="row.itemStatus===1">Received</span>
              <span v-else-if="row.itemStatus===2">Sent</span>
              <span v-else-if="row.itemStatus===9">Exception</span>
            </template>
          </el-table-column>
          <el-table-column prop="inspectFee" label="InspectFee" width="110">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.inspectFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="repairFee" label="RepairFee" width="110">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.repairFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="keepFee" label="KeepFee" width="110">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.keepFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="packingFee" label="PackingFee" width="110">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.packingFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="otherFee" label="OtherFee" width="110">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.otherFee) }}</div></template>
          </el-table-column>
          <el-table-column label="TotalFee" width="120">
            <template #default="{row}"><div style="text-align:right;font-weight:600">{{ formatFee(computeTotalFee(row)) }}</div></template>
          </el-table-column>
          <el-table-column prop="ispaid" label="Paid" width="100">
            <template #default="{row}">
              <span :style="{ color: row.ispaid === 1 ? 'red' : '' }">{{ row.ispaid === 1 ? 'paid' : (row.ispaid === 0 ? 'unpaid' : '') }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
          <div><strong>Total Items:</strong> {{ checkoutCount }}</div>
          <div><strong>Amount:</strong> <span style="font-weight:600">{{ formatFee(checkoutAmount) }}</span></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="checkoutVisible=false">Cancel</el-button>
        <el-button type="primary" @click="confirmCheckout">Confirm</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryInfoApi, addApi, updateApi, deleteApi } from '@/api/item'
import { findByGroupApi } from '@/api/dict'
import { addApi as addParcelApi, queryPageApi } from '@/api/parcel'
import ParcelDialog from '@/components/parcel/ParcelDialog.vue'
import ItemDetail from '@/components/common/ItemDetail.vue'
import ItemTable from '@/components/common/ItemTable.vue'
import { formatFee, computeTotalFee } from '@/utils/fees'
import { useItemActions } from '@/composables/useItemActions'
import { useFileUpload } from '@/composables/useFileUpload'
import { useUser } from '@/composables/useUser'
import { useItemsList } from '@/composables/useItemsList'

const { users, currentUser, getCurrentUser, queryAllUsers, getUserById, getUserName } = useUser()

const {
  q,
  itemList,
  total,
  currentPage,
  pageSize,
  fetchList,
  onSearch,
  onClear,
  onSizeChange,
  onCurrentChange,
  computeStocklife
} = useItemsList({
  initialQ: { itemNo: '', sellerPart: '', mfrPart: '', ispaid: '', itemStatus: '', keeperId: null, receivePackageNo: '', sendPackageNo: '', minStocklife: null, dictId: '' },
  getFixedParams: () => ({ ownerId: currentUser.value.userId })
})

const dictOptions = ref([])

const loadDictOptions = async () => {
  try {
    let res = await findByGroupApi('Hardware')
    let list = []
    if (res && res.code === 1) list = res.data || []
    else if (Array.isArray(res)) list = res
    if ((!list || list.length === 0)) {
      const res2 = await findByGroupApi(2)
      if (res2 && res2.code === 1) list = res2.data || []
      else if (Array.isArray(res2)) list = res2
    }
    dictOptions.value = (list || []).map(d => ({ dictId: d.dictId ?? d.id ?? d.value, dictName: d.dictName ?? d.name ?? d.label }))
  } catch (err) {
    console.error('loadDictOptions error', err)
    dictOptions.value = []
  }
}

const {
  editing,
  detailData,
  detailVisible,
  dialogVisible,
  dialogTitle,
  viewDetail,
  onEdit,
  saveItem,
  onDelete
} = useItemActions({ fetchList, currentUser, getUserName })
const selectedMap = ref({}) // persistent selected rows across pages: { [itemId]: row }
const tableRef = ref(null)

// Checkout UI state
const checkoutVisible = ref(false)
const checkoutItems = ref([])
const checkoutCount = computed(() => checkoutItems.value.length)
const checkoutAmount = computed(() => {
  return (checkoutItems.value || []).reduce((sum, row) => {
    const total = computeTotalFee(row)
    return sum + total
  }, 0)
})

// item editing/detail handlers provided by useItemActions

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
    p.packingList = p.packingList || []

    const itemsForUpdate = (p.itemList && Array.isArray(p.itemList))
      ? p.itemList.map(item => ({
          ...item,
          itemImages: (item.itemImages && Array.isArray(item.itemImages))
            ? item.itemImages.map(img => (typeof img === 'string' ? img : (img.url || img.path || img)))
            : []
        }))
      : []

    if (p.packageType === 3) delete p.itemList
    else if (itemsForUpdate.length > 0) p.itemList = itemsForUpdate

    // If user provided a packageNo, check whether such parcel already exists
    if (p.packageNo) {
      try {
        const qRes = await queryPageApi(p.packageNo)
        const exists = qRes && qRes.code === 1 && Array.isArray(qRes.data?.rows) && qRes.data.rows.length > 0
        if (exists) {
          const existingParcel = qRes.data.rows[0]
          try {
            await ElMessageBox.confirm(`this parcel (package no ${p.packageNo}) is exisiting, do you want add the following items to this parcel?`, 'Confirm', { confirmButtonText: 'Yes', cancelButtonText: 'No', type: 'warning' })
            // User confirmed: do NOT create a new parcel, only update items to reference existing parcel
            const parcelId = existingParcel.parcelId || existingParcel.id || existingParcel
            if (itemsForUpdate.length > 0) {
              try {
                await Promise.all(itemsForUpdate.map(it => updateApi({ itemId: it.itemId, sendParcelId: parcelId, sendDate: getToday(), itemStatus: 2 })))
                ElMessage.success('Items updated to existing parcel')
              } catch (err) {
                console.error('Failed to update items to existing parcel', err)
                ElMessage.error('Failed to update items to existing parcel')
              }
            }
            parcelDialogVisible.value = false
            await fetchList()
            return
          } catch (err) {
            // user cancelled the confirm dialog, abort save
            return
          }
        }
      } catch (err) {
        console.error('Failed to query parcel by packageNo', err)
        // fallthrough to normal create flow
      }
    }

    // proceed to create parcel as normal
    const res = await addParcelApi(p)
    if (res && res.code === 1) {
      ElMessage.success('Parcel created')
      const parcelId = res.data?.parcelId || res.data?.id || res.data
      if (parcelObj.value.packageType === 3 && parcelId && itemsForUpdate.length > 0) {
        try {
          await Promise.all(itemsForUpdate.map(it => updateApi({ itemId: it.itemId, sendParcelId: parcelId, sendDate: getToday(), itemStatus: 2 })))
        } catch (err) {
          console.error('Failed to update items after parcel save', err)
          ElMessage.error('Parcel saved but failed to update items')
        }
      }
      parcelDialogVisible.value = false
      await fetchList()
    } else {
      ElMessage.error(res.msg || 'Failed to create parcel')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('Failed to create parcel')
  }
}

// fetchList/onSearch/onClear/onSizeChange/onCurrentChange provided by useItemsList

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
  // validate all selected items are in Received status (itemStatus === 1)
  const notInStock = items.some(it => it.itemStatus !== 1)
  if (notInStock) {
    ElMessage.error('one of these items is not in stock, cannot be added in a parcel.')
    return
  }
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

const onCheckout = () => {
  const ids = Object.keys(selectedMap.value || {})
  if (!ids || ids.length === 0) { ElMessage.error('No items selected'); return }
  const items = ids.map(id => selectedMap.value[id]).filter(Boolean)
  if (!items || items.length === 0) { ElMessage.error('No items selected'); return }
  // prepare items for display (ensure numeric fee strings preserved)
  checkoutItems.value = items.map(it => ({ ...it }))
  checkoutVisible.value = true
}

const confirmCheckout = async () => {
  const items = checkoutItems.value || []
  if (!items.length) { ElMessage.info('No items to checkout'); return }
  try {
    const resArr = await Promise.all(items.map(it => updateApi({ itemId: it.itemId, ispaid: 1, paymentDate: getToday() })))
    const failed = resArr.some(r => !(r && r.code === 1))
    if (failed) { ElMessage.error('Some items failed to update'); return }
    ElMessage.success('Checkout successful')
    // remove updated items from selection map
    items.forEach(it => { if (selectedMap.value[it.itemId]) delete selectedMap.value[it.itemId] })
    checkoutVisible.value = false
    checkoutItems.value = []
    await fetchList()
  } catch (err) {
    console.error(err)
    ElMessage.error('Checkout failed')
  }
}

onMounted(async () => { getCurrentUser(); await queryAllUsers(); await fetchList(); await loadDictOptions() })

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
    delete copy.paymentDate
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

// computeStocklife provided by useItemsList

</script>

<style scoped>
.container { margin: 10px 0 }

/* Ensure fixed-right table area can show overflow (buttons won't be clipped) */
/* keep default scrolling and fixed column behavior (match warehouseInventory) */
</style>
