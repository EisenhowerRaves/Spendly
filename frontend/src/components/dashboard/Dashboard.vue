<template>
  <div>
    <!-- YEARLY OVERVIEW -->
    <div class="year-card">
      <div class="year-card-inner">
        <div class="year-summary">
          <h2 class="serif-heading" style="margin-bottom: 0.75rem">
            Financial Overview – {{ store.selectedYear }}
          </h2>
          <div class="year-stats">
            <div><strong>Total Net Income:</strong> ${{ store.yearNetIncome.toFixed(2) }}</div>
            <div><strong>Total Expenses:</strong> ${{ store.yearExpensesTotal.toFixed(2) }}</div>
          </div>
        </div>
        <div class="year-chart-wrap">
          <div class="year-chart-box">
            <div class="year-chart-header">
              <span style="font-weight: 600">Expenses for each month</span>
              <span style="color: var(--muted); font-size: 0.8rem"
                >Current year {{ store.selectedYear }}</span
              >
            </div>
            <div class="year-bars">
              <div v-for="(val, idx) in store.monthlyExpensesForYear" :key="idx" class="bar-col">
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{
                      height: barPct(val) + '%',
                      background: barColor(val, idx),
                    }"
                  />
                </div>
                <span>{{ shortMonths[idx] }}</span>
                <span class="bar-val">${{ val.toFixed(0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MONTH SELECTOR -->
    <div class="month-nav">
      <button class="month-arrow" @click="store.prevMonth()">
        <ChevronLeft :size="20" />
      </button>
      <h2 class="serif-heading month-label">{{ store.monthLabel }}</h2>
      <button class="month-arrow" @click="store.nextMonth()">
        <ChevronRight :size="20" />
      </button>
    </div>

    <!-- STAT CARDS -->
    <div class="overview-grid">
      <div class="stat-card" style="--c: #368a1c">
        <div class="card-bar" />
        <div class="stat-label">Income this Month</div>
        <div class="stat-value">${{ store.netIncomeThisMonth.toFixed(0) }}</div>
        <div class="stat-sub">
          Income ${{ store.incomeThisMonth.toFixed(0) }} · Taxes
          ${{ store.taxesThisMonth.toFixed(0) }}
        </div>
      </div>
      <div class="stat-card" :style="{ '--c': topCatColor }">
        <div class="card-bar" />
        <div class="stat-label">This Month (Expenses)</div>
        <div class="stat-value">${{ store.thisMonthTotal.toFixed(0) }}</div>
        <div class="stat-sub">{{ store.monthExpenses.length }} transactions this month</div>
      </div>
      <div class="stat-card" :style="{ '--c': topCatColor }">
        <div class="card-bar" :style="{ background: topCatColor }" />
        <div class="stat-label">Top Category</div>
        <div class="stat-value" style="font-size: 1.1rem; margin-top: 0.25rem">
          {{ store.topCategory?.name || 'None' }}
        </div>
        <div class="stat-sub">${{ store.topCategory?.total?.toFixed(0) || 0 }}</div>
      </div>
    </div>

    <!-- CATEGORY BREAKDOWN -->
    <div class="breakdown-card">
      <h3 class="serif-heading" style="margin-bottom: 1.25rem; font-size: 1.2rem">
        Category Breakdown
      </h3>
      <div v-for="cat in store.categoryBreakdown" :key="cat.id" class="breakdown-row">
        <div class="breakdown-labels">
          <span>{{ cat.name }}</span>
          <span style="color: var(--muted)">${{ cat.total.toFixed(2) }}</span>
        </div>
        <div class="breakdown-track">
          <div
            class="breakdown-fill"
            :style="{ background: cat.color, width: cat.pct + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- RECENT TRANSACTIONS -->
    <h3 class="serif-heading" style="font-size: 1.2rem; margin-bottom: 1rem">
      Recent Transactions
    </h3>
    <div class="expense-table-wrap">
      <table class="expense-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Category</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.recentTransactions.length === 0">
            <td colspan="4">
              <div class="empty-state">
                <span>
                  <BanknoteArrowUp :size="32" />
                </span>
                No expenses this month. Add your first one!
              </div>
            </td>
          </tr>
          <tr v-for="exp in store.recentTransactions" :key="exp.id">
            <td>
              {{ exp.desc }}
              <div v-if="exp.note" class="expense-note">{{ exp.note }}</div>
            </td>
            <td>
              <span class="cat-badge">
                <span
                  class="cat-dot"
                  :style="{ background: tabFor(exp)?.color || '#888' }"
                />
                {{ tabFor(exp)?.name || 'Unknown' }}
              </span>
            </td>
            <td class="expense-date">{{ formatDate(exp.date) }}</td>
            <td class="expense-amount" style="color: var(--accent)">
              ${{ exp.amount.toFixed(2) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore, formatDate } from '@/stores/useAppStore'
import { ChevronLeft, ChevronRight, BanknoteArrowUp } from 'lucide-vue-next'

const store = useAppStore()

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const topCatColor = computed(() => store.topCategory?.color || '#e8ff47')

const maxMonthly = computed(() => Math.max(1, ...store.monthlyExpensesForYear))
const maxMonthIdx = computed(() =>
  store.monthlyExpensesForYear.reduce(
    (best, v, i) => (v > store.monthlyExpensesForYear[best] ? i : best),
    0,
  ),
)

function barPct(val) {
  return Math.max(3, (val / maxMonthly.value) * 100)
}
function barColor(val, idx) {
  if (val > 0 && idx === maxMonthIdx.value) return '#dc2626'
  if (val > 0) return 'var(--accent)'
  return 'rgba(143,179,0,0.25)'
}
function tabFor(exp) {
  return store.tabs.find((t) => t.id === exp.tabId)
}
</script>

<style scoped>
.serif-heading {
  font-family: 'DM Serif Display', serif;
  margin: 0;
}

/* YEARLY OVERVIEW */
.year-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.75rem;
}
.year-card-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 1.75rem;
  align-items: flex-start;
  justify-content: space-between;
}
.year-summary {
  min-width: 220px;
  flex: 1;
}
.year-summary h2 {
  font-size: 1.4rem;
}
.year-stats {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
}
.year-chart-wrap {
  flex: 2;
  min-width: 260px;
}
.year-chart-box {
  border-radius: 12px;
  background: var(--surface3);
  padding: 1rem 1.25rem;
}
.year-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}
.year-bars {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.7rem;
}
.bar-track {
  height: 120px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
}
.bar-fill {
  width: 8px;
  border-radius: 999px;
  transition: height 0.3s;
}
.bar-val {
  color: var(--muted);
  font-size: 0.7rem;
}

/* MONTH NAV */
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

/* STAT CARDS */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
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
  background: var(--c);
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

/* CATEGORY BREAKDOWN */
.breakdown-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.breakdown-row {
  margin-bottom: 1rem;
}
.breakdown-row:last-child {
  margin-bottom: 0;
}
.breakdown-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.35rem;
  font-size: 0.85rem;
}
.breakdown-track {
  background: var(--surface3);
  border-radius: 4px;
  height: 6px;
}
.breakdown-fill {
  height: 6px;
  border-radius: 4px;
  transition: width 0.5s;
}

/* EXPENSE TABLE */
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
.cat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text);
}
.cat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .expense-table-wrap {
    overflow-x: auto;
  }
  .expense-table {
    min-width: 420px;
  }
}
</style>
