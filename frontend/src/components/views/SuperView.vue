<template>
  <EntryTableView
    title="Super"
    color="#2563eb"
    collection="super"
    :items="store.superannuation"
    :selected-ids="store.selectedSuperIds"
    @update:selected-ids="store.selectedSuperIds = $event"
    @open-add="$emit('open-add')"
    @edit="(id) => $emit('edit', id)"
  >
    <div class="super-calc">
      <h3 class="serif">SGC Estimate — {{ store.selectedYear }}</h3>
      <div class="calc-rows">
        <div class="calc-row"><span>Gross Income (year)</span><span>${{ yearIncome.toFixed(2) }}</span></div>
        <div class="calc-row"><span>SGC Rate</span><span>11.5%</span></div>
        <div class="calc-row"><span>Expected Employer Super</span><span class="strong">${{ expectedSuper.toFixed(2) }}</span></div>
        <div class="calc-row"><span>Super Received (entered above)</span><span>${{ superReceived.toFixed(2) }}</span></div>
        <div class="calc-row result" :class="{ ok: diff >= 0 }">
          <span>{{ diff >= 0 ? 'On Track' : 'Shortfall' }}</span>
          <span>${{ Math.abs(diff).toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </EntryTableView>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'
import EntryTableView from './EntryTableView.vue'

defineEmits(['open-add', 'edit'])
const store = useAppStore()

const yearIncome = computed(() =>
  store.income.filter((e) => new Date(e.date).getFullYear() === store.selectedYear).reduce((s, e) => s + e.amount, 0),
)
const expectedSuper = computed(() => yearIncome.value * 0.115)
const superReceived = computed(() =>
  store.superannuation.filter((e) => new Date(e.date).getFullYear() === store.selectedYear).reduce((s, e) => s + e.amount, 0),
)
const diff = computed(() => superReceived.value - expectedSuper.value)
</script>

<style scoped>
.serif { font-family: 'DM Serif Display', serif; margin: 0; }
.super-calc { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; }
.super-calc h3 { margin-bottom: 1rem; font-size: 1.2rem; }
.calc-rows { display: flex; flex-direction: column; gap: 0.6rem; }
.calc-row { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.4rem 0; border-bottom: 1px solid var(--border); }
.calc-row .strong { font-weight: 600; }
.calc-row.result { border-bottom: none; font-weight: 700; font-size: 1rem; padding-top: 0.75rem; border-top: 2px solid var(--border); color: #a51f07; }
.calc-row.result.ok { color: #368a1c; }
</style>
