<script setup>
import { ref, watch, onMounted, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n'
import i18n from '@/i18n'
import { queryPageApi, addApi, queryInfoApi, updateApi, deleteApi, selectUsersByDictId, getUserTypesApi, updateUserTypesApi, getUserWarehouseUsers, addUserWarehouse, deleteUserWarehouse } from '@/api/user';
import { findByGroupApi } from '@/api/dict'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as Icons from '@element-plus/icons-vue'
const { EditPen, Delete } = Icons
const { t } = useI18n()

//元数据
//是否状态有效
const isvalid = ref([{ name: 'valid', value: 1 }, { name: 'invalid', value: 0 }])


const token = ref('')

const dictOptions = ref([])
const serviceDictMap = reactive({})
const selectedDictIds = ref([])
//搜索表单对象
const searchUser = ref({ username: '', name: '',address: '', isValid: ''})


//钩子函数
onMounted(async () => {
  // load dict options (group 1), then initial search
  try {
    const list = (await findByGroupApi(1))?.data || []
    dictOptions.value = (list || []).map(d => ({ dictId: d.dictId ?? d.id ?? d.value, dictName: d.dictName ?? d.name ?? d.label }))
  } catch (err) {
    console.error('load dict options error', err)
    dictOptions.value = []
  }
  // load service type dicts (group 3) and prepare locale-aware labels (match account/services approach)
  try {
    const list3 = (await findByGroupApi(3))?.data || []
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
    const currentLocaleRaw = i18n.global?.locale?.value || 'zh'
    const s = (typeof currentLocaleRaw === 'string') ? currentLocaleRaw.toLowerCase() : String(currentLocaleRaw).toLowerCase()
    const isZh = s.indexOf('zh') === 0
    const isEn = s.indexOf('en') === 0
    (list3 || []).forEach(d => {
      const id = d.dictId ?? d.id ?? d.value
      const sid = String(id)
      if (isZh && idToZh[sid]) {
        serviceDictMap[id] = idToZh[sid]
      } else if (isEn && idToEn[sid]) {
        serviceDictMap[id] = idToEn[sid]
      } else {
        serviceDictMap[id] = d.dictName ?? d.name ?? d.label
      }
    })
  } catch (e) {
    console.error('load service dicts error', e)
  }

  

  search(); //查询用户列表数据
  getToken(); //获取token
})

// helper: populate type names for a list of users (attach `_typeNames` string)
const populateUserTypeNames = async (users) => {
  if (!users || !users.length) return
  try {
    await Promise.all(users.map(async (u) => {
      try {
        // Prefer dictNames/dictNamesJoined/dictName returned by selectUsersByDictId
        if (Array.isArray(u.dictNames) && u.dictNames.length) {
          u._typeNames = u.dictNames.join(', ')
          return
        }
        if (typeof u.dictNamesJoined === 'string' && u.dictNamesJoined.length) {
          u._typeNames = u.dictNamesJoined
          return
        }
        if (u.dictName) {
          u._typeNames = u.dictName
          return
        }

        // Fallback: call API to fetch types for this user (use userid/userId/id)
        const uid = u.userId ?? u.userid ?? u.id
        if (uid == null) {
          u._typeNames = ''
          return
        }

        const typesRes = (await getUserTypesApi(uid))?.data || []
        const names = (typesRes || []).map(it => it.dictName || it.name || it.label).filter(Boolean)
        u._typeNames = names.join(', ')
      } catch (e) {
        u._typeNames = ''
      }
    }))
  } catch (e) {
    console.error('populateUserTypeNames error', e)
  }
}

//获取token
const getToken = () => {
  const loginUser = JSON.parse(localStorage.getItem('loginUser'));
  if(loginUser && loginUser.token){
    token.value = loginUser.token;
  }
}

//查询用户列表
const search = async () => {
  // If user type(s) selected, call selectUsersByDictId for each dictId and merge results
  const paramsBase = {
    name: searchUser.value.name || null,
    username: searchUser.value.username || null,
    address: searchUser.value.address || null,
    isValid: searchUser.value.isValid !== '' ? searchUser.value.isValid : null
  }

  if (selectedDictIds.value && selectedDictIds.value.length > 0) {
    const allRows = []
    for (const dictId of selectedDictIds.value) {
      try {
        const res = await selectUsersByDictId({ ...paramsBase, dictId })
        // Backend responses vary: normalize to an array of rows.
        let rows = []
        if (!res) {
          rows = []
        } else if (Array.isArray(res)) {
          rows = res
        } else if (Array.isArray(res.data)) {
          rows = res.data
        } else if (res.code === 1 && Array.isArray(res.data)) {
          rows = res.data
        } else if (res.data && Array.isArray(res.data.rows)) {
          rows = res.data.rows
        } else {
          // fallback: try to extract 'data' field if it's an array-like value
          const maybe = res.data || res
          if (Array.isArray(maybe)) rows = maybe
          else rows = []
        }

        if (rows && rows.length) allRows.push(...rows)
      } catch (err) {
        console.error('selectUsersByDictId error', err)
      }
    }
    // merge unique by userId
    const map = new Map()
    allRows.forEach(r => {
      const id = r.userId ?? r.userid ?? r.id
      if (id != null && !map.has(id)) map.set(id, r)
    })
    const merged = Array.from(map.values())
    userList.value = merged
    total.value = merged.length
    // populate type names for display
    populateUserTypeNames(userList.value)
  } else {
    // Default: call /users/by-dict with paging params
    const params = {
      ...paramsBase,
      page: currentPage.value,
      pageSize: pageSize.value
    }

    try {
      const res = await selectUsersByDictId(params)
      // normalize response: support direct array, axios-style {data: [...]}, or {code:1, data:{rows:[], total}}
      let rows = []
      let totalCnt = 0

      if (!res) {
        rows = []
        totalCnt = 0
      } else if (Array.isArray(res)) {
        rows = res
        totalCnt = res.length
      } else if (Array.isArray(res.data)) {
        rows = res.data
        totalCnt = Array.isArray(res.data) ? res.data.length : 0
      } else if (res.code === 1) {
        if (res.data) {
          if (Array.isArray(res.data.rows)) {
            rows = res.data.rows
            totalCnt = res.data.total || rows.length
          } else if (Array.isArray(res.data)) {
            rows = res.data
            totalCnt = rows.length
          }
        }
      } else if (res.data && Array.isArray(res.data.rows)) {
        rows = res.data.rows
        totalCnt = res.data.total || rows.length
      }

      userList.value = rows || []
      total.value = totalCnt || (userList.value.length)
      populateUserTypeNames(userList.value)
    } catch (err) {
      console.error('selectUsersByDictId paging error', err)
      userList.value = []
      total.value = 0
    }
  }
}

//清空
const clear = () => {
  searchUser.value = {username: '', name: '', address: '', isValid: ''};
  selectedDictIds.value = []
  search();
}

//员工列表数据
const userList = ref([])

//分页
const currentPage = ref(1); //页码
const pageSize = ref(10); //每页展示记录数
const background = ref(true); //背景色
const total = ref(0); //总记录数

//每页展示记录数变化
const handleSizeChange = (val) => {
  search();
}
//页码变化时触发
const handleCurrentChange = (val) => {
  search();
}

//新增员工
const addUser = () => {
  dialogVisible.value = true;
  dialogTitle.value = t('user.buttons.add');
  user.value = {
    username: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    zipcode: '',
    email: '',
    isValid: 1
  }

  //重置表单的校验规则-提示信息
  if (userFormRef.value){
    userFormRef.value.resetFields();
  }
}

//新增/修改表单
const user = ref({
  username: '',
  password: '',
  name: '',
  phone: '',
  address: '',
  zipcode: '',
  email: '',
  isValid: 1,
  selectedDictIds: [],
  isVerified: 0
})

// 控制弹窗
const dialogVisible = ref(false)
const dialogTitle = ref('')



//保存用户
const save = async () => {
  //表单校验
  if(!userFormRef.value) return;
 userFormRef.value.validate(async (valid) => { //valid 表示是否校验通过: true 通过 / false  不通过
    if(valid){ //通过

      let result;
      if(user.value.userId){ //修改
        result = await updateApi(user.value);
      }else { //新增
        result = await addApi(user.value);
      }
      
          if(result.code) {//成功
            // after saving user, persist user types if provided
            let savedUserId = user.value.userId || result.data?.userId || result.data?.id || result.data
            try {
              if (Array.isArray(user.value.selectedDictIds) && savedUserId) {
                await updateUserTypesApi(savedUserId, user.value.selectedDictIds)
              }
            } catch (e) {
              console.error('updateUserTypesApi error', e)
            }

            ElMessage.success(t('user.messages.saved'));
            dialogVisible.value = false;
            search();
          } else { //失败了
            ElMessage.error(result.msg);
          }
    }else { //不通过
      ElMessage.error(t('user.messages.cannot_save'));
    }
  })
}
//表单引用
const userFormRef = ref();

//表单校验规则
const rules = ref({
  username: [
    { required: true, message: t('user.placeholders.username'), trigger: 'blur' },
    { min: 2, max: 40, message: t('user.placeholders.input_username'), trigger: 'blur' }
  ],
  name: [
    { required: true, message: t('user.placeholders.name'), trigger: 'blur' },
    { min: 2, max: 40, message: t('user.placeholders.input_name'), trigger: 'blur' }
  ],
  isValid: [
    { required: true, message: t('user.fields.isValid'), trigger: 'change' }
  ],
  phone: [
   
    /**
     * 正则表达式: / ..... / ;  ^ : 以...开始 ;  $ : 以 ... 结束
     * [3-9] : 范围 3-9 之间
     * \d : 数字, [0-9]
     * {9} : 量词
     */
    {
    pattern: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/,
    message: 'Please enter a valid North American phone number.',
    trigger: 'blur'
    }
  ]
});

//编辑
const edit = async (userId) => {
  const result = await queryInfoApi(userId);
  if(result.code){
    dialogVisible.value = true;
    dialogTitle.value = t('user.buttons.edit');
    user.value = { ...result.data };
    // load user types for edit dialog
    try {
      const types = (await getUserTypesApi(userId))?.data || []
      user.value.selectedDictIds = (types || []).map(it => it.dictId)
    } catch (e) {
      user.value.selectedDictIds = []
    }
    // ensure isVerified field exists
    user.value.isVerified = user.value.isVerified ?? 0
    // 重置表单的校验规则-提示信息
    if (userFormRef.value){
      userFormRef.value.resetFields();
    }
    
  }
}

// normalize row id across different backend shapes (userId / userid / id)
const getRowId = (r) => {
  if (!r) return null
  return r.userId ?? r.userid ?? r.id ?? null
}



//删除员工
const deleteById = (userId) => {

  //弹出确认框
  ElMessageBox.confirm(t('user.messages.delete_confirm'), t('user.messages.delete_confirm_title'),
    { confirmButtonText: t('user.buttons.yes'),cancelButtonText: t('user.buttons.no'),type: 'warning'}
  ).then(async () => { //确认
    const result = await deleteApi(userId);
    if(result.code){
      ElMessage.success(t('user.messages.deleted'));
      search();
    }else{
      ElMessage.error(result.msg);
    }
  }).catch(() => { //取消
    ElMessage.info(t('user.messages.canceled'));
  })
}
//记录勾选的员工的id
const selectedIds = ref([]);
//复选框勾选发生变化时触发 - selection: 当前选中的记录 (数组)
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => getRowId(item)).filter(Boolean);
}

