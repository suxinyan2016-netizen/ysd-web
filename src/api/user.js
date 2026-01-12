import request from "@/utils/request";

//列表查询
export const queryAllApi = () => request.get('/users/all');

//查询用户列表数据
export const queryPageApi = (name,username,address,isvalid,page,pageSize) => 
  request.get(`/users?name=${username}&username=${name}&address=${address}&isValid=${isvalid}&page=${page}&pageSize=${pageSize}`)

//新增
export const addApi = (user) =>  request.post('/users', user);

//根据ID查询
export const queryInfoApi = (id) =>  request.get(`/users/${id}`);

//修改
export const updateApi = (user) =>  request.put('/users', user);

//删除
export const deleteApi = (ids) =>  request.delete(`/users?ids=${ids}`);
