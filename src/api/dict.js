import request from '@/utils/request'

// 列表查询（支持按 group/name/isValid 搜索）
export const listApi = (params) => request.get('/dicts', { params })

// 新增
export const saveApi = (dict) => request.post('/dicts', dict)

// 根据ID查询
export const getInfoApi = (id) => request.get(`/dicts/${id}`)

// 修改
export const updateApi = (dict) => request.put('/dicts', dict)

// 删除（ids: array 或 单个 id）
export const deleteApi = (ids) => {
  const q = Array.isArray(ids) ? ids.join(',') : ids
  return request.delete(`/dicts?ids=${q}`)
}

// 按 group 查询（启用的）
export const findByGroupApi = (group) => request.get(`/dicts/group/${group}`)