import * as userServiceApi from '@/api/userService'
import ServiceDetailsDialog from '@/components/common/ServiceDetailsDialog.vue'

// Services dialog state (now uses reusable component)
const servicesDialogVisible = ref(false)
const servicesList = ref([])
const servicesLoading = ref(false)
const servicesUserName = ref('')
const servicesUserId = ref(null)

const servicesColumnLabel = computed(() => {
  const loc = i18n.global.locale.value || 'zh'
  return loc === 'en' ? 'Services' : '服务详情'
})

const openServices = async (row) => {
  const uid = getRowId(row)
  if (!uid) return ElMessage.error('无法定位用户')
  servicesUserId.value = uid
  servicesUserName.value = row.name || row.username || ''
  servicesLoading.value = true
  servicesList.value = []
  try {
    const res = await userServiceApi.queryAllApi(uid)
    let rows = []
    if (!res) rows = []
    else if (res.code === 1 && Array.isArray(res.data)) rows = res.data
    else if (Array.isArray(res)) rows = res
    else if (res.data && Array.isArray(res.data.rows)) rows = res.data.rows
    else if (Array.isArray(res.data)) rows = res.data
    servicesList.value = rows
    servicesDialogVisible.value = true
  } catch (e) {
    console.error(e)
    ElMessage.error('加载服务失败')
  } finally {
    servicesLoading.value = false
  }
}

