import { defineStore } from 'pinia'
import { db, auth } from '@/firebase'
import { signOut } from 'firebase/auth'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore'

export const COLORS = [
  '#60a5fa',
  '#34d399',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
  '#fbbf24',
  '#38bdf8',
  '#f87171',
  '#4ade80',
  '#e879f9',
  '#a8a29e',
  '#22d3ee',
  '#818cf8',
  '#fb7185',
  '#451a03',
  '#d4a373',
  '#b45309',
]

export const DEFAULT_TABS = [
  { id: 'housing', name: 'Housing', color: '#60a5fa' },
  { id: 'food', name: 'Food & Groceries', color: '#34d399' },
  { id: 'transport', name: 'Transport', color: '#f472b6' },
  { id: 'subscriptions', name: 'Subscriptions', color: '#a78bfa' },
  { id: 'health', name: 'Health', color: '#a8a29e' },
]

export const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

export function filterByMonth(items, month, year) {
  return items.filter((e) => {
    const d = new Date(e.date)
    return d.getMonth() === month && d.getFullYear() === year
  })
}

export function getMonthDisplayName(month, year) {
  return `${monthNames[month]} ${year}`
}

export function getMonthFirstDay(month, year) {
  const day = String(1).padStart(2, '0')
  const m = String(month + 1).padStart(2, '0')
  return `${year}-${m}-${day}`
}

export function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

