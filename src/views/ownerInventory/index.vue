<template>
  <div>
    <h1>{{ $t('menu.item.ownerInventory') }}</h1>

    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px;">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-input v-model="q.itemNo" :placeholder="$t('menu.item.fields.itemNo')" style="width:200px" />
        <el-select v-model="q.dictId" :placeholder="$t('menu.item.fields.category')" clearable style="width:180px">
          <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
        </el-select>
        <el-input v-model="q.sellerPart" :placeholder="$t('menu.item.fields.sellerPart')" style="width:220px" />
        <el-input v-model="q.mfrPart" :placeholder="$t('menu.item.fields.mfrPart')" style="width:220px" />
        <el-input v-model="q.receivePackageNo" :placeholder="$t('menu.item.fields.receivePackageNo')" style="width:200px" />
        <el-input v-model="q.sendPackageNo" :placeholder="$t('menu.item.fields.sendPackageNo')" style="width:200px" />
      </div>
      <div style="margin-top:8px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-input v-model="q.minStocklife" :placeholder="$t('menu.item.fields.stocklife') + '>'" type="number" style="width:105px" />
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
        <el-button type="primary" @click="onSearch">{{ $t('menu.item.buttons.search') }}</el-button>
        <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">{{ $t('menu.item.buttons.clear') }}</el-button>
        <el-button type="info" @click="onAddSelectedToParcel" style="background:#e6f7ff; border:1px solid #b3e5ff; color:#006c9c">{{ $t('menu.item.buttons.addToParcel') }}</el-button>
        <el-button type="primary" @click="onCheckout" style="margin-left:6px">{{ $t('menu.item.buttons.checkout') }}</el-button>
      </div>
    </div>

    <ItemTable ref="tableRef" :data="itemList" :row-key="'itemId'" :selectable="true" :compute-stocklife="computeStocklife" :fixed-left="true" :operation-width="336" @selection-change="onSelectionChange">
      <template #operation="{row}">
        <el-button size="small" @click="viewDetail(row)" style="background:#e6ffed; border:1px solid #b6f0c0; color:#2b7a2b">{{ $t('menu.item.actions.detail') }}</el-button>
        <el-button v-if="row.itemStatus===0" size="small" type="primary" @click="onEdit(row)">{{ $t('menu.item.actions.edit') }}</el-button>
        <el-button v-if="row.itemStatus===1 && row.qty>1 && canOperateItem(row)" size="small" @click="onSplit(row)" style="background:#fff7e6; border:1px solid #ffd966; color:#7a5a00">{{ $t('menu.item.actions.split') }}</el-button>
          <el-button v-if="row.itemStatus===1 && canOperateItem(row)" size="small" @click="onAddToParcel(row)" style="background:#e6f7ff; border:1px solid #b3e5ff; color:#006c9c">{{ $t('menu.item.actions.addToParcel') }}</el-button>

          <el-popover placement="left" width="160" trigger="click">
            <div class="other-actions-popover" style="display:flex;flex-direction:column;gap:8px;padding:6px;align-items:stretch">
              <!-- keep original visibility logic for split/consign/abandon -->
              <el-button v-if="row.itemStatus===1 && row.qty>1 && canOperateItem(row)" size="small" type="text" @click="onSplit(row)">{{ $t('menu.item.actions.split') }}</el-button>
              <el-button v-if="row.itemStatus===1 && (!row.isConsigned || row.isConsigned===0) && canOperateItem(row)" size="small" type="text" @click="openConsignDialog(row)">{{ $t('menu.item.actions.consign') }}</el-button>
              <el-button v-if="row.itemStatus===1 && canOperateItem(row)" size="small" type="text" @click="onAbandon(row)">{{ $t('menu.item.actions.abandon') }}</el-button>
              <!-- Apply/Cancel Test -->
              <el-button v-if="row.itemStatus===1 && (row.needTest !== 1 && row.needTest !== '1')" size="small" type="text" @click="openApplyTest(row)">{{ $t('menu.item.actions.applyTest') }}</el-button>
              <el-button v-else-if="row.itemStatus===1 && (row.needTest === 1 || row.needTest === '1') && (row.isTested !== 1 && row.isTested !== '1')" size="small" type="text" @click="cancelTest(row)">{{ $t('menu.item.actions.cancelTest') }}</el-button>
              <!-- Apply/Cancel Repair -->
              <el-button v-if="row.itemStatus===1 && (row.needRepair !== 1 && row.needRepair !== '1')" size="small" type="text" @click="openApplyRepair(row)">{{ $t('menu.item.actions.applyRepair') }}</el-button>
              <el-button v-else-if="row.itemStatus===1 && (row.needRepair === 1 || row.needRepair === '1') && (row.isRepaired !== 1 && row.isRepaired !== '1')" size="small" type="text" @click="cancelRepair(row)">{{ $t('menu.item.actions.cancelRepair') }}</el-button>
              <el-button v-if="(row.needTest === 1 || row.needTest === '1') && (row.isTested === 1 || row.isTested === '1')" size="small" type="text" @click="openTestDetail(row)">测试详情</el-button>
              <el-button v-if="(row.needRepair === 1 || row.needRepair === '1') && (row.isRepaired === 1 || row.isRepaired === '1')" size="small" type="text" @click="openRepairDetail(row)">维修详情</el-button>
            </div>
            <template #reference>
              <el-button size="small">{{ $t('menu.item.actions.otherActions') || '其它操作' }}</el-button>
            </template>
          </el-popover>
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
          <!-- commissionFee rendered by ItemDetail before totalFee -->
        </template>
      </template>
      <template #footer>
        <el-button type="primary" @click="detailVisible=false">{{ $t('menu.item.actions.close') }}</el-button>
      </template>
    </ItemDetail>

    <!-- Split Dialog -->
    <el-dialog :model-value="splitVisible" :title="$t('menu.item.dialogs.splitItem')" width="420px" @close="splitVisible=false">
      <div>{{ $t('menu.item.dialogs.currentQty') }}: {{ splitInfo.qty }}</div>
      <el-form>
        <el-form-item :label="$t('menu.item.dialogs.splitQty')">
          <el-input-number v-model="splitInfo.splitQty" :min="1" :max="splitInfo.qty-1" :precision="0" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="splitVisible=false">{{ $t('menu.item.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="confirmSplit">{{ $t('menu.item.buttons.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Consign Dialog -->
    <el-dialog :model-value="consignDialogVisible" :title="$t('menu.item.dialogs.consignTitle')" width="420px" @close="consignDialogVisible=false">
      <el-form :model="consignInfo" label-width="120px">
        <el-form-item :label="$t('menu.item.fields.commissionModel')">
          <el-select v-model="consignInfo.commissionModel">
            <el-option :label="$t('menu.item.commissionModel.options.proportion')" :value="1" />
            <el-option :label="$t('menu.item.commissionModel.options.fixed')" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('menu.item.fields.commissionSet')">
          <el-input-number v-model="consignInfo.commissionSet" :step="0.01" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('menu.item.fields.market')">
          <el-input v-model="consignInfo.market" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="consignDialogVisible=false">{{ $t('menu.item.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="confirmConsign">{{ $t('menu.item.buttons.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog (minimal, reused fields) -->
    <el-dialog :model-value="dialogVisible" :title="dialogTitle" width="864px" @close="onDialogClose">
      <el-form :model="editing" label-width="132px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.itemNo')"><el-input v-model="editing.itemNo" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.owner')"><el-input v-model="editing.owner" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.keeper')"><el-select v-model="editing.keeperId" :placeholder="$t('menu.item.placeholders.selectKeeper')">
            <el-option v-for="u in users" :key="u.userId" :label="u.name" :value="u.userId" />
          </el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.receivePackageNo')"><el-input v-model="editing.receivePackageNo" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.receivedDate')"><el-date-picker v-model="editing.receivedDate" type="date" :placeholder="$t('menu.item.placeholders.selectDate')" style="width:100%" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sendPackageNo')"><el-input v-model="editing.sendPackageNo" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sendDate')"><el-date-picker v-model="editing.sendDate" type="date" :placeholder="$t('menu.item.placeholders.selectDate')" style="width:100%" disabled /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.qty')"><el-input-number v-model="editing.qty" :min="1" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.status')"><el-select v-model="editing.itemStatus" :placeholder="$t('menu.item.placeholders.selectStatus')"><el-option :label="$t('menu.item.statuses.pending')" :value="0" /><el-option :label="$t('menu.item.statuses.received')" :value="1" /><el-option :label="$t('menu.item.statuses.sent')" :value="2" /><el-option :label="$t('menu.item.statuses.exception')" :value="9" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isUnpacked')"><el-select v-model="editing.isUnpacked"><el-option :label="$t('menu.item.unpackedStatus.packed')" :value="0" /><el-option :label="$t('menu.item.unpackedStatus.unpacked')" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isGood')"><el-select v-model="editing.isGood"><el-option :label="$t('menu.item.goodStatus.bad')" :value="0" /><el-option :label="$t('menu.item.goodStatus.good')" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isPaid')"><el-select v-model="editing.isPaid"><el-option :label="$t('menu.item.paidStatus.unpaid')" :value="0" /><el-option :label="$t('menu.item.paidStatus.paid')" :value="1" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.originalOrder')"><el-input v-model="editing.originalOrder" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.originalReturnNo')"><el-input v-model="editing.originalReturnNo" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.customerFeedback')"><el-input type="textarea" v-model="editing.customerFeedback" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.remark')"><el-input type="textarea" v-model="editing.remark" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="onDialogClose">{{ $t('menu.item.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="saveItem">{{ $t('menu.item.buttons.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Apply Test Dialog -->
    <el-dialog :model-value="applyTestVisible" :title="$t('menu.item.dialogs.applyTest')" width="720px" @close="applyTestVisible=false">
      <el-form :model="detailData" label-width="140px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.itemNo')"><div>{{ detailData.itemNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.category')"><div>{{ detailData.dictName || detailData.category || '-' }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sellerPart')"><div>{{ detailData.sellerPart }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.mfrPart')"><div>{{ detailData.mfrPart }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.qty')"><div>{{ detailData.qty }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.customerFeedback')"><div>{{ detailData.customerFeedback }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isGood')"><div>{{ detailData.isGood === 1 ? $t('menu.item.consignedStatus.yes') : $t('menu.item.consignedStatus.no') }}</div></el-form-item></el-col>

          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.testProcedure')"><el-input v-model="applyTestForm.testProcedure" type="textarea" rows="3" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.testDemands')"><el-input v-model="applyTestForm.testDemands" type="textarea" rows="3" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="applyTestVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmApplyTest">提交</el-button>
      </template>
    </el-dialog>

    <!-- Apply Repair Dialog -->
    <el-dialog :model-value="applyRepairVisible" :title="$t('menu.item.dialogs.applyRepair')" width="720px" @close="applyRepairVisible=false">
      <el-form :model="detailData" label-width="140px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.itemNo')"><div>{{ detailData.itemNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.category')"><div>{{ detailData.dictName || detailData.category || '-' }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.sellerPart')"><div>{{ detailData.sellerPart }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.mfrPart')"><div>{{ detailData.mfrPart }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.qty')"><div>{{ detailData.qty }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.customerFeedback')"><div>{{ detailData.customerFeedback }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isGood')"><div>{{ detailData.isGood === 1 ? $t('menu.item.consignedStatus.yes') : $t('menu.item.consignedStatus.no') }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.isTested')"><div>{{ detailData.isTested === 1 ? $t('menu.item.labels.completed') : $t('menu.item.labels.notCompleted') }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('menu.item.fields.testProcedure')"><div>{{ detailData.testProcedure }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.testDemands')"><div>{{ detailData.testDemands }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="$t('menu.item.fields.testResult')"><div>{{ detailData.testResult }}</div></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="测试图片">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <div v-for="img in detailData._images || detailData.itemImages || []" :key="img.id || img" style="width:120px;height:120px;border:1px solid #ddd">
                <img :src="img.imageUrl || img.url || img" style="width:100%;height:100%;object-fit:contain" />
              </div>
            </div>
          </el-form-item></el-col>

          <el-col :span="24"><el-form-item label="维修步骤"><el-input v-model="applyRepairForm.repairProcedure" type="textarea" rows="3" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="维修要求"><el-input v-model="applyRepairForm.repairDemands" type="textarea" rows="3" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="applyRepairVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmApplyRepair">提交</el-button>
      </template>
    </el-dialog>

    <!-- Test Detail Dialog (read-only) -->
    <el-dialog v-model="testDetailVisible" title="测试服务 - 详情" width="960px">
      <el-form label-position="top" :model="testDetailData">
        <el-row :gutter="12">
          <el-col :span="6"><el-form-item label="商品号"><div>{{ testDetailData.itemNo }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="商品名"><div>{{ testDetailData.sellerPart }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="类别"><div>{{ testDetailData.dictName }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="数量"><div>{{ testDetailData.qty }}</div></el-form-item></el-col>

          <el-col :span="6"><el-form-item label="货主"><div>{{ testDetailData.owner }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="收货运单号"><div>{{ testDetailData.receivePackageNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="测试结果"><div>{{ testDetailData.testResult }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="测试步骤"><div style="white-space:pre-wrap">{{ testDetailData.testProcedure }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="测试要求"><div style="white-space:pre-wrap">{{ testDetailData.testDemands }}</div></el-form-item></el-col>

          <el-col :span="6"><el-form-item label="是否良品"><div>{{ testDetailData.isGood === 1 ? '良品' : (testDetailData.isGood === 0 ? '次品' : '') }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="测试是否完成"><div>{{ testDetailData.isTested === 1 ? '已完成' : '未完成' }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="测试费用"><div style="text-align:right">{{ formatFee(testDetailData.inspectFee) }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="测试结果文本"><div>{{ testDetailData.testResult }}</div></el-form-item></el-col>

          <el-col :span="24"><el-form-item label="测试图片">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <div v-for="img in testDetailData._images || testDetailData.itemImages || []" :key="img.id || img" style="width:120px">
                <el-image :src="img.imageUrl || img.url || img" :preview-src-list="testDetailPreviewList" fit="contain" style="width:120px;height:120px;border:1px solid #ddd" />
                <div style="text-align:center;margin-top:6px"><a :href="(img.imageUrl || img.url || img)" target="_blank">原图</a></div>
              </div>
            </div>
          </el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="testDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Repair Detail Dialog (read-only) -->
    <el-dialog v-model="repairDetailVisible" title="维修服务 - 详情" width="960px">
      <el-form label-position="top" :model="repairDetailData">
        <el-row :gutter="12">
          <el-col :span="6"><el-form-item label="商品号"><div>{{ repairDetailData.itemNo }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="商品名"><div>{{ repairDetailData.sellerPart }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="类别"><div>{{ repairDetailData.dictName }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="数量"><div>{{ repairDetailData.qty }}</div></el-form-item></el-col>

          <el-col :span="6"><el-form-item label="货主"><div>{{ repairDetailData.owner }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="收货运单号"><div>{{ repairDetailData.receivePackageNo }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="测试结果"><div>{{ repairDetailData.testResult }}</div></el-form-item></el-col>

          <el-col :span="12"><el-form-item label="维修步骤"><div style="white-space:pre-wrap">{{ repairDetailData.repairProcedure }}</div></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="维修要求"><div style="white-space:pre-wrap">{{ repairDetailData.repairDemands }}</div></el-form-item></el-col>

          <el-col :span="6"><el-form-item label="是否良品"><div>{{ repairDetailData.isGood === 1 ? '良品' : (repairDetailData.isGood === 0 ? '次品' : '') }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="维修是否完成"><div>{{ repairDetailData.isRepaired === 1 ? '已完成' : '未完成' }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="维修费用"><div style="text-align:right">{{ formatFee(repairDetailData.repairFee) }}</div></el-form-item></el-col>
          <el-col :span="6"><el-form-item label="维修结果文本"><div>{{ repairDetailData.repairResult }}</div></el-form-item></el-col>

          <el-col :span="24"><el-form-item label="维修图片">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <div v-for="img in repairDetailData._images || repairDetailData.itemImages || []" :key="img.id || img" style="width:120px">
                <el-image :src="img.imageUrl || img.url || img" :preview-src-list="repairDetailPreviewList" fit="contain" style="width:120px;height:120px;border:1px solid #ddd" />
                <div style="text-align:center;margin-top:6px"><a :href="(img.imageUrl || img.url || img)" target="_blank">原图</a></div>
              </div>
            </div>
          </el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="repairDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- Add to Parcel Dialog -->
    <ParcelDialog
      v-model:visible="parcelDialogVisible"
      :title="parcelDialogTitle"
      :parcel="parcelObj"
      :users="users"
      :status-list="statusList"
      :token="token"
      :upload-handlers="uploadHandlers"
      :get-full-image-url="getFullImageUrl"
      :image-manager="imageManager"
      :rules="{}"
      :packagetype="packagetype"
      :is-edit-mode="false"
      :get-user-by-id="getUserById"
      :current-user="currentUser"
      @update:visible="(v) => parcelDialogVisible = v"
      @save="handleParcelSave"
      @cancel="parcelDialogVisible = false"
    />

    <!-- Checkout Dialog -->
    <el-dialog :model-value="checkoutVisible" :title="$t('menu.item.dialogs.checkoutItems')" width="1350px" @close="checkoutVisible=false">
      <div>
        <el-table :data="checkoutItems" stripe style="min-width:820px" border>
          <el-table-column prop="itemNo" :label="$t('menu.item.fields.itemNo')" width="147" />
          <el-table-column prop="sellerPart" :label="$t('menu.item.fields.sellerPart')" width="220" />
          <el-table-column prop="itemStatus" :label="$t('menu.item.fields.status')" width="120">
            <template #default="{row}">
              <span v-if="row.itemStatus===0">{{ $t('menu.item.statuses.pending') }}</span>
              <span v-else-if="row.itemStatus===1">{{ $t('menu.item.statuses.received') }}</span>
              <span v-else-if="row.itemStatus===2">{{ $t('menu.item.statuses.sent') }}</span>
              <span v-else-if="row.itemStatus===9">{{ $t('menu.item.statuses.exception') }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="inspectFee" :label="$t('menu.item.fields.inspectFee')" width="132" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.inspectFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="repairFee" :label="$t('menu.item.fields.repairFee')" width="110" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.repairFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="keepFee" :label="$t('menu.item.fields.keepFee')" width="110" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.keepFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="packingFee" :label="$t('menu.item.fields.packingFee')" width="110" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.packingFee) }}</div></template>
          </el-table-column>
          <el-table-column prop="otherFee" :label="$t('menu.item.fields.otherFee')" width="110" align="right">
            <template #default="{row}"><div style="text-align:right">{{ formatFee(row.otherFee) }}</div></template>
          </el-table-column>
          <el-table-column :label="$t('menu.item.fields.totalFee')" width="120" align="right">
            <template #default="{row}"><div style="text-align:right;font-weight:600">{{ formatFee(computeTotalFee(row)) }}</div></template>
          </el-table-column>
          <el-table-column prop="ispaid" :label="$t('menu.item.fields.isPaid')" width="100">
            <template #default="{row}">
              <span :style="{ color: row.ispaid === 1 ? 'red' : '' }">{{ row.ispaid === 1 ? $t('menu.item.paidStatus.paid') : (row.ispaid === 0 ? $t('menu.item.paidStatus.unpaid') : '') }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
          <div><strong>{{ $t('menu.item.dialogs.totalItems') }}:</strong> {{ checkoutCount }}</div>
          <div><strong>{{ $t('menu.item.dialogs.amount') }}:</strong> <span style="font-weight:600">{{ formatFee(checkoutAmount) }}</span></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="checkoutVisible=false">{{ $t('menu.item.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="confirmCheckout">{{ $t('menu.item.buttons.confirm') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { queryInfoApi, addApi, updateApi, deleteApi } from '@/api/item'
import { getGroupedImages } from '@/api/imageManage'
import { findByGroupApi } from '@/api/dict'
import { addApi as addParcelApi, queryPageApi } from '@/api/parcel'
import ParcelDialog from '@/components/parcel/ParcelDialog.vue'
import ItemDetail from '@/components/common/ItemDetail.vue'
import ItemTable from '@/components/common/ItemTable.vue'
import { formatFee, computeTotalFee } from '@/utils/fees'
import { useItemActions } from '@/composables/useItemActions'
import { useFileUpload } from '@/composables/useFileUpload'
import { useUser } from '@/composables/useUser'
import { useItemsList } from '@/composables/useItemsList'

const { users, currentUser, getCurrentUser, queryAllUsers, getUserById, getUserName } = useUser()
const { t } = useI18n()

// Permission check: userId=1 or current user is item owner
const canOperateItem = (row) => {
  const userId = currentUser.value?.userId
  return userId === 1 || userId === row.ownerId
}

const {
  q,
  itemList,
  total,
  currentPage,
  pageSize,
  fetchList,
  onSearch: rawOnSearch,
  onClear: rawOnClear,
  onSizeChange,
  onCurrentChange,
  computeStocklife
} = useItemsList({
  initialQ: { itemNo: '', sellerPart: '', mfrPart: '', ispaid: '', itemStatus: 1, keeperId: null, receivePackageNo: '', sendPackageNo: '', minStocklife: null, dictId: '', isConsigned: '', needTest: '', needRepair: '', isGood: '' },
  getFixedParams: () => ({ ownerId: currentUser.value.userId })
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
} = useItemActions({ fetchList, currentUser, getUserName })
// computed commission for the detail view (calculated in ItemDetail now)
const selectedMap = ref({}) // persistent selected rows across pages: { [itemId]: row }
const tableRef = ref(null)

// Checkout UI state
const checkoutVisible = ref(false)
const checkoutItems = ref([])
const checkoutCount = computed(() => checkoutItems.value.length)
const checkoutAmount = computed(() => {
  return (checkoutItems.value || []).reduce((sum, row) => {
    const total = computeTotalFee(row)
    return sum + total
  }, 0)
})

// item editing/detail handlers provided by useItemActions

const onDialogClose = () => {
  dialogVisible.value = false
  editing.value = {}
}

const splitVisible = ref(false)
const splitInfo = ref({ itemId: null, qty: 0, splitQty: 1 })

// Parcel dialog state
const parcelDialogVisible = ref(false)
const parcelDialogTitle = ref('Add To Parcel')
const parcelObj = ref({})
const token = ref(getCurrentUser())
const packagetype = ref([
  { name: 'return from a customer', value: 1 },
  { name: 'warehouse to warehouse', value: 2 },
  { name: 'delivery to a customer', value: 3 }
])
const statusList = ref([
  { name: 'Planing', value: 0 },
  { name: 'inDelivery', value: 1 },
  { name: 'Received', value: 2 },
  { name: 'Closed', value: 4 },
  { name: 'Exception', value: 9 }
])

const { uploadHandlers, getFullImageUrl, imageManager } = useFileUpload(parcelObj, token, currentUser)

const getToday = () => new Date().toISOString().split('T')[0]

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

const onAddToParcel = (row) => {
  if (!row) return
  // build minimal parcel object matching ParcelDialog expectations
  parcelObj.value = {
    packageNo: '',
    status: 0,
    processId: '',
    processDate: '',
    createDate: getToday(),
    ownerId: currentUser.value.userId || null,
    packageType: 3,
    demands: '',
    senderId: row.keeperId || null,
    sendDate: '',
    senderAddress: '',
    receiverId: null,
    receivedDate: '',
    receiverAddress: '',
    weight: '',
    size: '',
    imgBySender: '',
    imgByReceiver: '',
    label: '',
    packingList: [],
    itemList: [
      {
        ...row,
        itemImages: row.itemImages || [],
        _images: row._images || []
      }
    ]
  }
  parcelDialogTitle.value = 'Add To Parcel'
  parcelDialogVisible.value = true
}

const handleParcelSave = async () => {
  try {
    const p = { ...parcelObj.value }
    p.packingList = p.packingList || []

    const itemsForUpdate = (p.itemList && Array.isArray(p.itemList))
      ? p.itemList.map(item => ({
          ...item,
          itemImages: (item.itemImages && Array.isArray(item.itemImages))
            ? item.itemImages.map(img => (typeof img === 'string' ? img : (img.url || img.path || img)))
            : []
        }))
      : []

    if (p.packageType === 3) delete p.itemList
    else if (itemsForUpdate.length > 0) p.itemList = itemsForUpdate

    // If user provided a packageNo, check whether such parcel already exists
    if (p.packageNo) {
      try {
        const qRes = await queryPageApi(p.packageNo)
        const exists = qRes && qRes.code === 1 && Array.isArray(qRes.data?.rows) && qRes.data.rows.length > 0
        if (exists) {
          const existingParcel = qRes.data.rows[0]
          try {
            await ElMessageBox.confirm(`this parcel (package no ${p.packageNo}) is exisiting, do you want add the following items to this parcel?`, 'Confirm', { confirmButtonText: 'Yes', cancelButtonText: 'No', type: 'warning' })
            // User confirmed: do NOT create a new parcel, only update items to reference existing parcel
            const parcelId = existingParcel.parcelId || existingParcel.id || existingParcel
            if (itemsForUpdate.length > 0) {
              try {
                await Promise.all(itemsForUpdate.map(it => updateApi({ itemId: it.itemId, sendParcelId: parcelId, sendDate: getToday(), itemStatus: 2 })))
                ElMessage.success('Items updated to existing parcel')
              } catch (err) {
                console.error('Failed to update items to existing parcel', err)
                ElMessage.error('Failed to update items to existing parcel')
              }
            }
            parcelDialogVisible.value = false
            await fetchList()
            return
          } catch (err) {
            // user cancelled the confirm dialog, abort save
            return
          }
        }
      } catch (err) {
        console.error('Failed to query parcel by packageNo', err)
        // fallthrough to normal create flow
      }
    }

    // proceed to create parcel as normal
    const res = await addParcelApi(p)
    if (res && res.code === 1) {
      ElMessage.success('Parcel created')
      const parcelId = res.data?.parcelId || res.data?.id || res.data
      if (parcelObj.value.packageType === 3 && parcelId && itemsForUpdate.length > 0) {
        try {
          await Promise.all(itemsForUpdate.map(it => updateApi({ itemId: it.itemId, sendParcelId: parcelId, sendDate: getToday(), itemStatus: 2 })))
        } catch (err) {
          console.error('Failed to update items after parcel save', err)
          ElMessage.error('Parcel saved but failed to update items')
        }
      }
      parcelDialogVisible.value = false
      await fetchList()
    } else {
      ElMessage.error(res.msg || 'Failed to create parcel')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('Failed to create parcel')
  }
}

// fetchList/onSearch/onClear/onSizeChange/onCurrentChange provided by useItemsList
const onSearch = async () => {
  try {
    if (!q.itemStatus && q.itemStatus !== 0) q.itemStatus = 1
  } catch (e) {
    // ignore
  }
  // clear persisted selections when changing search
  try { selectedMap.value = {}; if (tableRef.value && tableRef.value.clearSelection) tableRef.value.clearSelection() } catch (e) {}
  return await rawOnSearch()
}

// wrap clear to also clear selections
const onClear = async () => {
  try { await rawOnClear() } catch (e) {}
  try { selectedMap.value = {}; if (tableRef.value && tableRef.value.clearSelection) tableRef.value.clearSelection() } catch (e) {}
}

const onSelectionChange = (selection) => {
  // keep selections across pages: add selected rows, remove rows from current page that were unselected
  const currentPageIds = itemList.value.map(r => r.itemId)
  const selectedIdsOnPage = selection.map(s => s.itemId)

  // add newly selected rows from this page
  selection.forEach((row) => {
    if (row && row.itemId) selectedMap.value[row.itemId] = row
  })

  // remove rows from this page that are not currently selected
  currentPageIds.forEach((id) => {
    if (!selectedIdsOnPage.includes(id) && selectedMap.value[id]) {
      delete selectedMap.value[id]
    }
  })
}

const restoreSelectionOnPage = async () => {
  // after itemList is populated, re-select rows that were stored in selectedMap
  await nextTick()
  if (!tableRef.value) return
  itemList.value.forEach(row => {
    if (row && row.itemId && selectedMap.value[row.itemId]) {
      try { tableRef.value.toggleRowSelection(row, true) } catch (err) { /* ignore */ }
    }
  })
}

const onAddSelectedToParcel = () => {
  const ids = Object.keys(selectedMap.value || {})
  if (!ids || ids.length === 0) { ElMessage.error('No items selected'); return }
  const items = ids.map(id => selectedMap.value[id]).filter(Boolean)
  if (!items || items.length === 0) { ElMessage.error('No items selected'); return }
  // validate all selected items are in Received status (itemStatus === 1)
  const notInStock = items.some(it => it.itemStatus !== 1)
  if (notInStock) {
    ElMessage.error('one of these items is not in stock, cannot be added in a parcel.')
    return
  }
  // validate keeperId consistency
  const keeperId = items[0].keeperId
  const inconsistent = items.some(it => it.keeperId !== keeperId)
  if (inconsistent) {
    ElMessage.error('these items are not from a same keeper, please check.')
    return
  }

  // build parcel object with multiple items
  parcelObj.value = {
    packageNo: '',
    status: 0,
    processId: '',
    processDate: '',
    createDate: getToday(),
    ownerId: currentUser.value.userId || null,
    packageType: 3,
    demands: '',
    senderId: keeperId || null,
    sendDate: '',
    senderAddress: '',
    receiverId: null,
    receivedDate: '',
    receiverAddress: '',
    weight: '',
    size: '',
    imgBySender: '',
    imgByReceiver: '',
    label: '',
    packingList: [],
    itemList: items.map(row => ({ ...row, itemImages: row.itemImages || [], _images: row._images || [] }))
  }
  parcelDialogTitle.value = 'Add To Parcel'
  parcelDialogVisible.value = true
}

// --- Test / Repair actions and dialogs ---
const applyTestVisible = ref(false)
const applyRepairVisible = ref(false)
const actionItem = ref(null)
const applyTestForm = ref({ testProcedure: '', testDemands: '' })
const applyRepairForm = ref({ repairProcedure: '', repairDemands: '' })

const openApplyTest = async (row) => {
  actionItem.value = row
  // load full item detail for display
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) {
      detailData.value = res.data || res
    } else {
      detailData.value = { ...row }
    }
  } catch (e) { detailData.value = { ...row } }
  applyTestForm.value = { testProcedure: detailData.value.testProcedure || '', testDemands: detailData.value.testDemands || '' }
  applyTestVisible.value = true
}

const openApplyRepair = async (row) => {
  actionItem.value = row
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) {
      detailData.value = res.data || res
    } else {
      detailData.value = { ...row }
    }
  } catch (e) { detailData.value = { ...row } }
  applyRepairForm.value = { repairProcedure: detailData.value.repairProcedure || '', repairDemands: detailData.value.repairDemands || '' }
  applyRepairVisible.value = true
}

const confirmApplyTest = async () => {
  if (!actionItem.value) return
  try {
    const payload = { itemId: actionItem.value.itemId, needTest: 1, testProcedure: applyTestForm.value.testProcedure || null, testDemands: applyTestForm.value.testDemands || null }
    const res = await updateApi(payload)
    if (res && res.code === 1) { ElMessage.success('申请测试成功'); applyTestVisible.value = false; if (fetchList) await fetchList() }
    else ElMessage.error(res.msg || '申请测试失败')
  } catch (e) { ElMessage.error('申请测试失败') }
}

const confirmApplyRepair = async () => {
  if (!actionItem.value) return
  try {
    const payload = { itemId: actionItem.value.itemId, needRepair: 1, repairProcedure: applyRepairForm.value.repairProcedure || null, repairDemands: applyRepairForm.value.repairDemands || null }
    const res = await updateApi(payload)
    if (res && res.code === 1) { ElMessage.success('申请维修成功'); applyRepairVisible.value = false; if (fetchList) await fetchList() }
    else ElMessage.error(res.msg || '申请维修失败')
  } catch (e) { ElMessage.error('申请维修失败') }
}

const cancelTest = async (row) => {
  try {
    await ElMessageBox.confirm('确定取消测试吗?','确认')
    const res = await updateApi({ itemId: row.itemId, needTest: 0, testProcedure: null, testDemands: null })
    if (res && res.code === 1) { ElMessage.success('取消测试成功'); if (fetchList) await fetchList() }
    else ElMessage.error(res.msg || '取消测试失败')
  } catch (e) {}
}

const cancelRepair = async (row) => {
  try {
    await ElMessageBox.confirm('确定取消维修吗?','确认')
    const res = await updateApi({ itemId: row.itemId, needRepair: 0, repairProcedure: null, repairDemands: null })
    if (res && res.code === 1) { ElMessage.success('取消维修成功'); if (fetchList) await fetchList() }
    else ElMessage.error(res.msg || '取消维修失败')
  } catch (e) {}
}

// Detail dialogs for Test and Repair (read-only)
const testDetailVisible = ref(false)
const repairDetailVisible = ref(false)
const testDetailData = ref({})
const repairDetailData = ref({})

const testDetailPreviewList = computed(() => ((testDetailData.value._images || testDetailData.value.itemImages || []).map(i => i.imageUrl || i.url || i)))
const repairDetailPreviewList = computed(() => ((repairDetailData.value._images || repairDetailData.value.itemImages || []).map(i => i.imageUrl || i.url || i)))

const openTestDetail = async (row) => {
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) testDetailData.value = res.data || res
    else testDetailData.value = { ...row }
  } catch (e) { testDetailData.value = { ...row } }
  // load grouped images for ITEM_TEST
  try {
    const imgs = await getGroupedImages('ITEM', row.itemId)
    if (imgs && imgs.code === 1) {
      const grouped = imgs.data || {}
      testDetailData.value._images = grouped['ITEM_TEST'] || grouped.ITEM_TEST || []
    }
  } catch (err) { /* ignore */ }
  testDetailVisible.value = true
}

const openRepairDetail = async (row) => {
  try {
    const res = await queryInfoApi(row.itemId)
    if (res && res.code === 1) repairDetailData.value = res.data || res
    else repairDetailData.value = { ...row }
  } catch (e) { repairDetailData.value = { ...row } }
  // load grouped images for ITEM_REPAIR
  try {
    const imgs = await getGroupedImages('ITEM', row.itemId)
    if (imgs && imgs.code === 1) {
      const grouped = imgs.data || {}
      repairDetailData.value._images = grouped['ITEM_REPAIR'] || grouped.ITEM_REPAIR || []
    }
  } catch (err) { /* ignore */ }
  repairDetailVisible.value = true
}

const onCheckout = () => {
  const ids = Object.keys(selectedMap.value || {})
  if (!ids || ids.length === 0) { ElMessage.error('No items selected'); return }
  const items = ids.map(id => selectedMap.value[id]).filter(Boolean)
  if (!items || items.length === 0) { ElMessage.error('No items selected'); return }
  // If any selected item is consigned, block checkout and show i18n warning
  const hasConsigned = items.some(it => it.isConsigned === 1 || it.isConsigned === '1')
  if (hasConsigned) {
    ElMessageBox.alert(t('menu.item.messages.containsConsignedItems'), t('menu.item.buttons.checkout'), { type: 'warning' })
    return
  }
  // prepare items for display (ensure numeric fee strings preserved)
  checkoutItems.value = items.map(it => ({ ...it }))
  checkoutVisible.value = true
}

const confirmCheckout = async () => {
  const items = checkoutItems.value || []
  if (!items.length) { ElMessage.info('No items to checkout'); return }
  try {
    const resArr = await Promise.all(items.map(it => updateApi({ itemId: it.itemId, ispaid: 1, paymentDate: getToday() })))
    const failed = resArr.some(r => !(r && r.code === 1))
    if (failed) { ElMessage.error('Some items failed to update'); return }
    ElMessage.success('Checkout successful')
    // remove updated items from selection map
    items.forEach(it => { if (selectedMap.value[it.itemId]) delete selectedMap.value[it.itemId] })
    checkoutVisible.value = false
    checkoutItems.value = []
    await fetchList()
  } catch (err) {
    console.error(err)
    ElMessage.error('Checkout failed')
  }
}

onMounted(async () => { getCurrentUser(); await queryAllUsers(); await fetchList(); await loadDictOptions() })

const onAbandon = async (row) => {
  if (!row || !row.itemId) return
  if (!row.keeperId) { ElMessage.error('No keeper assigned'); return }
  try {
    await ElMessageBox.confirm('Abandon this item to keeper','Confirm', { confirmButtonText: 'Confirm', cancelButtonText: 'Cancel' })
    const payload = { itemId: row.itemId, ownerId: row.keeperId }
    const res = await updateApi(payload)
    if (res && res.code === 1) { ElMessage.success('Abandoned'); await fetchList() }
    else ElMessage.error(res.msg || 'Abandon failed')
  } catch (err) {
    // user cancelled or error
  }
}

// Split flow
const onSplit = (row) => {
  splitInfo.value = { itemId: row.itemId, qty: row.qty, splitQty: 1 }
  splitVisible.value = true
}

const confirmSplit = async () => {
  const info = splitInfo.value
  if (!info.splitQty || info.splitQty < 1 || info.splitQty >= info.qty) { ElMessage.error('Split Qty must be a positive integer less than current Qty'); return }
  try {
    // 1) update current item qty
    const updateRes = await updateApi({ itemId: info.itemId, qty: info.qty - info.splitQty })
    if (!(updateRes && updateRes.code === 1)) { ElMessage.error('Failed to update original item'); return }
    // 2) get original item data
    const res = await queryInfoApi(info.itemId)
    if (!(res && res.code === 1)) { ElMessage.error('Failed to read item'); return }
    const orig = res.data || res
    // build new item copying fields except the excluded ones
    const copy = { ...orig }
    delete copy.itemId
    delete copy.sendPackageNo
    delete copy.sendParcelId
    delete copy.inspectFee
    delete copy.keepFee
    delete copy.packingFee
    delete copy.otherFee
    delete copy.ispaid
    delete copy.feeRemarks
    delete copy.paymentDate
    // set qty to splitQty
    copy.qty = info.splitQty
    // copy slot from original item so split item retains the same storage location
    if (orig.slot) {
      copy.slot = orig.slot
    }
    // ensure category and isGood are copied to the new split item
    copy.dictId = orig.dictId
    copy.isGood = orig.isGood
    // ensure isPaid/ispaid default to 0 when creating split item
    if (copy.ispaid == null) copy.ispaid = 0
    if (copy.isPaid == null) copy.isPaid = 0
    // now call addApi
    const addRes = await addApi(copy)
    if (addRes && addRes.code === 1) {
      ElMessage.success('Split successful')
      splitVisible.value = false
      splitInfo.value = { itemId: null, qty: 0, splitQty: 1 }
      await fetchList()
      // double-fetch to ensure backend write is visible in list
      await new Promise((r) => setTimeout(r, 300))
      await fetchList()
    } else {
      ElMessage.error(addRes.msg || 'Failed to create split item')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('Split failed')
  }
}

// computeStocklife provided by useItemsList

// Consign state and handlers
const consignDialogVisible = ref(false)
const consignInfo = ref({ itemId: null, commissionModel: 1, commissionSet: 0.00, market: '', salePrice: 0, saleDate: '' })

const openConsignDialog = (row) => {
  if (!row || !row.itemId) return
  consignInfo.value = {
    itemId: row.itemId,
    commissionModel: row.commissionModel || 1,
    commissionSet: row.commissionSet != null ? Number(row.commissionSet) : 0.00,
    market: row.market || '',
    salePrice: row.salePrice || 0,
    saleDate: row.saleDate || ''
  }
  consignDialogVisible.value = true
}

const confirmConsign = async () => {
  const info = consignInfo.value
  if (!info || !info.itemId) { ElMessage.error('Invalid item'); return }
  try {
    const payload = { itemId: info.itemId, isConsigned: 1, commissionModel: info.commissionModel, commissionSet: info.commissionSet, market: info.market }
    const res = await updateApi(payload)
    if (res && res.code === 1) {
      ElMessage.success('Consign saved')
      consignDialogVisible.value = false
      await fetchList()
    } else {
      ElMessage.error(res.msg || 'Failed to save consign')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('Failed to save consign')
  }
}

const confirmCancelConsign = async (row) => {
  if (!row || !row.itemId) return
  try {
    await ElMessageBox.confirm('是否需要对该商品委托仓库取消寄售', 'Confirm', { confirmButtonText: 'Confirm', cancelButtonText: 'Cancel', type: 'warning' })
    const payload = { itemId: row.itemId, isConsigned: 0, commissionModel: null, commissionSet: 0, market: '', salePrice: 0, saleDate: null }
    const res = await updateApi(payload)
    if (res && res.code === 1) {
      ElMessage.success('Cancel consign successful')
      await fetchList()
    } else {
      ElMessage.error(res.msg || 'Failed to cancel consign')
    }
  } catch (err) {
    // cancelled or error
  }
}

</script>

<style scoped>
.container { margin: 10px 0 }

/* Ensure fixed-right table area can show overflow (buttons won't be clipped) */
/* keep default scrolling and fixed column behavior (match warehouseInventory) */
  .other-actions-popover { padding:6px; display:flex; flex-direction:column; gap:8px; align-items:stretch; min-width:140px }
  .other-actions-popover ::v-deep .el-button,
  .other-actions-popover ::v-deep .el-button--text,
  .other-actions-popover ::v-deep .el-button__inner,
  .other-actions-popover ::v-deep .el-button__content {
    display:block !important;
    align-items:center !important;
    justify-content:flex-start !important;
    padding-left:18px !important;
    margin-left:0 !important;
    text-indent:0 !important;
    text-align:left !important;
    width:100% !important;
    box-sizing:border-box !important;
  }
  .other-actions-popover ::v-deep .el-button--text { height:auto !important }
</style>
