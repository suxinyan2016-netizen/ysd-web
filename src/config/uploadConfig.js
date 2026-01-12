/**
 * 上传字段配置
 */
export const UPLOAD_FIELDS = {
  // 图片字段
  IMG_BY_SENDER: 'imgBySender',
  IMG_BY_RECEIVER: 'imgByReceiver',
  IMG_PACKING_LIST_1: 'imgPackingList1',
  IMG_PACKING_LIST_2: 'imgPackingList2',
  
  // PDF字段
  LABEL_PDF: 'label'
};

/**
 * 上传接口配置
 */
export const UPLOAD_CONFIG = {
  // 上传地址
  ACTION: '/uploads/',
  
  // 文件类型限制
  ACCEPT_TYPES: {
    IMAGE: 'image/*',
    PDF: '.pdf'
  },
  
  // 文件大小限制（单位：MB）
  SIZE_LIMIT: {
    IMAGE: 5,
    PDF: 10
  },
  
  // 上传提示信息
  MESSAGES: {
    SUCCESS: '文件上传成功',
    FAILED: '文件上传失败',
    TYPE_ERROR: '文件类型错误',
    SIZE_ERROR: '文件大小超出限制'
  }
};