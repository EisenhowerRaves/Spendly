// #region agent log
const __dbgRunId = 'pre-fix';
function __dbgLog(hypothesisId, location, message, data) {
  try {
    try {
      const el = document.getElementById('agent-debug-log');
      if (el) {
        const line = JSON.stringify({ sessionId: '9f51e0', runId: __dbgRunId, hypothesisId, location, message, data, timestamp: Date.now() });
        el.textContent += (el.textContent ? '\n' : '') + line;
      }
    } catch (_) {}
    fetch('http://127.0.0.1:7313/ingest/d28f7232-67de-44f2-b7cd-d97b24cb39e8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '9f51e0' },
      body: JSON.stringify({ sessionId: '9f51e0', runId: __dbgRunId, hypothesisId, location, message, data, timestamp: Date.now() })
    }).catch(() => {});
  } catch (_) {}
}
window.addEventListener('error', (e) => {
  __dbgLog('H4', 'expense-tracker.html:global_error', 'window.error', {
    message: e?.message,
    filename: e?.filename,
    lineno: e?.lineno,
    colno: e?.colno
  });
});
window.addEventListener('unhandledrejection', (e) => {
  __dbgLog('H4', 'expense-tracker.html:global_unhandledrejection', 'window.unhandledrejection', {
    reason: String(e?.reason ?? '')
  });
});
// #endregion agent log

// ─── MODULE IMPORTS ──────────────────────────────────────────────────────────
import {
  state, auth, db, saveLocal,
  initializeApp, getFirestore, getAuth, onAuthStateChanged, getDoc, doc,
  setDb, setAuth, setIsFirebase, setCurrentUserId, setCurrentUserProfile,
  loadFromFirebase, fbSaveExpense,
  isFirebase, filterByMonth, getMonthDisplayName, populateCategorySelect, showToast
} from './state.js';
import { renderSidebar, renderContent } from './render.js';
import { showAuthScreen, launchApp } from './auth.js';

// Side-effect imports: each module registers its window.xxx handlers on load
import './expenses.js';
import './categories.js';
import './taxes.js';

// ─── INIT FIREBASE ────────────────────────────────────────────────────────────
async function initApp() {
  // #region agent log
  __dbgLog('H1', 'expense-tracker.html:initApp', 'initApp.start', {
    href: location.href,
    ua: navigator.userAgent
  });
  // #endregion agent log

  const apiKey = 'AIzaSyDbL7xNxPTCx3EqhUA2zyPlWQApdBmm-W0';
  const authDomain = 'spendly-ff40a.firebaseapp.com';
  const projectId = 'spendly-ff40a';
  const appId = '1:552192142593:web:eb4258a229c80d45f37f00';
  try {
    const app = initializeApp({ apiKey, authDomain, projectId, appId });
    setDb(getFirestore(app));
    setAuth(getAuth(app));
    setIsFirebase(true);
    document.getElementById('fb-status-badge').className = 'fb-status connected';
    document.getElementById('fb-status-text').textContent = 'Firebase';
    // #region agent log
    __dbgLog('H1', 'expense-tracker.html:initApp', 'firebase.init.ok', {
      isFirebase: true,
      hasAuth: true,
      hasDb: true
    });
    // #endregion agent log
  } catch(e) {
    console.warn('Firebase init error:', e.message);
    // #region agent log
    __dbgLog('H1', 'expense-tracker.html:initApp', 'firebase.init.error', {
      message: e?.message,
      name: e?.name
    });
    // #endregion agent log
  }

  if (!auth || !db) {
    // #region agent log
    __dbgLog('H1', 'expense-tracker.html:initApp', 'firebase.unavailable_fallback_to_auth_screen', {
      hasAuth: !!auth,
      hasDb: !!db
    });
    // #endregion agent log
    showAuthScreen();
    return;
  }
  // #region agent log
  __dbgLog('H1', 'expense-tracker.html:initApp', 'about_to_attach_auth_listener', {
    isFirebase: true,
    authType: typeof auth,
    hasAuth: !!auth
  });
  // #endregion agent log
  try {
    onAuthStateChanged(auth, async (user) => {
      // #region agent log
      __dbgLog('H2', 'expense-tracker.html:onAuthStateChanged', 'auth_state_changed', {
        hasUser: !!user,
        uid: user?.uid || null
      });
      // #endregion agent log
    if (user) {
      setCurrentUserId(user.uid);
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      setCurrentUserProfile(profileSnap.exists() ? profileSnap.data() : {});
      await loadFromFirebase();
      launchApp();
    } else {
      // Clear any stale cached data so it never persists after account deletion
      localStorage.removeItem('spendly_user');
      localStorage.removeItem('spendly_state');
      Object.keys(localStorage)
        .filter(k => k.startsWith('spendly_'))
        .forEach(k => localStorage.removeItem(k));
      showAuthScreen();
    }
    });
  } catch (e) {
    // #region agent log
    __dbgLog('H1', 'expense-tracker.html:initApp', 'onAuthStateChanged.attach_error', {
      message: e?.message,
      name: e?.name,
      authType: typeof auth,
      hasAuth: !!auth
    });
    // #endregion agent log
    throw e;
  }
}