// Resolve service type label with i18n fallback to serviceDictMap/row.dictName
const getServiceTypeLabel = (id, row) => {
  if (id == null) return ''

  // inline known mappings (same as account/services)
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

  // determine locale from multiple sources
  const vueLocale = (i18n && i18n.global && i18n.global.locale && i18n.global.locale.value) || ''
  const navLocale = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : ''
  const docLang = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) ? document.documentElement.lang : ''
  const currentLocaleRaw = vueLocale || navLocale || docLang || 'zh'
  const s = (typeof currentLocaleRaw === 'string') ? currentLocaleRaw.toLowerCase() : String(currentLocaleRaw).toLowerCase()
  const isZh = s.indexOf('zh') === 0
  const isEn = s.indexOf('en') === 0

  // prefer i18n messages if available
  try {
    const key = `dict.group.3.${id}`
    const localeCandidates = [vueLocale, navLocale, docLang, 'zh', 'zh-CN', 'en']
    for (const loc of localeCandidates) {
      if (!loc) continue
      try {
        const msgs = (i18n.global && i18n.global.getLocaleMessage) ? i18n.global.getLocaleMessage(loc) : null
        const group = msgs && msgs.dict && msgs.dict.group && (msgs.dict.group['3'] || msgs.dict.group[3])
        if (group) {
          const v = group[String(id)] ?? group[id]
          if (v) return v
        }
      } catch (_) {}
    }
    if (i18n.global && i18n.global.te && i18n.global.te(key)) return t(key)
  } catch (_) {}

  // fallback to explicit mappings based on detected locale
  const sid = String(id)
  if (isZh && idToZh[sid]) return idToZh[sid]
  if (isEn && idToEn[sid]) return idToEn[sid]

  // final fallback to dict map or row-provided name
  return serviceDictMap[id] || serviceDictMap[String(id)] || row?.dictName || id
}

