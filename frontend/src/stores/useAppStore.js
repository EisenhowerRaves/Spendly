import { defineStore } from 'pinia'
import { db, auth } from '@/firebase'
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
  },
})
