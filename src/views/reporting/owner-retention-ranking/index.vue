<template>
  <div class="owner-retention-ranking">
    <h2>{{ $t('menu.reporting.ownerRetentionRanking') }}</h2>
    
    <!-- Filter Section -->
    <div style="margin: 10px 0; padding: 12px; background: #f5f5f5; border: 1px solid #e6e6e6; border-radius: 4px;">
      <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
        <el-select v-model="filters.keeperId" :placeholder="$t('menu.reporting.warehouse') || 'Warehouse'" clearable style="width: 180px">
          <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
        </el-select>
        
        <el-select v-model="filters.dictId" :placeholder="$t('menu.item.fields.category')" clearable style="width: 160px">
          <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
        </el-select>
        
        <el-input
          v-model="filters.sellerpart"
          :placeholder="$t('menu.reporting.productName') || 'Product Name'"
          clearable
          style="width: 200px"
        />
        
        <el-button type="primary" @click="handleSearch">{{ $t('menu.item.buttons.search') }}</el-button>
        <el-button type="info" @click="handleClear">{{ $t('menu.item.buttons.clear') }}</el-button>
      </div>
    </div>

    <!-- Table Section -->
    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%; margin-top: 20px;"
      border
      stripe
    >
      <el-table-column type="index" :label="'SN'" width="60" align="center">
        <template #default="{ $index }">
          {{ (pagination.page - 1) * pagination.pageSize + $index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="dictname" :label="$t('menu.item.fields.category')" width="120" />
      <el-table-column prop="warehouse" :label="$t('menu.reporting.warehouse')" width="150" />
      <el-table-column prop="sellerpart" :label="$t('menu.reporting.productName')" width="320" />
      <el-table-column prop="itemno" :label="$t('menu.reporting.itemNo')" width="150" />
      <el-table-column prop="qty" :label="$t('menu.reporting.quantity')" width="80" align="right" />
      <el-table-column prop="receiveddate" :label="$t('menu.reporting.receivedDate')" width="100">
        <template #default="{ row }">
          {{ formatDate(row.receiveddate) }}
        </template>
      </el-table-column>
      <el-table-column prop="agingdays" :label="$t('menu.reporting.agingDays')" width="110" align="right" sortable />
      <el-table-column :label="$t('menu.item.actions.detail')" width="80" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleViewDetail(row)">{{ $t('menu.item.actions.detail') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- Pagination -->
    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- Item Detail Dialog -->
    <ItemDetail
      v-if="detailVisible"
      v-model="detailVisible"
      :title="$t('menu.item.dialogs.itemDetail')"
      :detail-data="detailData"
      width="960px"
      label-width="154px"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ownerRetentionRankingApi } from '@/api/report'
import { queryAllApi } from '@/api/user'
import { findByGroupApi } from '@/api/dict'
import { queryInfoApi } from '@/api/item'
import { useUser } from '@/composables/useUser'
import ItemDetail from '@/components/common/ItemDetail.vue'

const { t } = useI18n()
const { currentUser, getCurrentUser } = useUser()

// Filter state
const filters = ref({
  keeperId: null,
  dictId: null,
  sellerpart: ''
})

const loading = ref(false)
const tableData = ref([])
const users = ref([])
const dictOptions = ref([])
const detailVisible = ref(false)
const detailData = ref({})

// Ensure tableData is always an array
const ensureArray = (data) => {
  if (Array.isArray(data)) return data
  if (data === null || data === undefined) return []
  // Handle paginated response structure {total, rows}
  if (data && typeof data === 'object' && Array.isArray(data.rows)) {
    return data.rows
  }
  console.warn('Expected array but got:', typeof data, data)
  return []
}

// Format date to YYYY-MM-DD
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Pagination state
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// Load users for warehouse dropdown
const loadUsers = async () => {
  try {
    const res = await queryAllApi()
    if (res && res.code === 1) {
      users.value = res.data || []
    } else if (Array.isArray(res)) {
      users.value = res
    }
  } catch (err) {
    console.error('Failed to load users:', err)
  }
}

// Load dict options for category dropdown
const loadDictOptions = async () => {
  try {
    let res = await findByGroupApi('Hardware')
    let list = []
    if (res && res.code === 1) list = res.data || []
    else if (Array.isArray(res)) list = res
    
    if (!list || list.length === 0) {
      const res2 = await findByGroupApi(2)
      if (res2 && res2.code === 1) list = res2.data || []
      else if (Array.isArray(res2)) list = res2
    }
    
    dictOptions.value = (list || []).map(d => ({
      dictId: d.dictId ?? d.id ?? d.value,
      dictName: d.dictName ?? d.name ?? d.label
    }))
  } catch (err) {
    console.error('Failed to load dict options:', err)
    dictOptions.value = []
  }
}

// Handle search
const handleSearch = async () => {
  // Ensure user is available before making API call
  if (!currentUser.value?.userId) {
    console.warn('User not available, skipping search')
    return
  }

  loading.value = true
  try {
    const params = {
      ownerid: currentUser.value.userId,
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    
    if (filters.value.keeperId) {
      params.keeperid = filters.value.keeperId
    }
    
    if (filters.value.dictId) {
      params.dictid = filters.value.dictId
    }
    
    if (filters.value.sellerpart) {
      params.sellerpart = filters.value.sellerpart
    }
    
    const res = await ownerRetentionRankingApi(params)
    
    console.log('API response:', res)
    
    if (res && res.code === 1) {
      // Handle response structure: {total: 207, rows: [...]}
      tableData.value = ensureArray(res.rows || res.data)
      
      // Set total from response - handle both direct total and nested in data
      if (res.total) {
        pagination.value.total = res.total
      } else if (res.data && typeof res.data === 'object' && res.data.total) {
        pagination.value.total = res.data.total
      } else {
        pagination.value.total = tableData.value.length
      }
      
      console.log('Pagination total set to:', pagination.value.total)
    } else {
      ElMessage.error(res?.msg || 'Failed to load data')
      tableData.value = []
      pagination.value.total = 0
    }
  } catch (err) {
    console.error('Failed to fetch owner retention ranking data:', err)
    ElMessage.error('Failed to load data')
    tableData.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

// Handle clear
const handleClear = () => {
  filters.value = {
    keeperId: null,
    dictId: null,
    sellerpart: ''
  }
  pagination.value.page = 1
  handleSearch()
}

// Handle page size change
const handleSizeChange = (val) => {
  pagination.value.pageSize = val
  pagination.value.page = 1
  handleSearch()
}

// Handle current page change
const handleCurrentChange = (val) => {
  pagination.value.page = val
  handleSearch()
}

// Handle view detail
const handleViewDetail = async (row) => {
  try {
    const res = await queryInfoApi(row.itemid)
    if (res && res.code === 1) {
      detailData.value = res.data || {}
      // Use nextTick to ensure dialog renders properly
      await nextTick()
      detailVisible.value = true
    } else {
      ElMessage.error(res?.msg || 'Failed to load item detail')
    }
  } catch (err) {
    console.error('Failed to fetch item detail:', err)
    ElMessage.error('Failed to load item detail')
  }
}

onMounted(async () => {
  getCurrentUser()
  await Promise.all([
    loadUsers(),
    loadDictOptions()
  ])
  
  // Only search if user is available
  if (currentUser.value?.userId) {
    handleSearch()
  }
})
</script>

<style scoped>
.owner-retention-ranking {
  padding: 20px;
}
</style>
