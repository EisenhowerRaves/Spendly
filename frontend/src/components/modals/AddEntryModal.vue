<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: visible }" @click.self="$emit('close')">
      <div class="modal">
        <h3>{{ editId ? `Edit ${label}` : `Add ${label}` }}</h3>
        <div class="form-group">
          <label>Description</label>
          <input v-model="form.desc" type="text" placeholder="e.g. Salary" />
        </div>
        <div class="form-group">
          <label>Amount (AUD $)</label>
          <input v-model.number="form.amount" type="number" placeholder="0.00" step="0.01" min="0" />
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
          <button class="btn-accent" style="flex: 2" @click="save">{{ editId ? 'Update' : `Add ${label}` }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { useAppStore, getMonthFirstDay } from '@/stores/useAppStore'

const props = defineProps({
  visible: Boolean,
  label: { type: String, default: 'Entry' },
  editId: { type: String, default: null },
  collection: { type: String, required: true },
})
const emit = defineEmits(['close'])
const store = useAppStore()

const form = reactive({ desc: '', amount: null, date: '', note: '' })

function getList() {
  if (props.collection === 'income') return store.income
  if (props.collection === 'taxes') return store.taxes
  if (props.collection === 'super') return store.superannuation
  return []
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    if (props.editId) {
      const item = getList().find((e) => e.id === props.editId)
      if (item) { form.desc = item.desc; form.amount = item.amount; form.date = item.date; form.note = item.note || '' }
    } else {
      form.desc = ''; form.amount = null
      form.date = getMonthFirstDay(store.selectedMonth, store.selectedYear)
      form.note = ''
    }
  },
)

function save() {
  if (!form.desc.trim() || !form.amount || form.amount <= 0 || !form.date) {
    window.__spendlyToast?.('Please fill in description, amount and date'); return
  }
  const entry = { id: props.editId || crypto.randomUUID(), desc: form.desc.trim(), amount: form.amount, date: form.date, note: form.note.trim() }

  if (props.editId) {
    if (props.collection === 'income') store.updateIncome(entry)
    else if (props.collection === 'taxes') store.updateTax(entry)
    else if (props.collection === 'super') store.updateSuper(entry)
    window.__spendlyToast?.(`${props.label} updated`)
  } else {
    if (props.collection === 'income') store.addIncome(entry)
    else if (props.collection === 'taxes') store.addTax(entry)
    else if (props.collection === 'super') store.addSuper(entry)
    window.__spendlyToast?.(`${props.label} added`)
  }
  emit('close')
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 440px; }
.modal h3 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; margin-bottom: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.form-group label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.form-group input { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1rem; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; outline: none; width: 100%; }
.form-group input:focus { border-color: var(--accent); }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.btn-cancel { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; cursor: pointer; }
</style>
