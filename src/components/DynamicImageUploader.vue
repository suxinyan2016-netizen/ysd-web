<template>
  <div class="dynamic-uploader">
    <div v-for="typeConfig in imageTypes" :key="typeConfig.typeCode" class="type-section">
      <div class="type-header">
        <span class="type-name">{{ typeConfig.typeName }}</span>
        <span v-if="typeConfig.description" class="type-desc">
          {{ typeConfig.description }}
        </span>
      </div>
      
      <ImageUploader
        v-model="images[typeConfig.typeCode]"
        :module-type="moduleType"
        :record-id="recordId"
        :image-type="typeConfig.typeCode"
        :max-count="typeConfig.maxCount"
        @change="handleImageChange(typeConfig.typeCode, $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import ImageUploader from './ImageUploader.vue'
import { getImageTypes, getGroupedImages } from '@/api/image'

const props = defineProps({
  moduleType: {
    type: String,
    required: true
  },
  recordId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['change'])

const imageTypes = ref([])
const images = ref({})

// 加载图片类型配置
const loadImageTypes = async () => {
  try {
    const result = await getImageTypes(props.moduleType)
    if (result.code === 1) {
      imageTypes.value = result.data
      
      // 初始化images对象
      imageTypes.value.forEach(type => {
        if (!images.value[type.typeCode]) {
          images.value[type.typeCode] = []
        }
      })
    }
  } catch (error) {
    console.error('加载图片类型配置失败:', error)
  }
}

// 加载已有图片
const loadExistingImages = async () => {
  if (!props.recordId) return
  
  try {
    const result = await getGroupedImages(props.moduleType, props.recordId)
    if (result.code === 1) {
      images.value = result.data
    }
  } catch (error) {
    console.error('加载已有图片失败:', error)
  }
}

// 图片变化处理
const handleImageChange = (typeCode, imageList) => {
  images.value[typeCode] = imageList
  emit('change', images.value)
}

// 获取所有图片
const getAllImages = () => {
  return images.value
}

// 获取某个类型的图片
const getImagesByType = (typeCode) => {
  return images.value[typeCode] || []
}

onMounted(() => {
  loadImageTypes()
  if (props.recordId) {
    loadExistingImages()
  }
})

// 监听recordId变化
watch(() => props.recordId, (newRecordId) => {
  if (newRecordId) {
    loadExistingImages()
  } else {
    images.value = {}
  }
})

defineExpose({
  getAllImages,
  getImagesByType
})
</script>

<style scoped>
.dynamic-uploader {
  padding: 10px;
}

.type-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.type-header {
  margin-bottom: 10px;
}

.type-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  margin-right: 10px;
}

.type-desc {
  font-size: 12px;
  color: #606266;
}
</style>