<template>
  <div>
    <h2>仓库库存</h2>

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

    <ItemTable ref="tableRef" :data="itemList" :row-key="'itemId'" :compute-stocklife="computeStocklife">
      <template #operation="{row}">
        <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">Detail</el-button>
        <el-button size="small" type="primary" @click="onEdit(row)">Edit</el-button>
      </template>
    </ItemTable>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>
    
    <ItemDetail v-model="detailVisible" title="Item Detail" :detail-data="detailData" width="900px" label-width="140px">
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">Close</el-button>
      </template>
    </ItemDetail>

    <!-- Edit Dialog -->
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="720px" @close="dialogVisible=false">
      <el-form :model="editing" label-width="140px">
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="ItemNo"><div>{{ editing.itemNo }}</div></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="Category">
            <el-select v-model="editing.dictId" placeholder="Category" clearable style="width:100%">
              <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item label="Owner"><div>{{ editing.owner }}</div></el-form-item></el-col>
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
          <el-col :span="12"><el-form-item label="PaymentDate"><el-date-picker v-model="editing.paymentDate" type="date" placeholder="Pick date" style="width:100%" /></el-form-item></el-col>
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
import { findByGroupApi } from '@/api/dict'
import ItemDetail from '@/components/common/ItemDetail.vue'
import ItemTable from '@/components/common/ItemTable.vue'
import { formatFee, computeTotalFee } from '@/utils/fees'
import { useItemActions } from '@/composables/useItemActions'

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
} = useItemsList({ initialQ: { itemNo: '', sellerPart: '', mfrPart: '', ispaid: '', ownerId: null, keeperId: null, itemStatus: '', minStocklife: null, dictId: '' } })

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
} = useItemActions({ fetchList })

const computeEditTotal = () => {
  return formatFee(computeTotalFee(editing.value))
}

onMounted(() => { fetchList(); getCurrentUser(); queryAllUsers(); loadDictOptions() })


</script>

<style scoped>
/* basic styles */
</style>
