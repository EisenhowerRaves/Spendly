<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: visible }" @click.self="$emit('close')">
      <div class="modal">
        <h3>Select Month</h3>
        <div class="month-grid">
          <button
            v-for="(name, idx) in months"
            :key="idx"
            class="month-btn"
            :class="{ active: idx === store.selectedMonth }"
            @click="pick(idx, name)"
          >
            {{ name }}
          </button>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useAppStore, monthNames } from '@/stores/useAppStore'

defineProps({ visible: Boolean })
const emit = defineEmits(['close'])
const store = useAppStore()
const months = monthNames

function pick(idx, name) {
  store.selectedMonth = idx
  store.selectedYear = new Date().getFullYear()
  window.__spendlyToast?.(`Selected: ${name}`)
  emit('close')
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 400px; }
.modal-overlay.open .modal { transform: translateY(0); }
.modal h3 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; margin-bottom: 1.5rem; }
.month-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1.5rem; }
.month-btn { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; color: var(--text); }
.month-btn:hover { border-color: var(--accent); color: var(--accent); }
.month-btn.active { background: var(--accent); color: #0f0f0f; border-color: var(--accent); font-weight: 600; }
.modal-actions { display: flex; gap: 0.75rem; }
.btn-cancel { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; cursor: pointer; }
.btn-cancel:hover { color: var(--text); }
</style>
