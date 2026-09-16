import request from "@/utils/request";

// 库存周转查询
export const inventoryTurnoverApi = (params) => {
  return request.get('/report/inventoryTurnover', { params });
};

export default {
  inventoryTurnoverApi
};
