<template>
  <div class="user-services">
    <div class="toolbar" style="margin-bottom:12px;">
      <el-input v-model="search.serviceName" :placeholder="t('menu.services.placeholders.serviceName')" style="width:240px;margin-right:8px;"/>
      <el-select v-model="search.dictId" :placeholder="t('menu.services.placeholders.serviceType')" clearable style="width:180px;margin-right:8px;">
        <el-option v-for="d in dictOptions" :key="d.dictId" :label="dictMap[d.dictId] || d.dictName" :value="d.dictId"/>
      </el-select>
      <el-button type="primary" @click="loadList">{{ t('menu.services.buttons.search') }}</el-button>
    </div>

    <div class="container" style="margin-bottom:12px;">
      <el-button type="primary" @click="openAdd">{{ t('menu.services.buttons.add') }}</el-button>
      <el-button type="danger" @click="deleteSelected" style="margin-left:8px;">{{ t('menu.services.buttons.deleteSelected') }}</el-button>
    </div>

    <el-table :data="rows" style="width:100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55"/>
      <el-table-column prop="dictId" :label="t('menu.services.labels.serviceType')" width="160">
        <template #default="{ row }">
          {{ dictMap[row.dictId] || row.dictId }}
        </template>
      </el-table-column>
      <el-table-column prop="serviceName" :label="t('menu.services.labels.serviceName')" width="240"/>
      <el-table-column prop="unit" :label="t('menu.services.labels.unit')" width="100"/>
      <el-table-column prop="price" :label="t('menu.services.labels.price')" width="120">
        <template #default="{ row }">{{ formatPrice(row.price) }}</template>
      </el-table-column>
      <el-table-column prop="currency" :label="t('menu.services.labels.currency')" width="100"/>
      <el-table-column prop="remark" :label="t('menu.services.labels.remark')"/>
      <el-table-column :label="t('menu.services.labels.actions')" width="160">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="openEdit(row)">{{ t('menu.services.buttons.edit') }}</el-button>
          <el-button type="text" size="small" @click="deleteOne(row)">{{ t('menu.services.buttons.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top:12px;text-align:right;">
      <el-pagination layout="prev, pager, next, sizes, total" :page-size="pageSize" :current-page="page" :total="total" @current-change="onPageChange" @size-change="onSizeChange"/>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item :label="t('menu.services.labels.serviceType')" prop="dictId">
          <el-select v-model="form.dictId" :placeholder="t('menu.services.placeholders.selectServiceType')">
            <el-option v-for="d in dictOptions" :key="d.dictId" :label="dictMap[d.dictId] || d.dictName" :value="d.dictId"/>
          </el-select>
        </el-form-item>

        <el-form-item :label="t('menu.services.labels.serviceName')" prop="serviceName">
          <el-input v-model="form.serviceName" maxlength="24" show-word-limit/>
        </el-form-item>

        <el-form-item :label="t('menu.services.labels.unit')" prop="unit">
          <el-input v-model="form.unit" maxlength="12" show-word-limit/>
        </el-form-item>

        <el-form-item :label="t('menu.services.labels.price')" prop="price">
          <el-input-number v-model="form.price" :step="0.01" :precision="2" style="width:160px;"/>
        </el-form-item>

        <el-form-item :label="t('menu.services.labels.currency')" prop="currency">
          <el-select v-model="form.currency" :placeholder="t('menu.services.placeholders.selectCurrency')">
            <el-option v-for="c in currencies" :key="c" :label="c" :value="c"/>
          </el-select>
        </el-form-item>

        <el-form-item :label="t('menu.services.labels.remark')" prop="remark">
          <el-input v-model="form.remark" maxlength="40" show-word-limit/>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('cancel') }}</el-button>
        <el-button type="primary" @click="save">{{ t('menu.services.buttons.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import i18n from '@/i18n'
import zhMsgs from '@/i18n/locales/zh.json'
import enMsgs from '@/i18n/locales/en.json'
import { ElMessage, ElMessageBox } from 'element-plus'
import { findByGroupApi } from '@/api/dict'
import * as userServiceApi from '@/api/userService'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()

const rows = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedIds = ref([])

const dictOptions = ref([])
const dictMap = reactive({})

const currencies = ['USD','CNY','EUR','JPY','CAD']

const search = reactive({ serviceName: '', dictId: null })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const form = reactive({ serviceId: null, dictId: null, serviceName: '', unit: '', price: 0.00, currency: 'USD', remark: '' })

const rules = {
  dictId: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  serviceName: [{ required: true, message: '请输入服务项目', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'change' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }]
}

onMounted(async () => {
  await loadDicts()
  await loadList()
})
const loadDicts = async () => {
  try {
    const list = (await findByGroupApi(3))?.data || []
    dictOptions.value = (list || []).map(d => ({ dictId: d.dictId ?? d.id ?? d.value, dictName: d.dictName ?? d.name ?? d.label }))
    // prepare locale messages once to avoid calling t() (prevents missing-key warnings)
    // Reliable fallback mapping for group 3 (service types).
    // This ensures Chinese/English labels show even if locale JSON isn't accessible at runtime.
    const idToZh = {
      '16': '增值服务',
      '17': '出入库服务',
      '18': '修理服务',
      '19': '运输服务',
      '20': '仓储服务'
    }
    const idToEn = {
      '16': 'additional service',
      '17': 'warehouse service',
      '18': 'repair service',
      '19': 'transport service',
      '20': 'storage service'
    }

    const currentLocale = i18n.global.locale.value || 'zh'

    dictOptions.value.forEach(d => {
      const id = String(d.dictId)
      if (currentLocale === 'zh' && idToZh[id]) {
        dictMap[d.dictId] = idToZh[id]
      } else if (currentLocale === 'en' && idToEn[id]) {
        dictMap[d.dictId] = idToEn[id]
      } else {
        // final fallback: API-provided name
        dictMap[d.dictId] = d.dictName
      }
    })
  } catch (e) {
    console.error(e)
    dictOptions.value = []
  }
}

const getUserId = () => {
  // prefer explicit route param, otherwise current logged-in user
  const uid = route.params.userId
  if (uid) return uid
  const loginUser = JSON.parse(localStorage.getItem('loginUser') || '{}')
  return loginUser.userId || loginUser.id || null
}

const loadList = async () => {
  const uid = getUserId()
  if (!uid) return ElMessage.error('无法定位用户')
  const params = { page: page.value, pageSize: pageSize.value }
  if (search.serviceName) params.serviceName = search.serviceName
  if (search.dictId) params.dictId = search.dictId

  try {
    const res = await userServiceApi.queryPageApi(uid, params)
    // normalize: support {code:1, data:{rows:[], total}} or axios-style data
    let rowsData = []
    let totalCnt = 0
    if (!res) { rowsData = []; totalCnt = 0 }
    else if (res.code === 1 && res.data) {
      if (Array.isArray(res.data.rows)) { rowsData = res.data.rows; totalCnt = res.data.total || rowsData.length }
      else if (Array.isArray(res.data)) { rowsData = res.data; totalCnt = rowsData.length }
    } else if (Array.isArray(res)) { rowsData = res; totalCnt = res.length }
    else if (Array.isArray(res.rows)) { rowsData = res.rows; totalCnt = res.total || rowsData.length }
    else if (Array.isArray(res.data)) { rowsData = res.data; totalCnt = rowsData.length }

    // default sort by dictId then serviceName
    rowsData.sort((a,b) => {
      const da = (a.dictId || 0) - (b.dictId || 0)
      if (da !== 0) return da
      const sa = (a.serviceName||'').localeCompare(b.serviceName||'')
      return sa
    })

    rows.value = rowsData
    total.value = totalCnt
  } catch (e) {
    console.error(e)
    rows.value = []
    total.value = 0
  }
}

const onPageChange = (p) => { page.value = p; loadList() }
const onSizeChange = (s) => { pageSize.value = s; loadList() }

const handleSelectionChange = (selection) => { selectedIds.value = selection.map(r => r.serviceId) }

const formatPrice = (p) => p == null ? '' : Number(p).toFixed(2)

const openAdd = () => {
  dialogTitle.value = '新增服务'
  Object.assign(form, { serviceId: null, dictId: null, serviceName: '', unit: '', price: 0.00, currency: 'USD', remark: '' })
  // quick feedback to ensure handler runs
  ElMessage.info('打开新增服务')
  dialogVisible.value = true
}

const openEdit = async (row) => {
  dialogTitle.value = '编辑服务'
  const uid = getUserId()
  try {
    const res = await userServiceApi.getApi(uid, row.serviceId)
    const data = (res && res.code === 1 && res.data) ? res.data : (res || {})
    Object.assign(form, {
      serviceId: data.serviceId,
      dictId: data.dictId,
      serviceName: data.serviceName,
      unit: data.unit,
      price: data.price || 0,
      currency: data.currency || 'USD',
      remark: data.remark || ''
    })
    dialogVisible.value = true
  } catch (e) {
    console.error(e)
    ElMessage.error('加载失败')
  }
}

const save = () => {
  if (!formRef.value) return
  formRef.value.validate(async valid => {
    if (!valid) return
    const uid = getUserId()
    if (!uid) return ElMessage.error('无法定位用户')
    try {
      if (form.serviceId) {
        await userServiceApi.updateApi(uid, form.serviceId, form)
        ElMessage.success('更新成功')
      } else {
        await userServiceApi.addApi(uid, form)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadList()
    } catch (e) {
      console.error(e)
      ElMessage.error('保存失败')
    }
  })
}

const deleteOne = (row) => {
  ElMessageBox.confirm(t('menu.services.messages.deleteConfirm'), t('menu.services.messages.deleteConfirmTitle') || t('common.deleteConfirmTitle'), { type: 'warning' }).then(async () => {
    const uid = getUserId()
    try {
      await userServiceApi.deleteApi(uid, row.serviceId)
      ElMessage.success(t('menu.services.messages.deleteSuccess') || t('common.deleteSuccess'))
      loadList()
    } catch (e) {
      console.error(e)
      ElMessage.error(t('menu.services.messages.deleteFailed') || t('common.deleteFailed'))
    }
  }).catch(()=>{})
}

const deleteSelected = () => {
  if (!selectedIds.value.length) return ElMessage.info(t('menu.services.messages.selectToDelete') || t('common.noSelection'))
  ElMessageBox.confirm(t('menu.services.messages.deleteSelectedConfirm') || t('common.deleteSelectedConfirm'), t('menu.services.messages.deleteConfirmTitle') || t('common.deleteConfirmTitle'), { type: 'warning' }).then(async () => {
    const uid = getUserId()
    try {
      await userServiceApi.deleteApi(uid, selectedIds.value)
      ElMessage.success(t('menu.services.messages.deleteSuccess') || t('common.deleteSuccess'))
      loadList()
    } catch (e) {
      console.error(e)
      ElMessage.error(t('menu.services.messages.deleteFailed') || t('common.deleteFailed'))
    }
  }).catch(()=>{})
}

</script>

<style scoped>
.user-services { padding: 12px }
</style>
