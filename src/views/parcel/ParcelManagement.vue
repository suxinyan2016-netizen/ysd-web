<script setup>
import { ref, onMounted, computed } from "vue"
import { createDateRangeWatch } from "@/utils/dateWatch"
import { ElMessage, ElMessageBox } from "element-plus"
import { Download } from "@element-plus/icons-vue"
import * as XLSX from 'xlsx'

// 导入组合式函数
import { useUser } from "@/composables/useUser"
import { useParcel } from "@/composables/useParcel"
import { useParcelPermission } from "@/composables/useParcelPermission"
import { useFileUpload } from "@/composables/useFileUpload"

// 导入组件
import ParcelSearch from '@/components/parcel/ParcelSearch.vue'
import ParcelTable from '@/components/parcel/ParcelTable.vue'
import ParcelDialog from '@/components/parcel/ParcelDialog.vue'
import FilePreviewDialog from '@/components/common/FilePreviewDialog.vue'

// 用户相关逻辑
const { users, currentUser, getCurrentUser, queryAllUsers, getUserName } = useUser()
const token = ref("")

// 搜索表单对象
const searchParcel = ref(createSearchParams())

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const background = ref(true)

// 包裹相关逻辑
const { parcelList, total, search: searchParcels, getParcelDetail, saveParcel, deleteParcel } = 
  useParcel(searchParcel, currentPage, pageSize, currentUser)

// 权限相关逻辑
const { 
  hasViewPermission, 
  hasDeletePermission, 
  hasEditPermission,
  hasBatchDeletePermission,
  showOperationButtons 
} = useParcelPermission(currentUser)

// 文件上传相关逻辑
const parcel = ref(createDefaultParcel())
const { 
  uploadHandlers, 
  handleUploadError, 
  getFullImageUrl, 
  checkImageUrls,
  uploadHeaders 
} = useFileUpload(parcel, token, currentUser)

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref("New Parcel")
const parcelFormRef = ref()

// 文件预览状态
const previewVisible = ref(false)
const previewUrl = ref("")
const previewType = ref("")

// 全选和批量选择
const selectAll = ref(false)
const selectedParcels = ref([])
const selectedIds = ref([])

// 根据查询结果过滤数据
const filteredParcelList = computed(() => {
  if (currentUser.value.userId === 1) {
    return parcelList.value
  }
  return parcelList.value.filter((parcel) => hasViewPermission(parcel))
})

// 钩子函数
onMounted(async () => {
  token.value = getCurrentUser()
  setupDateRangeWatchers()
  // ensure users are loaded before first render/search (helps name lookup & permission checks)
  await queryAllUsers()
  await search()
})

// 搜索
const search = () => { searchParcels() }

// 接收来自 ParcelSearch 的搜索请求（并同步到 searchParcel）
const handleSearch = (payload) => {
  if (payload) searchParcel.value = payload
  search()
}

// 清空搜索条件（来自 ParcelSearch）
const handleClear = (payload) => {
  searchParcel.value = createSearchParams()
  search()
}

// 每页展示记录数变化
const handleSizeChange = (val) => {
  search()
}

// 页码变化时触发
const handleCurrentChange = (val) => {
  search()
}

// 新增包裹
const addParcel = () => {
  dialogVisible.value = true
  dialogTitle.value = "New Parcel"
  parcel.value = createDefaultParcel()
  parcel.value.ownerId = currentUser.value.userId
  
  if (parcelFormRef.value) {
    parcelFormRef.value.resetFields()
  }
}

// 添加包裹内商品
const addItem = () => {
  parcel.value.itemList.push({
    sellerPart: "",
    mfrPart: "",
    itemNo: "",
    qty: 1,
    itemStatus: 0,
    ownerId: parcel.value.ownerId,
    receivedDate: "",
    keeperId: "",
    receiveParcelId: null,
    sendDate: null,
    dealerReceivedDate: null,
    originalOrder: "",
    originalReturnNo: "",
    customerFeedback: "",
    itemImages: [],
    _images: [],  // 用于 UI 预览
  })
}

