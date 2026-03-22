<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: visible }" @click.self="$emit('close')">
      <div class="modal">
        <h3>Copy Selected Expenses</h3>
        <div class="preview-list">
          <div v-for="exp in selectedExpenses" :key="exp.id" class="preview-item">
            <span class="expense-date">{{ formatDate(exp.date) }}</span>
            <span class="cat-name">{{ exp.desc }}</span>
            <span class="expense-amount">${{ exp.amount.toFixed(2) }}</span>
          </div>
          <div v-if="selectedExpenses.length === 0" style="text-align: center; color: var(--muted); padding: 1rem">
            No expenses selected
          </div>
        </div>
        <div class="form-group">
          <label>Copy to Category</label>
          <select v-model="targetTabId">
            <option v-for="t in store.tabs" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Select Date</label>
          <input v-model="copyDate" type="date" />
        </div>
        <div class="form-group">
          <label>Select Amount</label>
          <input v-model.number="copyAmount" type="number" placeholder="0.00" step="0.01" min="0" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">Cancel</button>
          <button class="btn-accent" style="flex: 2" @click="copy">Copy</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore, formatDate, getTodayDateString } from '@/stores/useAppStore'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const store = useAppStore()

const targetTabId = ref('')
const copyDate = ref('')
const copyAmount = ref(null)

const selectedExpenses = computed(() =>
  store.selectedExpenseIds
    .map((id) => store.expenses.find((e) => e.id === id))
    .filter(Boolean),
)

watch(
  () => props.visible,
  (v) => {
    if (v) {
      targetTabId.value = store.tabs[0]?.id || ''
      copyDate.value = getTodayDateString()
      const first = selectedExpenses.value[0]
      copyAmount.value = first ? first.amount : null
    }
  },
)

async function copy() {
  if (!targetTabId.value) {
    window.__spendlyToast?.('Select a target category')
    return
  }
  const date = copyDate.value || getTodayDateString()
  const amt = copyAmount.value !== null && !isNaN(copyAmount.value) ? copyAmount.value : null
  const count = await store.copyExpenses([...store.selectedExpenseIds], targetTabId.value, date, amt)
  const tabName = store.tabs.find((t) => t.id === targetTabId.value)?.name || ''
  window.__spendlyToast?.(`${count} expense(s) copied to ${tabName}`)
  emit('close')
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 440px; transform: translateY(10px); transition: transform 0.2s; }
.modal-overlay.open .modal { transform: translateY(0); }
.modal h3 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; margin-bottom: 1.5rem; }
.preview-list { max-height: 200px; overflow-y: auto; margin-bottom: 1rem; border: 1px solid var(--border); border-radius: 8px; padding: 0.5rem; }
.preview-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
.preview-item:last-child { border-bottom: none; }
.expense-date { color: var(--muted); font-size: 0.8rem; flex-shrink: 0; min-width: 70px; }
.cat-name { flex: 1; font-weight: 500; }
.expense-amount { font-weight: 600; flex-shrink: 0; min-width: 70px; text-align: right; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.form-group label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-group input, .form-group select { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1rem; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; outline: none; transition: border-color 0.2s; width: 100%; }
.form-group input:focus, .form-group select:focus { border-color: var(--accent); }
.form-group select option { background: var(--surface2); }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.btn-cancel { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { color: var(--text); }
</style>
