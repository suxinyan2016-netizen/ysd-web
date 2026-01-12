import request from '@/utils/request'

// 获取图片类型配置
export function getImageTypes(moduleType) {
  return request({
    url: '/image/types',
    method: 'get',
    params: { moduleType }
  })
}

// 上传图片
export function uploadImage(file, moduleType, recordId, imageType) {
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

// 获取分组图片
export function getGroupedImages(moduleType, recordId) {
  return request({
    url: '/image/grouped',
    method: 'get',
    params: { moduleType, recordId }
  })
}

// 删除图片
export function deleteImage(id) {
  return request({
    url: `/image/${id}`,
    method: 'delete'
  })
}