// Populate warehouses for displayed users: for each user, fetch assigned warehouse users and attach _warehouseNames/_warehouseIds
const populateWarehouses = async (users) => {
  if (!users || !users.length) return
  await Promise.all(users.map(async (u) => {
    try {
      const uid = getRowId(u)
      if (!uid) {
        u._warehouseNames = ''
        u._warehouseIds = []
        return
      }
      const res = await getUserWarehouseUsers(uid)
      const rows = (res && Array.isArray(res)) ? res : (res?.data || [])
      const names = (rows || []).map(r => r.name || r.username || r.userName).filter(Boolean)
      const ids = (rows || []).map(r => r.userId ?? r.userid ?? r.id).filter(Boolean)
      u._warehouseNames = names.join(', ')
      u._warehouseIds = ids
    } catch (e) {
      u._warehouseNames = ''
      u._warehouseIds = []
    }
  }))
}

// Warehouse assignment dialog state
const warehouseDialogVisible = ref(false)
const warehouseCandidates = ref([]) // potential warehouses (User objects)
const warehouseLoading = ref(false)
const selectedWarehouseIdsForAssign = ref([])
const assigningUserId = ref(null)
const assigningUserName = ref('')

const warehouseColumnLabel = computed(() => {
  const loc = i18n.global.locale.value || 'zh'
  return loc === 'en' ? 'Warehouses' : '仓库'
})

