<template>
  <div class="image-uploader">
    <!-- 显示已上传图片 -->
    <div v-if="imageList.length > 0" class="image-list">
      <div v-for="(image, index) in imageList" :key="image.uid || index" class="image-item">
        <el-image
          :src="image.imageUrl"
          :preview-src-list="previewList"
          fit="cover"
          class="image-preview"
        />
        <div class="image-actions">
          <el-button
            type="danger"
            size="small"
            circle
            @click="handleRemove(image)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
          <a :href="image.imageUrl || image.url || image" target="_blank" rel="noopener noreferrer" class="open-original" @click.stop>
            原图
          </a>
        </div>
        <div class="image-info">
          {{ getImageName(image) }}
        </div>
      </div>
    </div>
    
    <!-- 上传按钮 -->
    <el-upload
      v-if="!maxCount || imageList.length < maxCount"
      :action="uploadUrl"
      :headers="headers"
      :data="uploadData"
      :show-file-list="false"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
      accept="image/*"
      class="upload-button"
    >
      <div class="big-plus">+</div>
      <template #tip>
        <div class="upload-tip">
          已上传 {{ imageList.length }} / {{ maxCount || '∞' }} 张
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { deleteImage, getGroupedImages } from '@/api/imageManage'

const props = defineProps({
  moduleType: {
    type: String,
    required: true,
    default: 'PARCEL'
  },
  recordId: {
    type: Number,
    default: null
  },
  imageType: {
    type: String,
    required: true
  },
  maxCount: {
    type: Number,
    default: 0
  },
  maxSize: {
    type: Number,
    default: 5 // MB
  },
  value: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:value', 'change'])

const imageList = ref([...props.value])

const token = localStorage.getItem('token') || ''

const headers = computed(() => ({
  token: token,
  username: localStorage.getItem('username') || ''
}))

const uploadData = computed(() => ({
  moduleType: props.moduleType,
  recordId: props.recordId,
  imageType: props.imageType
}))

const uploadUrl = computed(() => '/api/uploads/')

const previewList = computed(() => 
  imageList.value.map(img => img.imageUrl)
)

// 上传成功处理
const handleSuccess = async (response, file) => {
  if (response.code === 1) {
    // 重新加载图片列表
    await loadImages()
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

// 上传错误处理
const handleError = (error) => {
  console.error('Upload error:', error)
  ElMessage.error('上传失败')
}

// 上传前验证
const beforeUpload = (file) => {
  // 检查文件大小
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB`)
    return false
  }
  
  // 检查数量限制
  if (props.maxCount > 0 && imageList.value.length >= props.maxCount) {
    ElMessage.error(`最多只能上传 ${props.maxCount} 张图片`)
    return false
  }
  
  return true
}

// 删除图片
const handleRemove = async (image) => {
  const id = image.id || image.imageId || image.image_id
  if (!id) { ElMessage.error('无法删除该图片'); return }
  try {
    const res = await deleteImage(id)
    // if backend returns code field use it, otherwise assume success on 2xx
    if (res && (res.code === 1 || res.success === true || res.status === 200 || res === '') ) {
      // reload from server to ensure consistent state
      await loadImages()
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(res && res.msg ? res.msg : '删除失败')
    }
  } catch (error) {
    console.error('handleRemove error', error)
    ElMessage.error('删除失败')
  }
}

const openInNewTab = (image) => {
  const url = image.imageUrl || image.url || image
  if (url) window.open(url, '_blank', 'noopener')
}

// 获取图片显示名称
const getImageName = (image) => {
  return image.originalName || image.name || `图片 ${image.imageIndex}`
}

// 加载图片
const loadImages = async () => {
  if (!props.recordId) return
  
  try {
    const result = await getGroupedImages(props.moduleType, props.recordId)
    if (result.code === 1) {
      const grouped = result.data
      imageList.value = grouped[props.imageType] || []
      emitUpdate()
    }
  } catch (error) {
    console.error('加载图片失败:', error)
  }
}

// 触发更新事件
const emitUpdate = () => {
  emit('update:value', imageList.value)
  emit('change', imageList.value)
}

// 清空图片
const clearImages = () => {
  imageList.value = []
  emitUpdate()
}

// 暴露方法给父组件
defineExpose({
  loadImages,
  clearImages
})
</script>

<style scoped>
.image-uploader {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
}

.image-actions {
  position: absolute;
  top: 5px;
  right: 5px;
}

.image-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 5px;
  font-size: 10px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.upload-button {
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.big-plus {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  border: 2px dashed #d9d9d9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #909399;
  cursor: pointer;
}
</style>