<template>
  <div>
    <h2>{{ $t('menu.statement.collection') || '收款记录' }}</h2>

    <div style="margin:10px 0; padding:12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:12px; align-items:center;">
      <el-autocomplete v-model="userText" :fetch-suggestions="fetchUserSuggestions" :placeholder="$t('menu.statement.labels.paidby')" style="width:260px" @select="onUserSelect" />
      <el-date-picker v-model="startDate" type="date" :placeholder="$t('menu.statement.placeholders.start')" style="width:160px" />
      <el-date-picker v-model="endDate" type="date" :placeholder="$t('menu.statement.placeholders.end')" style="width:160px" />
      <el-button type="primary" @click="onQuery">{{ $t('menu.statement.labels.query') || '查询' }}</el-button>
    </div>

    <statement-table :rows="rows" @date-click="onDateClick" />
  
    <StatementItemsDialog v-model="showItemsDialog" :items="dialogItems" :title="dialogTitle" width="1500px" />
    <StatementParcelsDialog v-model="showParcelsDialog" :items="dialogParcelsItems" :title="dialogParcelsTitle" :headerDate="dialogParcelsHeaderDate" width="1000px" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getStatementApi } from '@/api/statement'
import { queryAllApi } from '@/api/user'
import StatementTable from '@/components/statement/StatementTable.vue'
import StatementItemsDialog from '@/components/statement/StatementItemsDialog.vue'
import StatementParcelsDialog from '@/components/statement/StatementParcelsDialog.vue'
import request from '@/utils/request'
import { exportJsonToXlsx } from '@/utils/excelExport'
import { computeConsignmentTotal } from '@/utils/fees'

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
    // sort by payment date descending
    rows.value.sort((a, b) => {
      const da = new Date(a.paymentdate || a.paymentDate || 0).getTime() || 0
      const db = new Date(b.paymentdate || b.paymentDate || 0).getTime() || 0
      return db - da
    })
      // adjust displayed paidby/payto per UI: paidby = selectedUser (query), payto = current login user
      try {
        const loginUser = JSON.parse(localStorage.getItem('loginUser') || '{}')
        const currentUserName = loginUser.name || loginUser.username || ''
        const selectedName = selectedUser.value ? (selectedUser.value.value || selectedUser.value.name || '') : ''
        if (selectedName || currentUserName) {
          rows.value = (rows.value || []).map(r => ({ ...r, paidby: selectedName || r.paidby, payto: currentUserName || r.payto }))
        }
      } catch (e) { /* ignore */ }
  } catch (e) { rows.value = [] }
}

async function onExport() {
  const loginUser = JSON.parse(localStorage.getItem('loginUser') || '{}')
  const keeperId = loginUser.userId || loginUser.id || null
  const ownerId = selectedUser.value && selectedUser.value.userId
  const params = {
    ownerId,
    keeperId,
    startDate: formatDate(startDate.value),
    endDate: formatDate(endDate.value),
    pageSize: 1000
  }
  try {
    const res = await request.get('/items', { params })
    let items = []
    if (res && res.code === 1) items = res.data?.rows || []
    else if (Array.isArray(res)) items = res

    items = items.map(it => ({
      itemNo: it.itemNo,
      sellerPart: it.sellerPart,
      qty: it.qty,
      inspectFee: Number(it.inspectFee || 0),
      repairFee: Number(it.repairFee || 0),
      keepFee: Number(it.keepFee || 0),
      packingFee: Number(it.packingFee || 0),
      otherFee: Number(it.otherFee || 0),
      TotalFee: Number(it.TotalFee || (Number(it.inspectFee||0) + Number(it.repairFee||0) + Number(it.keepFee||0) + Number(it.packingFee||0) + Number(it.otherFee||0))),
      ispaid: it.ispaid,
      paymentDate: formatYMD(it.paymentDate)
    }))

    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `Statement_Items_${timestamp}.xlsx`
    exportJsonToXlsx(items, 'Items', fileName)
    ElMessage.success(`Exported ${items.length} records to ${fileName}`)
  } catch (e) {
    console.error('Export failed', e)
    ElMessage.error('Export failed: ' + (e?.message || e))
  }
}