// UI state for two-column assignment
const assignedWarehouseUsers = ref([]) // full User objects assigned to the current user
const leftWarehouseCandidates = computed(() => {
  const assignedIds = (selectedWarehouseIdsForAssign.value || []).map(Number)
  return (warehouseCandidates.value || []).filter(c => {
    const id = getRowId(c)
    return id != null && !assignedIds.includes(Number(id))
  })
})

// Drag/drop handlers
const allowDrop = (e) => { e.preventDefault() }
const handleDragStart = (e, item, from) => {
  try {
    e.dataTransfer.setData('text/plain', String(getRowId(item)))
    e.dataTransfer.setData('from', from)
  } catch (err) {
    // ignore
  }
}

const handleDropToRight = (e) => {
  e.preventDefault()
  const idStr = e.dataTransfer.getData('text/plain') || ''
  const id = Number(idStr)
  if (!id) return
  if (!selectedWarehouseIdsForAssign.value.includes(id)) {
    const item = warehouseCandidates.value.find(c => Number(getRowId(c)) === id)
    if (item) {
      assignedWarehouseUsers.value.push(item)
      selectedWarehouseIdsForAssign.value = [...selectedWarehouseIdsForAssign.value, id]
    }
  }
}

const handleDropToLeft = (e) => {
  e.preventDefault()
  const idStr = e.dataTransfer.getData('text/plain') || ''
  const id = Number(idStr)
  if (!id) return
  // remove from assigned
  if (selectedWarehouseIdsForAssign.value.includes(id)) {
    selectedWarehouseIdsForAssign.value = selectedWarehouseIdsForAssign.value.filter(x => Number(x) !== id)
    assignedWarehouseUsers.value = (assignedWarehouseUsers.value || []).filter(u => Number(getRowId(u)) !== id)
  }
}

// Open assign warehouses dialog
const openAssignWarehouses = async (row) => {
  const uid = getRowId(row)
  if (!uid) return ElMessage.error('无法定位用户')
  assigningUserId.value = uid
  assigningUserName.value = row.name || row.username || ''
  warehouseLoading.value = true
  warehouseCandidates.value = []
  selectedWarehouseIdsForAssign.value = []

    try {
    // load candidates for user_type dictId = 13 (warehouse users)
    const candRes = await selectUsersByDictId({ dictId: 13 })
    let candidates = []
    if (!candRes) {
      candidates = []
    } else if (Array.isArray(candRes)) {
      candidates = candRes
    } else if (candRes.data && Array.isArray(candRes.data.rows)) {
      // support { code:1, data:{ total, rows: [...] } }
      candidates = candRes.data.rows
    } else if (Array.isArray(candRes.data)) {
      candidates = candRes.data
    } else if (candRes.code === 1 && candRes.data && Array.isArray(candRes.data)) {
      candidates = candRes.data
    }
    warehouseCandidates.value = candidates || []

    // load existing assignments to pre-select (also keep full user objects for right column)
    try {
      const assignedRes = await getUserWarehouseUsers(uid)
      let assigned = []
      if (!assignedRes) assigned = []
      else if (Array.isArray(assignedRes)) assigned = assignedRes
      else if (Array.isArray(assignedRes.data)) assigned = assignedRes.data
      const assignedRows = assigned || []
      assignedWarehouseUsers.value = assignedRows
      selectedWarehouseIdsForAssign.value = (assignedRows || []).map(a => a.userId ?? a.userid ?? a.id).filter(Boolean)
    } catch (e) {
      selectedWarehouseIdsForAssign.value = []
      assignedWarehouseUsers.value = []
    }

    warehouseDialogVisible.value = true
  } catch (e) {
    console.error('openAssignWarehouses error', e)
    ElMessage.error('加载仓库候选失败')
  } finally {
    warehouseLoading.value = false
  }
}

