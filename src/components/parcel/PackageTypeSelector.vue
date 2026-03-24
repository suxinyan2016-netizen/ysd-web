<template>
  <el-dialog
    :model-value="visible"
    :title="$t('menu.parcel_search.placeholders.choosePackageType') || 'Choose Package Type'"
    width="400px"
    @update:model-value="handleClose"
  >
    <el-form>
      <el-form-item :label="$t('menu.parcel_search.fields.packageType') || 'Package Type'">
        <el-select
          v-model="selectedType"
          :placeholder="$t('menu.parcel_search.placeholders.choosePackageType') || 'Please choose package type'"
          style="width: 100%"
        >
          <el-option
            v-for="type in availableTypes"
            :key="type.value"
            :label="$t('menu.package_types.' + type.value) || type.name"
            :value="type.value"
          ></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">{{ $t('cancel') || 'Cancel' }}</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!selectedType">
          {{ $t('confirm') || 'Confirm' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

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
  allowedTypes: {
    type: Array,
    required: false,
    default: null,
  },
})

const emit = defineEmits(['update:visible', 'confirm'])

const selectedType = ref(null)

const availableTypes = computed(() => {
  if (!props.allowedTypes || !Array.isArray(props.allowedTypes)) return props.packagetype || []
  return (props.packagetype || []).filter(t => props.allowedTypes.includes(t.value))
})

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