const showItemsDialog = ref(false)
const dialogItems = ref([])
const dialogTitle = ref('Items')
const showParcelsDialog = ref(false)
const dialogParcelsItems = ref([])
const dialogParcelsTitle = ref('Parcels')
const dialogParcelsHeaderDate = ref('')

async function onDateClick(row) {
  const ownerName = row.paidby
  const keeperName = row.payto
  const owner = users.value.find(u => u.name === ownerName)
  const keeper = users.value.find(u => u.name === keeperName)
  const ownerId = owner ? (owner.userId || owner.id) : null
  const keeperId = keeper ? (keeper.userId || keeper.id) : null

  try {
    const type = (row.statementtype || 'I').toString().toUpperCase()
    if (type === 'P') {
      // For collection view, call parcels fees endpoint with payerId=current user
      const loginUser = JSON.parse(localStorage.getItem('loginUser') || '{}')
      const currentUserId = loginUser.userId || loginUser.id || null
      const paramsParcels = { payerId: currentUserId, paymentDate: row.paymentdate, pageSize: 1000 }
      const resParcels = await request.get('/parcels/fees', { params: paramsParcels })
      let parcels = []
      if (resParcels && resParcels.code === 1) parcels = resParcels.data?.rows || resParcels.data || []
      else if (Array.isArray(resParcels)) parcels = resParcels

      const mapped = (parcels||[]).map(p => ({
        ...p,
        ownerName: (users.value.find(u => (u.userId||u.id) == p.ownerId) || {}).name || '',
        senderName: (users.value.find(u => (u.userId||u.id) == p.senderId) || {}).name || '',
        receiverName: (users.value.find(u => (u.userId||u.id) == p.receiverId) || {}).name || ''
      }))

      dialogParcelsItems.value = mapped
      dialogParcelsTitle.value = 'Parcels'
      dialogParcelsHeaderDate.value = formatYMD(row.paymentdate) || ''
      showParcelsDialog.value = true
      return
    }

    // when statement type is 'I' call /items twice in collection-specific order and merge
    if (type === 'I') {
      const payerId = ownerId
      const payeeId = keeperId
      const date = row.paymentdate

      // first: owner = payee (收款方), keeper = payer (支付方), isConsigned = 1
      const params1 = { ownerId: payeeId, keeperId: payerId, isConsigned: 1, paymentDate: date, pageSize: 1000 }
      const res1 = await request.get('/items', { params: params1 })
      let items1 = []
      if (res1 && res1.code === 1) items1 = res1.data?.rows || res1.data || []
      else if (Array.isArray(res1)) items1 = res1

      // second: owner = payer, keeper = payee, isConsigned = 0
      const params2 = { ownerId: payerId, keeperId: payeeId, isConsigned: 0, paymentDate: date, pageSize: 1000 }
      const res2 = await request.get('/items', { params: params2 })
      let items2 = []
      if (res2 && res2.code === 1) items2 = res2.data?.rows || res2.data || []
      else if (Array.isArray(res2)) items2 = res2

      // merge results
      let items = (items1 || []).concat(items2 || [])

      items = items.map(it => ({
        ...it,
        TotalFee: (Number(it.inspectFee||0) + Number(it.repairFee||0) + Number(it.keepFee||0) + Number(it.packingFee||0) + Number(it.otherFee||0))
      }))

      dialogItems.value = items
      dialogTitle.value = formatYMD(row.paymentdate) || 'Items'
      showItemsDialog.value = true
      return
    }

    const params = { ownerId, keeperId, paymentDate: row.paymentdate, pageSize: 1000 }
    const res = await request.get('/items', { params })
    let items = []
    if (res && res.code === 1) items = res.data?.rows || []
    else if (Array.isArray(res)) items = res

    // default: show item dialog
    items = items.map(it => ({
      ...it,
      TotalFee: (Number(it.inspectFee||0) + Number(it.repairFee||0) + Number(it.keepFee||0) + Number(it.packingFee||0) + Number(it.otherFee||0))
    }))

    dialogItems.value = items
    dialogTitle.value = formatYMD(row.paymentdate) || 'Items'
    showItemsDialog.value = true
  } catch (e) {
    console.error('Failed to fetch items for date click', e)
    dialogItems.value = []
    showItemsDialog.value = true
  }
}

</script>
