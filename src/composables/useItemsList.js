import { ref } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

/**
 * useItemsList - composable to share item list fetching, pagination and query handling
 * options:
 *  - initialQ: object (initial query values)
 *  - getFixedParams: function returning an object of params always included (e.g. { ownerId })
 */
export function useItemsList(options = {}) {
  const initialQ = options.initialQ || {}
  const getFixedParams = options.getFixedParams || (() => ({}))

  const q = ref({ ...initialQ })
  const itemList = ref([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  const computeStocklife = (row) => {
    try {
      const received = row.receivedDate ? new Date(row.receivedDate) : null
      if (!received) return 0
      const end = row.sendDate ? new Date(row.sendDate) : new Date()
      const diff = Math.floor((end - received) / (1000 * 60 * 60 * 24))
      return diff >= 0 ? diff : 0
    } catch (err) {
      return 0
    }
  }

  const buildParamsFromQ = () => {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...getFixedParams()
    }

    // copy non-empty q fields
    Object.keys(q.value || {}).forEach((k) => {
      const v = q.value[k]
      if (v === '' || v === null || v === undefined) return
      params[k] = v
    })

    return params
  }

  const fetchList = async () => {
    try {
      const params = buildParamsFromQ()
      const res = await request.get('/items', { params })
      if (res && res.code === 1) {
        let rows = res.data?.rows || []
        rows = rows.map(r => ({ ...r, _stocklife: computeStocklife(r) }))

        // client-side minStocklife filter (if provided)
        if (q.value.minStocklife != null && q.value.minStocklife !== '') {
          rows = rows.filter(r => (Number(r._stocklife) || 0) > Number(q.value.minStocklife))
        }

        // sort for deterministic order
        rows.sort((a, b) => {
          const i = (a.itemNo || '').localeCompare(b.itemNo || '')
          if (i !== 0) return i
          const r = (a.receivePackageNo || '').localeCompare(b.receivePackageNo || '')
          if (r !== 0) return r
          return (a.sendPackageNo || '').localeCompare(b.sendPackageNo || '')
        })

        itemList.value = rows
        // use server-reported total when available so pagination works correctly
        total.value = res.data?.total ?? rows.length
      } else {
        itemList.value = []
        total.value = 0
        ElMessage.error(res.msg || 'Failed to load items')
      }
    } catch (err) {
      console.error(err)
      ElMessage.error('Failed to load items')
    }
  }

  const onSearch = async () => { currentPage.value = 1; await fetchList() }
  const onClear = async (newQ = {}) => { q.value = { ...initialQ, ...newQ }; await fetchList() }
  const onSizeChange = (size) => { pageSize.value = size; fetchList() }
  const onCurrentChange = (page) => { currentPage.value = page; fetchList() }

  return {
    q,
    itemList,
    total,
    currentPage,
    pageSize,
    fetchList,
    onSearch,
    onClear,
    onSizeChange,
    onCurrentChange,
    computeStocklife
  }
}
