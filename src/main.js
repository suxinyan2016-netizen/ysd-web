import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import i18n, { setLocale } from './i18n'
import './assets/base.css'
import './assets/main.css'

const app = createApp(App)

// install router and i18n
app.use(router)
app.use(i18n)

// set ElementPlus locale according to stored locale
const current = localStorage.getItem('locale') || 'zh'
const elLocale = current === 'en' ? en : zhCn
app.use(ElementPlus, { locale: elLocale })

// add a class on the root element to indicate English locale so CSS can switch fonts
if (current === 'en') {
  try { document.documentElement.classList.add('lang-en') } catch (e) {}
} else {
  try { document.documentElement.classList.remove('lang-en') } catch (e) {}
}

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
