import request from "@/utils/request";

// Get all slots for current user
export const getSlotsApi = () => request.get('/slots');

// Create a new slot
export const createSlotApi = (slot) => request.post('/slots', { slot });

// Update a slot
export const updateSlotApi = (id, slot) => request.put('/slots', { id, slot });

// Delete slots (supports multiple ids)
export const deleteSlotsApi = (ids) => {
  const params = new URLSearchParams();
  if (Array.isArray(ids)) {
    ids.forEach(id => params.append('ids', id));
  } else {
    params.append('ids', ids);
  }
  return request.delete(`/slots?${params.toString()}`);
};

// Get a single slot by id
export const getSlotApi = (id) => request.get(`/slots/${id}`);

export default {
  getSlotsApi,
  createSlotApi,
  updateSlotApi,
  deleteSlotsApi,
  getSlotApi
}