initApp();

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
window.openCalendarModal = function() {
  document.getElementById('calendar-modal').classList.add('open');
}
window.closeCalendarModal = function() {
  document.getElementById('calendar-modal').classList.remove('open');
}
window.selectMonth = function(monthIndex, monthName) {
  state.selectedMonth = monthIndex;
  state.selectedYear = new Date().getFullYear();
  showToast(`Selected: ${monthName}`);
  closeCalendarModal();
  renderSidebar();
  renderContent();
}
window.prevMonth = function() {
  state.selectedMonth--;
  if (state.selectedMonth < 0) {
    state.selectedMonth = 11;
    state.selectedYear--;
  }
  renderSidebar();
  renderContent();
}
window.nextMonth = function() {
  state.selectedMonth++;
  if (state.selectedMonth > 11) {
    state.selectedMonth = 0;
    state.selectedYear++;
  }
  renderSidebar();
  renderContent();
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
window.openCSVModal = function() {
  populateCategorySelect('csv-category');
  state.pendingCSV = [];
  document.getElementById('csv-preview-text').textContent = '';
  document.getElementById('csv-import-btn').style.opacity = '0.4';
  document.getElementById('csv-import-btn').style.pointerEvents = 'none';
  document.getElementById('csv-modal').classList.add('open');
}
window.closeCSVModal = function() { document.getElementById('csv-modal').classList.remove('open'); }

window.handleCSVFile = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => parseCSV(ev.target.result, file.name);
  reader.readAsText(file);
}

function parseCSVRow(line) {
  // RFC4180-ish: supports quoted fields + commas inside quotes.
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur.trim());
  return out;
}

