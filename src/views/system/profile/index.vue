<template>
  <div>
    <h1>{{ $t('profile.title') }}</h1>

    <el-form :model="user" ref="formRef" label-width="120px">
      <el-row :gutter="16">
        <el-col :span="12"><el-form-item :label="$t('profile.fields.username')"><el-input v-model="user.username" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('profile.fields.name')"><el-input v-model="user.name" /></el-form-item></el-col>

        <el-col :span="12"><el-form-item :label="$t('profile.fields.phone')"><el-input v-model="user.phone" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('profile.fields.email')"><el-input v-model="user.email" /></el-form-item></el-col>

        <el-col :span="24"><el-form-item :label="$t('profile.fields.address')"><el-input v-model="user.address" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item :label="$t('profile.fields.zipcode')"><el-input v-model="user.zipcode" /></el-form-item></el-col>

        <el-col :span="24"><h3 style="margin-top:8px">{{ $t('change_password') }}</h3></el-col>
        <el-col :span="6"><el-form-item :label="$t('profile.fields.oldPassword')"><el-input type="password" v-model="oldPassword" /></el-form-item></el-col>
        <el-col :span="6"><el-form-item :label="$t('profile.fields.newPassword')"><el-input type="password" v-model="newPassword" /></el-form-item></el-col>
        <el-col :span="6"><el-form-item :label="$t('profile.fields.confirmPassword')"><el-input type="password" v-model="confirmPassword" /></el-form-item></el-col>
      </el-row>
    </el-form>

    <div style="margin-top:12px; text-align:right">
      <el-button @click="onCancel">{{ $t('profile.buttons.cancel') }}</el-button>
      <el-button type="primary" @click="onSave">{{ $t('profile.buttons.save') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUser } from '@/composables/useUser'
import { queryInfoApi, updateApi } from '@/api/user'
import { ElMessage } from 'element-plus'

const { currentUser, getCurrentUser } = useUser()
getCurrentUser()

const user = ref({})
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const formRef = ref(null)

const { t } = useI18n()

const load = async () => {
  const uid = currentUser.value?.userId || JSON.parse(localStorage.getItem('loginUser') || '{}').userId
  if (!uid) return
  try {
    const res = await queryInfoApi(uid)
    if (res && res.code === 1) user.value = { ...res.data }
    else user.value = {}
  } catch (err) {
    console.error(err)
    user.value = {}
  }
}

onMounted(load)

const onCancel = () => {
  load()
}

const onSave = async () => {
  // password change validation
  if (newPassword.value || confirmPassword.value || oldPassword.value) {
    if (newPassword.value !== confirmPassword.value) {
      ElMessage.error(t('profile.messages.password_mismatch'))
      return
    }

    // if loginUser stored a password, do quick client-side check
    const stored = JSON.parse(localStorage.getItem('loginUser') || '{}')
    if (stored.password && oldPassword.value && stored.password !== oldPassword.value) {
      ElMessage.error(t('profile.messages.old_password_incorrect'))
      return
    }
  }

  try {
    const payload = {
      userId: user.value.userId,
      username: user.value.username,
      name: user.value.name,
      phone: user.value.phone,
      address: user.value.address,
      zipcode: user.value.zipcode,
      email: user.value.email
    }

    if (newPassword.value) {
      payload.oldPassword = oldPassword.value
      payload.password = newPassword.value
    }

    const res = await updateApi(payload)
    if (res && res.code === 1) {
      // update localStorage loginUser fields
      const stored = JSON.parse(localStorage.getItem('loginUser') || '{}')
      const updated = { ...stored, username: payload.username, name: payload.name, phone: payload.phone, address: payload.address, zipcode: payload.zipcode, email: payload.email }
      if (payload.password) updated.password = payload.password
      localStorage.setItem('loginUser', JSON.stringify(updated))
      ElMessage.success(t('profile.messages.save_success'))
    } else {
      ElMessage.error(res.msg || t('profile.messages.save_failed'))
    }
  } catch (err) {
    console.error(err)
    ElMessage.error(t('profile.messages.save_failed'))
  }
}
</script>

<style scoped>
</style>
