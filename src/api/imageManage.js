import request from '@/utils/request'

// 图片管理API
const BASE_URL = ''

// 上传单个图片
export function uploadSingleImage(file, moduleType, recordId, imageType) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('moduleType', moduleType)
  formData.append('recordId', recordId)
  formData.append('imageType', imageType)
  
  return request({
    url: '/uploads/',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 批量上传图片
export function uploadMultipleImages(files, moduleType, recordId, imageType) {
  const formData = new FormData()
  
  // 添加参数
  formData.append('moduleType', moduleType)
  formData.append('recordId', recordId)
  formData.append('imageType', imageType)
  
  // 添加多个文件
  files.forEach((file, index) => {
    formData.append('files', file)
  })
  
  return request({
    url: '/uploads/',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除图片（逻辑删除）
export function deleteImage(id) {
  return request({
    url: `/image/manage/${id}`,
    method: 'delete'
  })
}

// 删除图片（物理删除）
export function deleteImagePhysically(id) {
  return request({
    url: `/image/manage/physical/${id}`,
    method: 'delete'
  })
}

// 获取分组图片
export function getGroupedImages(moduleType, recordId) {
  return request({
    url: '/image/manage/grouped',
    method: 'get',
    params: { moduleType, recordId }
  })
}

// 检查图片数量限制
export function checkImageLimit(moduleType, recordId, imageType) {
  return request({
    url: '/image/manage/check-limit',
    method: 'get',
    params: { moduleType, recordId, imageType }
  })
}

// 批量处理图片更新
export function batchProcessImages(moduleType, recordId, keepImageIds, newFiles) {
  const formData = new FormData()
  
  formData.append('moduleType', moduleType)
  formData.append('recordId', recordId)
  formData.append('keepImageIds', JSON.stringify(keepImageIds))
  
  newFiles.forEach((file, index) => {
    formData.append('newFiles', file)
  })
  
  return request({
    url: '/image/manage/batch-process',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}