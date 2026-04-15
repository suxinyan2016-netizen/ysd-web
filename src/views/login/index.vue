<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { loginApi, handleLoginResponse } from '@/api/login'
import { queryAllApi as queryAllUsersApi, addApi as addUserApi } from '@/api/user'
import { findByGroupApi } from '@/api/dict'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

const loginForm = ref({ username: '', password: '' })
const loginUsername = ref(null)

const registerForm = ref({ username: '', password: '', name: '', phone: '', address: '', zipcode: '', email: '', dictIds: [] })
const dictOptions = ref([])
const registerUsername = ref(null)

const isRegister = ref(false)

const login = async () => {
  try {
    const result = await loginApi(loginForm.value)
    if (result && result.code) {
      ElMessage.success('Login successful')
      handleLoginResponse(result)
      router.push('/')
    } else {
      ElMessage.error(result?.msg || 'Login failed')
    }
  } catch (err) {
    // Avoid logging full error objects which may include request bodies
    console.error('Login error:', err?.message || err)
    const msg = err?.response?.data?.msg || err?.message || 'Interface Error'
    ElMessage.error(msg)
  } finally {
    // Immediately clear password from UI state to minimize exposure
    try { loginForm.value.password = '' } catch (e) { /* ignore */ }
  }
}

const clear = () => { loginForm.value = { username: '', password: '' } }
const clearRegister = () => { registerForm.value = { username: '', password: '', name: '', phone: '', address: '', zipcode: '', email: '' } }

const checkUsernameExists = async (username) => {
  if (!username) return false
  try {
    const res = await queryAllUsersApi()
    if (res && res.code === 1) {
      const list = res.data || []
      return list.some(u => String(u.username).toLowerCase() === String(username).toLowerCase())
    }
    return false
  } catch (err) {
    console.error('checkUsernameExists error', err)
    return false
  }
}

const register = async () => {
  const form = registerForm.value
  if (!form.username || !form.password) { ElMessage.error('Username and password are required'); return }
  try {
    // Directly call registration API; backend will return an error if username exists.
    const res = await addUserApi(form)
    if (res && res.code === 1) {
      await ElMessageBox.alert('Registration successful. Please log in.', 'Success', { confirmButtonText: 'OK' })
      clearRegister()
      isRegister.value = false
      router.push('/login')
    } else {
      ElMessage.error(res?.msg || 'Register failed')
    }
  } catch (err) {
    // Avoid printing full error objects (may contain request bodies)
    console.error('register error', err?.message || err)
    ElMessage.error('Register failed')
  } finally {
    // Clear password from registration form promptly
    try { registerForm.value.password = '' } catch (e) { /* ignore */ }
  }
}

onMounted(() => {
  nextTick(() => { if (loginUsername.value && typeof loginUsername.value.focus === 'function') loginUsername.value.focus() })
  // load dict options for 'I am' multi-select (dictGroup = 1)
  const loadDictOptions = async () => {
    try {
      const list = (await findByGroupApi(1))?.data || []
      dictOptions.value = (list || []).map(d => ({ dictId: d.dictId ?? d.id ?? d.value, dictName: d.dictName ?? d.name ?? d.label }))
    } catch (err) {
      console.error('loadDictOptions error', err)
      dictOptions.value = []
    }
  }
  loadDictOptions()
})

const switchToRegister = () => { isRegister.value = true }
const switchToLogin = () => { isRegister.value = false; nextTick(() => { if (loginUsername.value && typeof loginUsername.value.focus === 'function') loginUsername.value.focus() }) }
</script>

<template>
  <div id="container">
    <div class="login-card">
      <el-card :class="['card', { register: isRegister }]" shadow="hover">
        <div v-if="!isRegister">
          <p class="title">Parcels & Items Management</p>
          <el-form label-width="80px">
            <el-form-item label="UserName" prop="username">
              <el-input ref="loginUsername" v-model="loginForm.username" placeholder="Please enter username" />
            </el-form-item>
            <el-form-item label="Password" prop="password">
              <el-input type="password" v-model="loginForm.password" placeholder="Please enter password" />
            </el-form-item>
            <el-form-item>
              <div class="button-group">
                <el-button class="button" type="primary" @click="login">Login</el-button>
                <el-button class="button" type="info" @click="clear">Reset</el-button>
              </div>
            </el-form-item>
          </el-form>
          <div style="margin-top:12px; text-align:right">
            <a href="javascript:void(0)" @click="switchToRegister">Register</a>
          </div>
        </div>

        <div v-else>
          <p class="title">Register</p>
          <el-form label-width="100px">
            <el-form-item label="Username">
              <el-input ref="registerUsername" v-model="registerForm.username" placeholder="Username" />
            </el-form-item>
            <el-form-item label="Password">
              <el-input type="password" v-model="registerForm.password" placeholder="Password" />
            </el-form-item>
            <el-form-item label="Name">
              <el-input v-model="registerForm.name" placeholder="Name" />
            </el-form-item>
            <el-form-item label="Phone">
              <el-input v-model="registerForm.phone" placeholder="Phone" />
            </el-form-item>
            <el-form-item label="Address">
              <el-input v-model="registerForm.address" placeholder="Address" />
            </el-form-item>
            <el-form-item label="Zipcode">
              <el-input v-model="registerForm.zipcode" placeholder="Zipcode" />
            </el-form-item>
            <el-form-item label="Email">
              <el-input v-model="registerForm.email" placeholder="Email" />
            </el-form-item>
            <el-form-item label="I am">
              <el-select v-model="registerForm.dictIds" multiple collapse-tags clearable placeholder="Select" style="width:100%">
                <el-option v-for="d in dictOptions" :key="d.dictId" :label="d.dictName" :value="d.dictId" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <div class="button-group">
                <el-button class="button" type="primary" @click="register">Register</el-button>
                <el-button class="button" type="info" @click="clearRegister">Clear</el-button>
              </div>
            </el-form-item>
          </el-form>
          <div style="margin-top:12px; text-align:right">
            <a href="javascript:void(0)" @click="switchToLogin">Login</a>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
#container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('../../assets/loginbg.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  padding: 0;
}
.login-card { display:flex; align-items:center; justify-content:center; width:100%; }
.card { width:480px; height:588px; background-color: rgba(0,0,0,0.32); border-radius:12px; padding:22px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); overflow: hidden; backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.06); }
.card.register { height: auto; max-height: calc(100vh - 80px); overflow: visible; }
.title { font-size: clamp(16px, 2.5vw, 24px); font-weight: bold; color: #fff; margin-bottom:18px }
.button { margin-top: 24px; width: 96px }
.button-group { display:flex; gap:12px; justify-content:flex-start }
::v-deep .el-form-item__label { color: #fff }
::v-deep .el-input__inner { background: transparent; color: #000 }
::v-deep .el-input__inner::placeholder { color: #777; opacity: 1 }
/* card link colors (Register / Login) */
.card a { color: #cfcfcf; text-decoration: none; }
.card a:hover { color: #ffffff; }

/* ensure inputs are clickable above backdrop/overlays */
.card .el-card__body { overflow: visible; }
.card .el-input, .card .el-input__inner { position: relative; z-index: 2; pointer-events: auto; }
.card .el-form-item { z-index: 1; }

/* register mode: make typed text visible (black) and adjust placeholder */
.card.register ::v-deep .el-input__inner { color: #000; background: rgba(255,255,255,0.94); }
.card.register ::v-deep .el-input__inner::placeholder { color: #777; opacity: 1; }
</style>