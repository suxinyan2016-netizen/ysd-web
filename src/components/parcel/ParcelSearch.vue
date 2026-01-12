<template>
  <div class="parcel-search">
    <el-form :inline="true" :model="searchForm" class="demo-form-inline">
      <el-form-item label="PackageNo">
        <el-input
          v-model="searchForm.packageNo"
          placeholder="PackageNo"
          style="width: 220px"
        />
      </el-form-item>

      <el-form-item label="Status" style="min-width: 150px">
        <el-select
          v-model="searchForm.status"
          placeholder="Choose"
          style="width: 100%"
        >
          <el-option label="Planed" :value="0" />
          <el-option label="InDelivery" :value="1" />
          <el-option label="Received" :value="2" />
          <el-option label="Exception" :value="9" />
        </el-select>
      </el-form-item>

      <el-form-item label="Item#">
        <el-input v-model="searchForm.itemNo" placeholder="Item#" />
      </el-form-item>

      <el-form-item label="SellerPart#">
        <el-input v-model="searchForm.sellerPart" placeholder="SellerPart#" />
      </el-form-item>

      <el-form-item label="ProcessID">
        <el-input
          v-model="searchForm.processId"
          placeholder="ProcessId"
          style="width: 220px"
        />
      </el-form-item>

      <el-form-item label="ProcessDate">
        <el-date-picker
          v-model="searchForm.processDate"
          type="daterange"
          range-separator="to"
          start-placeholder="Start"
          end-placeholder="End"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="Owner">
        <el-input
          v-model="searchForm.owner"
          placeholder="Owner"
          style="width: 120px"
        />
      </el-form-item>

      <el-form-item label="CreateDate">
        <el-date-picker
          v-model="searchForm.createDate"
          type="daterange"
          range-separator="to"
          start-placeholder="Start"
          end-placeholder="End"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="From Who">
        <el-input
          v-model="searchForm.sender"
          placeholder="Sender#"
          style="width: 120px"
        />
      </el-form-item>

      <el-form-item label="SendDate">
        <el-date-picker
          v-model="searchForm.sendDate"
          type="daterange"
          range-separator="to"
          start-placeholder="Start"
          end-placeholder="End"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="To Who">
        <el-input
          v-model="searchForm.receiver"
          placeholder="Receiver#"
          style="width: 120px"
        />
      </el-form-item>

      <el-form-item label="ReceivedDate">
        <el-date-picker
          v-model="searchForm.receivedDate"
          type="daterange"
          range-separator="to"
          start-placeholder="Start"
          end-placeholder="End"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSearch">Search</el-button>
        <el-button type="info" @click="handleReset">Clean</el-button>
      </el-form-item>
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
  };
  emit("search", searchForm.value);
};
</script>

<style scoped>
.parcel-search {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
