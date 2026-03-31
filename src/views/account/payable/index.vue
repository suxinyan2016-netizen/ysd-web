<template>
  <div>
    <h2>{{ $t('menu.account.payable') || '我的应付' }}</h2>

    <!-- 应付商品服务费及寄售货款 -->
    <el-card v-if="itemGroups.length" class="mb12">
      <template #header>
        <div class="clearfix">
          <span>{{ $t('account.payable.items.title') || '应付商品服务费及寄售货款' }}</span>
        </div>
      </template>
      <el-table :data="itemGroups" style="width:100%">
        <el-table-column prop="payto" :label="$t('account.fields.payto') || '收款人'" />
        <el-table-column prop="total" :label="$t('account.fields.total') || '应付总额'" align="right">
          <template #default="{row}">{{ fmt(row.total) }}</template>
        </el-table-column>
        <el-table-column label="" width="120">
          <template #default="{row}">
            <el-button type="text" @click="openItemDetails(row)">{{ $t('view') || '查看' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 应付包裹代付运费 -->
    <el-card v-if="parcelGroups.length" class="mb12">
      <template #header>
        <div class="clearfix">
          <span>{{ $t('account.payable.parcels.title') || '应付包裹代付运费' }}</span>
        </div>
      </template>
      <el-table :data="parcelGroups" style="width:100%">
        <el-table-column prop="payto" :label="$t('account.fields.payto') || '收款人'" />
        <el-table-column prop="total" :label="$t('account.fields.total') || '应付总额'" align="right">
          <template #default="{row}">{{ fmt(row.total) }}</template>
        </el-table-column>
        <el-table-column label="" width="120">
          <template #default="{row}">
            <el-button type="text" @click="openParcelDetails(row)">{{ $t('view') || '查看' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div style="text-align:right; margin-top:12px; font-size:18px; font-weight:600">
      {{ $t('account.total') || '合计' }}: <strong>{{ fmt(pageTotal) }}</strong>
    </div>

    <!-- Item details dialog -->
    <el-dialog v-model="showItemDialog" :title="dialogTitle" width="1500px">
      <el-table :data="pagedDialogItems" style="width:100%">
        <el-table-column type="selection" width="55" @selection-change="onItemSelectionChange" />
        <el-table-column prop="itemno" :label="$t('account.item.itemno') || '商品号'" min-width="180" fixed="left" />
        <el-table-column prop="sellerpart" :label="$t('account.item.name') || '商品名'" min-width="360" fixed="left" />
        <el-table-column prop="paidby" :label="$t('account.fields.paidby') || '付款人'" />
        <el-table-column prop="payto" :label="$t('account.fields.payto') || '收款人'" />
        <el-table-column prop="quantity" :label="$t('account.item.qty') || '数量'" align="right" >
          <template #default="{row}">{{ row.quantity ?? '' }}</template>
        </el-table-column>
        <el-table-column prop="sntno" :label="$t('account.item.sendno') || '寄出运单'" min-width="220" />
        <el-table-column prop="isconsigned" :label="$t('account.item.isconsigned') || '是否寄售'" min-width="160">
          <template #default="{row}">
            {{ row.isconsigned === 1 ? $t('menu.item.consignedStatus.yes') : $t('menu.item.consignedStatus.no') }}
          </template>
        </el-table-column>
        <el-table-column prop="commissionmodel" :label="$t('account.item.commissionModel') || '抽成方式'" min-width="200">
          <template #default="{row}">
            {{ row.commissionmodel === 1 ? $t('menu.item.commissionModel.options.proportion') : (row.commissionmodel === 2 ? $t('menu.item.commissionModel.options.fixed') : (row.commissionmodel || '')) }}
          </template>
        </el-table-column>
        <el-table-column prop="commissionset" :label="$t('account.item.commissionSet') || '抽成设定'" align="right"> 
          <template #default="{row}">{{ fmt(row.commissionset) }}</template>
        </el-table-column>
        <el-table-column prop="saleprice" :label="$t('account.item.saleprice') || '成交价格'" align="right"> 
          <template #default="{row}">{{ fmt(row.saleprice) }}</template>
        </el-table-column>
        <el-table-column prop="inspectfee" :label="$t('account.item.inspectfee') || '检验费'" align="right">
          <template #default="{row}">{{ fmt(row.inspectfee) }}</template>
        </el-table-column>
        <el-table-column prop="repairfee" :label="$t('account.item.repairfee') || '维修费'" align="right">
          <template #default="{row}">{{ fmt(row.repairfee) }}</template>
        </el-table-column>
        <el-table-column prop="keepfee" :label="$t('account.item.keepfee') || '保管费'" align="right">
          <template #default="{row}">{{ fmt(row.keepfee) }}</template>
        </el-table-column>
        <el-table-column prop="packingfee" :label="$t('account.item.packingfee') || '装箱费'" align="right">
          <template #default="{row}">{{ fmt(row.packingfee) }}</template>
        </el-table-column>
        <el-table-column prop="otherfee" :label="$t('account.item.otherfee') || '其它费用'" align="right">
          <template #default="{row}">{{ fmt(row.otherfee) }}</template>
        </el-table-column>
        <el-table-column prop="commisionfee" :label="$t('account.item.commisionfee') || '抽成费用'" align="right">
          <template #default="{row}">{{ fmt(row.commisionfee) }}</template>
        </el-table-column>
        <el-table-column prop="subtotalfee" :label="$t('account.item.subtotalfee') || '总费用'" align="right">
          <template #default="{row}">{{ fmt(row.subtotalfee) }}</template>
        </el-table-column>
      </el-table>
      <div style="display:flex; justify-content:flex-end; margin-top:8px">
        <el-pagination
          background
          size="small"
          layout="prev, pager, next"
          :total="dialogItems.length"
          :page-size="itemDialogPageSize"
          v-model:current-page="itemDialogPage"
        />
      </div>
      <div style="text-align:right; margin-top:8px">{{ $t('account.total') || '合计' }}: <strong>{{ fmt(dialogTotal) }}</strong></div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="settleSelectedItems">{{ $t('account.settle') || '结算' }}</el-button>
          <el-button @click="showItemDialog = false">{{ $t('close') || '关闭' }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Parcel details dialog -->
    <el-dialog v-model="showParcelDialog" :title="parcelDialogTitle" width="800px">
      <el-table :data="dialogParcels" style="width:100%">
        <el-table-column type="selection" width="55" @selection-change="onParcelSelectionChange" />
        <el-table-column prop="packageno" :label="$t('account.parcel.packageno') || '运单号'" />
        <el-table-column prop="paidby" :label="$t('account.fields.paidby') || '付款人'" />
        <el-table-column prop="payto" :label="$t('account.fields.payto') || '收款人'" />
        <el-table-column prop="fee" :label="$t('account.fields.fee') || '费用'" align="right">
          <template #default="{row}">{{ fmt(row.fee) }}</template>
        </el-table-column>
      </el-table>
      <div style="text-align:right; margin-top:8px">{{ $t('account.total') || '合计' }}: <strong>{{ fmt(parcelDialogTotal) }}</strong></div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="settleSelectedParcels">{{ $t('account.settle') || '结算' }}</el-button>
          <el-button @click="showParcelDialog = false">{{ $t('close') || '关闭' }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getItemFee, getParcelFee, settleItems, settleParcels } from '@/api/fee'
import { getTokenInfo } from '@/utils/tokenManager'
import { ElMessage, ElMessageBox } from 'element-plus'

const { t } = useI18n()

const itemGroups = ref([])
const parcelGroups = ref([])

const pageTotal = computed(() => {
  const sum = (groups) => (groups || []).reduce((s, g) => s + Number(g.total || 0), 0)
  return sum(itemGroups.value) + sum(parcelGroups.value)
})

const showItemDialog = ref(false)
const dialogItems = ref([])
const dialogTitle = ref('')
const dialogTotal = ref(0)

// pagination for item dialog
const itemDialogPage = ref(1)
const itemDialogPageSize = ref(10)
const pagedDialogItems = computed(() => {
  const start = (itemDialogPage.value - 1) * itemDialogPageSize.value
  return (dialogItems.value || []).slice(start, start + itemDialogPageSize.value)
})
const selectedItemRows = ref([])
const currentItemGroup = ref(null)

const showParcelDialog = ref(false)
const dialogParcels = ref([])
const parcelDialogTitle = ref('')
const parcelDialogTotal = ref(0)
const selectedParcelRows = ref([])
const currentParcelGroup = ref(null)

function fmt(v) {
  if (v == null || v === '') return '0.00'
  const n = Number(v)
  if (Number.isNaN(n)) return '0.00'
  return n.toFixed(2)
}

async function load() {
  const user = getTokenInfo().loginUser || JSON.parse(localStorage.getItem('loginUser') || '{}') || {}
  const uid = user.userId ?? user.id ?? user.userid
  if (!uid) return

  // item fees where current user is paidby (user pays) -> group by payto
  try {
    const res = await getItemFee(uid, null)
    const rows = (res && res.data) ? (Array.isArray(res.data) ? res.data : (res.data.rows || [])) : (Array.isArray(res) ? res : [])
    const map = new Map()
    rows.forEach(r => {
      const key = r.paytoid || 0
      const name = r.payto || t('unknown')
      const subtotal = Number(r.subtotalfee || 0)
      if (!map.has(key)) map.set(key, { paytoid: key, payto: name, total: 0 })
      map.get(key).total += subtotal
    })
    itemGroups.value = Array.from(map.values())
  } catch (e) { itemGroups.value = [] }

  // parcel fees where current user is paidby (user pays) -> group by payto
  try {
    const res = await getParcelFee(uid, null)
    const rows = (res && res.data) ? (Array.isArray(res.data) ? res.data : (res.data.rows || [])) : (Array.isArray(res) ? res : [])
    const map = new Map()
    rows.forEach(r => {
      const key = r.paytoid || 0
      const name = r.payto || t('unknown')
      const fee = Number(r.fee || 0)
      if (!map.has(key)) map.set(key, { paytoid: key, payto: name, total: 0 })
      map.get(key).total += fee
    })
    parcelGroups.value = Array.from(map.values())
  } catch (e) { parcelGroups.value = [] }
}

async function openItemDetails(group) {
  const user = getTokenInfo().loginUser || JSON.parse(localStorage.getItem('loginUser') || '{}') || {}
  const uid = user.userId ?? user.id ?? user.userid
  if (!uid) return
  const paytoid = group.paytoid
  try {
    const res = await getItemFee(uid, paytoid)
    const rows = (res && res.data) ? (Array.isArray(res.data) ? res.data : (res.data.rows || [])) : (Array.isArray(res) ? res : [])
    dialogItems.value = rows
    itemDialogPage.value = 1
    selectedItemRows.value = []
    currentItemGroup.value = group
    dialogTotal.value = rows.reduce((s, r) => s + Number(r.subtotalfee || 0), 0)
    dialogTitle.value = `${group.payto} - ${t('account.payable.items.title') || '应付明细'}`
    showItemDialog.value = true
  } catch (e) { }
}

async function openParcelDetails(group) {
  const user = getTokenInfo().loginUser || JSON.parse(localStorage.getItem('loginUser') || '{}') || {}
  const uid = user.userId ?? user.id ?? user.userid
  if (!uid) return
  const paytoid = group.paytoid
  try {
    const res = await getParcelFee(uid, paytoid)
    const rows = (res && res.data) ? (Array.isArray(res.data) ? res.data : (res.data.rows || [])) : (Array.isArray(res) ? res : [])
    dialogParcels.value = rows
    selectedParcelRows.value = []
    currentParcelGroup.value = group
    parcelDialogTotal.value = rows.reduce((s, r) => s + Number(r.fee || 0), 0)
    parcelDialogTitle.value = `${group.payto} - ${t('account.payable.parcels.title') || '应付包裹运费明细'}`
    showParcelDialog.value = true
  } catch (e) { }
}

function onItemSelectionChange(selection) { selectedItemRows.value = selection || [] }
function onParcelSelectionChange(selection) { selectedParcelRows.value = selection || [] }

async function settleSelectedItems() {
  const ids = (selectedItemRows.value || []).map(r => r.itemId ?? r.itemid ?? r.id).filter(Boolean)
  if (!ids.length) { ElMessage.error(t('account.select_to_settle') || '请选择要结算的商品'); return }
  try {
    await ElMessageBox.confirm(t('account.confirm_settle') || '确定结算选中的商品吗？', t('confirm') || '确认')
    await settleItems(ids)
    ElMessage.success(t('account.settle_success') || '结算成功')
    // refresh dialog and groups
    if (currentItemGroup.value) await openItemDetails(currentItemGroup.value)
    await load()
  } catch (err) { }
}

async function settleSelectedParcels() {
  const ids = (selectedParcelRows.value || []).map(r => r.parcelId ?? r.id ?? r.packageno).filter(Boolean)
  if (!ids.length) { ElMessage.error(t('account.select_to_settle') || '请选择要结算的包裹'); return }
  try {
    await ElMessageBox.confirm(t('account.confirm_settle') || '确定结算选中的包裹吗？', t('confirm') || '确认')
    await settleParcels(ids)
    ElMessage.success(t('account.settle_success') || '结算成功')
    if (currentParcelGroup.value) await openParcelDetails(currentParcelGroup.value)
    await load()
  } catch (err) { }
}

onMounted(() => load())
</script>

<style scoped>
.mb12 { margin-bottom: 12px }
</style>
