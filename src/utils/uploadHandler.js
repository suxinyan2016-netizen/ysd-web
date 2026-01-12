import { ElMessage } from 'element-plus';

/**
 * 调试响应数据
 * @param {Object} response - 服务器响应
 */
export const debugResponse = (response) => {
  console.log('=== 响应数据调试信息 ===');
  console.log('完整响应:', response);
  console.log('response.code:', response.code);
  console.log('response.msg:', response.msg);
  console.log('response.data 类型:', typeof response.data);
  console.log('response.data 内容:', response.data);
  
  if (response.data && typeof response.data === 'object') {
    console.log('response.data 属性:', Object.keys(response.data));
    console.log('response.data.imageUrl:', response.data.imageUrl);
  }
  console.log('========================');
};

/**
 * 创建文件上传成功处理函数
 * @param {Object} targetObj - 目标响应式对象
 * @param {string} fieldName - 要保存的字段名
 * @returns {Function} 上传成功处理函数
 */
export const createUploadSuccessHandler = (targetObj, fieldName) => {
  return (response) => {
    try {
      console.log('上传响应:', response);
      
      if (!response) {
        throw new Error('上传响应为空');
      }
      
      // 调试响应数据
      debugResponse(response);
      
      if (response.code === 1) {
        // 获取图片URL
        let fileUrl;
        
        if (typeof response.data === 'string') {
          // 情况1：response.data 直接是图片URL字符串
          fileUrl = response.data;
        } else if (response.data && response.data.imageUrl) {
          // 情况2：response.data 是一个对象，包含 imageUrl 字段
          fileUrl = response.data.imageUrl;
        } else if (response.data && response.data.url) {
          // 情况3：response.data 是一个对象，包含 url 字段
          fileUrl = response.data.url;
        } else {
          // 其他可能的位置
          fileUrl = response.data?.fileUrl || response.imageUrl || response.url;
        }
        
        if (!fileUrl) {
          console.warn('无法从响应数据中获取图片URL:', response.data);
          // 尝试从响应消息中提取URL（备选方案）
          const urlMatch = response.msg?.match(/\/upload\/[^"\s]+/);
          fileUrl = urlMatch ? urlMatch[0] : null;
        }
        
        if (fileUrl) {
          // 保存到对应的字段
          targetObj[fieldName] = fileUrl;
          
          // 强制触发响应式更新
          if (typeof targetObj === 'object' && targetObj !== null) {
            // 如果是对象，创建新引用
            const newObj = { ...targetObj };
            // 重新赋值确保响应式
            Object.assign(targetObj, newObj);
          }
          
          // 根据字段名判断文件类型
          const fileType = fieldName.includes('label') ? 'PDF文件' : '图片';
          
          // 显示成功提示
          ElMessage.success(response.msg || `${fileType}上传成功`);
          
          console.log(`文件上传成功:`, {
            field: fieldName,
            url: fileUrl,
            type: fileType,
            time: new Date().toLocaleString()
          });
          
          return { success: true, fieldName, fileUrl };
        } else {
          throw new Error('服务器未返回有效的图片URL');
        }
      } else {
        // API 返回错误
        throw new Error(response.msg || '上传失败');
      }
      
    } catch (error) {
      console.error('上传处理失败:', error);
      ElMessage.error(`上传失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  };
};

/**
 * 创建多文件上传处理器
 * @param {Object} targetObj - 目标响应式对象
 * @param {string} fieldName - 字段名（用于packing list）
 * @returns {Function} 多文件上传成功处理函数
 */
export const createMultiUploadHandler = (targetObj, fieldName) => {
  return (response, uploadFile) => {
    try {
      console.log('多文件上传响应:', response);
      
      if (!response) {
        throw new Error('上传响应为空');
      }
      
      // 调试响应数据
      debugResponse(response);
      
      if (response.code === 1) {
        // 获取图片URL
        let fileUrl;
        
        if (typeof response.data === 'string') {
          fileUrl = response.data;
        } else if (response.data && response.data.imageUrl) {
          fileUrl = response.data.imageUrl;
        } else if (response.data && response.data.url) {
          fileUrl = response.data.url;
        } else {
          fileUrl = response.data?.fileUrl || response.imageUrl || response.url;
        }
        
        const fileName = uploadFile.name;
        
        if (!fileUrl) {
          console.warn('无法从响应数据中获取图片URL:', response.data);
          // 尝试从响应消息中提取URL
          const urlMatch = response.msg?.match(/\/upload\/[^"\s]+/);
          fileUrl = urlMatch ? urlMatch[0] : null;
        }
        
        if (!fileUrl) {
          throw new Error('服务器未返回有效的文件URL');
        }
        
        // 确保字段存在
        if (!targetObj[fieldName]) {
          targetObj[fieldName] = [];
        }
        
        // 避免重复添加
        const existingFile = targetObj[fieldName].find(item => item.url === fileUrl);
        if (!existingFile) {
          // 添加文件信息到数组
          targetObj[fieldName].push({
            url: fileUrl,
            name: fileName,
            type: uploadFile.type,
            uploadTime: new Date().toLocaleString()
          });
          
          // 强制触发响应式更新 - 创建新数组引用
          targetObj[fieldName] = [...targetObj[fieldName]];
          
          // 显示成功提示
          ElMessage.success(response.msg || `文件上传成功: ${fileName}`);
          
          console.log(`多文件上传成功:`, {
            field: fieldName,
            file: fileName,
            url: fileUrl,
            total: targetObj[fieldName].length,
            time: new Date().toLocaleString()
          });
        }
        
        return { success: true, fieldName, fileUrl, fileName };
      } else {
        throw new Error(response.msg || '上传失败');
      }
      
    } catch (error) {
      console.error('多文件上传处理失败:', error);
      ElMessage.error(`上传失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  };
};

/**
 * 统一上传前验证函数
 * @param {File} file - 上传的文件
 * @param {string} fileType - 文件类型：'img', 'label', 'pdf', 'packingList'
 * @returns {boolean} 是否允许上传
 */
export const beforeUploadValidate = (file, fileType = 'img') => {
  console.log('上传前验证:', file.name, fileType, file.type, file.size);
  
  // 通用大小限制
  let maxSize = 5; // 默认5MB
  
  if (fileType === 'label') {
    // Label可以是图片或PDF
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (!isImage && !isPdf) {
      ElMessage.error('Label只能上传图片或PDF文件!');
      return false;
    }
    maxSize = isPdf ? 10 : 5; // PDF 10MB, 图片 5MB
  } 
  else if (fileType === 'packingList') {
    // 打包单可以是图片或PDF
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (!isImage && !isPdf) {
      ElMessage.error('打包单只能上传图片或PDF文件!');
      return false;
    }
    maxSize = 10; // 打包单统一10MB
  }
  else {
    // 普通图片验证
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      ElMessage.error('只能上传图片文件!');
      return false;
    }
    maxSize = 5; // 图片5MB
  }
  
  // 检查文件大小
  const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
  if (!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过${maxSize}MB!`);
    return false;
  }
  
  return true;
};

/**
 * 删除多文件中的指定文件
 * @param {Object} targetObj - 目标响应式对象
 * @param {string} fieldName - 字段名
 * @param {number} index - 要删除的文件索引
 */
export const deleteMultiFile = (targetObj, fieldName, index) => {
  if (!targetObj[fieldName] || !Array.isArray(targetObj[fieldName])) {
    return;
  }
  
  const deletedFile = targetObj[fieldName][index];
  targetObj[fieldName].splice(index, 1);
  
  // 强制触发响应式更新
  targetObj[fieldName] = [...targetObj[fieldName]];
  
  ElMessage.success(`已删除文件: ${deletedFile.name}`);
  console.log(`删除文件:`, {
    field: fieldName,
    file: deletedFile.name,
    remaining: targetObj[fieldName].length
  });
};

/**
 * 创建打包单上传处理器（简化版）
 * @param {Object} targetObj - 目标响应式对象
 * @param {string} fieldName - 字段名
 * @returns {Object} 包含处理函数的对象
 */
export const createPackingListUploadHandler = (targetObj, fieldName = 'packingList') => {
  return {
    onSuccess: createMultiUploadHandler(targetObj, fieldName),
    beforeUpload: (file) => beforeUploadValidate(file, 'packingList')
  };
};

/**
 * 创建完整的上传处理器集合
 * @param {Object} targetObj - 目标响应式对象
 * @returns {Object} 包含所有处理函数的对象
 */
export const createUploadHandlers = (targetObj) => {
  console.log('创建上传处理器, targetObj:', targetObj);
  
  // 创建包装函数，添加更多调试信息
  const createWrappedHandler = (handler, name) => {
    return (response, ...args) => {
      console.log(`=== ${name} 处理器被调用 ===`);
      console.log('目标对象当前状态:', targetObj);
      return handler(response, ...args);
    };
  };
  
  return {
    // 单文件上传处理器
    imgBySender: createWrappedHandler(createUploadSuccessHandler(targetObj, 'imgBySender'), 'imgBySender'),
    imgByReceiver: createWrappedHandler(createUploadSuccessHandler(targetObj, 'imgByReceiver'), 'imgByReceiver'),
    label: createWrappedHandler(createUploadSuccessHandler(targetObj, 'label'), 'label'),
    
    // 多文件上传处理器
    packingList: createWrappedHandler(createMultiUploadHandler(targetObj, 'packingList'), 'packingList'),
    
    // 上传前验证函数
    beforeAvatarUpload: (file) => beforeUploadValidate(file, 'img'),
    beforeLabelUpload: (file) => beforeUploadValidate(file, 'label'),
    beforePackingListUpload: (file) => beforeUploadValidate(file, 'packingList'),
    
    // 删除打包单文件
    deletePackingFile: (index) => deleteMultiFile(targetObj, 'packingList', index)
  };
};

/**
 * 创建快捷上传处理器
 * @param {Object} targetObj - 目标响应式对象
 * @param {string} fieldName - 字段名
 * @param {string} fileType - 文件类型
 * @returns {Object} 包含处理函数的对象
 */
export const createQuickHandler = (targetObj, fieldName, fileType = 'img') => {
  return {
    onSuccess: createUploadSuccessHandler(targetObj, fieldName),
    beforeUpload: (file) => beforeUploadValidate(file, fileType)
  };
};

/**
 * 错误处理函数
 */
export const handleUploadError = (error) => {
  console.error('上传错误:', error);
  
  if (error.response) {
    switch (error.response.status) {
      case 404:
        ElMessage.error('上传接口不存在 (404)，请检查路径: /api/uploads/');
        break;
      case 413:
        ElMessage.error('文件太大，服务器拒绝接收');
        break;
      case 415:
        ElMessage.error('不支持的媒体类型');
        break;
      case 500:
        ElMessage.error('服务器内部错误');
        break;
      default:
        ElMessage.error(`上传失败: ${error.response.status} ${error.response.statusText}`);
    }
  } else if (error.message) {
    ElMessage.error(`上传失败: ${error.message}`);
  } else {
    ElMessage.error('上传失败，未知错误');
  }
};

// 默认导出
export default {
  createUploadSuccessHandler,
  createMultiUploadHandler,
  beforeUploadValidate,
  deleteMultiFile,
  createPackingListUploadHandler,
  createUploadHandlers,
  createQuickHandler,
  handleUploadError
};