<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import ParcelSearch from '@/components/parcel/ParcelSearch.vue'
import ParcelTable from '@/components/parcel/ParcelTable.vue'
import ParcelDialog from '@/components/parcel/ParcelDialog.vue'
import PackageTypeSelector from '@/components/parcel/PackageTypeSelector.vue'
import FilePreviewDialog from '@/components/common/FilePreviewDialog.vue'
import { uuidv4 } from '@/utils/uuid'

// API 导入 - 使用正确的函数名
import {
  queryPageApi,
  addApi,
  queryInfoApi,
  updateApi,
  deleteApi,
} from "@/api/parcel"

// Composables 导入
import { useUser } from '@/composables/useUser'
import { useParcel } from '@/composables/useParcel'
import { useParcelPermission } from '@/composables/useParcelPermission'
import { useFileUpload } from '@/composables/useFileUpload'

// 用户管理
const { users, currentUser, getCurrentUser, queryAllUsers, getUserName, getUserById } = useUser()
const token = ref(getCurrentUser())

// 查询参数（增强版，包含所有搜索条件）
const searchParams = ref({
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
})

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 包裹管理 - 添加 getParcelDetail
const { parcelList, total, search, getParcelDetail } = 
  useParcel(searchParams, currentPage, pageSize, currentUser)

// 权限管理
const { hasViewPermission, hasDeletePermission, hasEditPermission, hasBatchDeletePermission } = 
  useParcelPermission(currentUser)

// 文件上传
// 对话框状态
const packageTypeSelectorVisible = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editingParcel = ref({})
const imageData = ref({})  // 存储后端返回的分组图片数据
const isEditMode = ref(false)  // 是否为编辑模式

// 文件上传 (pass the ref so useFileUpload can watch parcel.value)
const { imageManager, uploadHandlers, getFullImageUrl } = useFileUpload(
  editingParcel,
  token,
  currentUser
)

// 状态列表
const statusList = [
  { name: 'Planing', value: 0 },
  { name: 'InDelivery', value: 1 },
  { name: 'Received', value: 2 },
  { name: 'Abandon', value: 8 },
  { name: 'Exception', value: 9 }
]

// 包裹类型
const packagetype = [
  { name: 'return from a customer', value: 1 },
  { name: 'warehouse to warehouse', value: 2 }
]

// isPaid 状态
const isPaidList = [
  { name: "unpaid", value: 0 },
  { name: "paid", value: 1 },
]

// Item 状态
const itemStatusList = [
  { name: "Received", value: 0 },
  { name: "Inspected", value: 1 },
  { name: "Sent", value: 2 },
  { name: "Delivered", value: 3 }
]


// 表单验证规则
const rules = {
  packageNo: [
    { required: true, message: 'PackageNo is required', trigger: 'blur' }
  ],
  weight: [
    { type: 'number', message: 'Weight must be a number', trigger: 'blur' }
  ]
}

