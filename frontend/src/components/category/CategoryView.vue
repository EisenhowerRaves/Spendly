<template>
  <div v-if="tab">
    <!-- MONTH NAV -->
    <div class="month-nav">
      <button class="month-arrow" @click="store.prevMonth()">
        <ChevronLeft :size="20" />
      </button>
      <h2 class="serif month-label">{{ store.monthLabel }}</h2>
      <button class="month-arrow" @click="store.nextMonth()">
        <ChevronRight :size="20" />
      </button>
    </div>

    <!-- HEADER -->
    <div class="tab-header">
      <div class="tab-title">
        <div class="tab-dot" :style="{ background: tab.color }" />
        <h2 v-if="!editing" class="serif cat-name" @click="startEdit">
          <span>{{ tab.name }}</span>
          <span class="cat-edit-hint"><Pencil :size="16" :stroke-width="2" /></span>
        </h2>
        <input
          v-else
          ref="nameInput"
          v-model="editName"
          class="cat-name-input"
          @keydown.enter="commitEdit"
          @keydown.escape="cancelEdit"
          @blur="commitEdit"
        />
      </div>
      <div class="tab-actions">
        <button
          class="btn-ghost"
          :disabled="!hasSelection"
          title="Delete selected expenses"
          @click="$emit('open-delete-expenses')"
        >
          <Trash2 :size="16" :stroke-width="1.75" />
        </button>
        <button
          class="btn-ghost"
          :disabled="!hasSelection"
          title="Copy selected expenses"
          @click="$emit('open-copy-expenses')"
        >
          <Copy :size="16" :stroke-width="1.75" />
        </button>
        <button class="btn-ghost" title="Add expense" @click="$emit('open-add-expense')">
          <Plus :size="16" :stroke-width="1.75" />
        </button>
      </div>
    </div>

    <!-- STAT CARD -->
    <div class="overview-grid">
      <div class="stat-card">
        <div class="card-bar" :style="{ background: tab.color }" />
        <div class="stat-label">Total</div>
        <div class="stat-value">${{ monthTotal.toFixed(2) }}</div>
        <div class="stat-sub">{{ monthExpenses.length }} transactions</div>
      </div>
    </div>

    <!-- EXPENSE TABLE -->
    <ExpenseTable :expenses="monthExpenses" :tab="tab" @edit="(id) => $emit('edit-expense', id)" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useAppStore, filterByMonth } from '@/stores/useAppStore'
import { ChevronLeft, ChevronRight, Pencil, Trash2, Copy, Plus } from 'lucide-vue-next'
import ExpenseTable from './ExpenseTable.vue'

const props = defineProps({ tabId: String })
defineEmits(['open-add-expense', 'open-delete-expenses', 'open-copy-expenses', 'edit-expense'])

const store = useAppStore()

const tab = computed(() => store.tabs.find((t) => t.id === props.tabId))
const monthExpenses = computed(() =>
  filterByMonth(store.expenses, store.selectedMonth, store.selectedYear)
    .filter((e) => e.tabId === props.tabId)
    .sort((a, b) => new Date(b.date) - new Date(a.date)),
)
const monthTotal = computed(() => monthExpenses.value.reduce((s, e) => s + e.amount, 0))
const hasSelection = computed(() => store.selectedExpenseIds.length > 0)

const editing = ref(false)
const editName = ref('')
const nameInput = ref(null)

watch(
  () => props.tabId,
  () => {
    editing.value = false
    store.selectedExpenseIds = []
  },
)

function startEdit() {
  editName.value = tab.value.name
  editing.value = true
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
}
async function commitEdit() {
  if (!editing.value) return
  editing.value = false
  const n = editName.value.trim()
  if (n && n !== tab.value.name) {
    await store.renameCategory(props.tabId, n)
    window.__spendlyToast?.(`Renamed to ${n}`)
  }
}
function cancelEdit() {
  editing.value = false
}
</script>

<style scoped>
.serif {
  font-family: 'DM Serif Display', serif;
  margin: 0;
}
.month-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.month-label {
  font-size: 1.8rem;
}
.month-arrow {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.35rem;
  cursor: pointer;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}
.month-arrow:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.tab-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.tab-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.tab-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.cat-name {
  font-size: 1.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
}
.cat-edit-hint {
  display: inline-flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s;
}
.cat-name:hover .cat-edit-hint {
  opacity: 0.35;
}
.cat-name-input {
  font-family: 'DM Serif Display', serif;
  font-size: 1.8rem;
  font-weight: normal;
  border: none;
  border-bottom: 2px solid var(--accent);
  background: transparent;
  color: var(--text);
  outline: none;
  padding: 0 2px;
  min-width: 80px;
  line-height: 1.2;
}
.tab-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
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
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  position: relative;
  overflow: hidden;
}
.card-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}
.stat-label {
  font-size: 0.75rem;
  color: var(--muted);
  margin-bottom: 0.5rem;
}
.stat-value {
  font-family: 'DM Serif Display', serif;
  font-size: 1.6rem;
}
.stat-sub {
  font-size: 0.75rem;
  color: var(--muted);
  margin-top: 0.25rem;
}
</style>
