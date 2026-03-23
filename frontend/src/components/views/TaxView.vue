<template>
  <EntryTableView
    title="Taxes"
    color="#a51f07"
    collection="taxes"
    :items="store.taxes"
    :selected-ids="store.selectedTaxIds"
    @update:selected-ids="store.selectedTaxIds = $event"
    @open-add="$emit('open-add')"
    @edit="(id) => $emit('edit', id)"
  >
    <!-- ATO tax calculator panel below the table -->
    <div class="tax-calc">
      <h3 class="serif">ATO Tax Estimate — {{ store.selectedYear }}</h3>
      <div class="calc-toggle">
        <button :class="{ active: !soleTrader }" @click="soleTrader = false">TFN Employee</button>
        <button :class="{ active: soleTrader }" @click="soleTrader = true">Sole Trader</button>
      </div>
      <div class="calc-rows">
        <div class="calc-row"><span>Gross Income</span><span>${{ yearIncome.toFixed(2) }}</span></div>
        <div v-if="soleTrader" class="calc-row"><span>Business Expenses (deductible)</span><span>-${{ yearExpenses.toFixed(2) }}</span></div>
        <div class="calc-row"><span>Taxable Income</span><span class="strong">${{ taxableIncome.toFixed(2) }}</span></div>
        <div class="calc-row"><span>Estimated Tax</span><span>-${{ estimatedTax.toFixed(2) }}</span></div>
        <div class="calc-row"><span>Medicare Levy (2%)</span><span>-${{ medicare.toFixed(2) }}</span></div>
        <div class="calc-row"><span>Tax Paid (entered above)</span><span>${{ taxPaid.toFixed(2) }}</span></div>
        <div class="calc-row result" :class="{ refund: balance >= 0 }">
          <span>{{ balance >= 0 ? 'Estimated Refund' : 'Estimated Owing' }}</span>
          <span>${{ Math.abs(balance).toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </EntryTableView>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import EntryTableView from './EntryTableView.vue'

defineEmits(['open-add', 'edit'])
const store = useAppStore()
const soleTrader = ref(false)

const yearIncome = computed(() =>
  store.income.filter((e) => new Date(e.date).getFullYear() === store.selectedYear).reduce((s, e) => s + e.amount, 0),
)
const yearExpenses = computed(() =>
  store.expenses.filter((e) => new Date(e.date).getFullYear() === store.selectedYear).reduce((s, e) => s + e.amount, 0),
)
const taxableIncome = computed(() => Math.max(0, yearIncome.value - (soleTrader.value ? yearExpenses.value : 0)))
const taxPaid = computed(() =>
  store.taxes.filter((e) => new Date(e.date).getFullYear() === store.selectedYear).reduce((s, e) => s + e.amount, 0),
)

function calcTax(income) {
  if (income <= 18200) return 0
  if (income <= 45000) return (income - 18200) * 0.19
  if (income <= 120000) return 5092 + (income - 45000) * 0.325
  if (income <= 180000) return 29467 + (income - 120000) * 0.37
  return 51667 + (income - 180000) * 0.45
}

const estimatedTax = computed(() => calcTax(taxableIncome.value))
const medicare = computed(() => taxableIncome.value * 0.02)
const balance = computed(() => taxPaid.value - estimatedTax.value - medicare.value)
</script>

<style scoped>
.serif { font-family: 'DM Serif Display', serif; margin: 0; }
.tax-calc { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; }
.tax-calc h3 { margin-bottom: 1rem; font-size: 1.2rem; }
.calc-toggle { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
.calc-toggle button { padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface2); font-family: 'DM Sans', sans-serif; font-size: 0.85rem; cursor: pointer; color: var(--muted); transition: all 0.15s; }
.calc-toggle button.active { background: var(--accent); color: #0f0f0f; border-color: var(--accent); font-weight: 600; }
.calc-rows { display: flex; flex-direction: column; gap: 0.6rem; }
.calc-row { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.4rem 0; border-bottom: 1px solid var(--border); }
.calc-row .strong { font-weight: 600; }
.calc-row.result { border-bottom: none; font-weight: 700; font-size: 1rem; padding-top: 0.75rem; border-top: 2px solid var(--border); color: #a51f07; }
.calc-row.result.refund { color: #368a1c; }
</style>
