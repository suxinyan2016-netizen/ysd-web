<template>
  <div>
    <h2>仓库库存</h2>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:8px; align-items:center;">
      <el-input v-model="q.itemNo" placeholder="ItemNo" style="width:200px" />
      <el-input v-model="q.sellerPart" placeholder="Seller Part" style="width:220px" />
      <el-input v-model="q.mfrPart" placeholder="Manufacturer Part" style="width:220px" />
      <el-select v-model="q.ownerId" placeholder="Owner" clearable style="width:180px">
        <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
      </el-select>
      <el-input v-model="q.minStocklife" placeholder="Stocklife>" type="number" style="width:140px" />
      <el-input v-model="q.receivePackageNo" placeholder="ReceivePackageNo" style="width:200px" />
      <el-input v-model="q.sendPackageNo" placeholder="SendPackageNo" style="width:200px" />
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
    </div>

    <div style="overflow-x:auto;">
      <el-table :data="itemList" stripe style="min-width:1000px" border>
        <el-table-column prop="itemNo" label="ItemNo" width="160" />
        <el-table-column prop="sellerPart" label="SellerPart" width="280" />
        <el-table-column prop="mfrPart" label="MfrPart" width="280" />
        <el-table-column prop="qty" label="Qty" width="80" />
        <el-table-column prop="isGood" label="IsGood" width="100">
          <template #default="{row}">
            <div>{{ row.isGood === 1 ? 'good' : (row.isGood === 0 ? 'bad' : '') }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="itemStatus" label="Status" width="120">
          <template #default="{row}">
            <span v-if="row.itemStatus===0">Inspecting</span>
            <span v-else-if="row.itemStatus===1">Received</span>
            <span v-else-if="row.itemStatus===2">Sent</span>
            <span v-else-if="row.itemStatus===9">Exception</span>
          </template>
        </el-table-column>
        <el-table-column prop="isUnpacked" label="isUnpacked" width="100">
        <template #default="{row}">
            <div>{{ row.isUnpacked === 1 ? 'unpacked' : (row.isUnpacked === 0 ? 'packed' : '') }}</div>
        </template>
        </el-table-column>
        

        <el-table-column prop="receivePackageNo" label="ReceivePackage" width="170" />
        <el-table-column prop="receivedDate" label="ReceivedDate" width="140" />
        <el-table-column prop="sendPackageNo" label="SendPackage" width="165" />
        <el-table-column prop="sendDate" label="SendDate" width="140" />
        <el-table-column prop="owner" label="Owner" width="140" />
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
        

        <el-table-column label="Operation" width="200" align="center" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">Detail</el-button>
            <el-button size="small" type="primary" @click="onEdit(row)">Edit</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>
    
    <!-- Detail Dialog -->
    <el-dialog :model-value="detailVisible" title="Item Detail" width="900px" @close="detailVisible=false">
      <el-form :model="detailData" label-width="140px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="ItemNo"><div>{{ detailData.itemNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="SellerPart"><div>{{ detailData.sellerPart }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="MfrPart"><div>{{ detailData.mfrPart }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Qty"><div>{{ detailData.qty }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="ReceivePackageNo"><div>{{ detailData.receivePackageNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="ReceivedDate"><div>{{ detailData.receivedDate }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="SendPackageNo"><div>{{ detailData.sendPackageNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="SendDate"><div>{{ detailData.sendDate }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Owner"><div>{{ detailData.owner }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Stocklife"><div>{{ computeStocklife(detailData) }} days</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="isUnpacked"><div>{{ detailData.isUnpacked === 1 ? 'unpacked' : (detailData.isUnpacked === 0 ? 'packed' : '') }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="isGood"><div>{{ detailData.isGood === 1 ? 'good' : (detailData.isGood === 0 ? 'bad' : '') }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="InspectFee"><div>{{ (Number(detailData.inspectFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="repairFee"><div>{{ (Number(detailData.repairFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="KeepFee"><div>{{ (Number(detailData.keepFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PackingFee"><div>{{ (Number(detailData.packingFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OtherFee"><div>{{ (Number(detailData.otherFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="TotalFee"><div>{{ ((Number(detailData.inspectFee)||0)+(Number(detailData.repairFee)||0)+(Number(detailData.keepFee)||0)+(Number(detailData.packingFee)||0)+(Number(detailData.otherFee)||0)).toFixed(2) }}</div></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">Close</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="720px" @close="dialogVisible=false">
      <el-form :model="editing" label-width="140px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="ItemNo"><div>{{ editing.itemNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Owner"><div>{{ editing.owner }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="InspectFee"><el-input v-model="editing.inspectFee" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="RepairFee"><el-input v-model="editing.repairFee" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="KeepFee"><el-input v-model="editing.keepFee" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PackingFee"><el-input v-model="editing.packingFee" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OtherFee"><el-input v-model="editing.otherFee" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="TotalFee"><div>{{ computeEditTotal() }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="isUnpacked"><el-select v-model="editing.isUnpacked" placeholder="Unpacked" style="width:100%"><el-option label="packed" :value="0" /><el-option label="unpacked" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="isGood"><el-select v-model="editing.isGood" placeholder="Good" style="width:100%"><el-option label="bad" :value="0" /><el-option label="good" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="FeeRemarks"><el-input type="textarea" v-model="editing.feeRemarks" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Paid"><el-select v-model="editing.ispaid" placeholder="Paid" style="width:100%"><el-option label="unpaid" :value="0" /><el-option label="paid" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="Remark"><div>{{ editing.remark }}</div></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">Cancel</el-button>
        <el-button type="primary" @click="saveItem">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useUser } from '@/composables/useUser'
import { useItemsList } from '@/composables/useItemsList'
import { queryInfoApi, updateApi } from '@/api/item'

const { users, currentUser, getCurrentUser, queryAllUsers, getUserName } = useUser()

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
  initialQ: { itemNo: '', sellerPart: '', mfrPart: '', ownerId: '', itemStatus: '', ispaid: '', receivePackageNo: '', sendPackageNo: '', minStocklife: null },
  getFixedParams: () => ({ keeperId: currentUser.value.userId })
})

// Detail / Edit dialogs
const detailVisible = ref(false)
const detailData = ref({})
const dialogVisible = ref(false)
const editing = ref({})
const dialogTitle = ref('')

// fetchList/onSearch/onClear/onSizeChange/onCurrentChange provided by useItemsList

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
      // format fees as strings with two decimals for display and include feeRemarks
      editing.value = {
        ...d,
        inspectFee: (Number(d.inspectFee) || 0).toFixed(2),
        repairFee: (Number(d.repairFee) || 0).toFixed(2),
        keepFee: (Number(d.keepFee) || 0).toFixed(2),
        packingFee: (Number(d.packingFee) || 0).toFixed(2),
        otherFee: (Number(d.otherFee) || 0).toFixed(2),
        feeRemarks: d.feeRemarks || ''
      }
      // Ensure owner display: prefer API name, otherwise resolve from ownerId
      editing.value.owner = d.owner || getUserName(d.ownerId) || ''
      dialogTitle.value = 'Edit Item'
      dialogVisible.value = true
    } else {
      ElMessage.error('Failed to load item')
    }
  } catch (err) { ElMessage.error('Failed to load item') }
}

const saveItem = async () => {
  try {
    const payload = {
      itemId: editing.value.itemId,
      inspectFee: Number(editing.value.inspectFee) || 0,
      repairFee: Number(editing.value.repairFee) || 0,
      keepFee: Number(editing.value.keepFee) || 0,
      packingFee: Number(editing.value.packingFee) || 0,
      otherFee: Number(editing.value.otherFee) || 0,
      isUnpacked: editing.value.isUnpacked,
      isGood: editing.value.isGood,
      ispaid: editing.value.ispaid,
      feeRemarks: editing.value.feeRemarks || ''
    }
    const res = await updateApi(payload)
    if (res && res.code === 1) { ElMessage.success('Saved'); dialogVisible.value = false; await fetchList() }
    else ElMessage.error(res.msg || 'Save failed')
  } catch (err) { ElMessage.error('Save failed') }
}

const computeEditTotal = () => {
  const a = parseFloat(editing.value.inspectFee) || 0
  const b = parseFloat(editing.value.repairFee) || 0
  const c = parseFloat(editing.value.keepFee) || 0
  const d = parseFloat(editing.value.packingFee) || 0
  const e = parseFloat(editing.value.otherFee) || 0
  return (a + b + c + d).toFixed(2)
}

// computeStocklife provided by useItemsList


</script>

<style scoped>
/* basic styles */
</style>