// Save assigned warehouses: diff and call add/delete APIs
const saveAssignedWarehouses = async () => {
  if (!assigningUserId.value) return ElMessage.error('无法定位用户')
  const uid = assigningUserId.value
  const newIds = Array.isArray(selectedWarehouseIdsForAssign.value) ? selectedWarehouseIdsForAssign.value.map(Number) : []
  // current assigned ids (from userList cache) or refetch
  let currentIds = []
  try {
    const res = await getUserWarehouseUsers(uid)
    let assigned = []
    if (!res) assigned = []
    else if (Array.isArray(res)) assigned = res
    else if (Array.isArray(res.data)) assigned = res.data
    currentIds = (assigned || []).map(a => a.userId ?? a.userid ?? a.id).filter(Boolean)
  } catch (e) {
    currentIds = []
  }

  const toAdd = newIds.filter(id => !currentIds.includes(id))
  const toRemove = currentIds.filter(id => !newIds.includes(id))

  try {
    // Add new mappings
    for (const wid of toAdd) {
      await addUserWarehouse(uid, wid)
    }
    // Remove unselected mappings
    for (const wid of toRemove) {
      await deleteUserWarehouse(uid, wid)
    }
    ElMessage.success('保存成功')
    warehouseDialogVisible.value = false
    // refresh displayed warehouses
    search()
  } catch (e) {
    console.error('saveAssignedWarehouses error', e)
    ElMessage.error('保存失败')
  }
}

//批量删除
const deleteByIds = () => {
  // 检查是否有选中的数据
  if(!selectedIds.value || selectedIds.value.length === 0){
    ElMessage.info(t('user.messages.no_selected'));
    return;
  }
  
  console.log('批量删除 IDs:', selectedIds.value);
  
  // 弹出确认框
  ElMessageBox.confirm(t('user.messages.delete_multiple_confirm'), t('user.messages.delete_confirm_title'),
    { confirmButtonText: t('user.buttons.yes'),cancelButtonText: t('user.buttons.no'),type: 'warning'}
  ).then(async () => { //确认
    // 确保传递正确的 ID 数组
    const result = await deleteApi(selectedIds.value);
    if(result.code){
      ElMessage.success(t('user.messages.deleted'));
      search();
      selectedIds.value = []; // 清空选中状态
    }else{
      ElMessage.error(result.msg);
    }
  }).catch(() => { //取消
    ElMessage.info(t('user.messages.canceled'));
  })
}

</script>

