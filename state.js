// ─── FIREBASE ───────────────────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export {
  initializeApp, getFirestore, getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  setDoc, doc, getDoc, collection, addDoc, getDocs, deleteDoc
};

// ─── FIREBASE MODULE STATE ──────────────────────────────────────────────────
export let db = null;
export let auth = null;
export let isFirebase = false;
export let currentUserId = null;
export let currentUserProfile = null;

export function setDb(v) { db = v; }
export function setAuth(v) { auth = v; }
export function setIsFirebase(v) { isFirebase = v; }
export function setCurrentUserId(v) { currentUserId = v; }
export function setCurrentUserProfile(v) { currentUserProfile = v; }

// ─── STATE ───────────────────────────────────────────────────────────────────
export const COLORS = ['#60a5fa','#34d399','#f472b6','#a78bfa','#fb923c','#fbbf24','#38bdf8','#f87171','#4ade80','#e879f9','#a8a29e','#22d3ee','#818cf8','#fb7185','#451a03','#d4a373','#b45309'];
export const DEFAULT_TABS = [
  {id:'housing', name:'Housing', color:'#60a5fa'},
  {id:'food', name:'Food & Groceries', color:'#34d399'},
  {id:'transport', name:'Transport', color:'#f472b6'},
  {id:'subscriptions', name:'Subscriptions', color:'#a78bfa'},
  {id:'health', name:'Health', color:'#a8a29e'},
];

export const state = {
  tabs: [],
  expenses: [],
  income: [],
  taxes: [],
  super: [],
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
};

export function saveLocal() {
  if (!currentUserId) return;
  localStorage.setItem(`spendly_state_${currentUserId}`, JSON.stringify({tabs: state.tabs, expenses: state.expenses, income: state.income, taxes: state.taxes, super: state.super}));
}

// ─── PER-USER FIRESTORE PATH HELPERS ────────────────────────────────────────
function ucol(name) { return collection(db, 'users', currentUserId, name); }
function udoc(name, id) { return doc(db, 'users', currentUserId, name, id); }

export async function loadFromFirebase() {
  state.tabs = [];
  state.expenses = [];
  state.income = [];
  state.taxes = [];
  state.super = [];
  const tabsSnap = await getDocs(ucol('tabs'));
  tabsSnap.forEach(d => state.tabs.push({...d.data(), id: d.id}));
  const expSnap = await getDocs(ucol('expenses'));
  expSnap.forEach(d => state.expenses.push({...d.data(), id: d.id}));
  // Restore income, taxes, super from localStorage (local-only for now)
  try {
    const raw = localStorage.getItem(`spendly_state_${currentUserId}`);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.income)) state.income = data.income;
      if (Array.isArray(data.taxes)) state.taxes = data.taxes;
      if (Array.isArray(data.super)) state.super = data.super;
    }
  } catch (_) {}
}

export async function fbSaveTab(tab) {
  if (!isFirebase || !currentUserId) return;
  await setDoc(udoc('tabs', tab.id), tab);
}
export async function fbSaveExpense(exp) {
  if (!isFirebase || !currentUserId) return;
  const { id: _localId, ...data } = exp;
  const ref = await addDoc(ucol('expenses'), data);
  exp.id = ref.id;
}
export async function fbDeleteExpense(id) {
  if (!isFirebase || !currentUserId) return;
  await deleteDoc(udoc('expenses', id));
}
export async function fbDeleteTab(id) {
  if (!isFirebase || !currentUserId) return;
  await deleteDoc(udoc('tabs', id));
}
export async function fbUpdateExpense(expense) {
  if (!isFirebase || !currentUserId) return;
  await setDoc(udoc('expenses', expense.id), expense);
}

// ─── HELPERS FOR MONTH FILTERING ─────────────────────────────────────────────
export const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function getMonthDisplayName(month, year) {
  return `${monthNames[month]} ${year}`;
}

export function getMonthFirstDay(month, year) {
  const day = String(1).padStart(2, '0');
  const m = String(month + 1).padStart(2, '0');
  return `${year}-${m}-${day}`;
}

export function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export function filterByMonth(expenses, month, year) {
  return expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

// ─── SHARED UI HELPERS ──────────────────────────────────────────────────────
export function populateCategorySelect(id) {
  const sel = document.getElementById(id);
  sel.innerHTML = '';
  state.tabs.forEach(t => {
    const o = document.createElement('option');
    o.value = t.id; o.textContent = t.name;
    sel.appendChild(o);
  });
  if (state.activeTab !== 'overview') sel.value = state.activeTab;
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
