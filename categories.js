import {
  state, COLORS, isFirebase, saveLocal,
  fbSaveTab, fbDeleteTab, fbDeleteExpense,
  showToast, filterByMonth
} from './state.js';
import { renderSidebar, renderContent } from './render.js';

// ─── NEW TAB ─────────────────────────────────────────────────────────────────
let selectedNewColor = COLORS[0];

window.openNewTabModal = function() {
  const cp = document.getElementById('color-picker');
  cp.innerHTML = '';
  COLORS.forEach((c,i) => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (i===0?' selected':'');
    sw.style.background = c;
    sw.onclick = () => { selectedNewColor = c; document.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('selected')); sw.classList.add('selected'); };
    cp.appendChild(sw);
  });
  selectedNewColor = COLORS[0];
  document.getElementById('newtab-modal').classList.add('open');
}
window.closeNewTabModal = function() { document.getElementById('newtab-modal').classList.remove('open'); document.getElementById('new-tab-name').value = ''; }
window.createTab = async function() {
  const name = document.getElementById('new-tab-name').value.trim();
  if (!name) { showToast('Enter a category name'); return; }
  const tab = { id: crypto.randomUUID(), name, color: selectedNewColor };
  state.tabs.push(tab);
  if (isFirebase) await fbSaveTab(tab);
  saveLocal();
  closeNewTabModal();
  renderSidebar();
  renderContent();
  showToast('Category created ✓');
}

// ─── INLINE CATEGORY NAME EDITING ────────────────────────────────────────────
window.startEditCategoryName = function(tabId) {
  const tab = state.tabs.find(t => t.id === tabId);
  if (!tab) return;

  const h2 = document.getElementById('cat-name-display');
  if (!h2 || h2.querySelector('input')) return; // guard: already editing

  const originalName = tab.name;
  let committed = false;

  // Measure helper: match the exact rendered width of the input text
  const measureText = (text) => {
    const ruler = document.createElement('span');
    ruler.style.cssText = 'visibility:hidden;position:fixed;white-space:pre;font-family:"DM Serif Display",serif;font-size:1.8rem;';
    ruler.textContent = text || ' ';
    document.body.appendChild(ruler);
    const w = ruler.offsetWidth;
    document.body.removeChild(ruler);
    return w;
  };

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cat-name-input';
  input.value = originalName;
  input.style.width = Math.max(80, measureText(originalName) + 16) + 'px';
  input.addEventListener('input', () => {
    input.style.width = Math.max(80, measureText(input.value) + 16) + 'px';
  });

  const commit = async () => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim();
    if (newName && newName !== originalName) {
      tab.name = newName;
      saveLocal();
      if (isFirebase) await fbSaveTab(tab);
    }
    renderSidebar();
    renderContent();
  };

  const revert = () => {
    if (committed) return;
    committed = true;
    renderContent();
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); revert(); }
  });
  input.addEventListener('blur', commit);

  // Swap heading content for the bare input
  h2.innerHTML = '';
  h2.style.cursor = 'default';
  h2.appendChild(input);
  input.focus();
  input.select();
};

// ─── RENAME CATEGORY MODAL ────────────────────────────────────────────────
window.openRenameCategoryModal = function(tabId, currentName) {
  document.getElementById('old-category-name').textContent = currentName;
  document.getElementById('new-category-name').value = currentName;
  document.getElementById('new-category-name').tabId = tabId; // Store tabId for later
  document.getElementById('rename-category-modal').classList.add('open');
  document.getElementById('new-category-name').focus();
  document.getElementById('new-category-name').select();
}
window.closeRenameCategoryModal = function() {
  document.getElementById('rename-category-modal').classList.remove('open');
  document.getElementById('new-category-name').value = '';
}
window.confirmRenameCategory = async function() {
  const tabId = document.getElementById('new-category-name').tabId;
  const newName = document.getElementById('new-category-name').value.trim();
  if (!newName) {
    showToast('Enter a category name');
    return;
  }
  const tab = state.tabs.find(t => t.id === tabId);
  if (!tab) return;
  const oldName = tab.name;
  tab.name = newName;
  saveLocal();
  if (isFirebase) {
    await fbSaveTab(tab);
  }
  closeRenameCategoryModal();
  renderSidebar();
  if (state.activeTab === tabId) {
    renderContent();
  }
  showToast(`Renamed to ${newName}`);
}

// ─── DELETE CATEGORIES MODAL ─────────────────────────────────────────────────
window.openDeleteCategoriesModal = function() {
  const list = document.getElementById('delete-categories-list');
  list.innerHTML = '';
  if (state.tabs.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;text-align:center;padding:1rem">No categories to delete.</p>';
  } else {
    const monthExpenses = filterByMonth(state.expenses, state.selectedMonth, state.selectedYear);
    state.tabs.forEach(tab => {
      const count = monthExpenses.filter(e => e.tabId === tab.id).length;
      const total = monthExpenses.filter(e => e.tabId === tab.id).reduce((s,e) => s+e.amount, 0);

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:0.75rem;padding:0.65rem 0.75rem;border-radius:8px;cursor:pointer;border:1px solid var(--border);transition:background 0.15s;';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.tabId = tab.id;
      cb.style.cssText = 'width:16px;height:16px;cursor:pointer;accent-color:#ff4444;flex-shrink:0';

      const dot = document.createElement('span');
      dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${tab.color};flex-shrink:0`;

      const name = document.createElement('span');
      name.style.cssText = 'flex:1;font-size:0.9rem';
      name.textContent = tab.name;

      const info = document.createElement('span');
      info.style.cssText = 'font-size:0.78rem;color:var(--muted)';
      info.textContent = `${count} expense${count!==1?'s':''} · $${total.toFixed(2)}`;

      row.append(cb, dot, name, info);
      // Clicking the row toggles the checkbox; guard against double-toggle when clicking the checkbox directly
      row.addEventListener('click', (e) => { if (e.target !== cb) cb.checked = !cb.checked; });
      list.appendChild(row);
    });
  }
  document.getElementById('delete-categories-modal').classList.add('open');
}

window.closeDeleteCategoriesModal = function() {
  document.getElementById('delete-categories-modal').classList.remove('open');
}

window.confirmDeleteCategories = function() {
  const checked = document.querySelectorAll('#delete-categories-list input[type="checkbox"]:checked');
  if (checked.length === 0) { showToast('Select at least one category'); return; }
  const idsToDelete = Array.from(checked).map(cb => cb.dataset.tabId);

  idsToDelete.forEach(id => {
    // Capture expenses before removing them from state
    const expsToDelete = state.expenses.filter(e => e.tabId === id);

    // Update local state first — always runs regardless of Firebase
    state.tabs = state.tabs.filter(t => t.id !== id);
    state.expenses = state.expenses.filter(e => e.tabId !== id);

    // Sync to Firebase non-blocking — fire and forget with .catch() for error handling
    if (isFirebase) {
      expsToDelete.forEach(exp => fbDeleteExpense(exp.id).catch(e => console.warn('Firebase expense delete error:', e)));
      fbDeleteTab(id).catch(e => console.warn('Firebase tab delete error:', e));
    }
  });

  saveLocal();
  if (idsToDelete.includes(state.activeTab)) state.activeTab = 'overview';
  closeDeleteCategoriesModal();
  renderSidebar();
  renderContent();
  showToast(`${idsToDelete.length} categor${idsToDelete.length!==1?'ies':'y'} deleted`);
}
