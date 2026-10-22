import request from '@/utils/request'

// 分页查询服务费用
export const pageApi = (params) => request.get('/service-fees', { params })

// 根据ID查询详情
export const queryInfoApi = (id) => request.get(`/service-fees/${id}`)

// 新增服务费用
export const addApi = (data) => request.post('/service-fees', data)

// 修改服务费用
export const updateApi = (id, data) => request.put(`/service-fees/${id}`, data)

// 删除服务费用（支持批量）
export const deleteApi = (ids) => request.delete(`/service-fees?ids=${ids}`)

export default {
  pageApi,
  queryInfoApi,
  addApi,
  updateApi,
  deleteApi
}
