<template>
  <div>
    <h1>{{ $t('menu.account.mySku') }}</h1>

    <!-- 搜索栏 -->
    <div style="margin:10px 0; padding:8px 12px; background:#fff; border:1px solid #e6e6e6; border-radius:4px;">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-input
          v-model="q.itemNoPrefix"
          :placeholder="$t('menu.sku.fields.itemno')"
          style="width:200px"
          clearable
        />
        <el-input
          v-model="q.sellerPart"
          :placeholder="$t('menu.sku.fields.sellerpart')"
          style="width:220px"
          clearable
        />
        <el-select v-model="q.dictId" :placeholder="$t('menu.sku.fields.dictid')" clearable style="width:160px">
          <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
        </el-select>
        <el-button type="primary" @click="onSearch">{{ $t('menu.sku.buttons.search') }}</el-button>
        <el-button @click="onClear" style="background:#f5f5f5; border:1px solid #e6e6e6; color:#333">
          {{ $t('menu.sku.buttons.clear') }}
        </el-button>
        <el-button type="primary" @click="onAdd">{{ $t('menu.sku.buttons.add') }}</el-button>
        <el-button type="danger" @click="onDeleteSelected">{{ $t('menu.sku.buttons.deleteSelected') }}</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      :data="skuList"
      border
      stripe
      @selection-change="onSelectionChange"
      style="width:100%"
    >
      <el-table-column type="selection" width="40" />
      <el-table-column prop="itemNo" :label="$t('menu.sku.fields.itemno')" />
      <el-table-column prop="sellerPart" :label="$t('menu.sku.fields.sellerpart')" />
      <el-table-column :label="$t('menu.sku.fields.dictid')">
        <template #default="{ row }">
          {{ getDictName(row.dictId) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('menu.sku.fields.operation')" width="160">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="onEdit(row)">{{ $t('menu.sku.buttons.edit') }}</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">{{ $t('menu.sku.buttons.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div style="margin-top:12px; display:flex; justify-content:flex-end;">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="480px"
      @close="onDialogClose"
    >
      <el-form :model="editing" label-width="100px">
        <el-form-item :label="$t('menu.sku.fields.itemno')">
          <el-input v-model="editing.itemNo" :disabled="isEditing" />
        </el-form-item>
        <el-form-item :label="$t('menu.sku.fields.sellerpart')">
          <el-input v-model="editing.sellerPart" />
        </el-form-item>
        <el-form-item :label="$t('menu.sku.fields.dictid')">
          <el-select v-model="editing.dictId" :placeholder="$t('menu.sku.placeholders.selectCategory')" clearable style="width:100%">
            <el-option
              v-for="d in dictOptions"
              :key="d.dictId"
              :label="d.dictName"
              :value="d.dictId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onDialogClose">{{ $t('menu.sku.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="onSave">{{ $t('menu.sku.buttons.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { pageApi, saveApi, updateApi, deleteBatchApi } from '@/api/sku'
import { findByGroupApi } from '@/api/dict'
import { getTokenInfo } from '@/utils/tokenManager'

const { t } = useI18n()

// ---- 状态 ----
const skuList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const q = ref({ itemNoPrefix: '', sellerPart: '', dictId: null })
const selectedRows = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEditing = ref(false)
const editing = ref({})
const dictOptions = ref([])

// ---- 当前用户 ----
const getCurrentUserId = () => {
  const stored = getTokenInfo().loginUser || JSON.parse(localStorage.getItem('loginUser') || 'null')
  return stored ? (stored.userId ?? stored.id ?? null) : null
}

// ---- 字典 ----
const loadDictOptions = async () => {
  try {
    let res = await findByGroupApi('Hardware')
    let list = (res && res.code === 1) ? (res.data || []) : (Array.isArray(res) ? res : [])
    if (!list.length) {
      const res2 = await findByGroupApi(2)
      list = (res2 && res2.code === 1) ? (res2.data || []) : (Array.isArray(res2) ? res2 : [])
    }
    dictOptions.value = list.map(d => ({
      dictId: d.dictId ?? d.id ?? d.value,
      dictName: d.dictName ?? d.name ?? d.label
    }))
  } catch (err) {
    console.error('loadDictOptions error', err)
  }
}

const getDictName = (dictId) => {
  if (!dictId) return ''
  const found = dictOptions.value.find(d => d.dictId === dictId)
  return found ? found.dictName : dictId
}

// ---- 查询 ----
const fetchList = async () => {
  try {
    const ownerId = getCurrentUserId()
    const res = await pageApi({
      ownerId,
      itemNoPrefix: q.value.itemNoPrefix || undefined,
      sellerPart: q.value.sellerPart || undefined,
      dictId: q.value.dictId || undefined,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (res && res.code === 1) {
      const data = res.data || {}
      skuList.value = data.rows || data.list || data.records || []
      total.value = data.total ?? 0
    } else {
      ElMessage.error(res?.msg || t('menu.sku.messages.loadFailed'))
    }
  } catch (err) {
    console.error('fetchList error', err)
    ElMessage.error(t('menu.sku.messages.loadFailed'))
  }
}

const onSearch = () => {
  currentPage.value = 1
  fetchList()
}

const onClear = () => {
  q.value = { itemNoPrefix: '', sellerPart: '', dictId: null }
  currentPage.value = 1
  fetchList()
}

const onSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchList()
}

const onCurrentChange = (page) => {
  currentPage.value = page
  fetchList()
}

// ---- 选中 ----
const onSelectionChange = (rows) => {
  selectedRows.value = rows
}

// ---- 新增 ----
const onAdd = () => {
  isEditing.value = false
  dialogTitle.value = t('menu.sku.dialogs.add')
  editing.value = {}
  dialogVisible.value = true
}

// ---- 编辑 ----
const onEdit = (row) => {
  isEditing.value = true
  dialogTitle.value = t('menu.sku.dialogs.edit')
  editing.value = { ...row }
  dialogVisible.value = true
}

// ---- 保存 ----
const onSave = async () => {
  if (!editing.value.itemNo) {
    ElMessage.warning(t('menu.sku.messages.itemNoRequired'))
    return
  }
  try {
    const ownerId = getCurrentUserId()
    const payload = { ...editing.value, ownerId }
    let res
    if (isEditing.value) {
      res = await updateApi(payload)
    } else {
      res = await saveApi(payload)
    }
    if (res && res.code === 1) {
      ElMessage.success(t('menu.sku.messages.saveSuccess'))
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res?.msg || t('menu.sku.messages.saveFailed'))
    }
  } catch (err) {
    console.error('onSave error', err)
    ElMessage.error(t('menu.sku.messages.saveFailed'))
  }
}

// ---- 单行删除 ----
const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(t('menu.sku.messages.deleteConfirm'), t('menu.sku.messages.deleteConfirmTitle'))
    const res = await deleteBatchApi([{ ownerId: row.ownerId, itemNo: row.itemNo }])
    if (res && res.code === 1) {
      ElMessage.success(t('menu.sku.messages.deleteSuccess'))
      fetchList()
    } else {
      ElMessage.error(res?.msg || t('menu.sku.messages.deleteFailed'))
    }
  } catch (err) {
    // user cancelled or request error
    if (err !== 'cancel') console.error('onDelete error', err)
  }
}

// ---- 批量删除 ----
const onDeleteSelected = async () => {
  if (!selectedRows.value.length) {
    ElMessage.info(t('menu.sku.messages.selectToDelete'))
    return
  }
  try {
    await ElMessageBox.confirm(t('menu.sku.messages.deleteSelectedConfirm'), t('menu.sku.messages.deleteConfirmTitle'))
    const keys = selectedRows.value.map(r => ({ ownerId: r.ownerId, itemNo: r.itemNo }))
    const res = await deleteBatchApi(keys)
    if (res && res.code === 1) {
      ElMessage.success(t('menu.sku.messages.deleteSuccess'))
      selectedRows.value = []
      fetchList()
    } else {
      ElMessage.error(res?.msg || t('menu.sku.messages.deleteFailed'))
    }
  } catch (err) {
    if (err !== 'cancel') console.error('onDeleteSelected error', err)
  }
}

// ---- 对话框关闭 ----
const onDialogClose = () => {
  dialogVisible.value = false
  editing.value = {}
}

onMounted(() => {
  loadDictOptions()
  fetchList()
})
</script>
