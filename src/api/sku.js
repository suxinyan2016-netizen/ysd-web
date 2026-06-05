import request from '@/utils/request'

// 分页查询 SKU 列表
export const pageApi = (params) => request.get('/skus', { params })

// 新增 SKU
export const saveApi = (sku) => request.post('/skus', sku)

// 修改 SKU
export const updateApi = (sku) => request.put('/skus', sku)

// 根据主键查询
export const getByPkApi = (ownerId, itemNo) => request.get(`/skus/${ownerId}/${itemNo}`)

// 批量删除
export const deleteBatchApi = (keys) => request.delete('/skus', { data: keys })
