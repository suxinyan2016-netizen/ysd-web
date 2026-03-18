import request from '@/utils/request'

// 分页查询
export const queryPageApi = (userId, params) => request.get(`/users/${userId}/services`, { params })

// 不分页返回所有
export const queryAllApi = (userId) => request.get(`/users/${userId}/services/all`)

// 查询单条
export const getApi = (userId, serviceId) => request.get(`/users/${userId}/services/${serviceId}`)

// 新增
export const addApi = (userId, item) => request.post(`/users/${userId}/services`, item)

// 更新
export const updateApi = (userId, serviceId, item) => request.put(`/users/${userId}/services/${serviceId}`, item)

// 批量删除
export const deleteApi = (userId, ids) => {
  const q = Array.isArray(ids) ? ids.join(',') : ids
  return request.delete(`/users/${userId}/services?ids=${q}`)
}

export default {
  queryPageApi,
  queryAllApi,
  getApi,
  addApi,
  updateApi,
  deleteApi
}