// 删除包裹内商品
const delItem = (index) => {
  parcel.value.itemList.splice(index, 1)
}

// 保存包裹
const save = async () => {
  if (!parcelFormRef.value) return
  
  parcelFormRef.value.validate(async (valid) => {
    if (valid) {
      // 检查编辑权限（如果是编辑）
      if (parcel.value.parcelId) {
        const originalParcel = parcelList.value.find(
          (p) => p.parcelId === parcel.value.parcelId
        )
        if (!hasEditPermission(originalParcel)) {
          ElMessage.error("You do not have permission to edit this parcel")
          return
        }
      }

      const result = await saveParcel(parcel.value)

      if (result.code) {
        ElMessage.success("Save successful")
        dialogVisible.value = false
        search()
      } else {
        ElMessage.error(result.msg)
      }
    } else {
      ElMessage.error("Form validation failed")
    }
  })
}

// 编辑包裹
const edit = async (parcelId) => {
  const parcelToEdit = parcelList.value.find((p) => p.parcelId === parcelId)
  if (!parcelToEdit) {
    ElMessage.error("Parcel does not exist")
    return
  }

  if (!hasEditPermission(parcelToEdit)) {
    ElMessage.error("You do not have permission to edit this parcel")
    return
  }

  const data = await getParcelDetail(parcelId)
  if (data) {
    dialogVisible.value = true
    dialogTitle.value = "Edit Parcel"
    parcel.value = { ...data }
    
    // 确保 itemList 中的每个 item 都有 itemImages 数组
    if (parcel.value.itemList && Array.isArray(parcel.value.itemList)) {
      parcel.value.itemList.forEach(item => {
        if (!item.itemImages) {
          item.itemImages = []
        }
        // 初始化 _images：从 itemImages 加载已保存的图片
        if (!item._images) {
          item._images = []
        }
        if (item.itemImages && Array.isArray(item.itemImages)) {
          item._images = item.itemImages.map(img => ({
            id: img.id,
            url: img.url || img.imageUrl,
            name: img.name || '',
            uploading: false
          }))
        }
      })
    }
    
    if (parcelFormRef.value) {
      parcelFormRef.value.resetFields()
    }
  }
}

// 删除包裹
const deleteById = async (parcelId) => {
  const parcelToDelete = parcelList.value.find((p) => p.parcelId === parcelId)
  if (!parcelToDelete) {
    ElMessage.error("Parcel does not exist")
    return
  }

  if (parcelToDelete.status === 2 && currentUser.value.userId !== 1) {
    ElMessage.error("Received parcels cannot be deleted")
    return
  }

  if (!hasDeletePermission(parcelToDelete)) {
    ElMessage.error("You do not have permission to delete this parcel")
    return
  }

  ElMessageBox.confirm("Do you delete the data?", "note", {
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
    type: "warning",
  })
    .then(async () => {
      const result = await deleteParcel(parcelId)
      if (result.code) {
        ElMessage.success("Deleted")
        search()
      } else {
        ElMessage.error(result.msg)
      }
    })
    .catch(() => {
      ElMessage.info("Canceled")
    })
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedParcels.value = selection
  selectedIds.value = selection.map((item) => item.parcelId)
}

// 批量删除
const deleteByIds = () => {
  if (!selectedParcels.value || selectedParcels.value.length === 0) {
    ElMessage.info("No data is selected")
    return
  }

  const unauthorizedParcels = selectedParcels.value.filter((parcel) => {
    return !hasDeletePermission(parcel)
  })

  if (unauthorizedParcels.length > 0) {
    ElMessage.error(`You do not have permission to delete the selected ${unauthorizedParcels.length} parcels`)
    return
  }

  ElMessageBox.confirm("Do you delete these data?", "note", {
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
    type: "warning",
  })
    .then(async () => {
      const result = await deleteParcel(selectedIds.value)
      if (result.code) {
        ElMessage.success("Deleted")
        search()
        selectedParcels.value = []
        selectedIds.value = []
      } else {
        ElMessage.error(result.msg)
      }
    })
    .catch(() => {
      ElMessage.info("Canceled")
    })
}

