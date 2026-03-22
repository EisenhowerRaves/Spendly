<template>
  <div class="expense-table-wrap">
    <table class="expense-table">
      <thead>
        <tr>
          <th style="width: 30px">
            <input
              type="checkbox"
              :checked="allSelected"
              :indeterminate="someSelected && !allSelected"
              @change="toggleSelectAll"
            />
          </th>
          <th>Description</th>
          <th>Date</th>
          <th>Note</th>
          <th>Amount</th>
          <th style="width: 50px"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="expenses.length === 0">
          <td colspan="6">
            <div class="empty-state">
              <span><FolderOpen :size="32" /></span>
              No expenses in this category for {{ store.monthLabel }}.
            </div>
          </td>
        </tr>
        <tr
          v-for="exp in expenses"
          :key="exp.id"
          :class="{ 'expense-row-selected': store.selectedExpenseIds.includes(exp.id) }"
        >
          <td>
            <input
              type="checkbox"
              class="expense-checkbox"
              :checked="store.selectedExpenseIds.includes(exp.id)"
              @change="toggleOne(exp.id, $event)"
            />
          </td>
          <td>{{ exp.desc }}</td>
          <td class="expense-date">{{ formatDate(exp.date) }}</td>
          <td class="expense-note">{{ exp.note || '' }}</td>
          <td class="expense-amount" :style="{ color: tab?.color || 'var(--accent)' }">
            ${{ exp.amount.toFixed(2) }}
          </td>
          <td>
            <button class="edit-expense-btn" title="Edit expense" @click="$emit('edit', exp.id)">
              <Pencil :size="15" :stroke-width="1.75" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore, formatDate } from '@/stores/useAppStore'
import { Pencil, FolderOpen } from 'lucide-vue-next'

const props = defineProps({
  expenses: { type: Array, required: true },
  tab: { type: Object, default: null },
})
defineEmits(['edit'])

const store = useAppStore()

const allSelected = computed(
  () => props.expenses.length > 0 && props.expenses.every((e) => store.selectedExpenseIds.includes(e.id)),
)
const someSelected = computed(
  () => props.expenses.some((e) => store.selectedExpenseIds.includes(e.id)),
)

function toggleSelectAll(ev) {
  if (ev.target.checked) {
    store.selectedExpenseIds = props.expenses.map((e) => e.id)
  } else {
    store.selectedExpenseIds = []
  }
}

function toggleOne(id, ev) {
  if (ev.target.checked) {
    if (!store.selectedExpenseIds.includes(id)) store.selectedExpenseIds.push(id)
  } else {
    store.selectedExpenseIds = store.selectedExpenseIds.filter((x) => x !== id)
  }
}
</script>

<style scoped>
.expense-table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.expense-table {
  width: 100%;
  border-collapse: collapse;
}
.expense-table th {
  padding: 0.85rem 1.25rem;
  text-align: left;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
}
.expense-table td {
  padding: 0.85rem 1.25rem;
  font-size: 0.88rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.expense-table tr:last-child td {
  border-bottom: none;
}
.expense-amount {
  font-weight: 600;
  font-family: 'DM Serif Display', serif;
  font-size: 1rem;
}
.expense-date {
  color: var(--muted);
  font-size: 0.8rem;
}
.expense-note {
  color: var(--muted);
  font-size: 0.8rem;
  font-style: italic;
}
.expense-row-selected {
  background: rgba(143, 179, 0, 0.05);
}
.expense-checkbox {
  cursor: pointer;
  width: 18px;
  height: 18px;
}
.edit-expense-btn {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: color 0.15s;
  display: inline-flex;
  align-items: center;
}
.edit-expense-btn:hover {
  color: var(--accent);
}
.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
}
.empty-state span {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.75rem;
}
@media (max-width: 768px) {
  .expense-table-wrap {
    overflow-x: auto;
  }
  .expense-table {
    min-width: 420px;
  }
}
</style>
