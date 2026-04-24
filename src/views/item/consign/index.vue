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
        <el-button v-if="row.itemStatus===1 && row.qty>1 && canOperateItem(row)" size="small" @click="onSplit(row)" style="background:#fff7e6; border:1px solid #ffd966; color:#7a5a00">{{ $t('menu.item.actions.split') }}</el-button>
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

    <!-- Split Dialog -->
    <el-dialog :model-value="splitVisible" :title="$t('menu.item.dialogs.splitItem')" width="420px" @close="splitVisible=false">
      <div>{{ $t('menu.item.dialogs.currentQty') }}: {{ splitInfo.qty }}</div>
      <el-form>
        <el-form-item :label="$t('menu.item.dialogs.splitQty')">
          <el-input-number v-model="splitInfo.splitQty" :min="1" :max="splitInfo.qty-1" :precision="0" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="splitVisible=false">{{ $t('menu.item.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="confirmSplit">{{ $t('menu.item.buttons.confirm') }}</el-button>
      </template>
    </el-dialog>

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

          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isConsigned')"><div>{{ editing.isConsigned === 1 || editing.isConsigned === '1' ? $t('menu.item.consignedStatus.yes') : $t('menu.item.consignedStatus.no') }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.commissionModel')"><div>{{ editing.commissionModel === 1 ? $t('menu.item.commissionModel.options.proportion') : (editing.commissionModel === 2 ? $t('menu.item.commissionModel.options.fixed') : '') }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.commissionSet')"><el-input-number v-model="editing.commissionSet" :precision="2" style="width:100%" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.market')"><el-input v-model="editing.market" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.salePrice')"><el-input-number v-model="editing.salePrice" :precision="2" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.saleDate')"><el-date-picker v-model="editing.saleDate" type="date" style="width:100%" /></el-form-item></el-col>

          <!-- reuse many of the fields from item edit, but avoid changing unrelated fields -->
        </el-row>
      </el-form>

    <!-- SimpleConsignParcelDialog moved below to avoid nesting inside edit dialog -->
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
      :is-paid-list="isPaidList"
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

    <SimpleConsignParcelDialog
      v-model:visible="simpleParcelVisible"
      :title="simpleParcelTitle"
      :parcel="parcelObj"
      :items="simpleParcelItems"
      :owner-name="simpleParcelOwnerName"
      @update:visible="(v) => simpleParcelVisible = v"
      @save="handleSimpleSave"
      @send="handleSimpleSend"
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
import SimpleConsignParcelDialog from '@/components/parcel/SimpleConsignParcelDialog.vue'
import { useUser } from '@/composables/useUser'
import { useItemsList } from '@/composables/useItemsList'
import { findByGroupApi } from '@/api/dict'
import { formatFee, computeConsignmentTotal, computeCommissionFee } from '@/utils/fees'
import { addApi as addParcelApi, queryPageApi as queryParcelPageApi, queryInfoApi as queryParcelInfoApi, updateApi as updateParcelApi } from '@/api/parcel'
import { useFileUpload } from '@/composables/useFileUpload'

const { users, currentUser, getCurrentUser, queryAllUsers, getUserById } = useUser()
const { t } = useI18n()

const isPaidList = computed(() => [
  { name: t('menu.item.paidStatus.unpaid'), value: 0 },
  { name: t('menu.item.paidStatus.paid'), value: 1 }
])

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

// Split state
const splitVisible = ref(false)
const splitInfo = ref({ itemId: null, qty: 0, splitQty: 1 })

const onSplit = (row) => {
  splitInfo.value = { itemId: row.itemId, qty: row.qty, splitQty: 1 }
  splitVisible.value = true
}

const confirmSplit = async () => {
  const info = splitInfo.value
  if (!info.splitQty || info.splitQty < 1 || info.splitQty >= info.qty) { ElMessage.error('Split Qty must be a positive integer less than current Qty'); return }
  try {
    const updateRes = await updateApi({ itemId: info.itemId, qty: info.qty - info.splitQty })
    if (!(updateRes && updateRes.code === 1)) { ElMessage.error('Failed to update original item'); return }
    const res = await queryInfoApi(info.itemId)
    if (!(res && res.code === 1)) { ElMessage.error('Failed to read item'); return }
    const orig = res.data || res
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
    copy.qty = info.splitQty
    if (orig.slot) copy.slot = orig.slot
    copy.dictId = orig.dictId
    copy.isGood = orig.isGood
    // copy consign-related fields so split item preserves consign settings
    copy.isConsigned = orig.isConsigned
    copy.commissionModel = orig.commissionModel
    copy.commissionSet = orig.commissionSet
    copy.market = orig.market
    if (copy.ispaid == null) copy.ispaid = 0
    if (copy.isPaid == null) copy.isPaid = 0
    const addRes = await addApi(copy)
    if (addRes && addRes.code === 1) {
      ElMessage.success('Split successful')
      splitVisible.value = false
      splitInfo.value = { itemId: null, qty: 0, splitQty: 1 }
      await fetchList()
      await new Promise((r) => setTimeout(r, 300))
      await fetchList()
    } else {
      ElMessage.error(addRes.msg || 'Failed to create split item')
    }
  } catch (err) { console.error(err); ElMessage.error('Split failed') }
}

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

const onAddToParcel = async (row) => {
  if (!row) return
  console.debug('onAddToParcel called', row)
  // If item already has a sendParcelId, load that parcel and its items for editing
  const parcelId = row.sendParcelId || row.sendparcelid || row.sendparcel || null
  if (parcelId) {
    try {
      const pRes = await queryParcelInfoApi(parcelId)
      if (pRes && pRes.code === 1) {
        parcelObj.value = { ...(pRes.data || pRes) }
      } else if (pRes && pRes.parcelId) {
        parcelObj.value = { ...(pRes || {}) }
      } else {
        // fallback: create new parcel template but keep owner from item
        const ownerIdFromItem = row.ownerId || row.owner || null
        parcelObj.value = {
          packageNo: '', status: 0, createDate: new Date().toISOString().split('T')[0], ownerId: ownerIdFromItem || currentUser.value.userId || null,
          packageType: 3, weight: '', size: '', senderId: currentUser.value?.userId || null, senderName: currentUser.value?.name || '', sendDate: '', senderAddress: [currentUser.value?.address, currentUser.value?.zipcode, currentUser.value?.phone].filter(Boolean).join(' ') || '', receiverName: '', receivedDate: '', receiverAddress: '', remark: ''
        }
      }

      // fetch items that belong to this parcel (use existing request helper)
      try {
        const itemsRes = await request.get('/items', { params: { sendParcelId: parcelId, pageSize: 1000 } })
        if (itemsRes && itemsRes.code === 1) {
          simpleParcelItems.value = (itemsRes.data?.rows || []).map(it => ({ ...it }))
        } else {
          simpleParcelItems.value = [{ ...row }]
        }
      } catch (err) {
        console.error('failed to fetch items for parcel', err)
        simpleParcelItems.value = [{ ...row }]
      }

      simpleParcelOwnerName.value = (users.value.find(u => (u.userId||u.id) == parcelObj.value.ownerId) || {}).name || ''
      simpleParcelTitle.value = 'Edit Parcel'
      simpleParcelVisible.value = true
      return
    } catch (err) {
      console.error('failed to load parcel info', err)
      // fallthrough to create new parcel
    }
  }

  // Open simplified consign parcel dialog to create a new parcel
  const ownerIdFromItem = row.ownerId || row.ownerId === 0 ? row.ownerId : null
  parcelObj.value = {
    packageNo: '',
    status: 0,
    createDate: new Date().toISOString().split('T')[0],
    ownerId: ownerIdFromItem || currentUser.value.userId || null,
    packageType: 3,
    weight: '',
    size: '',
    senderId: currentUser.value?.userId || null,
    senderName: currentUser.value?.name || '',
    sendDate: '',
    senderAddress: [currentUser.value?.address, currentUser.value?.zipcode, currentUser.value?.phone].filter(Boolean).join(' ') || '',
    receiverName: '',
    receivedDate: '',
    receiverAddress: '',
    remark: ''
  }
  simpleParcelItems.value = [ { ...row } ]
  simpleParcelOwnerName.value = (users.value.find(u => (u.userId||u.id) == parcelObj.value.ownerId) || {}).name || ''
  simpleParcelTitle.value = 'Add To Parcel'
  simpleParcelVisible.value = true
  console.debug('simpleParcelVisible set true')
}

// Simple consign parcel state
const simpleParcelVisible = ref(false)
const simpleParcelTitle = ref('')
const simpleParcelItems = ref([])
const simpleParcelOwnerName = ref('')

async function handleSimpleSave({ parcel, items }) {
  try {
    const p = { ...parcel }
    p.packingList = p.packingList || []

    // If parcel has an id, update it instead of creating
    if (p.parcelId || p.id) {
      try {
        const upRes = await updateParcelApi(p)
        if (upRes && upRes.code === 1) {
          const parcelId = p.parcelId || p.id
          if (items && items.length > 0) {
            await Promise.all(items.map(it => updateApi({
              itemId: it.itemId,
              sendParcelId: parcelId,
              sendDate: it.sendDate || p.sendDate || getToday(),
              // persist consign/fee fields when saving
              salePrice: it.salePrice,
              saleDate: it.saleDate,
              inspectFee: it.inspectFee,
              repairFee: it.repairFee,
              keepFee: it.keepFee,
              packingFee: it.packingFee,
              otherFee: it.otherFee,
              commissionModel: it.commissionModel,
              commissionSet: it.commissionSet,
              market: it.market
            })))
          }
          ElMessage.success('Parcel updated')
          simpleParcelVisible.value = false
          await fetchList()
          return
        } else {
          ElMessage.error(upRes.msg || 'Failed to update parcel')
          return
        }
      } catch (err) {
        console.error('update parcel failed', err)
        ElMessage.error('Failed to update parcel')
        return
      }
    }

    // otherwise create a new parcel
    const res = await addParcelApi(p)
    if (res && res.code === 1) {
      const parcelId = res.data?.parcelId || res.data?.id || res.data
      // update items to attach parcelId and persist consign/fee fields
      if (items && items.length > 0) {
        await Promise.all(items.map(it => updateApi({
          itemId: it.itemId,
          sendParcelId: parcelId,
          sendDate: it.sendDate || p.sendDate || getToday(),
          // persist consign/fee fields when creating parcel
          salePrice: it.salePrice,
          saleDate: it.saleDate,
          inspectFee: it.inspectFee,
          repairFee: it.repairFee,
          keepFee: it.keepFee,
          packingFee: it.packingFee,
          otherFee: it.otherFee,
          commissionModel: it.commissionModel,
          commissionSet: it.commissionSet,
          market: it.market
        })))
      }
      ElMessage.success('Saved')
      simpleParcelVisible.value = false
      await fetchList()
    } else {
      ElMessage.error(res.msg || 'Failed to save parcel')
    }
  } catch (err) { console.error(err); ElMessage.error('Save failed') }
}

async function handleSimpleSend({ parcel, items }) {
  try {
    const p = { ...parcel, status: 1 }

    // update existing parcel if present
    if (p.parcelId || p.id) {
      try {
        const upRes = await updateParcelApi(p)
        if (upRes && upRes.code === 1) {
          const parcelId = p.parcelId || p.id
          if (items && items.length > 0) {
            await Promise.all(items.map(it => updateApi({
              itemId: it.itemId,
              sendParcelId: parcelId,
              sendDate: it.sendDate || p.sendDate || getToday(),
              itemStatus: 2,
              // persist consign/fee fields when sending
              salePrice: it.salePrice,
              saleDate: it.saleDate,
              inspectFee: it.inspectFee,
              repairFee: it.repairFee,
              keepFee: it.keepFee,
              packingFee: it.packingFee,
              otherFee: it.otherFee,
              commissionModel: it.commissionModel,
              commissionSet: it.commissionSet,
              market: it.market
            })))
          }
          ElMessage.success('Sent')
          simpleParcelVisible.value = false
          await fetchList()
          return
        } else {
          ElMessage.error(upRes.msg || 'Failed to update parcel')
          return
        }
      } catch (err) {
        console.error('update parcel failed', err)
        ElMessage.error('Failed to send parcel')
        return
      }
    }

    // otherwise create new parcel and mark sent
    const res = await addParcelApi(p)
    if (res && res.code === 1) {
      const parcelId = res.data?.parcelId || res.data?.id || res.data
      if (items && items.length > 0) {
        await Promise.all(items.map(it => updateApi({
          itemId: it.itemId,
          sendParcelId: parcelId,
          sendDate: it.sendDate || p.sendDate || getToday(),
          itemStatus: 2,
          // persist consign/fee fields when creating and sending parcel
          salePrice: it.salePrice,
          saleDate: it.saleDate,
          inspectFee: it.inspectFee,
          repairFee: it.repairFee,
          keepFee: it.keepFee,
          packingFee: it.packingFee,
          otherFee: it.otherFee,
          commissionModel: it.commissionModel,
          commissionSet: it.commissionSet,
          market: it.market
        })))
      }
      ElMessage.success('Sent')
      simpleParcelVisible.value = false
      await fetchList()
    } else {
      ElMessage.error(res.msg || 'Failed to send parcel')
    }
  } catch (err) { console.error(err); ElMessage.error('Send failed') }
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
          await Promise.all(itemsForUpdate.map(it => updateApi({
            itemId: it.itemId,
            sendParcelId: parcelId,
            sendDate: getToday(),
            itemStatus: 2,
            salePrice: it.salePrice,
            saleDate: it.saleDate,
            inspectFee: it.inspectFee,
            repairFee: it.repairFee,
            keepFee: it.keepFee,
            packingFee: it.packingFee,
            otherFee: it.otherFee,
            commissionModel: it.commissionModel,
            commissionSet: it.commissionSet,
            market: it.market
          })))
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
