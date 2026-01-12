import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as imageManageApi from '@/api/imageManage'
import * as imageApi from '@/api/image'

export function useImageManage(parcel, currentUser, token) {
  // 图片状态管理
  const imageAttachments = ref([])
  const newUploadedImages = ref([])
  const imagesToDelete = ref([])
  const loading = ref(false)

  // 模块类型和记录ID
  const MODULE_TYPE = 'PARCEL'
  const recordId = computed(() => parcel.value?.parcelId)

  // 图片类型配置
  const IMAGE_TYPES = {
    PACKAGE_SENDER: 'PACKAGE_SENDER',
    PACKAGE_RECEIVER: 'PACKAGE_RECEIVER',
    PACKAGE_LABEL: 'PACKAGE_LABEL',
    PACKING_LIST: 'PACKING_LIST'
  }

  // 获取分组图片 - 修复：添加类型安全检查
  const loadGroupedImages = async () => {
    if (!recordId.value) return;

    try {
      loading.value = true;
      const response = await imageManageApi.getGroupedImages(MODULE_TYPE, recordId.value);

      if (response.code === 1) {
        const data = response.data || {};
        console.log('加载的图片数据:', data);

        // 将对象格式转换为数组格式
        const attachmentsArray = [];
        Object.keys(data).forEach(type => {
          const images = data[type] || [];
          if (images.length > 0) {
            attachmentsArray.push({
              type: type,
              images: images
            });

            // 同时将图片添加到 imageAttachments 中（用于 getImagesByType 等方法）
            images.forEach(img => {
              if (!imageAttachments.value.some(existing => existing.id === img.id)) {
                imageAttachments.value.push(img);
              }
            });
          }
        });

        console.log('转换后的附件数组:', attachmentsArray);
        console.log('imageAttachments:', imageAttachments.value);

        // 更新parcel中的图片信息
        // 如果后端没有返回任何附件，但 parcel 对象本身包含图片字段，
        // 将这些图片从 parcel 字段转换为临时的 attachment 以便前端显示。
        if ((!attachmentsArray || attachmentsArray.length === 0) && parcel.value) {
          const tempAttachments = [];

          const pushIf = (imgUrl, type, suffixId) => {
            if (!imgUrl) return;
            const imageUrl = typeof imgUrl === 'string' ? imgUrl : (imgUrl.url || imgUrl.imageUrl || '');
            if (!imageUrl) return;
            tempAttachments.push({
              id: `temp-${type}-${suffixId || 0}`,
              imageUrl: imageUrl,
              imageType: type,
              originalName: imageUrl.split('/').pop(),
              mimeType: imageUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            })
          }

          pushIf(parcel.value.imgBySender, IMAGE_TYPES.PACKAGE_SENDER, 1)
          pushIf(parcel.value.imgByReceiver, IMAGE_TYPES.PACKAGE_RECEIVER, 1)
          pushIf(parcel.value.label, IMAGE_TYPES.PACKAGE_LABEL, 1)

          // packingList may be array of {url,name} or array of urls
          if (Array.isArray(parcel.value.packingList) && parcel.value.packingList.length>0) {
            parcel.value.packingList.forEach((pl, idx) => {
              const url = typeof pl === 'string' ? pl : (pl.url || pl.imageUrl || '')
              if (!url) return
              tempAttachments.push({
                id: `temp-PACKING_LIST-${idx}`,
                imageUrl: url,
                imageType: IMAGE_TYPES.PACKING_LIST,
                originalName: typeof pl === 'string' ? url.split('/').pop() : (pl.name || pl.originalName || url.split('/').pop()),
                mimeType: typeof pl === 'string' ? (url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg') : (pl.type || pl.mimeType || 'image/jpeg')
              })
            })
          }

          if (tempAttachments.length > 0) {
            // 将这些临时附件加入 imageAttachments
            tempAttachments.forEach(t => {
              if (!imageAttachments.value.some(e => e.id === t.id)) {
                imageAttachments.value.push(t)
              }
            })
            // 构建 attachmentsArray 以便后续 updateParcelImages 使用
            const grouped = {}
            tempAttachments.forEach(t => {
              if (!grouped[t.imageType]) grouped[t.imageType] = []
              grouped[t.imageType].push(t)
            })
            const tempGrouped = Object.keys(grouped).map(type => ({ type, images: grouped[type] }))
            updateParcelImages(tempGrouped)
            return
          }
        }

        updateParcelImages(attachmentsArray);
      }
    } catch (error) {
      console.error('加载图片失败:', error);
    } finally {
      loading.value = false;
    }
  };

  const updateParcelImages = (attachments) => {
  if (!parcel.value) return;
  
  console.log('updateParcelImages - 开始处理附件数据:', attachments);
  console.log('当前 parcel:', parcel.value);
  
  // 清空原有图片字段
  parcel.value.imgBySender = '';
  parcel.value.imgByReceiver = '';
  parcel.value.label = '';
  parcel.value.packingList = [];
  
  // 处理附件数据
  if (Array.isArray(attachments) && attachments.length > 0) {
    attachments.forEach(group => {
      if (!group || !group.type) return;
      
      const type = group.type;
      const images = group.images || [];
      
      console.log(`处理图片组 - type: ${type}, images数量: ${images.length}`);
      
      if (images.length > 0) {
        // 获取第一张图片
        const firstImage = images[0];
        const imageUrl = firstImage.imageUrl || firstImage.url || '';
        
        if (imageUrl) {
          const fullUrl = getFullImageUrl(imageUrl);
          console.log(`图片URL - 原始: ${imageUrl}, 完整: ${fullUrl}`);
          
          switch(type) {
            case 'PACKAGE_SENDER':
              parcel.value.imgBySender = fullUrl;
              console.log('设置 imgBySender:', fullUrl);
              break;
            case 'PACKAGE_RECEIVER':
              parcel.value.imgByReceiver = fullUrl;
              console.log('设置 imgByReceiver:', fullUrl);
              break;
            case 'PACKAGE_LABEL':
              parcel.value.label = fullUrl;
              console.log('设置 label:', fullUrl);
              break;
            case 'PACKING_LIST':
              // 处理打包单（可能是多张图片）
              const packingItems = images.map(img => ({
                url: getFullImageUrl(img.imageUrl || img.url),
                name: img.originalName || img.name || '未知文件',
                type: img.mimeType || img.type || 'image/jpeg'
              }));
              parcel.value.packingList = packingItems;
              console.log('设置 packingList:', packingItems);
              break;
            default:
              console.warn('未知的图片类型:', type);
          }
        }
      }
    });
  } else {
    console.log('没有找到图片附件记录或格式不正确');
  }
  
  console.log('更新后的 parcel 图片字段:', {
    imgBySender: parcel.value.imgBySender,
    imgByReceiver: parcel.value.imgByReceiver,
    label: parcel.value.label,
    packingList: parcel.value.packingList
  });
};

  // 上传单个图片
  const uploadSingleImage = async (file, imageType) => {
    if (!recordId.value) {
      // 如果是新增包裹，先保存包裹获取ID
      const tempId = -1 // 临时ID，表示新增状态
      return uploadImageToServer(file, imageType, tempId)
    }
    return uploadImageToServer(file, imageType, recordId.value)
  }

  const uploadImageToServer = async (file, imageType, id) => {
    try {
      // 1. 检查数量限制
      await checkImageLimitBeforeUpload(imageType, id)

      // 2. 上传图片
      const response = await imageManageApi.uploadSingleImage(
        file,
        MODULE_TYPE,
        id,
        imageType
      )

      if (response.code === 1) {
        const attachment = response.data

        // 添加到新上传图片列表
        newUploadedImages.value.push({
          id: attachment.id,
          imageType: imageType,
          file: file
        })

        // 如果是编辑状态且recordId存在，直接添加到imageAttachments
        if (recordId.value && recordId.value > 0) {
          imageAttachments.value.push(attachment)
          updateParcelImages(groupImages(imageAttachments.value))
        }

        ElMessage.success('Image upload successful')
        return attachment
      } else {
        throw new Error(response.msg || '上传失败')
      }
    } catch (error) {
      ElMessage.error(`Upload failed: ${error.message}`)
      throw error
    }
  }

  // 检查图片数量限制
  const checkImageLimitBeforeUpload = async (imageType, recordId) => {
    try {
      await imageManageApi.checkImageLimit(MODULE_TYPE, recordId, imageType)
    } catch (error) {
      throw new Error(error.response?.data?.msg || 'Image count limit reached')
    }
  }

  // 删除图片
  const deleteImage = async (imageId, physicalDelete = false) => {
    try {
      if (physicalDelete) {
        await imageManageApi.deleteImagePhysically(imageId)
      } else {
        await imageManageApi.deleteImage(imageId)
      }

      // 从本地列表中移除
      const index = imageAttachments.value.findIndex(img => img.id === imageId)
      if (index !== -1) {
        imagesToDelete.value.push(imageId)
        imageAttachments.value.splice(index, 1)
        updateParcelImages(groupImages(imageAttachments.value))
      }

      ElMessage.success('Image deleted successfully')
      return true
    } catch (error) {
      ElMessage.error(`删除失败: ${error.message}`)
      throw error
    }
  }

  // 上传单个 Item 图片（用于 ParcelItemList）
  const uploadItemImage = async (file, itemId, imageType) => {
    try {
      // 检查数量限制（可选，取决于后端是否需要）
      // await checkImageLimitBeforeUpload(imageType, itemId)

      // 调用 API 上传
      const response = await imageManageApi.uploadSingleImage(
        file,
        'PARCEL_ITEM',  // moduleType: 标记为 PARCEL_ITEM 类型
        itemId,         // recordId: 使用 itemId
        imageType       // imageType: 图片类型（ITEM_IMAGE 等）
      )

      if (response.code === 1) {
        const attachment = response.data
        ElMessage.success('Item image uploaded successfully')
        return attachment
      } else {
        throw new Error(response.msg || 'Upload failed')
      }
    } catch (error) {
      ElMessage.error(`Item image upload failed: ${error.message}`)
      throw error
    }
  }

  // 根据图片类型分组 - 修复：添加类型检查
  const groupImages = (images) => {
    if (!images || !Array.isArray(images)) {
      return []
    }

    const grouped = {}

    images.forEach(img => {
      if (!img) return

      const type = img.imageType
      if (type) {
        if (!grouped[type]) {
          grouped[type] = []
        }
        grouped[type].push(img)
      }
    })

    return Object.keys(grouped).map(type => ({
      type: type,
      images: grouped[type] || []
    }))
  }

  // 保存包裹时处理图片
  const handleSaveImages = async (parcelData) => {
    if (!parcelData.parcelId) return parcelData

    const result = {
      ...parcelData,
      // 添加图片处理相关信息
      _imageInfo: {
        keepImageIds: imageAttachments.value.map(img => img.id),
        newImages: newUploadedImages.value,
        deleteImageIds: imagesToDelete.value
      }
    }

    return result
  }

  // 清除图片状态
  const clearImageState = () => {
    newUploadedImages.value = []
    imagesToDelete.value = []
    imageAttachments.value = []
  }

  // 获取特定类型的图片
  const getImagesByType = (imageType) => {
    if (!Array.isArray(imageAttachments.value)) {
      return []
    }
    return imageAttachments.value.filter(img => img.imageType === imageType)
  }

  const getFullImageUrl = (url) => {
    console.log('useImageManage - getFullImageUrl 输入:', url);

    if (!url) return '';

    // 如果已经是完整URL，直接返回
    if (url.startsWith('http')) return url;

    const BACKEND_URL = 'http://localhost:8080';

    // 处理URL格式
    let formattedUrl = url;

    // 确保URL以斜杠开头
    if (!formattedUrl.startsWith('/')) {
      formattedUrl = '/' + formattedUrl;
    }

    // 拼接完整URL
    const fullUrl = `${BACKEND_URL}${formattedUrl}`;

    console.log('useImageManage - 拼接后完整URL:', fullUrl);
    return fullUrl;
  };

  // 上传处理器（兼容现有代码）
  const createUploadHandlers = () => {
    return {
      // 发送前图片
      imgBySender: createImageHandler(IMAGE_TYPES.PACKAGE_SENDER, 'imgBySender'),
      // 接收后图片
      imgByReceiver: createImageHandler(IMAGE_TYPES.PACKAGE_RECEIVER, 'imgByReceiver'),
      // 标签
      label: createImageHandler(IMAGE_TYPES.PACKAGE_LABEL, 'label'),
      // 打包单
      packingList: createPackingListHandler(),

      // 上传前验证
      beforeAvatarUpload: (file) => validateImageFile(file, 'img'),
      beforeLabelUpload: (file) => validateImageFile(file, 'label'),
      beforePackingListUpload: (file) => validateImageFile(file, 'packingList'),

      // 删除打包单文件
      deletePackingFile: (index) => {
        if (parcel.value.packingList && Array.isArray(parcel.value.packingList) && parcel.value.packingList[index]) {
          const file = parcel.value.packingList[index]
          // 查找对应的image_attachment记录
          const attachment = imageAttachments.value.find(img =>
            img.imageUrl === file.url
          )
          if (attachment) {
            deleteImage(attachment.id)
          }
          parcel.value.packingList.splice(index, 1)
        }
      }
    }
  }

  const createImageHandler = (imageType, fieldName) => {
    return async (response, uploadFile) => {
      try {
        if (response.code === 1) {
          const fileUrl = response.data?.imageUrl || response.data
          const file = uploadFile.raw || uploadFile

          if (fileUrl) {
            // 如果是编辑状态，使用新的图片管理API
            if (recordId.value && recordId.value > 0) {
              const attachment = await uploadSingleImage(file, imageType)
              parcel.value[fieldName] = attachment.imageUrl
            } else {
              // 新增状态，临时存储
              parcel.value[fieldName] = fileUrl
            }
            ElMessage.success('Upload successful')
          }
        }
      } catch (error) {
        ElMessage.error('上传失败')
      }
    }
  }

  const createPackingListHandler = () => {
    return async (response, uploadFile) => {
      try {
        if (response.code === 1) {
          const fileUrl = response.data?.imageUrl || response.data
          const file = uploadFile.raw || uploadFile

          if (fileUrl) {
            // 如果是编辑状态，使用新的图片管理API
            if (recordId.value && recordId.value > 0) {
              const attachment = await uploadSingleImage(file, IMAGE_TYPES.PACKING_LIST)

              if (!Array.isArray(parcel.value.packingList)) {
                parcel.value.packingList = []
              }

              parcel.value.packingList.push({
                url: attachment.imageUrl,
                name: file.name,
                type: file.type
              })
            } else {
              // 新增状态
              if (!Array.isArray(parcel.value.packingList)) {
                parcel.value.packingList = []
              }

              parcel.value.packingList.push({
                url: fileUrl,
                name: file.name,
                type: file.type
              })
            }
            ElMessage.success('Upload successful')
          }
        }
      } catch (error) {
        ElMessage.error('Upload failed')
      }
    }
  }

  const validateImageFile = (file, fileType = 'img') => {
    console.log('验证文件:', file.name, fileType)

    let maxSize = 5 // MB
    let allowedTypes = []

    switch (fileType) {
      case 'img':
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
        maxSize = 5
        break
      case 'label':
        allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
        maxSize = 10
        break
      case 'packingList':
        allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
        maxSize = 10
        break
    }

    // 检查文件类型
    const isValidType = allowedTypes.includes(file.type) ||
      (fileType === 'label' && file.name.toLowerCase().endsWith('.pdf')) ||
      (fileType === 'packingList' && file.name.toLowerCase().endsWith('.pdf'))

    if (!isValidType) {
      ElMessage.error(`Unsupported file type: ${file.type}`)
      return false
    }

    // Check file size
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize
    if (!isLtMaxSize) {
      ElMessage.error(`File size cannot exceed ${maxSize}MB`)
      return false
    }

    return true
  }

  // 监听recordId变化，加载图片
  watch(recordId, (newId) => {
    if (newId && newId > 0) {
      loadGroupedImages()
    } else {
      clearImageState()
    }
  }, { immediate: true })

  return {
    // 状态
    imageAttachments,
    newUploadedImages,
    imagesToDelete,
    loading,

    // 方法
    loadGroupedImages,
    uploadSingleImage,
    uploadItemImage,
    deleteImage,
    handleSaveImages,
    clearImageState,
    getImagesByType,
    getFullImageUrl,

    // 上传处理器
    createUploadHandlers,

    // 图片类型常量
    IMAGE_TYPES
  }
}