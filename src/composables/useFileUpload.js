import { computed } from 'vue'
import { useImageManage } from "./useImageManage"
import request from '@/utils/request'

export function useFileUpload(parcel, token, currentUser) {
  const BASE_URL = 'http://localhost:8080'

  // 使用新的图片管理逻辑
  const imageManager = useImageManage(parcel, currentUser, token)

  // 创建上传处理器
  const uploadHandlers = computed(() => {
    console.log('创建上传处理器, parcel:', parcel.value)
    return {
      ...imageManager.createUploadHandlers(),
      // 添加通用的 upload 方法，用于直接上传
      upload: async (file, options) => {
        console.log('[useFileUpload] upload called with options:', options);
        return uploadFile(file, options)
      }
    }
  })

  // 获取完整图片URL
  const getFullImageUrl = (url) => {
    return imageManager.getFullImageUrl(url)
  }

  // 通用上传函数 - 用于 ParcelFileUpload 和 ParcelItemList 的直接上传
  const uploadFile = async (file, options) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('moduleType', options.moduleType || 'PARCEL')
      formData.append('recordId', options.recordId || -1)
      formData.append('imageType', options.imageType || 'PACKAGE_SENDER')
      
      // 添加 tempKey 支持
      if (options.tempKey) {
        formData.append('tempKey', options.tempKey)
      }

      console.log('[useFileUpload] uploadFile - 请求参数:', {
        moduleType: options.moduleType,
        recordId: options.recordId,
        imageType: options.imageType,
        tempKey: options.tempKey,
        fileName: file.name,
        fileSize: file.size
      });

      const response = await request.post('/uploads/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log('[useFileUpload] uploadFile 响应:', response);
      
      // 后端返回结构: { code: 1, data: { imageUrl, originalName, fileSize, recordId, ... }, msg: "上传成功" }
      if (response && (response.code === 1 || response.code === 0) && response.data) {
        const data = response.data;
        console.log('[useFileUpload] 上传成功，返回数据:', data);
        
        // 返回格式化的响应数据
        // recordId 本身就是关键标识符，作为图片的 id
        return {
          id: data.recordId,  // 使用 recordId 作为图片的唯一标识
          url: data.imageUrl,  // 图片访问URL
          imageUrl: data.imageUrl,
          path: data.imageUrl,
          originalName: data.originalName,
          fileSize: data.fileSize,
          imageType: data.imageType,
          moduleType: data.moduleType,
          recordId: data.recordId
        }
      } else {
        const errorMsg = response?.msg || '上传失败';
        console.error('[useFileUpload] 上传失败:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('[useFileUpload] uploadFile 错误:', error);
      throw error
    }
  }

  // 添加调试函数来检查图片URL
  const checkImageUrls = () => {
    console.log('=== 图片URL调试信息 ===')
    console.log('图片附件列表:', imageManager.imageAttachments.value)
    console.log('parcel.imgBySender:', parcel.value.imgBySender)
    console.log('parcel.imgByReceiver:', parcel.value.imgByReceiver)
    console.log('parcel.label:', parcel.value.label)
    console.log('parcel.packingList:', parcel.value.packingList)
    console.log('新上传的图片:', imageManager.newUploadedImages.value)
    console.log('待删除的图片:', imageManager.imagesToDelete.value)
  }

  // 创建Element Plus上传组件的配置
  const createUploadConfig = (imageType) => {
    const currentToken = token.value
    const currentUserName = currentUser.value?.name || ''
    
    if (!currentToken) {
      console.error('无法创建上传配置：token为空')
      return null
    }

    return {
      // 上传地址（使用完整URL，避免代理问题）
      action: '/uploads/',
      
      // 认证头信息
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'token': currentToken,
        'username': currentUserName,
        'Content-Type': 'multipart/form-data'
      },
      
      // 附加数据
      data: {
        moduleType: 'PARCEL',
        recordId: parcel.value?.parcelId || -1,
        imageType: imageType
      },
      
      // 其他配置
      withCredentials: true,
      timeout: 30000
    }
  }

  return {
    // 图片管理器
    imageManager,
    
    // 兼容原有接口
    uploadHandlers,
    getFullImageUrl,
    checkImageUrls,
    
    // 新增：上传配置生成函数
    createUploadConfig,
    
    // 上传头信息（保持兼容）
    uploadHeaders: computed(() => ({ 
      'Authorization': `Bearer ${token.value}`,
      'token': token.value, 
      'username': currentUser.value?.name || ''
    })),
    
    // 错误处理
    handleUploadError: (error) => {
      console.error('上传错误:', error)
      if (error.response) {
        console.error('响应状态:', error.response.status)
        console.error('响应数据:', error.response.data)
      }
    }
  }
}
