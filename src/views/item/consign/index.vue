<template>
  <div>
    <h1>{{ $t('menu.services.consignManagement') }}</h1>

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
        <el-select v-model="q.ispaid" :placeholder="$t('menu.item.fields.isPaid')" clearable style="width:120px">
          <el-option :label="$t('menu.item.paidStatus.all')" :value="''" />
          <el-option :label="$t('menu.item.paidStatus.unpaid')" :value="0" />
          <el-option :label="$t('menu.item.paidStatus.paid')" :value="1" />
        </el-select>
        <el-button type="primary" @click="onSearch">{{ $t('menu.item.buttons.search') }}</el-button>
        <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">{{ $t('menu.item.buttons.clear') }}</el-button>
        <el-button type="primary" @click="onCheckout">{{ $t('menu.item.buttons.checkout') }}</el-button>
      </div>
    </div>

    <ItemTable ref="tableRef" :data="itemList" :row-key="'itemId'" :selectable="true" :compute-stocklife="computeStocklife" :fixed-left="true" :compute-fee="computeConsignmentTotal" @selection-change="onSelectionChange">
      <template #beforeInspectFee>
        <el-table-column prop="commissionModel" :label="$t('menu.item.fields.commissionModel')" width="120">
          <template #default="{row}">{{ row.commissionModel === 1 ? $t('menu.item.commissionModel.options.proportion') : (row.commissionModel === 2 ? $t('menu.item.commissionModel.options.fixed') : '') }}</template>
        </el-table-column>
        <el-table-column prop="commissionSet" :label="$t('menu.item.fields.commissionSet')" width="120" align="right">
          <template #default="{row}">{{ formatFee(row.commissionSet) }}</template>
        </el-table-column>
        <el-table-column prop="market" :label="$t('menu.item.fields.market')" width="160">
          <template #default="{row}">{{ row.market }}</template>
        </el-table-column>
        <el-table-column prop="salePrice" :label="$t('menu.item.fields.salePrice')" width="120" align="right">
          <template #default="{row}">{{ formatFee(row.salePrice) }}</template>
        </el-table-column>
        <el-table-column prop="saleDate" :label="$t('menu.item.fields.saleDate')" width="120">
          <template #default="{row}">{{ formatYMD(row.saleDate) }}</template>
        </el-table-column>
      </template>

      <template #operation="{row}">
        <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">{{ $t('menu.item.actions.detail') }}</el-button>
        <el-button v-if="canOperateItem(row)" size="small" type="primary" @click="onEdit(row)">{{ $t('menu.item.actions.edit') }}</el-button>
        <el-button v-if="row.itemStatus===1 && canOperateItem(row)" size="small" @click="onAddToParcel(row)" style="background:#e6f7ff; border:1px solid #b3e5ff; color:#006c9c">{{ $t('menu.item.actions.addToParcel') }}</el-button>
      </template>
    </ItemTable>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <ItemDetail v-model:visible="detailVisible" :title="$t('menu.item.dialogs.itemDetail')" :detail-data="detailData" width="960px" label-width="154px">
      <template #default>
        <el-col :span="24"><el-form-item :label="$t('menu.item.fields.isConsigned')"><div>{{ detailData.isConsigned === 1 ? $t('menu.item.consignedStatus.yes') : $t('menu.item.consignedStatus.no') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.commissionModel')"><div>{{ detailData.commissionModel === 1 ? $t('menu.item.commissionModel.options.proportion') : (detailData.commissionModel === 2 ? $t('menu.item.commissionModel.options.fixed') : '') }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.commissionSet')"><div>{{ formatFee(detailData.commissionSet) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.market')"><div>{{ detailData.market }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.salePrice')"><div>{{ formatFee(detailData.salePrice) }}</div></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('menu.item.fields.saleDate')"><div>{{ detailData.saleDate }}</div></el-form-item></el-col>
      </template>
    </ItemDetail>

    <!-- Checkout Dialog for consign management -->
    <el-dialog :model-value="checkoutVisible" :title="$t('menu.item.dialogs.checkoutItems')" width="1350px" @close="checkoutVisible=false">
      <div>
        <el-table :data="checkoutItems" stripe style="min-width:820px" border>
          <el-table-column prop="itemNo" :label="$t('menu.item.fields.itemNo')" width="147" />
          <el-table-column prop="sellerPart" :label="$t('menu.item.fields.sellerPart')" width="220" />
          <el-table-column prop="itemStatus" :label="$t('menu.item.fields.status')" width="120">
            <template #default="{row}">
              <span v-if="row.itemStatus===0">{{ $t('menu.item.statuses.pending') }}</span>
              <span v-else-if="row.itemStatus===1">{{ $t('menu.item.statuses.received') }}</span>
              <span v-else-if="row.itemStatus===2">{{ $t('menu.item.statuses.sent') }}</span>
              <span v-else-if="row.itemStatus===9">{{ $t('menu.item.statuses.exception') }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="commissionModel" :label="$t('menu.item.fields.commissionModel')" width="120">
            <template #default="{row}">{{ row.commissionModel === 1 ? $t('menu.item.commissionModel.options.proportion') : (row.commissionModel === 2 ? $t('menu.item.commissionModel.options.fixed') : '') }}</template>
          </el-table-column>
          <el-table-column prop="commissionSet" :label="$t('menu.item.fields.commissionSet')" width="120" align="right">
            <template #default="{row}">{{ formatFee(row.commissionSet) }}</template>
          </el-table-column>
          <el-table-column prop="market" :label="$t('menu.item.fields.market')" width="160">
            <template #default="{row}">{{ row.market }}</template>
          </el-table-column>
          <el-table-column prop="saleDate" :label="$t('menu.item.fields.saleDate')" width="120">
            <template #default="{row}">{{ formatYMD(row.saleDate) }}</template>
          </el-table-column>
          <el-table-column prop="salePrice" :label="$t('menu.item.fields.salePrice')" width="120" align="right">
            <template #default="{row}">{{ formatFee(row.salePrice) }}</template>
          </el-table-column>
          <el-table-column prop="inspectFee" :label="$t('menu.item.fields.inspectFee')" width="132" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.inspectFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="repairFee" :label="$t('menu.item.fields.repairFee')" width="110" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.repairFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="keepFee" :label="$t('menu.item.fields.keepFee')" width="110" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.keepFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="packingFee" :label="$t('menu.item.fields.packingFee')" width="110" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.packingFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="otherFee" :label="$t('menu.item.fields.otherFee')" width="110" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.otherFee) }}</div></template>
          </el-table-column>
          <el-table-column :label="$t('menu.item.fields.commissionFee')" width="120" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(computeCommissionFee(row)) }}</div></template>
          </el-table-column>
          <el-table-column :label="$t('menu.item.fields.totalFee')" width="120" align="right">
            <template #default="{row}"><div style="text-align:right;font-weight:600">{{ formatFee(Math.abs(computeConsignmentTotal(row))) }}</div></template>
          </el-table-column>
          <el-table-column prop="ispaid" :label="$t('menu.item.fields.isPaid')" width="100">
            <template #default="{row}">
              <span :style="{ color: row.ispaid === 1 ? 'red' : '' }">{{ row.ispaid === 1 ? $t('menu.item.paidStatus.paid') : (row.ispaid === 0 ? $t('menu.item.paidStatus.unpaid') : '') }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
          <div><strong>{{ $t('menu.item.dialogs.totalItems') }}:</strong> {{ checkoutCount }}</div>
          <div><strong>{{ $t('menu.item.dialogs.amount') }}:</strong> <span style="font-weight:600">{{ formatFee(checkoutAmount) }}</span></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="checkoutVisible=false">{{ $t('menu.item.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="confirmCheckout">{{ $t('menu.item.buttons.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog (consign-specific) -->
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="864px" @close="onDialogClose">
      <el-form :model="editing" label-width="132px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.itemNo')"><el-input v-model="editing.itemNo" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.owner')"><el-input v-model="editing.owner" disabled /></el-form-item></el-col>

          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isConsigned')"><el-input v-model="editing.isConsigned" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.commissionModel')"><el-input v-model="editing.commissionModel" disabled /></el-form-item></el-col>

          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.commissionSet')"><el-input-number v-model="editing.commissionSet" :precision="2" style="width:100%" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.market')"><el-input v-model="editing.market" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.salePrice')"><el-input-number v-model="editing.salePrice" :precision="2" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.saleDate')"><el-date-picker v-model="editing.saleDate" type="date" style="width:100%" /></el-form-item></el-col>

          <!-- reuse many of the fields from item edit, but avoid changing unrelated fields -->
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="onDialogClose">{{ $t('menu.item.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="saveItem">{{ $t('menu.item.buttons.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Parcel Dialog (reuse) -->
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

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import request from '@/utils/request'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryInfoApi, addApi, updateApi } from '@/api/item'
import ItemTable from '@/components/common/ItemTable.vue'
import ItemDetail from '@/components/common/ItemDetail.vue'
import ParcelDialog from '@/components/parcel/ParcelDialog.vue'
import { useUser } from '@/composables/useUser'
import { useItemsList } from '@/composables/useItemsList'
import { findByGroupApi } from '@/api/dict'
import { formatFee, computeConsignmentTotal, computeCommissionFee } from '@/utils/fees'
import { addApi as addParcelApi, queryPageApi as queryParcelPageApi } from '@/api/parcel'
import { useFileUpload } from '@/composables/useFileUpload'

const { users, currentUser, getCurrentUser, queryAllUsers, getUserById } = useUser()
const { t } = useI18n()

// Checkout state
const checkoutVisible = ref(false)
const checkoutItems = ref([])
const checkoutCount = computed(() => checkoutItems.value.length)
const checkoutAmount = computed(() => {
  return (checkoutItems.value || []).reduce((sum, row) => sum + Math.abs(computeConsignmentTotal(row) || 0), 0)
})

// getToday defined below for parcel and other flows

const onCheckout = () => {
  const ids = Object.keys(selectedMap.value || {})
  if (!ids || ids.length === 0) { ElMessage.error('No items selected'); return }
  const items = ids.map(id => selectedMap.value[id]).filter(Boolean)
  if (!items || items.length === 0) { ElMessage.error('No items selected'); return }
  // Only allow checkout for consigned items in this page; ensure all selected are consigned
  const notConsigned = items.some(it => !(it.isConsigned === 1 || it.isConsigned === '1'))
  if (notConsigned) { ElMessage.error('Please only select consigned items'); return }
  checkoutItems.value = items.map(it => ({ ...it }))
  checkoutVisible.value = true
}

const confirmCheckout = async () => {
  const items = checkoutItems.value || []
  if (!items.length) { ElMessage.info('No items to checkout'); return }
  try {
    const resArr = await Promise.all(items.map(it => updateApi({ itemId: it.itemId, paymentDate: getToday(), ispaid: 1 })))
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
} = useItemsList({ initialQ: { itemNo: '', dictId: '', sellerPart: '', ownerId: '', receivePackageNo: '', sendPackageNo: '', itemStatus: 1, ispaid: '', isConsigned: 1 }, getFixedParams: () => ({ keeperId: currentUser.value.userId }) })

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

const restoreSelectionOnPage = async () => { await nextTick(); if (!tableRef.value) return; itemList.value.forEach(row => { if (row && row.itemId && selectedMap.value[row.itemId]) { try { tableRef.value.toggleRowSelection(row, true) } catch (e) {} } }) }

// detail/edit state
const detailVisible = ref(false)
const detailData = ref({})
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editing = ref({})

const canOperateItem = (row) => {
  const uid = currentUser.value?.userId
  if (!row) return false
  return String(uid) === String(row.keeperId)
}

const viewDetail = async (row) => {
  if (!row || !row.itemId) return
  const res = await queryInfoApi(row.itemId)
  const data = (res && res.code === 1) ? (res.data || res) : row
  detailData.value = data
  detailVisible.value = true
}

const onEdit = async (row) => {
  if (!row || !row.itemId) return
  const res = await queryInfoApi(row.itemId)
  const data = (res && res.code === 1) ? (res.data || res) : row
  editing.value = { ...data }
  dialogTitle.value = t('menu.item.dialogs.editItem')
  dialogVisible.value = true
}

const onDialogClose = () => { dialogVisible.value = false; editing.value = {} }

const saveItem = async () => {
  try {
    const payload = { ...editing.value }
    const res = await updateApi(payload)
    if (res && res.code === 1) { ElMessage.success('Saved'); dialogVisible.value = false; await fetchList() }
    else ElMessage.error(res.msg || 'Save failed')
  } catch (err) { console.error(err); ElMessage.error('Save failed') }
}

// Parcel support (reuse code from ownerInventory)
const parcelDialogVisible = ref(false)
const parcelDialogTitle = ref('Add To Parcel')
const parcelObj = ref({})
const token = ref(getCurrentUser())
const packagetype = ref([{ name: 'return from a customer', value: 1 },{ name: 'warehouse to warehouse', value: 2 },{ name: 'delivery to a customer', value: 3 }])
const statusList = ref([{ name: 'Planing', value: 0 },{ name: 'inDelivery', value: 1 },{ name: 'Received', value: 2 },{ name: 'Closed', value: 4 },{ name: 'Exception', value: 9 }])
const { uploadHandlers, getFullImageUrl, imageManager } = useFileUpload(parcelObj, token, currentUser)

const onAddToParcel = (row) => {
  if (!row) return
  // Use the item's owner if available so Owner field shows the item's owner name
  const ownerIdFromItem = row.ownerId || row.ownerId === 0 ? row.ownerId : null
  parcelObj.value = {
    packageNo: '',
    status: 0,
    processId: '',
    processDate: '',
    createDate: new Date().toISOString().split('T')[0],
    ownerId: ownerIdFromItem || currentUser.value.userId || null,
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
    itemList: [ { ...row, itemImages: row.itemImages || [], _images: row._images || [] } ]
  }
  parcelDialogTitle.value = 'Add To Parcel'
  parcelDialogVisible.value = true
}

const getToday = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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
        const qRes = await queryParcelPageApi(p.packageNo)
        const exists = qRes && qRes.code === 1 && Array.isArray(qRes.data?.rows) && qRes.data.rows.length > 0
        if (exists) {
          const existingParcel = qRes.data.rows[0]
          try {
            await ElMessageBox.confirm(`this parcel (package no ${p.packageNo}) is exisiting, do you want add the following items to this parcel?`, 'Confirm', { confirmButtonText: 'Yes', cancelButtonText: 'No', type: 'warning' })
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
            return
          }
        }
      } catch (err) {
        console.error('Failed to query parcel by packageNo', err)
      }
    }

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

const formatYMD = (v) => { if (!v) return ''; try { const d = new Date(v); if (isNaN(d)) return String(v).slice(0,10); return d.toISOString().slice(0,10) } catch (e) { return String(v).slice(0,10) } }

onMounted(async () => { await getCurrentUser(); await queryAllUsers(); await loadDictOptions(); await fetchList() })

</script>

<style scoped>
</style>
