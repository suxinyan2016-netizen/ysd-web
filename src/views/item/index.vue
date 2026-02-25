<template>
  <div>
    <h1>Item Management</h1>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:8px; align-items:center;">
      <el-input v-model="q.itemNo" placeholder="ItemNo" style="width:200px" />
      <el-select v-model="q.dictId" placeholder="Category" clearable style="width:180px">
        <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
      </el-select>
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

    <ItemTable ref="tableRef" :data="itemList" :row-key="'itemId'" :selectable="true" :compute-stocklife="computeStocklife" @selection-change="onSelectionChange">
      <template #operation="{row}">
        <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">Detail</el-button>
        <el-button v-if="row.itemStatus===0" size="small" type="primary" @click="onEdit(row)">Edit</el-button>
        <el-button v-if="row.itemStatus===1" size="small" @click="onAddToParcel(row)" style="background:#e6f7ff; border:1px solid #b3e5ff; color:#006c9c">Add to Parcel</el-button>
        <el-button v-if="row.itemStatus===1" size="small" @click="onAbandon(row)" style="background:#fff1f0; border:1px solid #ffb3b3; color:#a80000">Abandon</el-button>
      </template>
    </ItemTable>
    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <ItemDetail v-model:visible="detailVisible" title="Item Detail" :detail-data="detailData" width="960px" label-width="154px">
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">Close</el-button>
      </template>
    </ItemDetail>
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="864px" @close="onDialogClose">
    <el-form :model="editing" label-width="132px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="ItemNo"><el-input v-model="editing.itemNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Category">
            <el-select v-model="editing.dictId" placeholder="Category" clearable>
              <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
            </el-select>
          </el-form-item></el-col>

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

          <el-col :span="12"><el-form-item label="Unpacked"><el-select v-model="editing.isUnpacked"><el-option label="packed" :value="0" /><el-option label="unpacked" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="IsGood"><el-select v-model="editing.isGood"><el-option label="good" :value="1" /><el-option label="bad" :value="0" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="InspectFee"><el-input-number v-model="editing.inspectFee" :min="0" style="width:100%" /></el-form-item></el-col>
          
          <el-col :span="12"><el-form-item label="repairFee"><el-input-number v-model="editing.repairFee" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="KeepFee"><el-input-number v-model="editing.keepFee" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PackingFee"><el-input-number v-model="editing.packingFee" :min="0" style="width:100%" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="OtherFee"><el-input-number v-model="editing.otherFee" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Paid"><el-select v-model="editing.isPaid"><el-option label="unpaid" :value="0" /><el-option label="paid" :value="1" /></el-select></el-form-item></el-col>

          <el-col :span="24"><el-form-item label="FeeRemarks"><el-input type="textarea" v-model="editing.feeRemarks" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PaymentDate"><el-date-picker v-model="editing.paymentDate" type="date" placeholder="Pick date" style="width:100%" /></el-form-item></el-col>

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
import { findByGroupApi } from '@/api/dict'
import ItemDetail from '@/components/common/ItemDetail.vue'
import ItemTable from '@/components/common/ItemTable.vue'
import { formatFee, computeTotalFee } from '@/utils/fees'
import { useItemActions } from '@/composables/useItemActions'
import { useUser } from '@/composables/useUser'
import { useItemsList } from '@/composables/useItemsList'

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
} = useItemsList({ initialQ: { itemNo: '', sellerPart: '', mfrPart: '', ispaid: '', ownerId: null, keeperId: null, itemStatus: '', minStocklife: null, dictId: '' } })

// dict options for category filter
const dictOptions = ref([])

const loadDictOptions = async () => {
  try {
    // Try by group name 'Hardware' first
    let res = await findByGroupApi('Hardware')
    let list = []
    if (res && res.code === 1) list = res.data || []
    else if (Array.isArray(res)) list = res

    // If empty, try using numeric key 2 (some backends store group as numeric)
    if ((!list || list.length === 0)) {
      const res2 = await findByGroupApi(2)
      if (res2 && res2.code === 1) list = res2.data || []
      else if (Array.isArray(res2)) list = res2
    }

    dictOptions.value = list || []
    // ensure items have dictId/dictName (map if necessary)
    dictOptions.value = dictOptions.value.map(d => ({ dictId: d.dictId ?? d.id ?? d.value, dictName: d.dictName ?? d.name ?? d.label }))
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
} = useItemActions({ fetchList })
const selectedIds = ref([])
const { users, currentUser, getCurrentUser, queryAllUsers, getUserName } = useUser()

// fetchList/onSearch/onClear/onSizeChange/onCurrentChange provided by useItemsList

const onSelectionChange = (selection) => { selectedIds.value = selection.map(s => s.itemId) }

const onAdd = () => {
  dialogTitle.value = 'Add Item'
  editing.value = {
    isUnpacked: 1,
    isGood: 1,
    isPaid: 0,
    ownerId: currentUser.value.userId || null,
    owner: currentUser.value.name || ''
  }
  dialogVisible.value = true
}

// editing/detail handlers provided by useItemActions

// editing/detail handlers provided by useItemActions

// single-item delete handled by useItemActions

const onDeleteSelected = async () => {
  if (!selectedIds.value.length) { ElMessage.info('No selection'); return }
  try {
    await ElMessageBox.confirm('Confirm delete selected?','Warning')
    const res = await deleteApi(selectedIds.value)
    if (res && res.code === 1) { ElMessage.success('Deleted'); fetchList(); selectedIds.value = [] }
    else ElMessage.error(res.msg || 'Delete failed')
  } catch (err) {}
}

onMounted(() => { fetchList(); getCurrentUser(); queryAllUsers(); loadDictOptions() })

const onDialogClose = () => {
  dialogVisible.value = false
  editing.value = {}
}

const statusClass = (s) => {
  if (s === 2) return 'status-sent'
  if (s === 0) return 'status-inspecting'
  if (s === 1) return 'status-received'
  if (s === 9) return 'status-exception'
  return ''
}

</script>

<style scoped>
.container { margin: 2px 0 }
.status-cell { padding:2px 4px; border-radius:4px; display:inline-block; min-width:72px; text-align:center; }
.status-sent { background:#9e9e9e; color:#fff }
.status-inspecting { background:#f7d774; color:#2b2b2b }
.status-received { background:#66bb6a; color:#fff }
.status-exception { background:#e57373; color:#fff }
</style>
