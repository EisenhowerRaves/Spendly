<template>
  <header class="header">
    <div class="header-logo">
      Spendly
      <span v-if="displayName" class="header-greeting">Hi {{ displayName }}!</span>
    </div>
    <div class="header-actions">
      <div class="fb-status" :class="store.isFirebase ? 'connected' : 'disconnected'">
        <div class="dot" />
        <span>{{ store.isFirebase ? 'Live' : 'Demo' }}</span>
      </div>
      <button class="btn-ghost" title="Import CSV" @click="$emit('open-csv-modal')">
        <Import :size="16" :stroke-width="1.75" />
      </button>
      <button class="btn-ghost" title="Export CSV" @click="$emit('export-csv')">
        <Download :size="16" :stroke-width="1.75" />
      </button>
      <button class="btn-ghost" title="Calendar" @click="$emit('open-calendar-modal')">
        <Calendar :size="16" :stroke-width="1.75" />
      </button>
      <button class="btn-ghost" title="Add Expense" @click="$emit('open-add-modal')">
        <Plus :size="16" :stroke-width="1.75" />
      </button>
      <button class="btn-ghost" title="Delete Categories" @click="$emit('open-delete-categories-modal')">
        <Trash2 :size="16" :stroke-width="1.75" />
      </button>
      <button class="btn-ghost" title="Log out" @click="store.logout()">
        <LogOut :size="16" :stroke-width="1.75" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import { Import, Download, Calendar, Plus, Trash2, LogOut } from 'lucide-vue-next'

defineEmits([
  'open-csv-modal',
  'export-csv',
  'open-calendar-modal',
  'open-add-modal',
  'open-delete-categories-modal',
  'toggle-chat',
])

const store = useAppStore()

const displayName = computed(() => {
  const p = store.currentUserProfile
  return (p && (p.preferredName || p.name)) || ''
})
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 0 1.5rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-logo {
  font-family: 'DM Serif Display', serif;
  font-size: 2.25rem;
  color: var(--accent3);
}
.header-greeting {
  font-size: 0.75em;
  color: #1a1a1a;
  opacity: 0.85;
  font-family: inherit;
  font-weight: 400;
  margin-left: 1rem;
}
.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.btn-ghost {
  background: rgba(255, 255, 255, 1);
  border: 1px solid rgba(2, 115, 172, 1);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: var(--muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.fb-status {
  font-size: 0.72rem;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.fb-status .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.fb-status.connected {
  color: #34d399;
}
.fb-status.connected .dot {
  background: #34d399;
}
.fb-status.disconnected {
  color: var(--muted);
}
.fb-status.disconnected .dot {
  background: var(--muted);
}
@media (max-width: 768px) {
  .header {
    padding: 0 1rem;
    height: 52px;
  }
  .header-logo {
    font-size: 1.8rem;
  }
  .header-actions {
    gap: 0.5rem;
  }
  .btn-ghost {
    padding: 0.45rem 0.65rem;
    font-size: 0.78rem;
  }
}
</style>