// Excel 导出功能
const exportToExcel = async () => {
  try {
    // 确定要导出的数据：选中的记录或全部查询结果
    const dataToExport = selectedParcels.value && selectedParcels.value.length > 0
      ? selectedParcels.value
      : filteredParcelList.value;

    if (!dataToExport || dataToExport.length === 0) {
      ElMessage.warning('No data to export');
      return;
    }

    ElMessage.info('Preparing export data...');

    // 获取每个 parcel 的完整详情（包括 itemList）
    const parcelsWithDetails = [];
    for (const parcel of dataToExport) {
      const detail = await getParcelDetail(parcel.parcelId);
      if (detail) {
        parcelsWithDetails.push(detail);
      }
    }

    // 准备 Excel 数据
    const excelData = [];

    // 按 packageNo 排序
    parcelsWithDetails.sort((a, b) => {
      if (a.packageNo < b.packageNo) return -1;
      if (a.packageNo > b.packageNo) return 1;
      return 0;
    });

    for (const parcel of parcelsWithDetails) {
      // 获取 parcel 相关的显示值
      const packageTypeName = packagetype.value.find(t => t.value === parcel.packageType)?.name || '';
      const statusName = status.value.find(s => s.value === parcel.status)?.name || '';
      const ownerName = getUserName(parcel.ownerId);
      const isPaidName = isPaid.value.find(p => p.value === parcel.isPaid)?.name || '';

      // 如果有 itemList，则为每个 item 创建一行
      if (parcel.itemList && parcel.itemList.length > 0) {
        // 对 items 按 itemNo 排序
        parcel.itemList.sort((a, b) => {
          if (a.itemNo < b.itemNo) return -1;
          if (a.itemNo > b.itemNo) return 1;
          return 0;
        });

        for (const item of parcel.itemList) {
          const itemStatusName = itemStatus.value.find(s => s.value === item.itemStatus)?.name || '';
          const itemOwnerName = getUserName(item.ownerId);
          const itemKeeperName = getUserName(item.keeperId);
          const itemIsPaidName = isPaid.value.find(p => p.value === item.isPaid)?.name || '';

          excelData.push({
            'packageNo': parcel.packageNo || '',
            'packageType': packageTypeName,
            'status': statusName,
            'processId': parcel.processId || '',
            'processDate': parcel.processDate || '',
            'owner': ownerName,
            'senderName': parcel.senderName || '',
            'sendDate': parcel.sendDate || '',
            'senderAddress': parcel.senderAddress || '',
            'receiverName': parcel.receiverName || '',
            'receivedDate': parcel.receivedDate || '',
            'receiverAddress': parcel.receiverAddress || '',
            'weight': parcel.weight || '',
            'size': parcel.size || '',
            'demands': parcel.demands || '',
            'fee': parcel.fee || '',
            'isPaid': isPaidName,
            'remarks': parcel.remarks || '',
            // Item 数据
            'itemNo': item.itemNo || '',
            'sellerPart': item.sellerPart || '',
            'mfrPart': item.mfrPart || '',
            'qty': item.qty || '',
            'itemStatus': itemStatusName,
            'itemOwner': itemOwnerName,
            'itemReceivedDate': item.receivedDate || '',
            'keeper': itemKeeperName,
            'receivePackageNo': item.receivePackageNo || '',
            'itemSendDate': item.sendDate || '',
            'sendPackageNo': item.sendPackageNo || '',
            'dealerReceivedDate': item.dealerReceivedDate || '',
            'originalOrder': item.originalOrder || '',
            'originalReturnNo': item.originalReturnNo || '',
            'customerFeedback': item.customerFeedback || '',
            'iqcResult': item.iqcResult || '',
            'isUnpacked': item.isUnpacked === 1 ? 'unpacked' : item.isUnpacked === 0 ? 'packed' : '',
            'itemRemark': item.remark || '',
            'inspectFee': item.inspectFee || '',
            'keepFee': item.keepFee || '',
            'packingFee': item.packingFee || '',
            'otherFee': item.otherFee || '',
            'itemIsPaid': itemIsPaidName,
            'feeRemarks': item.feeRemarks || ''
          });
        }
      } else {
        // 如果没有 item，只导出 parcel 信息
        excelData.push({
          'packageNo': parcel.packageNo || '',
          'packageType': packageTypeName,
          'status': statusName,
          'processId': parcel.processId || '',
          'processDate': parcel.processDate || '',
          'owner': ownerName,
          'senderName': parcel.senderName || '',
          'sendDate': parcel.sendDate || '',
          'senderAddress': parcel.senderAddress || '',
          'receiverName': parcel.receiverName || '',
          'receivedDate': parcel.receivedDate || '',
          'receiverAddress': parcel.receiverAddress || '',
          'weight': parcel.weight || '',
          'size': parcel.size || '',
          'demands': parcel.demands || '',
          'fee': parcel.fee || '',
          'isPaid': isPaidName,
          'remarks': parcel.remarks || '',
          // Item 字段为空
          'itemNo': '',
          'sellerPart': '',
          'mfrPart': '',
          'qty': '',
          'itemStatus': '',
          'itemOwner': '',
          'itemReceivedDate': '',
          'keeper': '',
          'receivePackageNo': '',
          'itemSendDate': '',
          'sendPackageNo': '',
          'dealerReceivedDate': '',
          'originalOrder': '',
          'originalReturnNo': '',
          'customerFeedback': '',
          'iqcResult': '',
          'isUnpacked': '',
          'itemRemark': '',
          'inspectFee': '',
          'keepFee': '',
          'packingFee': '',
          'otherFee': '',
          'itemIsPaid': '',
          'feeRemarks': ''
        });
      }
    }

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Parcels');

    // 生成文件名
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `Parcels_Export_${timestamp}.xlsx`;

    // 导出文件
    XLSX.writeFile(workbook, fileName);

    ElMessage.success(`Exported ${excelData.length} records to ${fileName}`);

  } catch (error) {
    console.error('Export error:', error);
    ElMessage.error('Export failed: ' + error.message);
  }
};