export const useAppStore = defineStore('app', {
  state: () => ({
    tabs: [],
    expenses: [],
    income: [],
    taxes: [],
    superannuation: [],
    activeTab: 'overview',
    selectedColor: COLORS[0],
    pendingCSV: [],
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
    selectedExpenseIds: [],
    selectedIncomeIds: [],
    selectedTaxIds: [],
    selectedSuperIds: [],
    editingExpenseId: null,

    currentUserId: null,
    currentUserProfile: null,
    isFirebase: true,
  }),

  getters: {
    monthLabel(state) {
      return getMonthDisplayName(state.selectedMonth, state.selectedYear)
    },
    monthExpenses(state) {
      return filterByMonth(state.expenses, state.selectedMonth, state.selectedYear)
    },
    monthIncome(state) {
      return filterByMonth(state.income, state.selectedMonth, state.selectedYear)
    },
    monthTaxes(state) {
      return filterByMonth(state.taxes, state.selectedMonth, state.selectedYear)
    },
    monthSuper(state) {
      return filterByMonth(state.superannuation, state.selectedMonth, state.selectedYear)
    },

    thisMonthTotal(state) {
      return filterByMonth(state.expenses, state.selectedMonth, state.selectedYear).reduce(
        (s, e) => s + e.amount,
        0,
      )
    },
    incomeThisMonth(state) {
      return filterByMonth(state.income, state.selectedMonth, state.selectedYear).reduce(
        (s, e) => s + e.amount,
        0,
      )
    },
    taxesThisMonth(state) {
      return filterByMonth(state.taxes, state.selectedMonth, state.selectedYear).reduce(
        (s, e) => s + e.amount,
        0,
      )
    },
    netIncomeThisMonth() {
      return this.incomeThisMonth - this.taxesThisMonth
    },
    topCategory(state) {
      const me = filterByMonth(state.expenses, state.selectedMonth, state.selectedYear)
      return state.tabs
        .map((t) => ({
          ...t,
          total: me.filter((e) => e.tabId === t.id).reduce((s, e) => s + e.amount, 0),
        }))
        .sort((a, b) => b.total - a.total)[0]
    },
    categoryBreakdown(state) {
      const me = filterByMonth(state.expenses, state.selectedMonth, state.selectedYear)
      const total = Math.max(1, me.reduce((s, e) => s + e.amount, 0))
      return state.tabs.map((tab) => {
        const catTotal = me.filter((e) => e.tabId === tab.id).reduce((s, e) => s + e.amount, 0)
        return { ...tab, total: catTotal, pct: Math.min(100, (catTotal / total) * 100) }
      })
    },
    recentTransactions(state) {
      const me = filterByMonth(state.expenses, state.selectedMonth, state.selectedYear)
      return [...me].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
    },
    yearExpensesTotal(state) {
      return state.expenses
        .filter((e) => new Date(e.date).getFullYear() === state.selectedYear)
        .reduce((s, e) => s + e.amount, 0)
    },
    yearNetIncome(state) {
      const y = state.selectedYear
      const yi = state.income
        .filter((e) => new Date(e.date).getFullYear() === y)
        .reduce((s, e) => s + e.amount, 0)
      const yt = state.taxes
        .filter((e) => new Date(e.date).getFullYear() === y)
        .reduce((s, e) => s + e.amount, 0)
      return yi - yt
    },
    monthlyExpensesForYear(state) {
      const ye = state.expenses.filter((e) => new Date(e.date).getFullYear() === state.selectedYear)
      return Array.from({ length: 12 }, (_, m) =>
        ye.filter((e) => new Date(e.date).getMonth() === m).reduce((s, e) => s + e.amount, 0),
      )
    },
    sidebarTabs(state) {
      const me = filterByMonth(state.expenses, state.selectedMonth, state.selectedYear)
      return state.tabs.map((tab) => ({
        ...tab,
        total: me.filter((e) => e.tabId === tab.id).reduce((s, e) => s + e.amount, 0),
      }))
    },
  },

  actions: {
    // ─── Per-user Firestore path helpers ──────────────────────────────
    _ucol(name) {
      return collection(db, 'users', this.currentUserId, name)
    },
    _udoc(name, id) {
      return doc(db, 'users', this.currentUserId, name, id)
    },

    // ─── Load / Save ─────────────────────────────────────────────────
    async loadFromFirebase() {
      this.tabs = []
      this.expenses = []
      this.income = []
      this.taxes = []
      this.superannuation = []

      const tabsSnap = await getDocs(this._ucol('tabs'))
      tabsSnap.forEach((d) => this.tabs.push({ ...d.data(), id: d.id }))

      const expSnap = await getDocs(this._ucol('expenses'))
      expSnap.forEach((d) => this.expenses.push({ ...d.data(), id: d.id }))

      // Income, taxes, super are local-only for now
      this.loadLocalForUser()
    },

    loadLocalForUser() {
      try {
        const raw = localStorage.getItem(`spendly_state_${this.currentUserId}`)
        if (raw) {
          const data = JSON.parse(raw)
          if (Array.isArray(data.income)) this.income = data.income
          if (Array.isArray(data.taxes)) this.taxes = data.taxes
          if (Array.isArray(data.super)) this.superannuation = data.super
        }
      } catch (_) {
        /* ignore parse errors */
      }
    },

    saveLocal() {
      if (!this.currentUserId) return
      localStorage.setItem(
        `spendly_state_${this.currentUserId}`,
        JSON.stringify({
          tabs: this.tabs,
          expenses: this.expenses,
          income: this.income,
          taxes: this.taxes,
          super: this.superannuation,
        }),
      )
    },

    // ─── Firebase CRUD ───────────────────────────────────────────────
    async fbSaveTab(tab) {
      if (!this.isFirebase || !this.currentUserId) return
      await setDoc(this._udoc('tabs', tab.id), tab)
    },

    async fbSaveExpense(exp) {
      if (!this.isFirebase || !this.currentUserId) return
      const { id: _localId, ...data } = exp
      const ref = await addDoc(this._ucol('expenses'), data)
      exp.id = ref.id
    },

    async fbDeleteExpense(id) {
      if (!this.isFirebase || !this.currentUserId) return
      await deleteDoc(this._udoc('expenses', id))
    },

    async fbDeleteTab(id) {
      if (!this.isFirebase || !this.currentUserId) return
      await deleteDoc(this._udoc('tabs', id))
    },

    async fbUpdateExpense(expense) {
      if (!this.isFirebase || !this.currentUserId) return
      await setDoc(this._udoc('expenses', expense.id), expense)
    },

    // ─── Expense CRUD ─────────────────────────────────────────────
    async addExpense(expense) {
      this.expenses.push(expense)
      await this.fbSaveExpense(expense)
      this.saveLocal()
    },
    async updateExpense(expense) {
      const idx = this.expenses.findIndex((e) => e.id === expense.id)
      if (idx !== -1) this.expenses[idx] = { ...expense }
      await this.fbUpdateExpense(expense)
      this.saveLocal()
    },
    async deleteExpenses(ids) {
      for (const id of ids) {
        this.expenses = this.expenses.filter((e) => e.id !== id)
        await this.fbDeleteExpense(id)
      }
      this.selectedExpenseIds = []
      this.saveLocal()
    },
    async copyExpenses(ids, targetTabId, date, amount) {
      const copied = []
      for (const id of ids) {
        const orig = this.expenses.find((e) => e.id === id)
        if (!orig) continue
        const dup = {
          id: crypto.randomUUID(),
          desc: orig.desc,
          amount: amount !== null && !isNaN(amount) ? amount : orig.amount,
          tabId: targetTabId,
          date,
          note: orig.note || '',
        }
        this.expenses.push(dup)
        await this.fbSaveExpense(dup)
        copied.push(dup)
      }
      this.selectedExpenseIds = []
      this.saveLocal()
      return copied.length
    },

    // ─── Income CRUD (local-only) ──────────────────────────────
    addIncome(entry) {
      this.income.push(entry)
      this.saveLocal()
    },
    updateIncome(entry) {
      const idx = this.income.findIndex((e) => e.id === entry.id)
      if (idx !== -1) this.income[idx] = { ...entry }
      this.saveLocal()
    },
    deleteIncomes(ids) {
      this.income = this.income.filter((e) => !ids.includes(e.id))
      this.selectedIncomeIds = []
      this.saveLocal()
    },

    // ─── Taxes CRUD (local-only) ────────────────────────────────
    addTax(entry) {
      this.taxes.push(entry)
      this.saveLocal()
    },
    updateTax(entry) {
      const idx = this.taxes.findIndex((e) => e.id === entry.id)
      if (idx !== -1) this.taxes[idx] = { ...entry }
      this.saveLocal()
    },
    deleteTaxes(ids) {
      this.taxes = this.taxes.filter((e) => !ids.includes(e.id))
      this.selectedTaxIds = []
      this.saveLocal()
    },

    // ─── Super CRUD (local-only) ────────────────────────────────
    addSuper(entry) {
      this.superannuation.push(entry)
      this.saveLocal()
    },
    updateSuper(entry) {
      const idx = this.superannuation.findIndex((e) => e.id === entry.id)
      if (idx !== -1) this.superannuation[idx] = { ...entry }
      this.saveLocal()
    },
    deleteSupers(ids) {
      this.superannuation = this.superannuation.filter((e) => !ids.includes(e.id))
      this.selectedSuperIds = []
      this.saveLocal()
    },

    // ─── Category CRUD ──────────────────────────────────────────
    async createTab(name, color) {
      const tab = { id: crypto.randomUUID(), name, color }
      this.tabs.push(tab)
      await this.fbSaveTab(tab)
      this.saveLocal()
      return tab
    },
    async deleteCategories(ids) {
      for (const id of ids) {
        const exps = this.expenses.filter((e) => e.tabId === id)
        this.tabs = this.tabs.filter((t) => t.id !== id)
        this.expenses = this.expenses.filter((e) => e.tabId !== id)
        if (this.isFirebase) {
          for (const exp of exps) this.fbDeleteExpense(exp.id).catch(() => {})
          this.fbDeleteTab(id).catch(() => {})
        }
      }
      if (ids.includes(this.activeTab)) this.activeTab = 'overview'
      this.saveLocal()
    },

    async renameCategory(tabId, newName) {
      const tab = this.tabs.find((t) => t.id === tabId)
      if (!tab) return
      tab.name = newName
      await this.fbSaveTab(tab)
      this.saveLocal()
    },

    // ─── Month navigation ───────────────────────────────────────────
    prevMonth() {
      if (this.selectedMonth === 0) {
        this.selectedMonth = 11
        this.selectedYear--
      } else {
        this.selectedMonth--
      }
    },
    nextMonth() {
      if (this.selectedMonth === 11) {
        this.selectedMonth = 0
        this.selectedYear++
      } else {
        this.selectedMonth++
      }
    },

    // ─── AI summary ────────────────────────────────────────────────
    getExpenseSummary() {
      const total = this.expenses.reduce((s, e) => s + e.amount, 0)
      const now = new Date()
      const thisMonth = this.expenses
        .filter((e) => {
          const d = new Date(e.date)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        .reduce((s, e) => s + e.amount, 0)
      const byTab = this.tabs.map((t) => ({
        category: t.name,
        total: this.expenses.filter((e) => e.tabId === t.id).reduce((s, e) => s + e.amount, 0),
        count: this.expenses.filter((e) => e.tabId === t.id).length,
      }))
      const recent = [...this.expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map((e) => ({
          desc: e.desc,
          amount: e.amount,
          date: e.date,
          category: this.tabs.find((t) => t.id === e.tabId)?.name,
        }))
      return JSON.stringify({
        totalAllTime: total.toFixed(2),
        thisMonth: thisMonth.toFixed(2),
        categories: byTab,
        recentTransactions: recent,
        totalTransactions: this.expenses.length,
      })
    },

    // ─── CSV Export ──────────────────────────────────────────────
    exportCSV() {
      const me = filterByMonth(this.expenses, this.selectedMonth, this.selectedYear)
      const activeTab = this.tabs.find((t) => t.id === this.activeTab)
      const list = activeTab ? me.filter((e) => e.tabId === activeTab.id) : me
      if (list.length === 0) return 0
      const esc = (v) => {
        const s = String(v ?? '')
        return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
      }
      const lines = [['Date', 'Description', 'Amount', 'Category', 'Note'].map(esc).join(',')]
      for (const e of [...list].sort((a, b) => new Date(a.date) - new Date(b.date))) {
        const cat = this.tabs.find((t) => t.id === e.tabId)?.name || ''
        lines.push([e.date, e.desc, e.amount.toFixed(2), cat, e.note || ''].map(esc).join(','))
      }
      const label = getMonthDisplayName(this.selectedMonth, this.selectedYear).replace(/\s+/g, '-')
      const scope = activeTab ? activeTab.name.replace(/[^\w.-]+/g, '-') : 'All-Categories'
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Spendly-${label}-${scope}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2500)
      return list.length
    },

    // ─── Logout ──────────────────────────────────────────────────────
    async logout() {
      localStorage.removeItem('spendly_user')
      localStorage.removeItem('spendly_state')
      Object.keys(localStorage)
        .filter((k) => k.startsWith('spendly_'))
        .forEach((k) => localStorage.removeItem(k))
      await signOut(auth)
      this.currentUserId = null
      this.currentUserProfile = null
      this.tabs = []
      this.expenses = []
      this.income = []
      this.taxes = []
      this.superannuation = []
      this.activeTab = 'overview'
      this.selectedExpenseIds = []
      this.selectedIncomeIds = []
      this.selectedTaxIds = []
      this.selectedSuperIds = []
    },
  },
})
