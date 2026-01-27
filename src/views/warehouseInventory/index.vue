<template>
  <div>
    <h2>仓库库存</h2>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:8px; align-items:center;">
      <el-input v-model="q.itemNo" placeholder="ItemNo" style="width:200px" />
      <el-input v-model="q.sellerPart" placeholder="Seller Part" style="width:220px" />
      <el-input v-model="q.mfrPart" placeholder="Manufacturer Part" style="width:220px" />
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
        <el-table-column prop="receivePackageNo" label="ReceivePackage" width="192" />
        <el-table-column prop="sendPackageNo" label="SendPackage" width="192" />
      </el-table>
    </div>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useUser } from '@/composables/useUser'

const { users, currentUser, getCurrentUser, queryAllUsers } = useUser()

const q = ref({ itemNo: '', sellerPart: '', mfrPart: '', receivePackageNo: '', sendPackageNo: '' })
const itemList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const fetchList = async () => {
  const params = { page: currentPage.value, pageSize: pageSize.value }
  if (q.value.itemNo) params.itemNo = q.value.itemNo
  if (q.value.sellerPart) params.sellerPart = q.value.sellerPart
  if (q.value.mfrPart) params.mfrPart = q.value.mfrPart
  if (q.value.receivePackageNo) params.receivePackageNo = q.value.receivePackageNo
  if (q.value.sendPackageNo) params.sendPackageNo = q.value.sendPackageNo

  try {
    const res = await request.get('/items', { params })
    if (res && res.code === 1) {
      itemList.value = res.data?.rows || []
      total.value = res.data?.total || 0
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
const onClear = async () => { q.value = { itemNo:'', sellerPart:'', mfrPart:'', receivePackageNo:'', sendPackageNo:'' }; await fetchList() }
const onSizeChange = (size) => { pageSize.value = size; fetchList() }
const onCurrentChange = (page) => { currentPage.value = page; fetchList() }

onMounted(async () => { getCurrentUser(); await queryAllUsers(); await fetchList() })
</script>

<style scoped>
/* basic styles */
</style>
