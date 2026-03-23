<template>
  <div>
    <!-- MONTH NAV -->
    <div class="month-nav">
      <button class="month-arrow" @click="store.prevMonth()"><ChevronLeft :size="20" /></button>
      <h2 class="serif month-label">{{ store.monthLabel }}</h2>
      <button class="month-arrow" @click="store.nextMonth()"><ChevronRight :size="20" /></button>
    </div>

    <!-- HEADER -->
    <div class="tab-header">
      <div class="tab-title">
        <div class="tab-dot" :style="{ background: color }" />
        <h2 class="serif" style="font-size: 1.8rem">{{ title }}</h2>
      </div>
      <div class="tab-actions">
        <button class="btn-ghost" title="Add" @click="$emit('open-add')"><Plus :size="16" /></button>
        <button class="btn-ghost" :disabled="!hasSelection" title="Delete selected" @click="doDelete"><Trash2 :size="16" /></button>
        <button class="btn-ghost" :disabled="!hasSelection" title="Duplicate selected" @click="doDuplicate"><Copy :size="16" /></button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="expense-table-wrap">
      <table class="expense-table">
        <thead>
          <tr>
            <th style="width: 30px"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
            <th>Description</th>
            <th>Date</th>
            <th>Note</th>
            <th>Amount</th>
            <th style="width: 50px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="monthItems.length === 0">
            <td colspan="6">
              <div class="empty-state"><span><FolderOpen :size="32" /></span>No {{ title.toLowerCase() }} for {{ store.monthLabel }}.</div>
            </td>
          </tr>
          <tr
            v-for="item in monthItems"
            :key="item.id"
            :class="{ 'expense-row-selected': selectedIds.includes(item.id) }"
          >
            <td><input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleOne(item.id, $event)" /></td>
            <td>{{ item.desc }}</td>
            <td class="expense-date">{{ formatDate(item.date) }}</td>
            <td class="expense-note">{{ item.note || '' }}</td>
            <td class="expense-amount" :style="{ color }">
              ${{ item.amount.toFixed(2) }}
            </td>
            <td><button class="edit-expense-btn" title="Edit" @click="$emit('edit', item.id)"><Pencil :size="15" /></button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SLOT: extra content below the table (tax calculator, super calc, etc.) -->
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore, filterByMonth, formatDate } from '@/stores/useAppStore'
import { ChevronLeft, ChevronRight, Plus, Trash2, Copy, Pencil, FolderOpen } from 'lucide-vue-next'

const props = defineProps({
  title: String,
  color: String,
  items: { type: Array, required: true },
  selectedIds: { type: Array, required: true },
  collection: String,
})
const emit = defineEmits(['open-add', 'edit', 'update:selectedIds'])

const store = useAppStore()

const monthItems = computed(() =>
  filterByMonth(props.items, store.selectedMonth, store.selectedYear).sort((a, b) => new Date(b.date) - new Date(a.date)),
)

const allSelected = computed(() => monthItems.value.length > 0 && monthItems.value.every((e) => props.selectedIds.includes(e.id)))
const hasSelection = computed(() => props.selectedIds.length > 0)

function toggleAll(ev) {
  emit('update:selectedIds', ev.target.checked ? monthItems.value.map((e) => e.id) : [])
}
function toggleOne(id, ev) {
  const ids = [...props.selectedIds]
  if (ev.target.checked) { if (!ids.includes(id)) ids.push(id) }
  else { const i = ids.indexOf(id); if (i >= 0) ids.splice(i, 1) }
  emit('update:selectedIds', ids)
}

function doDelete() {
  const count = props.selectedIds.length
  if (props.collection === 'income') store.deleteIncomes([...props.selectedIds])
  else if (props.collection === 'taxes') store.deleteTaxes([...props.selectedIds])
  else if (props.collection === 'super') store.deleteSupers([...props.selectedIds])
  emit('update:selectedIds', [])
  window.__spendlyToast?.(`${count} entry(ies) deleted`)
}

function doDuplicate() {
  const list = props.items
  for (const id of props.selectedIds) {
    const orig = list.find((e) => e.id === id)
    if (!orig) continue
    const dup = { id: crypto.randomUUID(), desc: orig.desc, amount: orig.amount, date: orig.date, note: orig.note || '' }
    if (props.collection === 'income') store.addIncome(dup)
    else if (props.collection === 'taxes') store.addTax(dup)
    else if (props.collection === 'super') store.addSuper(dup)
  }
  emit('update:selectedIds', [])
  window.__spendlyToast?.('Duplicated')
}
</script>

<style scoped>
.serif { font-family: 'DM Serif Display', serif; margin: 0; }
.month-nav { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
.month-label { font-size: 1.8rem; }
.month-arrow { background: none; border: 1px solid var(--border); border-radius: 8px; padding: 0.35rem; cursor: pointer; color: var(--text); display: inline-flex; align-items: center; justify-content: center; transition: border-color 0.2s; }
.month-arrow:hover { border-color: var(--accent); color: var(--accent); }
.tab-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.tab-title { display: flex; align-items: center; gap: 0.75rem; }
.tab-dot { width: 12px; height: 12px; border-radius: 50%; }
.tab-actions { display: flex; gap: 0.75rem; }
.btn-ghost { background: rgba(255,255,255,1); border: 1px solid rgba(2,115,172,1); border-radius: 8px; padding: 0.5rem 1rem; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; }
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
.expense-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.expense-table { width: 100%; border-collapse: collapse; }
.expense-table th { padding: 0.85rem 1.25rem; text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); border-bottom: 1px solid var(--border); background: var(--surface2); }
.expense-table td { padding: 0.85rem 1.25rem; font-size: 0.88rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
.expense-table tr:last-child td { border-bottom: none; }
.expense-amount { font-weight: 600; font-family: 'DM Serif Display', serif; font-size: 1rem; }
.expense-date { color: var(--muted); font-size: 0.8rem; }
.expense-note { color: var(--muted); font-size: 0.8rem; font-style: italic; }
.expense-row-selected { background: rgba(143,179,0,0.05); }
.edit-expense-btn { background: none; border: none; color: var(--muted); cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 4px; display: inline-flex; align-items: center; }
.edit-expense-btn:hover { color: var(--accent); }
.empty-state { padding: 3rem; text-align: center; color: var(--muted); font-size: 0.9rem; }
.empty-state span { font-size: 2rem; display: block; margin-bottom: 0.75rem; }
</style>
