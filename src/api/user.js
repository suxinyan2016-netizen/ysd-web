import request from "@/utils/request";

//列表查询
export const queryAllApi = () => request.get('/users/all');

//查询用户列表数据
export const queryPageApi = (name,username,address,isvalid,page,pageSize) => 
  request.get(`/users?name=${username}&username=${name}&address=${address}&isValid=${isvalid}&page=${page}&pageSize=${pageSize}`)

//新增 (registration) — use public /register endpoint so it doesn't require auth
export const addApi = (user) =>  request.post('/register', user, { skipAuth: true });

//根据ID查询
export const queryInfoApi = (id) =>  request.get(`/users/${id}`);

//修改
export const updateApi = (user) =>  request.put('/users', user);

// user types APIs (user_type)
export const getUserTypesApi = (userId) => request.get(`/users/${userId}/types`)
export const updateUserTypesApi = (userId, dictIds) => request.put(`/users/${userId}/types`, dictIds)

// 根据 dictId 查询关联用户（支持传入其他过滤参数）
export const selectUsersByDictId = (params) => request.get('/users/by-dict', { params })


//删除
export const deleteApi = (ids) =>  request.delete(`/users?ids=${ids}`);

// --- warehouse assignment helpers ---
// Get warehouses assigned to a user (returns array of user objects representing warehouses)
// Returns the actual User objects for warehouseIds tied to the user
export const getUserWarehouseUsers = (userId) => request.get(`/users/${userId}/warehouses/users`)

// Add a warehouse assignment for a user. Body contains the warehouse id.
export const addUserWarehouse = (userId, warehouseId) => request.post(`/users/${userId}/warehouses`, { warehouseId })

// Delete one or more warehouse assignments for a user. `ids` can be a single id or comma-separated.
export const deleteUserWarehouse = (userId, warehouseId) => {
  // backend expects a single `warehouseId` query parameter
  return request.delete(`/users/${userId}/warehouses?warehouseId=${warehouseId}`)
}

// Change password (authenticated)
// Body: { oldPassword: string, newPassword: string }
export const changePasswordApi = (userId, oldPassword, newPassword) => {
  const body = { oldPassword, newPassword }
  return request.put(`/users/${userId}/change-password`, body)
}

export default {
  queryAllApi,
  queryPageApi,
  addApi,
  queryInfoApi,
  updateApi,
  getUserTypesApi,
  updateUserTypesApi,
  selectUsersByDictId,
  deleteApi,
  getUserWarehouseUsers,
  addUserWarehouse,
  deleteUserWarehouse
}
