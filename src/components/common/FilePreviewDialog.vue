<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    class="preview-modal"
    width="90%"
    @update:model-value="handleVisibleChange"
    @close="handleClose"
  >
    <div class="preview-content">
      <!-- Image preview -->
      <div v-if="previewType.startsWith('image/')" class="preview-image-container">
        <img
          :src="previewUrl"
          class="preview-image"
          alt="Preview"
          @click="openOriginal"
          title="Click to open original size in a new tab"
        />
        <div class="preview-hint">Click image to open original size in a new tab</div>
      </div>

      <!-- PDF preview -->
      <iframe
        v-else-if="previewType === 'application/pdf'"
        :src="previewUrl"
        class="preview-pdf"
        frameborder="0"
      ></iframe>

      <!-- Other file types -->
      <div v-else class="unsupported-preview">
        <el-icon><Warning /></el-icon>
        <p>Preview not supported for this file type</p>
        <p>File URL: {{ previewUrl }}</p>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">Close</el-button>
        <el-button
          type="primary"
          @click="handleDownload"
          v-if="previewUrl"
        >
          Download file
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Warning } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  previewUrl: {
    type: String,
    default: ''
  },
  previewType: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'close', 'download'])

const title = computed(() => {
  return props.previewType.startsWith('image/') ? 'Image Preview' : 'PDF Preview'
})

const handleVisibleChange = (value) => {
  emit('update:visible', value)
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleDownload = () => {
  emit('download', props.previewUrl)
}

const openOriginal = () => {
  if (!props.previewUrl) return
  // open in a new browser tab/window at full URL
  window.open(props.previewUrl, '_blank')
}
</script>

<style scoped>
.preview-modal .preview-content {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto; /* allow scrolling for large images */
  padding: 12px;
}

.preview-image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-image {
  display: block;
  max-width: none; /* show at original width */
  height: auto;
  cursor: zoom-in;
}

.preview-pdf {
  width: 100%;
  min-height: 70vh;
}

.preview-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.unsupported-preview {
  text-align: center;
}
</style>