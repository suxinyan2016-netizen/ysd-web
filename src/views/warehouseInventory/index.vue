<template>
  <div>
    <h2>{{ $t('menu.item.warehouseInventory') }}</h2>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px;">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-input v-model="q.itemNo" :placeholder="$t('menu.item.fields.itemNo')" style="width:200px" />
        <el-input v-model="q.slot" :placeholder="$t('menu.item.fields.slot')" style="width:180px" />
        <el-select v-model="q.dictId" :placeholder="$t('menu.item.fields.category')" clearable style="width:180px">
          <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
        </el-select>
        <el-input v-model="q.sellerPart" :placeholder="$t('menu.item.fields.sellerPart')" style="width:220px" />
        <el-input v-model="q.mfrPart" :placeholder="$t('menu.item.fields.mfrPart')" style="width:220px" />
        <el-select v-model="q.ownerId" :placeholder="$t('menu.item.fields.owner')" clearable style="width:180px">
          <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
        </el-select>
        <el-input v-model="q.minStocklife" :placeholder="$t('menu.item.fields.stocklife') + '>'" type="number" style="width:105px" />
      </div>
      <div style="margin-top:8px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-input v-model="q.receivePackageNo" :placeholder="$t('menu.item.fields.receivePackageNo')" style="width:200px" />
        <el-input v-model="q.sendPackageNo" :placeholder="$t('menu.item.fields.sendPackageNo')" style="width:200px" />
        <el-select v-model="q.itemStatus" :placeholder="$t('menu.item.fields.status')" clearable style="width:120px">
          <el-option :label="$t('menu.item.statuses.all')" :value="''" />
          <el-option :label="$t('menu.item.statuses.pending')" :value="0" />
          <el-option :label="$t('menu.item.statuses.received')" :value="1" />
          <el-option :label="$t('menu.item.statuses.sent')" :value="2" />
          <el-option :label="$t('menu.item.statuses.exception')" :value="9" />
        </el-select>
        <el-select v-model="q.ispaid" :placeholder="$t('menu.item.fields.isPaid')" clearable style="width:120px">
          <el-option :label="$t('menu.item.paidStatus.all')" :value="''" />
          <el-option :label="$t('menu.item.paidStatus.unpaid')" :value="0" />
          <el-option :label="$t('menu.item.paidStatus.paid')" :value="1" />
        </el-select>
        <el-select v-model="q.needTest" :placeholder="$t('menu.parcel_dialog.demands.needTest')" clearable style="width:120px">
          <el-option :label="$t('menu.item.statuses.all')" :value="''" />
          <el-option :label="$t('menu.item.consignedStatus.yes')" :value="1" />
          <el-option :label="$t('menu.item.consignedStatus.no')" :value="0" />
        </el-select>
        <el-select v-model="q.needRepair" :placeholder="$t('menu.parcel_dialog.demands.needRepair')" clearable style="width:120px">
          <el-option :label="$t('menu.item.statuses.all')" :value="''" />
          <el-option :label="$t('menu.item.consignedStatus.yes')" :value="1" />
          <el-option :label="$t('menu.item.consignedStatus.no')" :value="0" />
        </el-select>
        <el-select v-model="q.isGood" :placeholder="$t('menu.item.fields.isGood')" clearable style="width:120px">
          <el-option :label="$t('menu.item.statuses.all')" :value="''" />
          <el-option :label="$t('menu.item.goodStatus.good')" :value="1" />
          <el-option :label="$t('menu.item.goodStatus.bad')" :value="0" />
        </el-select>
        <el-select v-model="q.isConsigned" :placeholder="$t('menu.item.fields.isConsigned')" clearable style="width:120px">
          <el-option :label="$t('menu.item.consignedStatus.all')" :value="''" />
          <el-option :label="$t('menu.item.consignedStatus.no')" :value="0" />
          <el-option :label="$t('menu.item.consignedStatus.yes')" :value="1" />
        </el-select>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">清除</el-button>
      </div>
    </div>

    <ItemTable ref="tableRef" :data="itemList" :row-key="'itemId'" :compute-stocklife="computeStocklife">
      <template #operation="{row}">
        <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">详情</el-button>
        <el-button size="small" type="primary" @click="onEdit(row)">编辑</el-button>
      </template>
    </ItemTable>

    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange" @current-change="onCurrentChange" />
    </div>
    
    <ItemDetail v-model="detailVisible" :title="$t('menu.item.dialogs.itemDetail')" :detail-data="detailData" width="960px" label-width="154px">
      <template #default>
        <el-col :span="24"><el-form-item :label="$t('menu.item.fields.isConsigned')"><div>{{ detailData.isConsigned === 1 ? $t('menu.item.consignedStatus.yes') : $t('menu.item.consignedStatus.no') }}</div></el-form-item></el-col>
        <template v-if="detailData.isConsigned === 1 || detailData.isConsigned === '1'">
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.commissionModel')"><div>{{ detailData.commissionModel === 1 ? $t('menu.item.commissionModel.options.proportion') : (detailData.commissionModel === 2 ? $t('menu.item.commissionModel.options.fixed') : '') }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.commissionSet')"><div>{{ formatFee(detailData.commissionSet) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.market')"><div>{{ detailData.market }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.saleDate')"><div>{{ formatYMD(detailData.saleDate) }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.salePrice')"><div>{{ formatFee(detailData.salePrice) }}</div></el-form-item></el-col>
        </template>
      </template>
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">{{ $t('menu.item.actions.close') }}</el-button>
      </template>
    </ItemDetail>

    <!-- Edit Dialog -->
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="800px" @close="dialogVisible=false">
      <el-form :model="editing" label-width="80px">
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.itemNo')"><div>{{ editing.itemNo }}</div></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.category')">
            <el-select v-model="editing.dictId" :placeholder="$t('menu.item.fields.category')" clearable style="width:100%">
              <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.owner')"><div>{{ editing.owner }}</div></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.inspectFee')"><el-input v-model="editing.inspectFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.repairFee')"><el-input v-model="editing.repairFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.keepFee')"><el-input v-model="editing.keepFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.packingFee')"><el-input v-model="editing.packingFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.otherFee')"><el-input v-model="editing.otherFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.totalFee')"><div style="text-align:right; font-weight:600">{{ computeEditTotal() }}</div></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.isUnpacked')"><el-select v-model="editing.isUnpacked" :placeholder="$t('menu.item.fields.isUnpacked')" style="width:100%"><el-option :label="$t('menu.item.unpackedStatus.packed')" :value="0" /><el-option :label="$t('menu.item.unpackedStatus.unpacked')" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.isGood')"><el-select v-model="editing.isGood" :placeholder="$t('menu.item.fields.isGood')" style="width:100%"><el-option :label="$t('menu.item.goodStatus.bad')" :value="0" /><el-option :label="$t('menu.item.goodStatus.good')" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.slot')"><el-input v-model="editing.slot" :placeholder="$t('menu.item.fields.slot') || 'Slot'" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.remark')"><el-input type="textarea" v-model="editing.feeRemarks" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isPaid')"><el-select v-model="editing.ispaid" :placeholder="$t('menu.item.fields.isPaid')" style="width:100%"><el-option :label="$t('menu.item.paidStatus.unpaid')" :value="0" /><el-option :label="$t('menu.item.paidStatus.paid')" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.paymentDate')"><el-date-picker v-model="editing.paymentDate" type="date" :placeholder="$t('menu.item.placeholders.selectDate')" style="width:100%" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.remark')"><div>{{ editing.remark }}</div></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">{{ $t('menu.item.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="saveItem">{{ $t('menu.item.buttons.save') }}</el-button>
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
  onSearch: rawOnSearch,
  onClear,
  onSizeChange,
  onCurrentChange,
  computeStocklife

} = useItemsList({
    initialQ: { itemNo: '', sellerPart: '', mfrPart: '', ispaid: '', ownerId: null, itemStatus: 1, minStocklife: null, dictId: '', isConsigned: '', needTest: '', needRepair: '', isGood: '' },
  getFixedParams: () => ({ keeperId: currentUser.value.userId })
})

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

onMounted(async () => {
  await getCurrentUser()
  queryAllUsers()
  loadDictOptions()
  fetchList()
})

// wrap search to default itemStatus to 1 when clicking load/search
const onSearch = async () => {
  try {
    if (!q.itemStatus && q.itemStatus !== 0) q.itemStatus = 1
  } catch (e) {
    // ignore
  }
  return await rawOnSearch()
}

function formatYMD(v) {
  if (!v && v !== 0) return ''
  try { return (v || '').toString().split('T')[0] } catch (e) { return v }
}


</script>

<style scoped>
/* basic styles */
.fee-input :deep(.el-input__inner) {
  text-align: right;
}
</style>
