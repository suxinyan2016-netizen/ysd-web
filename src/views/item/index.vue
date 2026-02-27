<template>
  <div>
    <h1>{{ $t('menu.item.title') }}</h1>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:8px; align-items:center;">
      <el-input v-model="q.itemNo" :placeholder="$t('menu.item.fields.itemNo')" style="width:200px" />
      <el-select v-model="q.dictId" :placeholder="$t('menu.item.fields.category')" clearable style="width:180px">
        <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
      </el-select>
      <el-input v-model="q.sellerPart" :placeholder="$t('menu.item.fields.sellerPart')" style="width:220px" />
      <el-input v-model="q.mfrPart" :placeholder="$t('menu.item.fields.mfrPart')" style="width:220px" />
      <el-select v-model="q.ownerId" :placeholder="$t('menu.item.fields.owner')" clearable style="width:180px">
        <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
      </el-select>
      <el-select v-model="q.keeperId" :placeholder="$t('menu.item.fields.keeper')" clearable style="width:180px">
        <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
      </el-select>
      <el-select v-model="q.itemStatus" :placeholder="$t('menu.item.fields.status')" clearable style="width:120px">
        <el-option :label="$t('menu.item.statuses.all')" :value="''" />
        <el-option :label="$t('menu.item.statuses.pending')" :value="0" />
        <el-option :label="$t('menu.item.statuses.received')" :value="1" />
        <el-option :label="$t('menu.item.statuses.sent')" :value="2" />
        <el-option :label="$t('menu.item.statuses.exception')" :value="9" />
      </el-select>
      <el-input v-model="q.minStocklife" :placeholder="$t('menu.item.fields.stocklife') + '>'" type="number" style="width:140px" />
      <el-select v-model="q.ispaid" :placeholder="$t('menu.item.fields.isPaid')" clearable style="width:120px">
        <el-option :label="$t('menu.item.paidStatus.all')" :value="''" />
        <el-option :label="$t('menu.item.paidStatus.unpaid')" :value="0" />
        <el-option :label="$t('menu.item.paidStatus.paid')" :value="1" />
      </el-select>
      <el-button type="primary" @click="onSearch">{{ $t('menu.item.buttons.search') }}</el-button>
      <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">{{ $t('menu.item.buttons.clear') }}</el-button>
      <el-button type="primary" @click="onAdd">{{ $t('menu.item.buttons.addItem') }}</el-button>
      <el-button type="danger" @click="onDeleteSelected">{{ $t('menu.item.buttons.deleteSelected') }}</el-button>
    </div>

    <ItemTable ref="tableRef" :data="itemList" :row-key="'itemId'" :selectable="true" :compute-stocklife="computeStocklife" @selection-change="onSelectionChange">
      <template #operation="{row}">
        <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">{{ $t('menu.item.actions.detail') }}</el-button>
        <el-button v-if="row.itemStatus===0" size="small" type="primary" @click="onEdit(row)">{{ $t('menu.item.actions.edit') }}</el-button>
        <el-button v-if="row.itemStatus===1 && canOperateItem(row)" size="small" @click="onAddToParcel(row)" style="background:#e6f7ff; border:1px solid #b3e5ff; color:#006c9c">{{ $t('menu.item.actions.addToParcel') }}</el-button>
        <el-button v-if="row.itemStatus===1 && canOperateItem(row)" size="small" @click="onAbandon(row)" style="background:#fff1f0; border:1px solid #ffb3b3; color:#a80000">{{ $t('menu.item.actions.abandon') }}</el-button>
      </template>
    </ItemTable>
    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>

    <ItemDetail v-model:visible="detailVisible" title="商品详情" :detail-data="detailData" width="960px" label-width="154px">
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">关闭</el-button>
      </template>
    </ItemDetail>
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="864px" @close="onDialogClose">
    <el-form :model="editing" label-width="132px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="商品号"><el-input v-model="editing.itemNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="类别">
            <el-select v-model="editing.dictId" placeholder="类别" clearable>
              <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
            </el-select>
          </el-form-item></el-col>

          <el-col :span="12"><el-form-item label="商品名"><el-input v-model="editing.sellerPart" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="厂商料号"><el-input v-model="editing.mfrPart" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="数量"><el-input-number v-model="editing.qty" :min="1" style="width:100%" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="状态"><el-select v-model="editing.itemStatus" placeholder="请选择状态"><el-option label="待验收" :value="0" /><el-option label="已验收" :value="1" /><el-option label="已寄出" :value="2" /><el-option label="异常" :value="9" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="物主"><el-input v-model="editing.owner" disabled /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="保管员"><el-select v-model="editing.keeperId" placeholder="请选择保管员">
            <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
          </el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收货包裹号"><el-input v-model="editing.receivePackageNo" disabled /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="寄出包裹号"><el-input v-model="editing.sendPackageNo" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="收货日期"><el-date-picker v-model="editing.receivedDate" type="date" placeholder="请选择日期" style="width:100%" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="寄出日期"><el-date-picker v-model="editing.sendDate" type="date" placeholder="请选择日期" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="经销商接收日期"><el-date-picker v-model="editing.dealerReceivedDate" type="date" placeholder="请选择日期" style="width:100%" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="客户反馈"><el-input type="textarea" v-model="editing.customerFeedback" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="检验结果"><el-input v-model="editing.iqcResult" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="原订单号"><el-input v-model="editing.originalOrder" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="原退货号"><el-input v-model="editing.originalReturnNo" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="是否拆包"><el-select v-model="editing.isUnpacked"><el-option label="未拆包" :value="0" /><el-option label="已拆包" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="良品"><el-select v-model="editing.isGood"><el-option label="良品" :value="1" /><el-option label="次品" :value="0" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="检验费"><el-input-number v-model="editing.inspectFee" :min="0" style="width:100%" /></el-form-item></el-col>
          
          <el-col :span="12"><el-form-item label="维修费"><el-input-number v-model="editing.repairFee" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="保管费"><el-input-number v-model="editing.keepFee" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="装箱费"><el-input-number v-model="editing.packingFee" :min="0" style="width:100%" /></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="其他费用"><el-input-number v-model="editing.otherFee" :min="0" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="是否结算"><el-select v-model="editing.isPaid"><el-option label="未结算" :value="0" /><el-option label="已结算" :value="1" /></el-select></el-form-item></el-col>

          <el-col :span="24"><el-form-item label="费用备注"><el-input type="textarea" v-model="editing.feeRemarks" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="付款日期"><el-date-picker v-model="editing.paymentDate" type="date" placeholder="请选择日期" style="width:100%" /></el-form-item></el-col>

          <el-col :span="24"><el-form-item label="备注"><el-input type="textarea" v-model="editing.remark" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="onDialogClose">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryInfoApi, addApi, updateApi, deleteApi } from '@/api/item'
