<template>
  <div>
    <h2>{{ $t('menu.item.warehouseInventory') }}</h2>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px; display:flex; gap:8px; align-items:center;">
      <el-input v-model="q.itemNo" placeholder="商品号" style="width:200px" />
      <el-select v-model="q.dictId" placeholder="类别" clearable style="width:180px">
        <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
      </el-select>
      <el-input v-model="q.sellerPart" placeholder="商品名" style="width:220px" />
      <el-input v-model="q.mfrPart" placeholder="厂商料号" style="width:220px" />
      <el-select v-model="q.ownerId" placeholder="物主" clearable style="width:180px">
        <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
      </el-select>
      <el-input v-model="q.minStocklife" placeholder="保质期>" type="number" style="width:140px" />
      <el-input v-model="q.receivePackageNo" placeholder="收货包裹号" style="width:200px" />
      <el-input v-model="q.sendPackageNo" placeholder="寄出包裹号" style="width:200px" />
      <el-select v-model="q.itemStatus" placeholder="状态" clearable style="width:120px">
        <el-option label="全部" :value="''" />
        <el-option label="待验收" :value="0" />
        <el-option label="已验收" :value="1" />
        <el-option label="已寄出" :value="2" />
        <el-option label="异常" :value="9" />
      </el-select>
      <el-select v-model="q.ispaid" placeholder="是否结算" clearable style="width:120px">
          <el-option label="全部" :value="''" />
        <el-option label="未结算" :value="0" />
        <el-option label="已结算" :value="1" />
      </el-select>
      <el-button type="primary" @click="onSearch">查询</el-button>
      <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">清除</el-button>
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
    
    <ItemDetail v-model="detailVisible" title="商品详情" :detail-data="detailData" width="900px" label-width="140px">
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">关闭</el-button>
      </template>
    </ItemDetail>

    <!-- Edit Dialog -->
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="720px" @close="dialogVisible=false">
      <el-form :model="editing" label-width="140px">
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.itemNo')"><div>{{ editing.itemNo }}</div></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.category')">
            <el-select v-model="editing.dictId" :placeholder="$t('menu.item.fields.category')" clearable style="width:100%">
              <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
            </el-select>
          </el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('menu.item.fields.owner')"><div>{{ editing.owner }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.inspectFee')"><el-input v-model="editing.inspectFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.repairFee')"><el-input v-model="editing.repairFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.keepFee')"><el-input v-model="editing.keepFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.packingFee')"><el-input v-model="editing.packingFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.otherFee')"><el-input v-model="editing.otherFee" placeholder="0.00" style="width:100%" class="fee-input" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.totalFee')"><div style="text-align:right; font-weight:600">{{ computeEditTotal() }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isUnpacked')"><el-select v-model="editing.isUnpacked" :placeholder="$t('menu.item.fields.isUnpacked')" style="width:100%"><el-option :label="$t('menu.item.unpackedStatus.packed')" :value="0" /><el-option :label="$t('menu.item.unpackedStatus.unpacked')" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isGood')"><el-select v-model="editing.isGood" :placeholder="$t('menu.item.fields.isGood')" style="width:100%"><el-option :label="$t('menu.item.goodStatus.bad')" :value="0" /><el-option :label="$t('menu.item.goodStatus.good')" :value="1" /></el-select></el-form-item></el-col>
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
  onSearch,
  onClear,
  onSizeChange,
  onCurrentChange,
  computeStocklife
} = useItemsList({
  initialQ: { itemNo: '', sellerPart: '', mfrPart: '', ispaid: '', ownerId: null, itemStatus: '', minStocklife: null, dictId: '' },
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


</script>

<style scoped>
/* basic styles */
.fee-input :deep(.el-input__inner) {
  text-align: right;
}
</style>