// 文件预览
const previewFile = (url, type) => {
  console.debug('ParcelManagement - previewFile called', { url, type });
  previewUrl.value = url
  previewType.value = type
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
  previewUrl.value = ""
  previewType.value = ""
}

// 文件下载
const downloadFile = (url) => {
  if (!url) return

  try {
    const link = document.createElement("a")
    link.href = url
    link.target = "_blank"
    const fileName = url.split("/").pop()
    link.download = fileName || "download"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success("开始下载文件")
  } catch (error) {
    console.error("下载失败:", error)
    ElMessage.error("下载失败: " + error.message)
  }
}

// 表单校验规则
const rules = ref({
  packageNo: [{ required: true, message: "PackageNo", trigger: "blur" }],
  owner: [{ required: true, message: "PackageOnwer", trigger: "blur" }],
})

// 元数据
const status = ref([
  { name: "Planed", value: 0 },
  { name: "inDelivery", value: 1 },
  { name: "Received", value: 2 },
  { name: "Exception", value: 9 },
])
const isPaid = ref([
  { name: "unpaid", value: 0 },
  { name: "paid", value: 1 },
])

// 包裹类型
const packagetype = ref([
  { name: 'return from a customer', value: 1 },
  { name: 'warehouse to warehouse', value: 2 },
  { name: 'delivery to a customer', value: 3 }
])

// Item 状态
const itemStatus = ref([
  { name: "Received", value: 0 },
  { name: "Inspected", value: 1 },
  { name: "Sent", value: 2 },
  { name: "Delivered", value: 3 }
])

