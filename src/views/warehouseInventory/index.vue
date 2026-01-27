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
      <el-button type="primary" @click="onSearch">Search</el-button>
      <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">Clear</el-button>
    </div>

    <div style="overflow-x:auto;">
      <el-table :data="itemList" stripe style="min-width:1000px" border>
        <el-table-column prop="itemNo" label="ItemNo" width="160" />
        <el-table-column prop="sellerPart" label="SellerPart" width="200" />
        <el-table-column prop="mfrPart" label="MfrPart" width="200" />
        <el-table-column prop="qty" label="Qty" width="80" />
        <el-table-column prop="receivePackageNo" label="ReceivePackage" width="160" />
        <el-table-column prop="receivedDate" label="ReceivedDate" width="140" />
        <el-table-column prop="sendPackageNo" label="SendPackage" width="160" />
        <el-table-column prop="sendDate" label="SendDate" width="140" />
        <el-table-column prop="owner" label="Owner" width="140" />
        <el-table-column label="Stocklife" width="120">
          <template #default="{row}">
            <div>{{ computeStocklife(row) }} days</div>
          </template>
        </el-table-column>
        <el-table-column label="Operation" width="400" align="center" fixed="right">
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
          <el-col :span="12"><el-form-item label="InspectFee"><div>{{ (Number(detailData.inspectFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="KeepFee"><div>{{ (Number(detailData.keepFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PackingFee"><div>{{ (Number(detailData.packingFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OtherFee"><div>{{ (Number(detailData.otherFee) || 0).toFixed(2) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="TotalFee"><div>{{ ((Number(detailData.inspectFee)||0)+(Number(detailData.keepFee)||0)+(Number(detailData.packingFee)||0)+(Number(detailData.otherFee)||0)).toFixed(2) }}</div></el-form-item></el-col>
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
          <el-col :span="12"><el-form-item label="KeepFee"><el-input v-model="editing.keepFee" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="PackingFee"><el-input v-model="editing.packingFee" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="OtherFee"><el-input v-model="editing.otherFee" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="TotalFee"><div>{{ computeEditTotal() }}</div></el-form-item></el-col>
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
import { queryInfoApi, updateApi } from '@/api/item'

const { users, currentUser, getCurrentUser, queryAllUsers } = useUser()

const q = ref({ itemNo: '', sellerPart: '', mfrPart: '', ownerId: '', receivePackageNo: '', sendPackageNo: '', minStocklife: null })
const itemList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// Detail / Edit dialogs
const detailVisible = ref(false)
const detailData = ref({})
const dialogVisible = ref(false)
const editing = ref({})
const dialogTitle = ref('')

const fetchList = async () => {
  const params = { page: currentPage.value, pageSize: pageSize.value, keeperId: currentUser.value.userId }
  if (q.value.itemNo) params.itemNo = q.value.itemNo
  if (q.value.sellerPart) params.sellerPart = q.value.sellerPart
  if (q.value.mfrPart) params.mfrPart = q.value.mfrPart
  if (q.value.ownerId) params.ownerId = q.value.ownerId
  if (q.value.receivePackageNo) params.receivePackageNo = q.value.receivePackageNo
  if (q.value.sendPackageNo) params.sendPackageNo = q.value.sendPackageNo

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
const onClear = async () => { q.value = { itemNo:'', sellerPart:'', mfrPart:'', ownerId:'', receivePackageNo:'', sendPackageNo:'', minStocklife: null }; await fetchList() }
const onSizeChange = (size) => { pageSize.value = size; fetchList() }
const onCurrentChange = (page) => { currentPage.value = page; fetchList() }

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
        keepFee: (Number(d.keepFee) || 0).toFixed(2),
        packingFee: (Number(d.packingFee) || 0).toFixed(2),
        otherFee: (Number(d.otherFee) || 0).toFixed(2),
        feeRemarks: d.feeRemarks || ''
      }
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
      keepFee: Number(editing.value.keepFee) || 0,
      packingFee: Number(editing.value.packingFee) || 0,
      otherFee: Number(editing.value.otherFee) || 0,
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
  const b = parseFloat(editing.value.keepFee) || 0
  const c = parseFloat(editing.value.packingFee) || 0
  const d = parseFloat(editing.value.otherFee) || 0
  return (a + b + c + d).toFixed(2)
}

// compute stocklife in days: if sendDate exists use sendDate - receivedDate, else today - receivedDate
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
/* basic styles */
</style>
