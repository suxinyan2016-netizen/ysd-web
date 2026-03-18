<script setup>
import { ref, onMounted } from 'vue'
import { getTokenInfo } from '@/utils/tokenManager'
import * as userApi from '@/api/user'
import * as userServiceApi from '@/api/userService'
import ServiceDetailsDialog from '@/components/common/ServiceDetailsDialog.vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const warehouses = ref([])
const loading = ref(false)
const servicesDialogVisible = ref(false)
const currentServices = ref([])
const currentWarehouseName = ref('')

const load = async () => {
  const user = getTokenInfo().loginUser || JSON.parse(localStorage.getItem('loginUser') || '{}') || {}
  const uid = user.userId ?? user.id ?? user.userid
  if (!uid) return
  loading.value = true
  try {
    const res = await userApi.getUserWarehouseUsers(uid)
    let rows = []
    if (!res) rows = []
    else if (Array.isArray(res)) rows = res
    else if (res.data && Array.isArray(res.data.rows)) rows = res.data.rows
    else if (Array.isArray(res.data)) rows = res.data
    else if (res.code === 1 && Array.isArray(res.data)) rows = res.data
    warehouses.value = rows || []
  } catch (e) {
    console.error('load warehouses error', e)
    ElMessage.error('加载仓库失败')
  } finally {
    loading.value = false
  }
}

const openServices = async (row) => {
  const wid = row.userId ?? row.userid ?? row.id
  if (!wid) return
  currentWarehouseName.value = row.name || row.username || ''
  servicesDialogVisible.value = true
  currentServices.value = []
  try {
    const res = await userServiceApi.queryAllApi(wid)
    let rows = []
    if (!res) rows = []
    else if (Array.isArray(res)) rows = res
    else if (res.data && Array.isArray(res.data)) rows = res.data
    else if (res.code === 1 && Array.isArray(res.data)) rows = res.data
    currentServices.value = rows || []
  } catch (e) {
    console.error('load services error', e)
    ElMessage.error('加载服务失败')
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2>{{ t('menu.account.myWarehouses') || 'My Warehouses' }}</h2>

    <el-table :data="warehouses" v-loading="loading" style="width:100%">
      <el-table-column prop="name" label="仓库名 / Name" width="220" />
      <el-table-column prop="phone" label="电话 / Phone" width="160" />
      <el-table-column prop="address" label="地址 / Address" />
      <el-table-column prop="zipcode" label="邮编 / Zip" width="120" />
      <el-table-column prop="email" label="邮箱 / Email" width="220" />
      <el-table-column label="服务详情" width="120">
        <template #default="{ row }">
          <a href="#" @click.prevent="openServices(row)">{{ t('user.table.services') || '服务详情' }}</a>
        </template>
      </el-table-column>
    </el-table>
    <ServiceDetailsDialog v-model="servicesDialogVisible" :title="currentWarehouseName + ' - ' + (t('user.table.services') || '服务详情')" :services="currentServices" :loading="false" width="70%" />
  </div>
</template>

<style scoped>
</style>
