import request from "@/utils/request";

// Paginated query
export const getStocktakesApi = (params) => request.get('/stocktakes', { params });

// Get detail by id
export const getStocktakeApi = (id) => request.get(`/stocktakes/${id}`);

// Create new stocktake
export const createStocktakeApi = (data) => request.post('/stocktakes', data);

// Update remark and keeperId
export const updateStocktakeApi = (id, data) => request.put(`/stocktakes/${id}`, data);

// Start stocktake (update status to 1)
export const startStocktakeApi = (id) => request.put(`/stocktakes/${id}/start`);

// Get book snapshot
export const getStocktakeSnapshotApi = (id) => request.get(`/stocktakes/${id}/snapshot`);

// Get actual count results
export const getStocktakeResultsApi = (id) => request.get(`/stocktakes/${id}/results`);

// Save actual count results
export const saveStocktakeResultsApi = (id, data) => request.put(`/stocktakes/${id}/results`, data);

// Confirm stocktake
export const confirmStocktakeApi = (id) => request.put(`/stocktakes/${id}/confirm`);

// Batch delete
export const deleteStocktakesApi = (ids) => {
  const params = new URLSearchParams();
  if (Array.isArray(ids)) {
    ids.forEach(id => params.append('ids', id));
  } else {
    params.append('ids', ids);
  }
  return request.delete(`/stocktakes?${params.toString()}`);
};

export default {
  getStocktakesApi,
  getStocktakeApi,
  createStocktakeApi,
  updateStocktakeApi,
  startStocktakeApi,
  getStocktakeSnapshotApi,
  getStocktakeResultsApi,
  saveStocktakeResultsApi,
  confirmStocktakeApi,
  deleteStocktakesApi
}