// 编辑包裹 - 修改为正确的 API 调用
// 在 edit 函数中添加更详细的调试
const edit = async (parcelId) => {
  console.log('=== 开始编辑包裹 ===', parcelId);
  
  try {
    // 使用正确的 API 函数
    const result = await queryInfoApi(parcelId);
    console.log('接口返回的原始数据:', result);
    console.log('返回数据类型:', typeof result);
    
    // 调试：检查返回结构
    if (result) {
      console.log('result keys:', Object.keys(result));
      console.log('result.code:', result.code);
      console.log('result.data:', result.data);
      console.log('result.msg:', result.msg);
    }
    
    let parcelData = null;
    let imageDataFromBackend = {};
    
    // 根据实际返回格式处理
    if (result && result.code !== undefined) {
      // 格式1: { code: 1, data: { ...parcelData, PACKAGE_SENDER: [], PACKAGE_RECEIVER: [], ... }, msg: 'success' }
      if (result.code === 1) {
        parcelData = result.data;
        
        // 从返回数据中提取分组的图片数据
        const imageTypes = ['PACKAGE_SENDER', 'PACKAGE_RECEIVER', 'PACKAGE_LABEL', 'PACKING_LIST'];
        imageTypes.forEach(imageType => {
          if (parcelData[imageType] && Array.isArray(parcelData[imageType])) {
            imageDataFromBackend[imageType] = parcelData[imageType];
          }
        });
        
        console.log('提取的后端图片数据:', imageDataFromBackend);
      } else {
        ElMessage.error(result.msg || "Failed to fetch parcel details");
        return;
      }
    } else if (result && result.parcelId) {
      // 格式2: 直接返回包裹对象
      parcelData = result;
    } else if (result && result.id) {
      // 格式3: 可能使用 id 而不是 parcelId
      parcelData = result;
    }
    
    if (parcelData) {
      dialogTitle.value = "Edit Parcel";
      isEditMode.value = true;
      
      // 确保必要的字段存在
      if (!parcelData.itemList) parcelData.itemList = [];
      if (!parcelData.packingList) parcelData.packingList = [];
      
      // 处理 createTime 到 createDate 的转换
      if (parcelData.createTime && !parcelData.createDate) {
        // 提取日期部分 YYYY-MM-DD (格式: "2026-01-07T04:28:01")
        parcelData.createDate = parcelData.createTime.split('T')[0];
      }
      
      // 复制数据到编辑对象
      editingParcel.value = { ...parcelData };
      
      // Edit 模式下，确保现有 item 没有被破坏
      // 新增的 item 会在 handleAddItem 中自动生成 tempKey
      
      // 存储后端图片数据，供 ParcelFileUpload 组件使用
      imageData.value = imageDataFromBackend;
      
      console.log('设置 editingParcel:', editingParcel.value);
      console.log('设置 imageData:', imageData.value);
      
      // 等待图片管理器加载图片（imageManager 是对象而非 ref）
      if (imageManager && typeof imageManager.loadGroupedImages === 'function') {
        console.log('调用 imageManager.loadGroupedImages');
        await imageManager.loadGroupedImages();

        // 等待数据更新
        await nextTick();

        console.log('加载图片后的 parcel:', editingParcel.value);
        console.log('图片附件:', imageManager.imageAttachments?.value);
      }
      
      dialogVisible.value = true;
    } else {
      console.error('无法解析包裹数据:', result);
      ElMessage.error("Failed to fetch parcel details");
    }
  } catch (error) {
    console.error("Error fetching parcel details:", error);
    ElMessage.error("Failed to fetch parcel details");
  }
};

// 新增包裹 - 先显示 packageType 选择对话框
const handleAdd = () => {
  packageTypeSelectorVisible.value = true;
};

// 确认选择 packageType 后打开主对话框
const handlePackageTypeConfirm = (packageType) => {
  // 获取当前日期 YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  // 生成 tempKey 用于临时附件上传
  const tempKey = uuidv4();
  
  dialogTitle.value = "Add Parcel";
  isEditMode.value = false;
  editingParcel.value = {
    status: 0,
    packageType: packageType,
    ownerId: currentUser.value.userId,  // 默认为当前用户
    createDate: today,  // 默认为当前日期
    tempKey: tempKey,  // 添加 tempKey
    itemList: [],
    packingList: []
  };
  dialogVisible.value = true;
};

