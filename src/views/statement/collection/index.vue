<template>
  <div>
    <h2>{{ $t('menu.statement.collection') || '收款记录' }}</h2>

    <div style="margin:10px 0; padding:12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:12px; align-items:center;">
      <el-autocomplete v-model="userText" :fetch-suggestions="fetchUserSuggestions" :placeholder="$t('menu.statement.labels.paidby')" style="width:260px" @select="onUserSelect" />
      <el-date-picker v-model="startDate" type="date" placeholder="Start" style="width:160px" />
      <el-date-picker v-model="endDate" type="date" placeholder="End" style="width:160px" />
      <el-button type="primary" @click="onQuery">{{ $t('menu.statement.labels.query') || '查询' }}</el-button>
    </div>

    <statement-table :rows="rows" @date-click="onDateClick" />
  
    <StatementItemsDialog v-model="showItemsDialog" :items="dialogItems" title="Items" width="1500px" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStatementApi } from '@/api/statement'
import { queryAllApi } from '@/api/user'
import StatementTable from '@/components/statement/StatementTable.vue'
import StatementItemsDialog from '@/components/statement/StatementItemsDialog.vue'
import request from '@/utils/request'

const rows = ref([])
const userText = ref('')
const selectedUser = ref(null)
const startDate = ref(null)
const endDate = ref(null)
const users = ref([])
const router = useRouter()

onMounted(async () => {
  try {
    const res = await queryAllApi()
    if (res && res.code) users.value = res.data || []
    else if (Array.isArray(res)) users.value = res
  } catch (e) { users.value = [] }
})

function fetchUserSuggestions(queryString, cb) {
  const list = users.value.filter(u => u.name && u.name.toLowerCase().includes((queryString||'').toLowerCase()))
  cb(list.map(u => ({ value: u.name, userId: u.userId })))
}

function onUserSelect(item) {
  selectedUser.value = item
}

function formatDate(d) {
  if (!d) return null
  const dt = new Date(d)
  return dt.toISOString().slice(0,10)
}

function formatYMD(v) {
  if (!v) return ''
  try {
    const d = new Date(v)
    if (isNaN(d)) return String(v).slice(0,10)
    return d.toISOString().slice(0,10)
  } catch (e) {
    return String(v).slice(0,10)
  }
}

async function onQuery() {
  const loginUser = JSON.parse(localStorage.getItem('loginUser') || '{}')
  const keeperId = loginUser.userId || loginUser.id || null
  const ownerId = selectedUser.value && selectedUser.value.userId
  const params = {
    ownerId,
    keeperId,
    startDate: formatDate(startDate.value),
    endDate: formatDate(endDate.value)
  }
  try {
    const res = await getStatementApi(params)
    if (res && res.code) rows.value = Array.isArray(res.data) ? res.data : (res.data.rows || [])
    else if (Array.isArray(res)) rows.value = res
  } catch (e) { rows.value = [] }
}

const showItemsDialog = ref(false)
const dialogItems = ref([])

async function onDateClick(row) {
  const ownerName = row.paidby
  const keeperName = row.payto
  const owner = users.value.find(u => u.name === ownerName)
  const keeper = users.value.find(u => u.name === keeperName)
  const ownerId = owner ? (owner.userId || owner.id) : null
  const keeperId = keeper ? (keeper.userId || keeper.id) : null

  try {
    const params = { ownerId, keeperId, paymentDate: row.paymentdate, pageSize: 1000 }
    const res = await request.get('/items', { params })
    let items = []
    if (res && res.code === 1) items = res.data?.rows || []
    else if (Array.isArray(res)) items = res

    items = items.map(it => ({
      ...it,
      TotalFee: (Number(it.inspectFee||0) + Number(it.repairFee||0) + Number(it.keepFee||0) + Number(it.packingFee||0) + Number(it.otherFee||0))
    }))

    dialogItems.value = items
    showItemsDialog.value = true
  } catch (e) {
    console.error('Failed to fetch items for date click', e)
    dialogItems.value = []
    showItemsDialog.value = true
  }
}

</script>
