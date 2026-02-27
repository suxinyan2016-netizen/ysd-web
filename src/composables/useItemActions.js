import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryInfoApi, addApi, updateApi, deleteApi } from '@/api/item'
import { useUser } from '@/composables/useUser'
import { useI18n } from 'vue-i18n'

export function useItemActions(options = {}) {
  const { fetchList, currentUser: injectedCurrentUser, getUserName: injectedGetUserName } = options
  const { t } = useI18n()
  let currentUser
  let getUserName
  if (injectedCurrentUser && injectedGetUserName) {
    currentUser = injectedCurrentUser
    getUserName = injectedGetUserName
  } else {
    const userHooks = useUser()
    currentUser = userHooks.currentUser
    getUserName = userHooks.getUserName
  }

  const editing = ref({})
  const detailData = ref({})
  const detailVisible = ref(false)
  const dialogVisible = ref(false)
  const dialogTitle = ref('')

  const preparePayload = (data) => {
    const payload = { ...data }
    payload.ispaid = data.isPaid == null ? 0 : data.isPaid
    payload.isUnpacked = data.isUnpacked == null ? 0 : data.isUnpacked
    payload.ownerId = currentUser.value.userId || payload.ownerId
    return payload
  }

  const viewDetail = async (row) => {
    if (!row) return
    // show immediate data while fetching full info
    detailData.value = { ...row }
    detailVisible.value = true
    try {
      const res = await queryInfoApi(row.itemId)
      if (res && res.code === 1) {
        detailData.value = res.data || res
      }
    } catch (err) {
      console.error('Failed to load item detail', err)
      ElMessage.error('Failed to load item')
    }
  }

  const onEdit = async (row) => {
    try {
      const res = await queryInfoApi(row.itemId)
      if (res && res.code === 1) {
        const d = res.data || res
        editing.value = { ...d }
        editing.value.isPaid = d.ispaid == null ? 0 : d.ispaid
        editing.value.isGood = d.isGood == null ? 1 : d.isGood
        editing.value.isUnpacked = d.isUnpacked == null ? 0 : d.isUnpacked
        editing.value.ownerId = d.ownerId || currentUser.value.userId || null
        editing.value.owner = d.owner || getUserName(d.ownerId) || currentUser.value.name || ''
        editing.value.keeperId = d.keeperId || null

        dialogTitle.value = t('menu.item.dialogs.editItem')
        dialogVisible.value = true
      } else {
        ElMessage.error('Failed to load item')
      }
    } catch (err) {
      ElMessage.error('Failed to load item')
    }
  }

  const saveItem = async () => {
    try {
      const payload = preparePayload(editing.value)
      if (editing.value.itemId) {
        const res = await updateApi(payload)
        if (res && res.code === 1) { ElMessage.success('Saved'); dialogVisible.value = false; if (fetchList) await fetchList() }
        else ElMessage.error(res.msg || 'Save failed')
      } else {
        const res = await addApi(payload)
        if (res && res.code === 1) { ElMessage.success('Added'); dialogVisible.value = false; if (fetchList) await fetchList() }
        else ElMessage.error(res.msg || 'Add failed')
      }
    } catch (err) { ElMessage.error('Save failed') }
  }

  const onDelete = async (id) => {
    try {
      await ElMessageBox.confirm('Confirm delete?','Warning')
      const res = await deleteApi(id)
      if (res && res.code === 1) { ElMessage.success('Deleted'); if (fetchList) await fetchList() }
      else ElMessage.error(res.msg || 'Delete failed')
    } catch (err) {}
  }

  return {
    editing,
    detailData,
    detailVisible,
    dialogVisible,
    dialogTitle,
    preparePayload,
    viewDetail,
    onEdit,
    saveItem,
    onDelete
  }
}
