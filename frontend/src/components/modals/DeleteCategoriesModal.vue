<template>
  <Teleport to="body">
    <div class="modal-overlay" :class="{ open: visible }" @click.self="$emit('close')">
      <div class="modal">
        <h3>Delete Categories</h3>
        <div class="cat-list">
          <p v-if="store.tabs.length === 0" class="empty-msg">No categories to delete.</p>
          <div
            v-for="tab in tabsWithStats"
            :key="tab.id"
            class="cat-row"
            @click="toggle(tab.id)"
          >
            <input type="checkbox" :checked="selected.includes(tab.id)" @click.stop="toggle(tab.id)" />
            <span class="dot" :style="{ background: tab.color }" />
            <span class="cat-name">{{ tab.name }}</span>
            <span class="cat-info">{{ tab.count }} expense{{ tab.count !== 1 ? 's' : '' }} · ${{ tab.total.toFixed(2) }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">Cancel</button>
          <button class="btn-delete" :disabled="selected.length === 0" @click="confirm">
            Delete Selected
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore, filterByMonth } from '@/stores/useAppStore'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])
const store = useAppStore()

const selected = ref([])

watch(() => props.visible, (v) => { if (v) selected.value = [] })

const tabsWithStats = computed(() => {
  const me = filterByMonth(store.expenses, store.selectedMonth, store.selectedYear)
  return store.tabs.map((tab) => ({
    ...tab,
    count: me.filter((e) => e.tabId === tab.id).length,
    total: me.filter((e) => e.tabId === tab.id).reduce((s, e) => s + e.amount, 0),
  }))
})

function toggle(id) {
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}

async function confirm() {
  const count = selected.value.length
  await store.deleteCategories([...selected.value])
  window.__spendlyToast?.(`${count} categor${count !== 1 ? 'ies' : 'y'} deleted`)
  emit('close')
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.modal-overlay.open { opacity: 1; pointer-events: all; }
.modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; width: 100%; max-width: 480px; }
.modal h3 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; margin-bottom: 1.5rem; }
.cat-list { max-height: 320px; overflow-y: auto; margin-bottom: 1rem; }
.empty-msg { text-align: center; color: var(--muted); font-size: 0.85rem; padding: 1rem; }
.cat-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.75rem; border-radius: 8px; cursor: pointer; border: 1px solid var(--border); margin-bottom: 0.4rem; transition: background 0.15s; }
.cat-row:hover { background: rgba(0,0,0,0.03); }
.cat-row input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #ff4444; flex-shrink: 0; }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.cat-name { flex: 1; font-size: 0.9rem; }
.cat-info { font-size: 0.78rem; color: var(--muted); }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
.btn-cancel { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem; color: var(--muted); font-family: 'DM Sans', sans-serif; cursor: pointer; }
.btn-delete { flex: 2; background: #ff4444; color: #fff; border: none; border-radius: 8px; padding: 0.75rem; font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: opacity 0.2s; }
.btn-delete:hover { opacity: 0.9; }
.btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
