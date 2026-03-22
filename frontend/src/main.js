import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')

// Stage 3B Step 1 verification — remove after confirming
import { useAppStore } from './stores/useAppStore'
const store = useAppStore()
console.log('[Spendly] Pinia store loaded:', {
  tabs: store.tabs,
  activeTab: store.activeTab,
  selectedMonth: store.selectedMonth,
  isFirebase: store.isFirebase,
})
