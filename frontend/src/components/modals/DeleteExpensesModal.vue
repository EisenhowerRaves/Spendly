<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: visible }" @click.self="$emit('close')">
      <div class="modal">
        <h3>Delete Expenses</h3>
        <p class="confirm-msg">
          Are you sure you want to delete {{ store.selectedExpenseIds.length }} selected
          expense(s)? This cannot be undone.
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">Cancel</button>
          <button class="btn-delete" @click="confirm">Delete</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useAppStore } from '@/stores/useAppStore'

defineProps({ visible: Boolean })
const emit = defineEmits(['close'])
const store = useAppStore()

async function confirm() {
  const count = store.selectedExpenseIds.length
  await store.deleteExpenses([...store.selectedExpenseIds])
  window.__spendlyToast?.(`${count} expense(s) deleted`)
  emit('close')
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 440px; transform: translateY(10px); transition: transform 0.2s; }
.modal-overlay.open .modal { transform: translateY(0); }
.modal h3 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; margin-bottom: 1.5rem; }
.confirm-msg { color: var(--muted); font-size: 0.9rem; line-height: 1.6; margin-bottom: 0.25rem; }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.btn-cancel { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { color: var(--text); }
.btn-delete { flex: 2; background: #ff4444; color: #fff; border: none; border-radius: 8px; padding: 0.75rem; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: opacity 0.2s; }
.btn-delete:hover { opacity: 0.9; }
</style>
