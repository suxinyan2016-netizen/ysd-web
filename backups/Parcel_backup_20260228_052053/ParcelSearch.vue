<template>
  <div class="parcel-search">
    <el-form :model="searchForm">
      <!-- 第一行 -->
      <el-row :gutter="8">
        <el-col :span="4">
          <el-form-item :label="$t('menu.parcel_search.fields.packageNo') || 'PackageNo'">
            <el-input
              v-model="searchForm.packageNo"
              :placeholder="$t('menu.parcel_search.fields.packageNo') || 'PackageNo'"
            />
          </el-form-item>
        </el-col>

        <el-col :span="4">
          <el-form-item :label="$t('menu.parcel_search.fields.status') || 'Status'">
            <el-select
              v-model="searchForm.status"
              :placeholder="$t('menu.parcel_search.fields.status') || 'Choose'"
              style="width: 100%"
            >
              <el-option label="Planed" :value="0" />
              <el-option label="InDelivery" :value="1" />
              <el-option label="Received" :value="2" />
              <el-option label="Abandon" :value="8" />
              <el-option label="Exception" :value="9" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="4">
          <el-form-item :label="$t('menu.parcel_search.fields.itemNo') || 'Item#'">
            <el-input v-model="searchForm.itemNo" :placeholder="$t('menu.parcel_search.fields.itemNo') || 'Item#'" />
          </el-form-item>
        </el-col>

        <el-col :span="4">
          <el-form-item :label="$t('menu.parcel_search.fields.sellerPart') || 'SellerPart#'">
            <el-input v-model="searchForm.sellerPart" :placeholder="$t('menu.parcel_search.fields.sellerPart') || 'SellerPart#'" />
          </el-form-item>
        </el-col>

        <el-col :span="4">
          <el-form-item :label="$t('menu.parcel_search.fields.isPaid') || 'IsPaid'">
            <el-select
              v-model="searchForm.isPaid"
              :placeholder="$t('menu.parcel_search.fields.isPaid') || 'Choose'"
              style="width: 100%"
            >
              <el-option label="unpaid" :value="0" />
              <el-option label="paid" :value="1" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第二行 -->
      <el-row :gutter="8">
        <el-col :span="4">
          <el-form-item :label="$t('menu.parcel_search.fields.processId') || 'ProcessID'">
            <el-input
              v-model="searchForm.processId"
              :placeholder="$t('menu.parcel_search.fields.processId') || 'ProcessId'"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.processDate') || 'ProcessDate'">
            <el-date-picker
              v-model="searchForm.processDate"
              type="daterange"
              range-separator="to"
              start-placeholder="Start"
              end-placeholder="End"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="4">
          <el-form-item :label="$t('menu.parcel_search.fields.owner') || 'Owner'">
            <el-input
              v-model="searchForm.owner"
              :placeholder="$t('menu.parcel_search.fields.owner') || 'Owner'"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.createDate') || 'CreateDate'">
            <el-date-picker
              v-model="searchForm.createDate"
              type="daterange"
              range-separator="to"
              start-placeholder="Start"
              end-placeholder="End"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第三行 -->
      <el-row :gutter="8">
        <el-col :span="4">
          <el-form-item :label="$t('menu.parcel_search.fields.sender') || 'From Who'">
            <el-input
              v-model="searchForm.sender"
              :placeholder="$t('menu.parcel_search.fields.sender') || 'Sender#'"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.sendDate') || 'SendDate'">
            <el-date-picker
              v-model="searchForm.sendDate"
              type="daterange"
              range-separator="to"
              start-placeholder="Start"
              end-placeholder="End"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="4">
          <el-form-item :label="$t('menu.parcel_search.fields.receiver') || 'To Who'">
            <el-input
              v-model="searchForm.receiver"
              :placeholder="$t('menu.parcel_search.fields.receiver') || 'Receiver#'"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item :label="$t('menu.parcel_search.fields.receivedDate') || 'ReceivedDate'">
            <el-date-picker
              v-model="searchForm.receivedDate"
              type="daterange"
              range-separator="to"
              start-placeholder="Start"
              end-placeholder="End"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第四行 - 按钮，放在ReceivedDate下面 -->
      <el-row :gutter="8">
        <el-col :span="18">
          <!-- 空位对齐前面的From Who和SendDate -->
        </el-col>

        <el-col :span="6">
          <el-form-item style="text-align: right;">
            <el-button type="primary" @click="handleSearch">{{ $t('menu.parcel_search.actions.search') || 'Search' }}</el-button>
            <el-button type="info" @click="handleReset">{{ $t('menu.parcel_search.actions.clean') || 'Clean' }}</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { createDateRangeWatch } from "@/utils/dateWatch";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["search", "update:modelValue"]);

