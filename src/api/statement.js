import request from '@/utils/request'

// params: { ownerId, keeperId, startDate, endDate }
export const getStatementApi = (params) => request.get('/statement', { params })
