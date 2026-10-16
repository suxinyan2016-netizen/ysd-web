<template>
  <div>
    <h1>{{ $t('menu.account.mySlots') }}</h1>

    <!-- 操作栏 -->
    <div style="margin:10px 0; padding:8px 12px; background:#f5f5f5; border:1px solid #e6e6e6; border-radius:4px;">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <el-button type="primary" @click="onAdd">新增</el-button>
        <el-button type="danger" @click="onDeleteSelected">批量删除</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      :data="slotList"
      border
      stripe
      @selection-change="onSelectionChange"
      style="width:100%"
    >
      <el-table-column type="selection" width="40" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="slot" label="Slot (货架)" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="onEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="480px"
      @close="onDialogClose"
    >
      <el-form :model="editing" label-width="100px">
        <el-form-item label="Slot (货架)">
          <el-input v-model="editing.slot" placeholder="请输入货架编号，如 A-1-23" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onDialogClose">取消</el-button>
        <el-button type="primary" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getSlotsApi, createSlotApi, updateSlotApi, deleteSlotsApi } from '@/api/slot'

const { t } = useI18n()

// ---- 状态 ----
const slotList = ref([])
const selectedRows = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEditing = ref(false)
const editing = ref({})

// ---- 查询 ----
const fetchList = async () => {
  try {
    const res = await getSlotsApi()
    if (res && res.code === 1) {
      slotList.value = res.data || []
    } else {
      ElMessage.error(res?.msg || '加载失败')
    }
  } catch (err) {
    console.error('fetchList error', err)
    ElMessage.error('加载失败')
  }
}

// ---- 选中 ----
const onSelectionChange = (rows) => {
  selectedRows.value = rows
}

// ---- 新增 ----
const onAdd = () => {
  isEditing.value = false
  dialogTitle.value = '新增货架'
  editing.value = {}
  dialogVisible.value = true
}

// ---- 编辑 ----
const onEdit = (row) => {
  isEditing.value = true
  dialogTitle.value = '编辑货架'
  editing.value = { ...row }
  dialogVisible.value = true
}

// ---- 保存 ----
const onSave = async () => {
  if (!editing.value.slot) {
    ElMessage.warning('请输入货架编号')
    return
  }
  try {
    let res
    if (isEditing.value) {
      res = await updateSlotApi(editing.value.id, editing.value.slot)
    } else {
      res = await createSlotApi(editing.value.slot)
    }
    if (res && res.code === 1) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      fetchList()
    } else {
      ElMessage.error(res?.msg || '保存失败')
    }
  } catch (err) {
    console.error('onSave error', err)
    ElMessage.error('保存失败')
  }
}

// ---- 单行删除 ----
const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该货架吗？', '确认删除')
    const res = await deleteSlotsApi(row.id)
    if (res && res.code === 1) {
      ElMessage.success('删除成功')
      fetchList()
    } else {
      ElMessage.error(res?.msg || '删除失败')
    }
  } catch (err) {
    // user cancelled or request error
    if (err !== 'cancel') console.error('onDelete error', err)
  }
}

// ---- 批量删除 ----
const onDeleteSelected = async () => {
  if (!selectedRows.value.length) {
    ElMessage.info('请选择要删除的记录')
    return
  }
  try {
    await ElMessageBox.confirm('确认删除选中的货架吗？', '确认删除')
    const ids = selectedRows.value.map(r => r.id)
    const res = await deleteSlotsApi(ids)
    if (res && res.code === 1) {
      ElMessage.success('删除成功')
      selectedRows.value = []
      fetchList()
    } else {
      ElMessage.error(res?.msg || '删除失败')
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
  fetchList()
})
</script>