import { findByGroupApi } from '@/api/dict'
import ItemDetail from '@/components/common/ItemDetail.vue'
import ItemTable from '@/components/common/ItemTable.vue'
import { formatFee, computeTotalFee } from '@/utils/fees'
import { useItemActions } from '@/composables/useItemActions'
import { useUser } from '@/composables/useUser'
import { useItemsList } from '@/composables/useItemsList'

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

// dict options for category filter
const dictOptions = ref([])

const loadDictOptions = async () => {
  try {
    // Try by group name 'Hardware' first
    let res = await findByGroupApi('Hardware')
    let list = []
    if (res && res.code === 1) list = res.data || []
    else if (Array.isArray(res)) list = res

    // If empty, try using numeric key 2 (some backends store group as numeric)
    if ((!list || list.length === 0)) {
      const res2 = await findByGroupApi(2)
      if (res2 && res2.code === 1) list = res2.data || []
      else if (Array.isArray(res2)) list = res2
    }

    dictOptions.value = list || []
    // ensure items have dictId/dictName (map if necessary)
    dictOptions.value = dictOptions.value.map(d => ({ dictId: d.dictId ?? d.id ?? d.value, dictName: d.dictName ?? d.name ?? d.label }))
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
const selectedIds = ref([])
const { users, currentUser, getCurrentUser, queryAllUsers, getUserName } = useUser()

// Permission check: userId=1 or current user is item owner
const canOperateItem = (row) => {
  const userId = currentUser.value?.userId
  return userId === 1 || userId === row.ownerId
}

// fetchList/onSearch/onClear/onSizeChange/onCurrentChange provided by useItemsList

const onSelectionChange = (selection) => { selectedIds.value = selection.map(s => s.itemId) }

  const onAdd = () => {
  dialogTitle.value = '添加商品'
  editing.value = {
    isUnpacked: 1,
    isGood: 1,
    isPaid: 0,
    ownerId: currentUser.value.userId || null,
    owner: currentUser.value.name || ''
  }
  dialogVisible.value = true
}

// editing/detail handlers provided by useItemActions

// editing/detail handlers provided by useItemActions

// single-item delete handled by useItemActions

const onDeleteSelected = async () => {
  if (!selectedIds.value.length) { ElMessage.info('未选择项'); return }
  try {
    await ElMessageBox.confirm('确定删除所选项吗？','警告')
    const res = await deleteApi(selectedIds.value)
    if (res && res.code === 1) { ElMessage.success('删除成功'); fetchList(); selectedIds.value = [] }
    else ElMessage.error(res.msg || '删除失败')
  } catch (err) {}
}

onMounted(() => { fetchList(); getCurrentUser(); queryAllUsers(); loadDictOptions() })

const onDialogClose = () => {
  dialogVisible.value = false
  editing.value = {}
}

const statusClass = (s) => {
  if (s === 2) return 'status-sent'
  if (s === 0) return 'status-inspecting'
  if (s === 1) return 'status-received'
  if (s === 9) return 'status-exception'
  return ''
}

</script>

<style scoped>
.container { margin: 2px 0 }
.status-cell { padding:2px 4px; border-radius:4px; display:inline-block; min-width:72px; text-align:center; }
.status-sent { background:#9e9e9e; color:#fff }
.status-inspecting { background:#f7d774; color:#2b2b2b }
.status-received { background:#66bb6a; color:#fff }
.status-exception { background:#e57373; color:#fff }
</style>