// 工具函数
function createSearchParams() {
  return {
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
  }
}

function createDefaultParcel() {
  // 获取当前日期 YYYY-MM-DD 格式
  const today = new Date().toISOString().split('T')[0];
  
  return {
    packageNo: "",
    status: 0,
    processId: "",
    processDate: "",
    createDate: today,  // 默认为当前日期
    ownerId: "",
    packageType: "",  // Package type
    demands: "",  // Owner's demands
    senderId: "",
    sendDate: "",
    senderAddress: "",
    receiverId: "",
    receivedDate: "",
    receiverAddress: "",
    weight: "",
    size: "",
    imgBySender: "",
    imgByReceiver: "",
    label: "",
    packingList: [],
    itemList: [
      {
        sellerPart: "",
        mfrPart: "",
        itemNo: "",
        qty: 1,
        itemStatus: 0,
        ownerId: "",
        receivedDate: "",
        keeperId: "",
        receiveParcelId: null,
        sendDate: null,
        dealerReceivedDate: null,
        originalOrder: "",
        originalReturnNo: "",
        customerFeedback: "",
        itemImages: [],
        _images: [],  // 用于 UI 预览
      },
    ],
  }
}

function setupDateRangeWatchers() {
  createDateRangeWatch(
    "processDate",
    "beginProcessDate",
    "endProcessDate",
    searchParcel.value
  )
  createDateRangeWatch(
    "createDate",
    "beginCreateDate",
    "endCreateDate",
    searchParcel.value
  )
  createDateRangeWatch(
    "sendDate",
    "beginSendDate",
    "endSendDate",
    searchParcel.value
  )
  createDateRangeWatch(
    "receivedDate",
    "beginReceivedDate",
    "endReceivedDate",
    searchParcel.value
  )
}
</script>

<template>
  <h1>Parcel Management</h1>
  
  <!-- 搜索组件 -->
  <ParcelSearch 
    :search-params="searchParcel"
    @search="handleSearch"
    @clear="handleClear"
  >
    <template #extra-actions>
      <el-button type="warning" @click="checkImageUrls" size="small" style="margin-left: 10px;">
        调试图片URL
      </el-button>
    </template>
  </ParcelSearch>

  <!-- 功能按钮 -->
  <div class="container">
    <el-button type="primary" @click="addParcel">+ AddParcel</el-button>
    <el-button type="danger" @click="deleteByIds">- Delete</el-button>
    <el-button type="success" @click="exportToExcel">
      <el-icon><Download /></el-icon> Export Excel
    </el-button>
  </div>

  <!-- 表格组件 -->
  <ParcelTable 
    :parcels="filteredParcelList"
    :users="users"
    :current-user="currentUser"
    :get-parcel-detail="getParcelDetail"
    @edit="edit"
    @delete="deleteById"
    @selection-change="handleSelectionChange"
  />

  <!-- 分页组件 -->
  <div class="container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 30, 50, 75, 100]"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>

  <!-- 包裹对话框组件 -->
  <ParcelDialog 
    v-model:visible="dialogVisible"
    :title="dialogTitle"
    :parcel="parcel"
    :users="users"
    :status-list="status"
    :upload-handlers="uploadHandlers"
    :get-full-image-url="getFullImageUrl"
    :upload-headers="uploadHeaders"
    :rules="rules"
    @save="save"
    @cancel="dialogVisible = false"
    @preview-file="previewFile"
    @check-image-urls="checkImageUrls"
    @add-item="addItem"
    @delete-item="delItem"
    ref="parcelFormRef"
  />

  <!-- 文件预览对话框 -->
  <FilePreviewDialog 
    v-model:visible="previewVisible"
    :preview-url="previewUrl"
    :preview-type="previewType"
    @close="closePreview"
    @download="downloadFile"
  />
</template>

<style scoped>
.container {
  margin: 10px 0px;
}
</style>