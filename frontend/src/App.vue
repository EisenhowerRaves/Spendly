<template>
  <template v-if="authReady">
    <div v-if="!isLoggedIn">
      <LoginScreen @open-register="showRegister = true" />
      <RegisterModal :visible="showRegister" @close="showRegister = false" />
    </div>
    <template v-else>
      <AppHeader
        @open-csv-modal="todo('CSV modal')"
        @export-csv="todo('Export CSV')"
        @open-calendar-modal="todo('Calendar modal')"
        @open-add-modal="openAddExpense"
        @open-delete-categories-modal="todo('Delete categories modal')"
        @toggle-chat="todo('Chat panel')"
      />
      <div class="main-layout">
        <Sidebar @open-new-tab-modal="todo('New tab modal')" />
        <main class="content">
          <Dashboard v-if="store.activeTab === 'overview'" />
          <CategoryView
            v-else-if="isCategory"
            :tab-id="store.activeTab"
            @open-add-expense="openAddExpense"
            @open-delete-expenses="showDeleteExpenses = true"
            @open-copy-expenses="showCopyExpenses = true"
            @edit-expense="openEditExpense"
          />
          <div v-else class="tab-placeholder">
            <p>{{ store.activeTab }} view — coming in a later step</p>
          </div>
        </main>
      </div>

      <AddExpenseModal
        :visible="showAddExpense"
        :preselected-tab="isCategory ? store.activeTab : ''"
        @close="showAddExpense = false"
      />
      <EditExpenseModal
        :visible="showEditExpense"
        :expense-id="editingExpenseId"
        @close="closeEditExpense"
      />
      <DeleteExpensesModal :visible="showDeleteExpenses" @close="showDeleteExpenses = false" />
      <CopyExpensesModal :visible="showCopyExpenses" @close="showCopyExpenses = false" />
    </template>
  </template>
  <div v-else class="loading-screen">
    <p>Loading…</p>
  </div>
  <div class="toast" :class="{ show: toastMsg }">{{ toastMsg }}</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useAppStore } from '@/stores/useAppStore'
import LoginScreen from '@/components/auth/LoginScreen.vue'
import RegisterModal from '@/components/auth/RegisterModal.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Dashboard from '@/components/dashboard/Dashboard.vue'
import CategoryView from '@/components/category/CategoryView.vue'
import AddExpenseModal from '@/components/modals/AddExpenseModal.vue'
import EditExpenseModal from '@/components/modals/EditExpenseModal.vue'
import DeleteExpensesModal from '@/components/modals/DeleteExpensesModal.vue'
import CopyExpensesModal from '@/components/modals/CopyExpensesModal.vue'

const store = useAppStore()

const isLoggedIn = ref(false)
const authReady = ref(false)
const showRegister = ref(false)
const toastMsg = ref('')

const showAddExpense = ref(false)
const showEditExpense = ref(false)
const showDeleteExpenses = ref(false)
const showCopyExpenses = ref(false)
const editingExpenseId = ref(null)

const isCategory = computed(() =>
  store.activeTab !== 'overview' &&
  store.activeTab !== 'income' &&
  store.activeTab !== 'taxes' &&
  store.activeTab !== 'super',
)

function openAddExpense() {
  showAddExpense.value = true
}
function openEditExpense(id) {
  editingExpenseId.value = id
  showEditExpense.value = true
}
function closeEditExpense() {
  showEditExpense.value = false
  editingExpenseId.value = null
}

function todo(label) {
  window.__spendlyToast?.(`${label} — coming soon`)
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      store.currentUserId = user.uid
      try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid))
        store.currentUserProfile = profileSnap.exists() ? profileSnap.data() : {}
      } catch {
        store.currentUserProfile = {}
      }
      await store.loadFromFirebase()
      isLoggedIn.value = true
    } else {
      localStorage.removeItem('spendly_user')
      localStorage.removeItem('spendly_state')
      Object.keys(localStorage)
        .filter((k) => k.startsWith('spendly_'))
        .forEach((k) => localStorage.removeItem(k))
      isLoggedIn.value = false
      showRegister.value = false
    }
    authReady.value = true
  })
})

window.__spendlyToast = (msg) => {
  toastMsg.value = msg
  setTimeout(() => (toastMsg.value = ''), 2500)
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --bg: #f5f0e8;
  --surface: #d6cdc0;
  --surface2: #a39683;
  --surface3: #f5f0e8;
  --border: #dfdfdf;
  --border2: #000000;
  --accent: #16a370;
  --accent2: #ff6b35;
  --accent3: #059669;
  --text: #000000;
  --muted: #000000;
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: 'DM Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}
.btn-accent {
  background: var(--accent);
  color: #0f0f0f;
  border: none;
  border-radius: 8px;
  padding: 0.85rem 1.5rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  width: 100%;
}
.btn-accent:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-accent:active {
  transform: translateY(0);
}
.btn-accent:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* LAYOUT */
.main-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: calc(100vh - 60px);
}
.content {
  padding: 2rem;
  overflow-y: auto;
}

.loading-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: var(--muted);
}
.tab-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  font-family: 'DM Serif Display', serif;
  font-size: 1.2rem;
  color: var(--muted);
}
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  font-size: 0.85rem;
  color: var(--text);
  z-index: 999;
  opacity: 0;
  transition: all 0.3s;
  pointer-events: none;
  white-space: nowrap;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  .content {
    padding: 1rem;
    padding-bottom: 90px;
  }
}
</style>
