<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ParcelSearch from '@/components/parcel/ParcelSearch.vue'
import ParcelTable from '@/components/parcel/ParcelTable.vue'
import ParcelDialog from '@/components/parcel/ParcelDialog.vue'
import FilePreviewDialog from '@/components/common/FilePreviewDialog.vue'

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
const { users, currentUser, getCurrentUser, queryAllUsers, getUserName } = useUser()
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
})

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 包裹管理 - 移除 getParcelDetail 参数
const { parcelList, total, search } = 
  useParcel(searchParams, currentPage, pageSize, currentUser)

// 权限管理
const { hasViewPermission, hasDeletePermission, hasEditPermission, hasBatchDeletePermission } = 
  useParcelPermission(currentUser)

// 文件上传
// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const editingParcel = ref({})
const imageData = ref({})  // 存储后端返回的分组图片数据

// 文件上传 (pass the ref so useFileUpload can watch parcel.value)
const { imageManager, uploadHandlers, getFullImageUrl } = useFileUpload(
  editingParcel,
  token,
  currentUser
)

// 状态列表
const statusList = [
  { name: 'Planed', value: 0 },
  { name: 'InDelivery', value: 1 },
  { name: 'Received', value: 2 },
  { name: 'Exception', value: 9 }
]

// 表单验证规则
const rules = {
  packageNo: [
    { required: true, message: 'PackageNo is required', trigger: 'blur' }
  ],
  processId: [
    { required: true, message: 'ProcessId is required', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: 'Weight is required', trigger: 'blur' },
    { type: 'number', message: 'Weight must be a number', trigger: 'blur' }
  ],
  size: [
    { required: true, message: 'Size is required', trigger: 'blur' }
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
      
      // 确保必要的字段存在
      if (!parcelData.itemList) parcelData.itemList = [];
      if (!parcelData.packingList) parcelData.packingList = [];
      
      // 复制数据到编辑对象
      editingParcel.value = { ...parcelData };
      
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

// 新增包裹
const handleAdd = () => {
  dialogTitle.value = "Add Parcel";
  editingParcel.value = {
    status: 0,
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
  await search();
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
  </div>

  <!-- 表格组件 -->
  <ParcelTable 
    :parcels="filteredParcelList"
    :users="users"
    :current-user="currentUser"
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
    @update:visible="handleDialogVisibleChange"
    @save="handleSave"
    @cancel="handleCancel"
    @preview-file="handlePreviewFile"
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