const searchForm = ref({
  packageNo: "",
  status: "",
  processId: "",
  processDate: [],
  beginProcessDate: "",
  endProcessDate: "",
  owner: "",
  createDate: [],
  beginCreateDate: "",
  endCreateDate: "",
  itemNo: "",
  sellerPart: "",
  sender: "",
  sendDate: [],
  beginSendDate: "",
  endSendDate: "",
  receiver: "",
  receivedDate: [],
  beginReceivedDate: "",
  endReceivedDate: "",
  isPaid: "",
});

// 为日期组件创建监听器
createDateRangeWatch(
  "processDate",
  "beginProcessDate",
  "endProcessDate",
  searchForm.value
);
createDateRangeWatch(
  "createDate",
  "beginCreateDate",
  "endCreateDate",
  searchForm.value
);
createDateRangeWatch(
  "sendDate",
  "beginSendDate",
  "endSendDate",
  searchForm.value
);
createDateRangeWatch(
  "receivedDate",
  "beginReceivedDate",
  "endReceivedDate",
  searchForm.value
);

const handleSearch = () => {
  emit("search", searchForm.value);
};

const handleReset = () => {
  searchForm.value = {
    packageNo: "",
    status: "",
    processId: "",
    processDate: [],
    beginProcessDate: "",
    endProcessDate: "",
    owner: "",
    createDate: [],
    beginCreateDate: "",
    endCreateDate: "",
    itemNo: "",
    sellerPart: "",
    sender: "",
    sendDate: [],
    beginSendDate: "",
    endSendDate: "",
    receiver: "",
    receivedDate: [],
    beginReceivedDate: "",
    endReceivedDate: "",
    isPaid: "",
  };
  emit("search", searchForm.value);
};
</script>

<style scoped>
.parcel-search {
  margin-bottom: 8px;
  padding: 6px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

/* 使用row和col的网格布局 */
:deep(.el-row) {
  margin-bottom: 6px;
}

/* 减少form-item的margin */
:deep(.el-form-item) {
  margin-bottom: 0;
}

/* 确保label左对齐，统一宽度 */
:deep(.el-form-item__label) {
  text-align: left;
  width: 84px !important;
  padding-right: 0 !important;
}

/* 减少input高度 - wrapper统一为28px */
:deep(.el-input__wrapper) {
  padding: 2px 6px !important;
  height: 28px !important;
}

:deep(.el-input__inner) {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px;
}

:deep(.el-input) {
  height: 28px !important;
}

/* 减少select高度 (从32px -> 28px) */
:deep(.el-select) {
  height: 28px !important;
  min-height: 28px !important;
}

:deep(.el-select__wrapper) {
  height: 28px !important;
  min-height: 28px !important;
  padding: 2px 6px !important;
  display: flex !important;
  align-items: center !important;
}

:deep(.el-select .el-input) {
  height: 28px !important;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  height: 28px !important;
}

:deep(.el-select__input) {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px;
}

/* 减少date-picker高度 - wrapper统一为28px */
:deep(.el-date-editor) {
  height: 28px !important;
}

:deep(.el-date-editor.el-input) {
  height: 28px !important;
}

:deep(.el-date-editor .el-input__wrapper) {
  height: 28px !important;
  padding: 2px 6px !important;
}

:deep(.el-date-editor .el-input__inner) {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px;
}

:deep(.el-date-editor--daterange) {
  height: 28px !important;
}

:deep(.el-range-separator) {
  height: 28px !important;
  line-height: 28px !important;
}

/* 按钮尺寸调整 */
:deep(.el-button) {
  height: 28px;
  padding: 4px 12px;
  font-size: 13px;
}
</style>