<template>
  <h1>{{ t('menu.user') }}</h1>

  <!-- 搜索栏 -->
  <div class="container">
    <el-form :inline="true" :model="searchUser" class="demo-form-inline">
      <el-form-item :label="t('user.fields.username')">
        <el-input v-model="searchUser.username" :placeholder="t('user.placeholders.username')" />
      </el-form-item>

      <el-form-item :label="t('user.fields.name')">
        <el-input v-model="searchUser.name" :placeholder="t('user.placeholders.name')" />
      </el-form-item>

      <el-form-item :label="t('user.fields.address')">
        <el-input v-model="searchUser.address" :placeholder="t('user.placeholders.address')" />
      </el-form-item>

      <el-form-item :label="t('user.fields.userType')" style="min-width: 220px;">
        <el-select v-model="selectedDictIds" multiple collapse-tags clearable :placeholder="t('user.placeholders.choose')" style="width:100%">
          <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('user.fields.isValid')" style="min-width: 180px;">
        <el-select v-model="searchUser.isValid" :placeholder="t('user.placeholders.choose')"  style="width: 100%;">
          <el-option :label="t('user.status.valid')" value="1" />
          <el-option :label="t('user.status.invalid')" value="0" />
        </el-select>
      </el-form-item>

      

      <el-form-item>
        <el-button type="primary" @click="search">{{ t('user.buttons.search') }}</el-button>
        <el-button type="info" @click="clear">{{ t('user.buttons.clear') }}</el-button>
      </el-form-item>
    </el-form>
  </div>
  
  <!-- 功能按钮 -->
  <div class="container">
    <el-button type="primary" @click="addUser">+ {{ t('user.buttons.add') }}</el-button>
    <el-button type="danger" @click="deleteByIds">- {{ t('user.buttons.delete') }}</el-button>
  </div>

  <!-- 数据展示表格 -->
  <div class="container">
    <el-table :data="userList" border style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column prop="username" :label="t('user.fields.username')" width="120" align="center"/>
      <el-table-column prop="name" :label="t('user.fields.name')" width="120" align="center"/>
      <el-table-column prop="phone" :label="t('user.fields.phone')" width="120" align="center"/>
      <el-table-column :label="t('user.fields.isValid')" width="120"  align="center">
        <template #default="scope">
          {{ ((scope.row.isValid ?? scope.row.isvalid ?? scope.row.valid) == 1) ? t('user.status.valid') : t('user.status.invalid') }}
        </template>
      </el-table-column>
      <el-table-column prop="address" :label="t('user.fields.address')" width="320" align="left"/>
      <el-table-column :label="t('user.fields.userType')" width="200" align="left">
        <template #default="scope">
          {{ scope.row._typeNames || scope.row.dictName || '' }}
        </template>
      </el-table-column>
      <!-- 仓库列已移除 -->
      <el-table-column :label="servicesColumnLabel" width="120" align="center">
        <template #default="scope">
          <a href="#" @click.prevent="openServices(scope.row)">{{ servicesColumnLabel }}</a>
        </template>
      </el-table-column>
      
      
      
      
      <el-table-column :label="t('user.table.operation')" align="center">
        <template #default="scope">
              <el-button type="primary" size="small" @click="edit(getRowId(scope.row))"><el-icon><EditPen /></el-icon> {{ t('user.buttons.edit') }}</el-button>
              <el-button type="success" size="small" @click="openAssignWarehouses(scope.row)">分配仓库</el-button>
              <el-button type="danger" size="small" @click="deleteById(getRowId(scope.row))"><el-icon><Delete /></el-icon> {{ t('user.buttons.delete') }}</el-button>
        </template>
      </el-table-column>
 
    </el-table>
  </div>

  <!-- 分页条 -->
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
  
  <!-- 新增员工/修改员工的对话框 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form :model="user" :rules="rules" ref="userFormRef" label-width="80px">
      <!-- 基本信息 -->
      <!-- 第一行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="t('user.fields.username')" prop="username">
            <el-input v-model="user.username" :placeholder="t('user.placeholders.input_username')"></el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item :label="t('user.fields.password')" prop="password">
            <el-input v-model="user.password" :placeholder="t('user.placeholders.input_password')"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      
      <!-- 第二行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="t('user.fields.name')" prop="name">
            <el-input v-model="user.name" :placeholder="t('user.placeholders.input_name')"></el-input>
          </el-form-item>
        </el-col>
        

        <el-col :span="12">
          <el-form-item :label="t('user.fields.phone')" prop="phone">
            <el-input v-model="user.phone" :placeholder="t('user.placeholders.input_phone')"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第三行 -->
      <el-row :gutter="20">
        <el-col :span="18">
          <el-form-item :label="t('user.fields.address')" prop="address">
            <el-input v-model="user.address" :placeholder="t('user.placeholders.input_address')"></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item :label="t('user.fields.zipcode')" prop="zipcode">
            <el-input v-model="user.zipcode" :placeholder="t('user.placeholders.input_zipcode')"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 用户类型 + 是否认证 -->
      <el-row :gutter="20" style="margin-top:8px">
        <el-col :span="12">
          <el-form-item :label="t('user.fields.userType')">
            <el-select v-model="user.selectedDictIds" multiple collapse-tags clearable :placeholder="t('user.placeholders.choose')" style="width:100%">
              <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item :label="t('user.fields.isVerified')">
            <el-radio-group v-model="user.isVerified">
                  <el-radio :label="0">否</el-radio>
                  <el-radio :label="1">是</el-radio>
                </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 第四行 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="t('user.fields.email')" prop="email">
            <el-input v-model="user.email" :placeholder="t('user.placeholders.input_email')"></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item :label="t('user.fields.isValid')"  prop="isValid">
            <el-select v-model="user.isValid" :placeholder="t('user.placeholders.choose')" style="width: 100%;">
              <el-option v-for="g in isvalid" :key="g.value" :label="g.name" :value="g.value"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>
    
    <!-- 底部按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ t('user.buttons.cancel') }}</el-button>
        <el-button type="primary" @click="save">{{ t('user.buttons.save') }}</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 仓库分配对话框（左右两栏，支持拖放） -->
  <el-dialog v-model="warehouseDialogVisible" :title="assigningUserName + ' - ' + warehouseColumnLabel" width="900px">
    <div style="display:flex; gap:12px;">
      <div style="flex:1; border:1px solid var(--el-border-color); padding:8px; border-radius:4px; background:#fff;">
        <h4 style="margin:4px 0">所有仓库</h4>
        <div style="min-height:260px; max-height:420px; overflow:auto;" @dragover.prevent="allowDrop" @drop="handleDropToLeft">
          <div v-for="c in leftWarehouseCandidates" :key="getRowId(c)" class="warehouse-item" draggable="true" @dragstart="(e) => handleDragStart(e, c, 'left')" style="padding:8px;border:1px solid #eee;margin:6px 0;border-radius:4px;background:#fafafa;">
            {{ c.name || c.username || c.userName }}
          </div>
        </div>
      </div>

      <div style="width:40px; display:flex; align-items:center; justify-content:center;">
        <div style="writing-mode:vertical-rl; transform:rotate(180deg); color: #999">拖放</div>
      </div>

      <div style="flex:1; border:1px solid var(--el-border-color); padding:8px; border-radius:4px; background:#fff;">
        <h4 style="margin:4px 0">已分配仓库</h4>
        <div style="min-height:260px; max-height:420px; overflow:auto;" @dragover.prevent="allowDrop" @drop="handleDropToRight">
          <div v-for="c in assignedWarehouseUsers" :key="getRowId(c)" class="warehouse-item" draggable="true" @dragstart="(e) => handleDragStart(e, c, 'right')" style="padding:8px;border:1px solid #eee;margin:6px 0;border-radius:4px;background:#f4ffef;">
            {{ c.name || c.username || c.userName }}
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="warehouseDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveAssignedWarehouses">保存</el-button>
    </template>
  </el-dialog>

  <!-- 用户服务对话框（复用组件） -->
  <ServiceDetailsDialog v-model="servicesDialogVisible" :title="servicesUserName + ' - ' + servicesColumnLabel" :services="servicesList" :loading="servicesLoading" width="100%" />

</template>

<style scoped>
.container {
  margin: 10px 0px;
}

.avatar {
  height: 40px;
}
.avatar-uploader .avatar {
  width: 78px;
  height: 78px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 78px;
  height: 78px;
  text-align: center;
  border-radius: 10px;
  /* 添加灰色的虚线边框 */
  border: 1px dashed var(--el-border-color);
}
</style>