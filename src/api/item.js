import request from "@/utils/request";

//查询用户列表数据
export const queryPageApi = (name,username,address,isvalid,page,pageSize) => 
  request.get(`/items?name=${username}&username=${name}&address=${address}&isValid=${isvalid}&page=${page}&pageSize=${pageSize}`)

//新增
export const addApi = (item) =>  request.post('/items', item);

//根据ID查询
export const queryInfoApi = (id) =>  request.get(`/items/${id}`);

//修改
export const updateApi = (item) =>  request.put('/items', item);

//删除
export const deleteApi = (ids) =>  request.delete(`/items?ids=${ids}`);
