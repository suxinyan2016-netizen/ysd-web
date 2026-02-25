<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listApi, saveApi, getInfoApi, updateApi, deleteApi } from '@/api/dict'

// 元数据
const isvalidOptions = ref([{ name: '启用', value: 1 }, { name: '不启用', value: 0 }])
const groupOptions = ref([{ name: 'Hardware', value: 2 }])

const getGroupLabel = (val) => {
  const v = Number(val)
  const g = groupOptions.value.find(x => Number(x.value) === v)
  return g ? g.name : val
}

// 搜索模型
const searchModel = ref({ dictGroup: '', dictName: '', isValid: '' })

const dictList = ref([])
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)

onMounted(() => {
  search()
})

const search = async () => {
  const params = {}
  if (searchModel.value.dictGroup) params.dictGroup = searchModel.value.dictGroup
  if (searchModel.value.dictName) params.dictName = searchModel.value.dictName
  if (searchModel.value.isValid !== '') params.isValid = searchModel.value.isValid
  const res = await listApi(params)
  if (res && res.code === 1) {
    dictList.value = res.data || res
    total.value = Array.isArray(res.data) ? res.data.length : (res.data?.total || dictList.value.length)
  } else {
    dictList.value = []
    total.value = 0
  }
}

const clear = () => {
  searchModel.value = { dictGroup: '', dictName: '', isValid: '' }
  search()
}

// 新增/编辑
const dialogVisible = ref(false)
const dialogTitle = ref('Add')
const dict = ref({ dictId: null, dictGroup: '', dictName: '', isValid: 1 })
const dictFormRef = ref(null)

const addDict = () => {
  dialogTitle.value = 'Add Dict'
  dict.value = { dictId: null, dictGroup: '', dictName: '', isValid: 1 }
  dialogVisible.value = true
  if (dictFormRef.value) dictFormRef.value.resetFields()
}

const editDict = async (id) => {
  const res = await getInfoApi(id)
  if (res && res.code === 1) {
    dict.value = { ...res.data }
    dialogTitle.value = 'Edit Dict'
    dialogVisible.value = true
  }
}

const save = async () => {
  if (!dictFormRef.value) return
  dictFormRef.value.validate(async (valid) => {
    if (!valid) { ElMessage.error('Invalid data'); return }
    let res
    if (dict.value.dictId) {
      res = await updateApi(dict.value)
    } else {
      res = await saveApi(dict.value)
    }
    if (res && res.code === 1) {
      ElMessage.success('Saved')
      dialogVisible.value = false
      search()
    } else {
      ElMessage.error(res?.msg || 'Save failed')
    }
  })
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(s => s.dictId)
}

const deleteById = (id) => {
  ElMessageBox.confirm('Delete this record?','Confirm', { confirmButtonText: 'Yes', cancelButtonText: 'Cancel', type: 'warning' })
    .then(async () => {
      const res = await deleteApi(id)
      if (res && res.code === 1) { ElMessage.success('Deleted'); search() } else { ElMessage.error(res?.msg || 'Delete failed') }
    }).catch(() => {})
}

const deleteByIds = () => {
  if (!selectedIds.value || selectedIds.value.length === 0) { ElMessage.info('No selection'); return }
  ElMessageBox.confirm('Delete selected records?','Confirm', { confirmButtonText: 'Yes', cancelButtonText: 'Cancel', type: 'warning' })
    .then(async () => {
      const res = await deleteApi(selectedIds.value)
      if (res && res.code === 1) { ElMessage.success('Deleted'); search(); selectedIds.value = [] } else { ElMessage.error(res?.msg || 'Delete failed') }
    }).catch(() => {})
}

const rules = {
  dictGroup: [{ required: true, message: 'Choose group', trigger: 'change' }],
  dictName: [{ required: true, message: 'Enter name', trigger: 'blur' }],
  isValid: [{ required: true, message: 'Choose status', trigger: 'change' }]
}
</script>

<template>
  <h1>字典设置 / Dict Settings</h1>

  <div class="container">
    <el-form :inline="true" :model="searchModel" class="demo-form-inline">
      <el-form-item label="Group">
        <el-select v-model="searchModel.dictGroup" placeholder="Choose" style="width:160px">
          <el-option v-for="g in groupOptions" :key="g.value" :label="g.name" :value="g.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Name">
        <el-input v-model="searchModel.dictName" placeholder="Name" />
      </el-form-item>

      <el-form-item label="Status">
        <el-select v-model="searchModel.isValid" placeholder="Choose" style="width:120px">
          <el-option v-for="s in isvalidOptions" :key="s.value" :label="s.name" :value="s.value" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="search">Search</el-button>
        <el-button @click="clear">Clear</el-button>
      </el-form-item>
    </el-form>
  </div>

  <div class="container">
    <el-button type="primary" @click="addDict">+ Add</el-button>
    <el-button type="danger" @click="deleteByIds">- Delete</el-button>
  </div>

  <div class="container">
    <el-table :data="dictList" border style="width:100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="dictId" label="ID" width="80" />
      <el-table-column label="Group" width="180">
        <template #default="scope">{{ getGroupLabel(scope.row.dictGroup) }}</template>
      </el-table-column>
      <el-table-column prop="dictName" label="Name" />
      <el-table-column label="Status" width="120">
        <template #default="scope">{{ scope.row.isValid == 1 ? '启用' : '不启用' }}</template>
      </el-table-column>
      <el-table-column label="Operation" width="200">
        <template #default="scope">
          <el-button type="primary" size="small" @click="editDict(scope.row.dictId)">Edit</el-button>
          <el-button type="danger" size="small" @click="deleteById(scope.row.dictId)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <el-dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form :model="dict" :rules="rules" ref="dictFormRef" label-width="100px">
      <el-form-item label="Group" prop="dictGroup">
        <el-select v-model="dict.dictGroup" placeholder="Choose group">
          <el-option v-for="g in groupOptions" :key="g.value" :label="g.name" :value="g.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="Name" prop="dictName">
        <el-input v-model="dict.dictName" />
      </el-form-item>

      <el-form-item label="Status" prop="isValid">
        <el-select v-model="dict.isValid">
          <el-option v-for="s in isvalidOptions" :key="s.value" :label="s.name" :value="s.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="save">Save</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.container { margin: 10px 0 }
</style>