// 删除包裹
const handleDelete = async (parcelId) => {
  try {
    const confirm = await ElMessageBox.confirm(
      'Are you sure to delete this parcel?',
      'Warning',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    );
    
    if (confirm) {
      const result = await deleteApi(parcelId);
      if (result.code === 1) {
        ElMessage.success('Delete successful');
        await search();
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Delete failed');
    }
  }
};

// 保存包裹
const handleSave = async () => {
  try {
    // editingParcel.value 包含 tempKey 和 itemList（每个 item 也有 tempKey）
    // 后端会根据 tempKey 关联之前上传的临时附件
    const result = editingParcel.value.parcelId
      ? await updateApi(editingParcel.value)
      : await addApi(editingParcel.value);
    
    if (result.code === 1) {
      ElMessage.success('Save successful');
      dialogVisible.value = false;
      await search();
    }
  } catch (error) {
    ElMessage.error('Save failed');
  }
};

// 对话框可见性变化
const handleDialogVisibleChange = (visible) => {
  dialogVisible.value = visible;
  if (!visible) {
    editingParcel.value = {};
  }
};

// 取消编辑
const handleCancel = () => {
  dialogVisible.value = false;
  editingParcel.value = {};
};

// 文件预览
const previewVisible = ref(false);
const previewUrl = ref('');
const previewType = ref('');

const handlePreviewFile = (url, type) => {
  console.debug('index.vue - handlePreviewFile', { url, type });
  // 直接在新tab打开
  window.open(url, '_blank');
};

// 初始加载
onMounted(async () => {
  await queryAllUsers();
  await search(true);
});

// --- Compatibility aliases for template (original template expects these names) ---
const searchParcel = searchParams

const clear = () => {
  searchParams.value = {
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
  search()
}

const addParcel = () => handleAdd()

const selectedParcels = ref([])
const selectedIds = ref([])

const handleSelectionChange = (selection) => {
  selectedParcels.value = selection
  selectedIds.value = selection.map((s) => s.parcelId)
}

const deleteByIds = async () => {
  if (!selectedIds.value || selectedIds.value.length === 0) {
    ElMessage.info('No data is selected')
    return
  }
  try {
    const res = await deleteApi(selectedIds.value)
    if (res && res.code === 1) {
      ElMessage.success('Deleted')
      selectedParcels.value = []
      selectedIds.value = []
      await search()
    } else {
      ElMessage.error(res.msg || 'Delete failed')
    }
  } catch (err) {
    ElMessage.error('Delete failed')
  }
}

const deleteById = (id) => handleDelete(id)

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
      const packageTypeName = packagetype.find(t => t.value === parcel.packageType)?.name || '';
      const statusName = statusList.find(s => s.value === parcel.status)?.name || '';
      const ownerName = getUserName(parcel.ownerId);
      const isPaidName = isPaidList.find(p => p.value === parcel.isPaid)?.name || '';

      // 如果有 itemList，则为每个 item 创建一行
      if (parcel.itemList && parcel.itemList.length > 0) {
        // 对 items 按 itemNo 排序
        parcel.itemList.sort((a, b) => {
          if (a.itemNo < b.itemNo) return -1;
          if (a.itemNo > b.itemNo) return 1;
          return 0;
        });

        for (const item of parcel.itemList) {
          const itemStatusName = itemStatusList.find(s => s.value === item.itemStatus)?.name || '';
          const itemOwnerName = getUserName(item.ownerId);
          const itemKeeperName = getUserName(item.keeperId);
          const itemIsPaidName = isPaidList.find(p => p.value === item.isPaid)?.name || '';

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

const background = ref(true)

const handleSizeChange = (val) => {
  pageSize.value = val
  search()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  search()
}

const filteredParcelList = computed(() => {
  if (currentUser.value.userId === 1) return parcelList.value
  return parcelList.value.filter((p) => hasViewPermission(p))
})

const closePreview = () => {
  previewVisible.value = false
  previewUrl.value = ''
  previewType.value = ''
}

const downloadFile = (url) => {
  if (!url) return
  try {
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.download = url.split('/').pop() || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('开始下载文件')
  } catch (error) {
    ElMessage.error('下载失败: ' + (error.message || error))
  }
}

// expose checkImageUrls if available from useFileUpload
const checkImageUrls = () => {
  if (typeof imageManager.checkImageUrls === 'function') {
    imageManager.checkImageUrls()
  } else if (typeof uploadHandlers?.value?.checkImageUrls === 'function') {
    uploadHandlers.value.checkImageUrls()
  } else if (typeof uploadHandlers.checkImageUrls === 'function') {
    uploadHandlers.checkImageUrls()
  } else {
    console.debug('checkImageUrls not available')
  }
}

// 处理搜索表单提交
const handleSearch = (searchForm) => {
  searchParams.value = { ...searchForm }
  currentPage.value = 1
  search()
}
</script>

<template>
  <h1>Parcel Management</h1>
  
  <!-- 搜索组件 -->
  <ParcelSearch 
    :model-value="searchParams"
    @search="handleSearch"
  />

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
    :token="token"
    :get-parcel-detail="getParcelDetail"
    :upload-handlers="uploadHandlers"
    :image-manager="imageManager"
    @edit="edit"
    @delete="deleteById"
    @selection-change="handleSelectionChange"
    @refresh="search"
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
    :visible="dialogVisible"
    :title="dialogTitle"
    :parcel="editingParcel"
    :image-data="imageData"
    :users="users"
    :status-list="statusList"
    :token="token"
    :current-user="currentUser"
    :upload-handlers="uploadHandlers"
    :get-full-image-url="getFullImageUrl"
    :image-manager="imageManager"
    :rules="rules"
    :packagetype="packagetype"
    :is-paid-list="isPaidList"
    :is-edit-mode="isEditMode"
    :get-user-by-id="getUserById"
    @update:visible="handleDialogVisibleChange"
    @save="handleSave"
    @cancel="handleCancel"
    @preview-file="handlePreviewFile"
  />

  <!-- PackageType 选择对话框 -->
  <PackageTypeSelector
    :visible="packageTypeSelectorVisible"
    :packagetype="packagetype"
    @update:visible="packageTypeSelectorVisible = $event"
    @confirm="handlePackageTypeConfirm"
  />

  <!-- 文件预览对话框 -->
  <FilePreviewDialog 
    :visible="previewVisible"
    :preview-url="previewUrl"
    :preview-type="previewType"
    @update:visible="previewVisible = $event"
    @close="closePreview"
    @download="downloadFile"
  />
</template>

<style scoped>
.container {
  margin: 10px 0px;
}
</style>