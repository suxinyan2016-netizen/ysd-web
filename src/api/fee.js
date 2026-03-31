import request from '@/utils/request'

// 获取商品应收/应付费用列表
export const getItemFee = (paidbyid, paytoid) => {
  const params = {}
  if (paidbyid !== undefined && paidbyid !== null) params.paidbyid = paidbyid
  if (paytoid !== undefined && paytoid !== null) params.paytoid = paytoid
  return request.get('/fee/itemfee', { params })
}

// 获取包裹应收/应付费用列表
export const getParcelFee = (paidbyid, paytoid) => {
  const params = {}
  if (paidbyid !== undefined && paidbyid !== null) params.paidbyid = paidbyid
  if (paytoid !== undefined && paytoid !== null) params.paytoid = paytoid
  return request.get('/fee/parcelfee', { params })
}

// settle (mark paid) multiple items by updating ispaid and paymentDate
export const settleItems = (itemIds) => {
  if (!Array.isArray(itemIds)) itemIds = [itemIds]
  const date = new Date().toISOString().slice(0,10)
  return Promise.all(itemIds.map(id => request.put('/items', { itemId: id, ispaid: 1, paymentDate: date })))
}

// settle (mark paid) multiple parcels by updating ispaid and paymentDate
export const settleParcels = (parcelIds) => {
  if (!Array.isArray(parcelIds)) parcelIds = [parcelIds]
  const date = new Date().toISOString().slice(0,10)
  return Promise.all(parcelIds.map(id => request.put('/parcels', { parcelId: id, ispaid: 1, paymentDate: date })))
}

export default {
  getItemFee,
  getParcelFee
}
