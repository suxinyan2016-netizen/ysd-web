import request from "@/utils/request";

// 查询包裹列表数据 - 更新参数名与页面代码保持一致
export const queryPageApi = (
  packageNo,
  status,
  processId,
  beginProcessDate,
  endProcessDate,
  owner,
  beginCreateDate,
  endCreateDate,
  itemNo,
  sellerPart,
  sender,
  beginSendDate,
  endSendDate,
  receiver,
  beginReceivedDate,
  endReceivedDate,
  page,
  pageSize
) => {
  // 构建查询参数
  const params = {
    page,
    pageSize,
  };
  
  // 只添加非空的参数
  if (packageNo) params.packageNo = packageNo;
  if (status !== '' && status !== undefined && status !== null) params.status = status;
  if (processId) params.processId = processId;
  if (beginProcessDate) params.beginProcessDate = beginProcessDate;
  if (endProcessDate) params.endProcessDate = endProcessDate;
  if (owner) params.owner = owner;
  if (beginCreateDate) params.beginCreateDate = beginCreateDate;
  if (endCreateDate) params.endCreateDate = endCreateDate;
  if (itemNo) params.itemNo = itemNo;
  if (sellerPart) params.sellerPart = sellerPart;
  if (sender) params.sender = sender;
  if (beginSendDate) params.beginSendDate = beginSendDate;
  if (endSendDate) params.endSendDate = endSendDate;
  if (receiver) params.receiver = receiver;
  if (beginReceivedDate) params.beginReceivedDate = beginReceivedDate;
  if (endReceivedDate) params.endReceivedDate = endReceivedDate;
  
  return request.get('/parcels', { params });
}

// 新增包裹
export const addApi = (parcel) => request.post('/parcels', parcel);

// 根据ID查询包裹详情
export const queryInfoApi = (id) => request.get(`/parcels/${id}`);

// 修改包裹
export const updateApi = (parcel) => request.put('/parcels', parcel);

// 删除包裹 - 支持单个ID或ID数组
export const deleteApi = (ids) => {
  // 如果ids是数组，转换为逗号分隔的字符串
  const idParam = Array.isArray(ids) ? ids.join(',') : ids;
  return request.delete(`/parcels?ids=${idParam}`);
}

// 查询所有用户数据 - 根据您的页面代码，可能还需要这个函数
export const queryAllUserApi = () => request.get('/users/all');