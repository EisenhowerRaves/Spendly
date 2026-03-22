<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: visible }" @click.self="$emit('close')">
      <div class="modal">
        <h3>Edit Expense</h3>
        <div class="form-group">
          <label>Description</label>
          <input v-model="form.desc" type="text" placeholder="e.g. Woolworths groceries" />
        </div>
        <div class="form-group">
          <label>Amount (AUD $)</label>
          <input v-model.number="form.amount" type="number" placeholder="0.00" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select v-model="form.tabId">
            <option v-for="t in store.tabs" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input v-model="form.date" type="date" />
        </div>
        <div class="form-group">
          <label>Note (optional)</label>
          <input v-model="form.note" type="text" placeholder="Any extra detail..." />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">Cancel</button>
          <button class="btn-accent" style="flex: 2" @click="save">Save Changes</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useAppStore } from '@/stores/useAppStore'

const props = defineProps({ visible: Boolean, expenseId: { type: String, default: null } })
const emit = defineEmits(['close'])

const store = useAppStore()

const form = reactive({ desc: '', amount: null, tabId: '', date: '', note: '' })

watch(
  () => props.visible,
  (v) => {
    if (v && props.expenseId) {
      const exp = store.expenses.find((e) => e.id === props.expenseId)
      if (exp) {
        form.desc = exp.desc
        form.amount = exp.amount
        form.tabId = exp.tabId
        form.date = exp.date
        form.note = exp.note || ''
      }
    }
  },
)

async function save() {
  if (!form.desc.trim() || !form.amount || form.amount <= 0 || !form.date) {
    window.__spendlyToast?.('Please fill in all required fields')
    return
  }
  await store.updateExpense({
    id: props.expenseId,
    desc: form.desc.trim(),
    amount: form.amount,
    tabId: form.tabId,
    date: form.date,
    note: form.note.trim(),
  })
  window.__spendlyToast?.('Expense updated')
  emit('close')
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 440px; transform: translateY(10px); transition: transform 0.2s; }
.modal-overlay.open .modal { transform: translateY(0); }
.modal h3 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; margin-bottom: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.form-group label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-group input, .form-group select { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1rem; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; outline: none; transition: border-color 0.2s; width: 100%; }
.form-group input:focus, .form-group select:focus { border-color: var(--accent); }
.form-group select option { background: var(--surface2); }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.btn-cancel { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { color: var(--text); }
</style>