function parseCSV(text, filename) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  const headers = (parseCSVRow(lines[0]) || []).map(h => h.trim().replace(/"/g,'').toLowerCase());
  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('narr') || h.includes('detail') || h.includes('merchant') || h === 'description');
  const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('credit'));
  const dateIdx = headers.findIndex(h => h.includes('date'));

  if (descIdx === -1 || amtIdx === -1) {
    document.getElementById('csv-preview-text').textContent = '⚠ Could not find required columns. Make sure CSV has Date, Description, Amount columns.';
    return;
  }

  state.pendingCSV = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = (parseCSVRow(lines[i]) || []).map(c => c.trim().replace(/"/g,''));
    if (!cols[descIdx] || !cols[amtIdx]) continue;
    const amt = Math.abs(parseFloat(cols[amtIdx].replace(/[^0-9.-]/g,'')));
    if (isNaN(amt) || amt === 0) continue;
    let date = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().split('T')[0];
    // try to normalise date
    try { const d = new Date(date); if (!isNaN(d)) date = d.toISOString().split('T')[0]; } catch(e){}
    state.pendingCSV.push({ desc: cols[descIdx], amount: amt, date, note: '', id: crypto.randomUUID() });
  }

  document.getElementById('csv-preview-text').textContent = `✓ Found ${state.pendingCSV.length} transactions in "${filename}"`;
  document.getElementById('csv-import-btn').style.opacity = '1';
  document.getElementById('csv-import-btn').style.pointerEvents = 'all';
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function downloadTextFile(text, filename, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

window.exportCSV = function() {
  const monthExpenses = filterByMonth(state.expenses, state.selectedMonth, state.selectedYear);
  const activeTabObj = state.tabs.find(t => t.id === state.activeTab);
  const exportExpenses = activeTabObj ? monthExpenses.filter(e => e.tabId === activeTabObj.id) : monthExpenses;

  if (exportExpenses.length === 0) {
    showToast('No expenses to export for this month');
    return;
  }

  const lines = [];
  lines.push(['Date', 'Description', 'Amount', 'Category', 'Note'].map(csvEscape).join(','));
  for (const e of [...exportExpenses].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    const category = state.tabs.find(t => t.id === e.tabId)?.name || '';
    lines.push([e.date, e.desc, e.amount.toFixed(2), category, e.note || ''].map(csvEscape).join(','));
  }

  const monthLabel = getMonthDisplayName(state.selectedMonth, state.selectedYear).replace(/\s+/g, '-');
  const scope = activeTabObj ? activeTabObj.name.replace(/[^\w.-]+/g, '-') : 'All-Categories';
  downloadTextFile(lines.join('\n'), `Spendly-${monthLabel}-${scope}.csv`, 'text/csv;charset=utf-8');
  showToast(`Exported ${exportExpenses.length} expense(s) ✓`);
}

window.importCSV = async function() {
  const tabId = document.getElementById('csv-category').value;
  for (const exp of state.pendingCSV) {
    exp.tabId = tabId;
    state.expenses.push(exp);
    if (isFirebase) await fbSaveExpense(exp);
  }
  saveLocal();
  closeCSVModal();
  renderSidebar();
  renderContent();
  showToast(`Imported ${state.pendingCSV.length} transactions ✓`);
}

// drag/drop
document.getElementById('csv-drop').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
document.getElementById('csv-drop').addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
document.getElementById('csv-drop').addEventListener('drop', e => {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) { const r = new FileReader(); r.onload = ev => parseCSV(ev.target.result, file.name); r.readAsText(file); }
});

// ─── AI CHAT ─────────────────────────────────────────────────────────────────
window.toggleChat = function() {
  const panel = document.getElementById('chat-panel');
  const isOpen = panel.classList.toggle('open');
  document.body.classList.toggle('chat-open', isOpen);
}

function getExpenseSummary() {
  const total = state.expenses.reduce((s,e)=>s+e.amount,0);
  const byTab = state.tabs.map(t => ({
    category: t.name,
    total: state.expenses.filter(e=>e.tabId===t.id).reduce((s,e)=>s+e.amount,0),
    count: state.expenses.filter(e=>e.tabId===t.id).length
  }));
  const now = new Date();
  const thisMonth = state.expenses.filter(e=>{const d=new Date(e.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).reduce((s,e)=>s+e.amount,0);
  const recent = [...state.expenses].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).map(e=>({desc:e.desc,amount:e.amount,date:e.date,category:state.tabs.find(t=>t.id===e.tabId)?.name}));
  return JSON.stringify({totalAllTime: total.toFixed(2), thisMonth: thisMonth.toFixed(2), categories: byTab, recentTransactions: recent, totalTransactions: state.expenses.length});
}

window.handleChatKey = function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }

window.sendChat = async function() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  const msgs = document.getElementById('chat-messages');
  const userEl = document.createElement('div');
  userEl.className = 'msg user';
  userEl.textContent = msg;
  msgs.appendChild(userEl);

  const loadEl = document.createElement('div');
  loadEl.className = 'msg ai loading';
  loadEl.textContent = 'Analysing your expenses...';
  msgs.appendChild(loadEl);
  msgs.scrollTop = msgs.scrollHeight;

  // Use backend proxy so the API key never appears in the browser (see server/ and SETUP.md)
  const apiBase = window.SPENDLY_AI_API || (location.protocol === 'file:' ? 'http://localhost:3000' : '');
  try {
    const summary = getExpenseSummary();
    const res = await fetch(`${apiBase}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, message: msg })
    });
    const data = await res.json();
    const reply = data.reply || data.error || 'Sorry, I had trouble processing that. Try again!';
    loadEl.classList.remove('loading');
    loadEl.textContent = reply;
  } catch(e) {
    loadEl.classList.remove('loading');
    loadEl.textContent = 'AI unavailable right now. Your expense data is saved and working fine!';
  }
  msgs.scrollTop = msgs.scrollHeight;
}

// ─── CLOSE MODALS ON OVERLAY CLICK ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  [
    'add-modal','add-income-modal','add-taxes-modal','add-super-modal','csv-modal','newtab-modal','calendar-modal','copy-expenses-modal',
    'rename-category-modal','edit-expense-modal','copy-expenses-to-category-modal',
    'delete-expenses-confirm-modal','delete-income-confirm-modal','delete-taxes-confirm-modal','delete-super-confirm-modal','delete-categories-modal','mobile-cat-sheet',
    'register-modal'
  ].forEach(id => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('open');
    });
  });
});

// ─── MOBILE BOTTOM NAV ───────────────────────────────────────────────────────
window.openMobileCatSheet = function() {
  const list = document.getElementById('mobile-cat-list');
  list.innerHTML = '';
  // Dashboard item
  const dash = document.createElement('div');
  dash.className = 'sidebar-item' + (state.activeTab === 'overview' ? ' active' : '');
  dash.innerHTML = `<div class="dot" style="background:#e8ff47"></div><span>Dashboard</span>`;
  dash.onclick = () => { closeModalSheet('mobile-cat-sheet'); switchTab('overview'); };
  list.appendChild(dash);
  // Income item
  const income = document.createElement('div');
  income.className = 'sidebar-item' + (state.activeTab === 'income' ? ' active' : '');
  income.innerHTML = `<div class="dot" style="background:#368a1c"></div><span>Income</span>`;
  income.onclick = () => { closeModalSheet('mobile-cat-sheet'); switchTab('income'); };
  list.appendChild(income);
  // Taxes item
  const taxes = document.createElement('div');
  taxes.className = 'sidebar-item' + (state.activeTab === 'taxes' ? ' active' : '');
  taxes.innerHTML = `<div class="dot" style="background:#2563eb"></div><span>Taxes</span>`;
  taxes.onclick = () => { closeModalSheet('mobile-cat-sheet'); switchTab('taxes'); };
  list.appendChild(taxes);
  // Super item
  const superEl = document.createElement('div');
  superEl.className = 'sidebar-item' + (state.activeTab === 'super' ? ' active' : '');
  superEl.innerHTML = `<div class="dot" style="background:#7c3aed"></div><span>Super</span>`;
  superEl.onclick = () => { closeModalSheet('mobile-cat-sheet'); switchTab('super'); };
  list.appendChild(superEl);
  // Category items
  state.tabs.forEach(tab => {
    const total = filterByMonth(state.expenses, state.selectedMonth, state.selectedYear)
      .filter(e => e.tabId === tab.id)
      .reduce((s,e) => s+e.amount, 0);
    const el = document.createElement('div');
    el.className = 'sidebar-item' + (state.activeTab === tab.id ? ' active' : '');
    el.innerHTML = `<div class="dot" style="background:${tab.color}"></div><span>${tab.name}</span><span class="tab-total" style="margin-left:auto;font-size:0.75rem;color:var(--muted)">$${total.toFixed(0)}</span>`;
    el.onclick = () => { closeModalSheet('mobile-cat-sheet'); switchTab(tab.id); };
    list.appendChild(el);
  });
  document.getElementById('mobile-cat-sheet').classList.add('open');
}

window.closeModalSheet = function(id) {
  document.getElementById(id).classList.remove('open');
}
