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
  senderId,
  beginSendDate,
  endSendDate,
  receiver,
  receiverId,
  beginReceivedDate,
  endReceivedDate,
  isPaid,
  page,
  pageSize,
  currentUserId
) => {
  // 构建查询参数
  const params = {
    page: page || 1,
    pageSize: pageSize || 20,
  };
  
  // 只添加非空的参数
  if (packageNo) params.packageNo = packageNo;
  if (status !== '' && status !== undefined && status !== null) params.status = status;
  if (processId) params.processId = processId;
  if (beginProcessDate) params.beginProcessDate = beginProcessDate;
  if (endProcessDate) params.endProcessDate = endProcessDate;
  // owner: if numeric, set ownerId; otherwise set owner string
  if (owner !== '' && owner !== undefined && owner !== null) {
    if (/^\d+$/.test(String(owner))) params.ownerId = owner
    else params.owner = owner
  }
  if (beginCreateDate) params.beginCreateDate = beginCreateDate;
  if (endCreateDate) params.endCreateDate = endCreateDate;
  if (itemNo) params.itemNo = itemNo;
  if (sellerPart) params.sellerPart = sellerPart;
  // sender: if numeric, set senderId; otherwise set sender string
  if (sender !== '' && sender !== undefined && sender !== null) {
    if (/^\d+$/.test(String(sender))) params.senderId = sender
    else params.sender = sender
  }
  if (beginSendDate) params.beginSendDate = beginSendDate;
  if (endSendDate) params.endSendDate = endSendDate;
  // 支持 receiver 为 numeric 时传递为 receiverId（用于待收包裹按 userId 查询）
  // receiver: if numeric, set receiverId; otherwise set receiver string
  if (receiver !== '' && receiver !== undefined && receiver !== null) {
    if (/^\d+$/.test(String(receiver))) params.receiverId = receiver
    else params.receiver = receiver
  }
  if (beginReceivedDate) params.beginReceivedDate = beginReceivedDate;
  // only include endReceivedDate if it looks like a date string (YYYY-MM-DD) or contains a dash
  if (endReceivedDate && typeof endReceivedDate === 'string' && /\d{4}-\d{2}-\d{2}/.test(endReceivedDate)) params.endReceivedDate = endReceivedDate;
  // only include isPaid if it's 0 or 1
  if (isPaid === 0 || isPaid === 1) params.isPaid = isPaid;
  // do not include currentUserId in query params - backend filters by explicit ownerId/senderId/receiverId
  
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

// 更新单个 item
export const updateItem = (item) => request.put('/items', item);

// 更新 parcel 信息
export const updateParcel = (parcel) => request.put('/parcels', parcel);

// 别名：获取包裹详情
export const getParcelDetail = queryInfoApi;

// 查询所有用户数据 - 根据您的页面代码，可能还需要这个函数
export const queryAllUserApi = () => request.get('/users/all');