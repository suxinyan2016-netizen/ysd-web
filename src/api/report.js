import request from "@/utils/request";

// 库存周转查询
export const inventoryTurnoverApi = (params) => {
  return request.get('/report/inventoryTurnover', { params });
};

// 货主库存滞留排名
export const ownerRetentionRankingApi = (params) => {
  return request.get('/report/ownerRetentionRanking', { params });
};

export default {
  inventoryTurnoverApi,
  ownerRetentionRankingApi
};
