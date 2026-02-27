
<template>
  <div>
    <h2>{{ $t('menu.parcel.send') || '待发包裹' }}</h2>

    <div style="margin: 10px 0; display:flex; align-items:center; gap:8px; padding:8px 12px; background:#fff; position:relative; z-index:1000; overflow:visible; border:1px solid #e6e6e6; border-radius:4px;">
      <el-input v-model="packageNo" :placeholder="$t('menu.parcel_search.fields.packageNo') || '包裹号'" style="width:240px" />
      <el-button type="primary" @click="onSearch">{{ $t('menu.parcel_search.actions.search') || '查询' }}</el-button>
      <el-button @click="onClear">{{ $t('menu.parcel_search.actions.clean') || '清除' }}</el-button>
    </div>

    <el-table :data="parcelList" stripe style="width:100%" border>
      <el-table-column prop="packageNo" :label="$t('menu.parcel_table.fields.packageNo') || '包裹号'" width="200">
        <template #default="{ row }">
          <span>{{ row.packageNo }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="status" :label="$t('menu.parcel_table.fields.status') || '状态'" width="120">
        <template #default="{ row }">
          <span v-if="row.status == 0">Planed</span>
          <span v-else-if="row.status == 1">inDelivery</span>
          <span v-else-if="row.status == 2">Received</span>
          <span v-else-if="row.status == 9">Exception</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('menu.parcel_table.fields.sender') || '寄件人'" prop="senderName" width="160">
        <template #default="{ row }">{{ row.senderName || '-' }}</template>
      </el-table-column>

      <el-table-column :label="$t('menu.parcel_table.fields.receiver') || '收件人'" prop="receiverName" width="180">
        <template #default="{ row }">
          <span>{{ row.receiverName || '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('menu.parcel_table.fields.processId') || '标签'" width="120" align="center">
        <template #default="{ row }">
          <a v-if="hasLabel(row)" href="javascript:void(0)" @click="openLabel(row)">{{ $t('menu.parcel_search.actions.imgExport') || '查看' }}</a>
        </template>
      </el-table-column>

      <el-table-column :label="$t('menu.parcel_table.fields.operation') || '操作'" width="160" align="center">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="onSent(row)">{{ $t('menu.parcel_search.actions.send') || '寄出' }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5,10,20,50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>

    <!-- Inspect/Detail Dialog reuse ParcelInspect for detail viewing -->
    <ParcelInspect
      v-model:visible="inspectVisible"
      :parcel="inspectParcel"
      :users="users"
      :token="token"
      :current-user="currentUser"
      :upload-handlers="uploadHandlers"
      :image-manager="imageManager"
      @refresh="fetchList"
    />
    <ParcelSendDialog v-model:visible="sendDialogVisible" :parcel="sendDialogParcel" @saved="onSendDialogSaved" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUser } from '@/composables/useUser'
import { useParcel } from '@/composables/useParcel'
import ParcelInspect from '@/components/parcel/ParcelInspect.vue'
import ParcelSendDialog from '@/components/parcel/ParcelSendDialog.vue'
import { useFileUpload } from '@/composables/useFileUpload'
import { getGroupedImages } from '@/api/imageManage'
import { updateApi } from '@/api/parcel'

const packageNo = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const { users, currentUser, getCurrentUser, queryAllUsers } = useUser()
const token = ref(getCurrentUser())

const { parcelList, total, search, getParcelDetail } = useParcel(ref({}), currentPage, pageSize, currentUser)

const editingParcel = ref({})
const { imageManager, uploadHandlers } = useFileUpload(editingParcel, token, currentUser)

const inspectVisible = ref(false)
const inspectParcel = ref({})
const sendDialogVisible = ref(false)
const sendDialogParcel = ref({})

  const fetchList = async () => {
  const senderId = currentUser.value?.userId || (JSON.parse(localStorage.getItem('loginUser') || '{}').userId)
  const params = {
    page: currentPage.value,
    pageSize: pageSize.value,
    status: 0,
    senderId: senderId
  }
  if (packageNo.value && packageNo.value.trim() !== '') params.packageNo = packageNo.value.trim()

  try {
    const res = await request.get('/parcels', { params })
    if (res && res.code === 1) {
      parcelList.value = res.data?.rows || []
      total.value = res.data?.total || 0
    } else {
      parcelList.value = []
      total.value = 0
    }
  } catch (err) {
    console.error('fetchList error', err)
    parcelList.value = []
    total.value = 0
  }
}

const onSearch = async () => { currentPage.value = 1; await fetchList() }
const onClear = async () => { packageNo.value = ''; await fetchList() }
const onSizeChange = (size) => { pageSize.value = size; fetchList() }
const onCurrentChange = (page) => { currentPage.value = page; fetchList() }

const viewDetail = async (row) => {
  const detail = await getParcelDetail(row.parcelId)
  inspectParcel.value = detail || row
  inspectVisible.value = true
}

const hasLabel = (row) => {
  // we assume parcel has label images under PACKAGE_LABEL; if not, show the link anyway to attempt fetch
  return true
}

const openLabel = async (row) => {
  try {
    const res = await getGroupedImages('PARCEL', row.parcelId)
    if (res && res.code === 1 && res.data && res.data.PACKAGE_LABEL && res.data.PACKAGE_LABEL.length > 0) {
      const first = res.data.PACKAGE_LABEL[0]
      const url = first.imageUrl || first.url || first
      window.open(url, '_blank')
    } else {
      ElMessage.warning('未找到标签')
    }
    } catch (err) {
    console.error('openLabel error', err)
    ElMessage.error('加载标签失败')
  }
}

const onSent = async (row) => {
  // open send dialog to edit item fees/remarks before finalizing send
  sendDialogParcel.value = row
  sendDialogVisible.value = true
}

const onSendDialogSaved = async () => {
  // after items saved in dialog, continue original parcel update
  try {
    const today = new Date().toISOString().split('T')[0]
    const payload = { parcelId: sendDialogParcel.value.parcelId, status: 1, sendDate: today }
    const res = await updateApi(payload)
    if (res && res.code === 1) {
      ElMessage.success('更新成功')
      fetchList()
    } else {
      ElMessage.error(res.msg || '更新失败')
    }
    } catch (err) {
    console.error('onSent finalize error', err)
    ElMessage.error('更新包裹失败')
  }
}

onMounted(async () => { await queryAllUsers(); await fetchList() })
</script>

<style scoped>
h2 { margin: 8px 0; }
</style>
