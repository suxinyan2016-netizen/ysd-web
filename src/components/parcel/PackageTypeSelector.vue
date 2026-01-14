<template>
  <el-dialog
    :model-value="visible"
    title="Choose Package Type"
    width="400px"
    @update:model-value="handleClose"
  >
    <el-form>
      <el-form-item label="Package Type">
        <el-select
          v-model="selectedType"
          placeholder="Please choose package type"
          style="width: 100%"
        >
          <el-option
            v-for="type in packagetype"
            :key="type.value"
            :label="type.name"
            :value="type.value"
          ></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedType">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  packagetype: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const emit = defineEmits(['update:visible', 'confirm'])

const selectedType = ref(null)

// 监听 visible 变化，重置选择
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedType.value = null
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleConfirm = () => {
  if (selectedType.value) {
    emit('confirm', selectedType.value)
    handleClose()
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
