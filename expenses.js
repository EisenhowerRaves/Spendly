import {
  state, isFirebase, saveLocal,
  fbSaveExpense, fbDeleteExpense, fbUpdateExpense,
  showToast, populateCategorySelect, formatDate, getTodayDateString, getMonthFirstDay, getMonthDisplayName
} from './state.js';
import { renderSidebar, renderContent } from './render.js';

// ─── ADD / SAVE / DELETE ─────────────────────────────────────────────────────
window.openAddModal = function() {
  populateCategorySelect('exp-category');
  document.getElementById('exp-date').value = getMonthFirstDay(state.selectedMonth, state.selectedYear);
  document.getElementById('add-modal').classList.add('open');
}
window.openAddModalFor = function(tabId) {
  openAddModal();
  document.getElementById('exp-category').value = tabId;
}
window.closeAddModal = function() {
  document.getElementById('add-modal').classList.remove('open');
  document.getElementById('exp-desc').value = '';
  document.getElementById('exp-amount').value = '';
  document.getElementById('exp-note').value = '';
}

window.saveExpense = async function() {
  const desc = document.getElementById('exp-desc').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const tabId = document.getElementById('exp-category').value;
  const date = document.getElementById('exp-date').value;
  const note = document.getElementById('exp-note').value.trim();
  if (!desc || isNaN(amount) || amount <= 0 || !date) { showToast('Please fill in description, amount and date'); return; }
  const exp = { id: crypto.randomUUID(), desc, amount, tabId, date, note };
  state.expenses.push(exp);
  if (isFirebase) { await fbSaveExpense(exp); }
  saveLocal();
  closeAddModal();
  renderSidebar();
  renderContent();
  showToast('Expense added ✓');
}

window.deleteExpense = async function(id) {
  state.expenses = state.expenses.filter(e => e.id !== id);
  if (isFirebase) await fbDeleteExpense(id);
  saveLocal();
  renderSidebar();
  renderContent();
  showToast('Expense removed');
}

window.deleteTab = function(id) {
  if (!confirm('Delete this category and all its expenses?')) return;
  state.tabs = state.tabs.filter(t => t.id !== id);
  state.expenses = state.expenses.filter(e => e.tabId !== id);
  saveLocal();
  state.activeTab = 'overview';
  renderSidebar();
  renderContent();
  showToast('Category deleted');
}

// ─── EXPENSE TABLE CHECKBOX & SELECTION ────────────────────────────────────────
window.getSelectedExpenseCount = function() {
  return state.selectedExpenseIds.length;
}

window.toggleSelectAllExpensesInTable = function() {
  const selectAllCheckbox = document.getElementById('select-all-expenses');
  const individualCheckboxes = document.querySelectorAll('.expense-checkbox');
  if (selectAllCheckbox.checked) {
    state.selectedExpenseIds = Array.from(individualCheckboxes).map(cb => cb.value);
    individualCheckboxes.forEach(cb => cb.checked = true);
  } else {
    state.selectedExpenseIds = [];
    individualCheckboxes.forEach(cb => cb.checked = false);
  }
  updateExpenseCheckboxState();
}

window.updateExpenseCheckboxState = function() {
  const checkboxes = document.querySelectorAll('.expense-checkbox');
  const selectAllCheckbox = document.getElementById('select-all-expenses');

  // Update selected IDs
  state.selectedExpenseIds = Array.from(document.querySelectorAll('.expense-checkbox:checked')).map(cb => cb.value);

  // Update row highlighting
  document.querySelectorAll('[id^="expense-row-"]').forEach(row => {
    if (state.selectedExpenseIds.some(id => row.id === `expense-row-${id}`)) {
      row.classList.add('expense-row-selected');
    } else {
      row.classList.remove('expense-row-selected');
    }
  });

  // Update button states
  const hasSelection = state.selectedExpenseIds.length > 0;
  document.getElementById('delete-expenses-btn').disabled = !hasSelection;
  document.getElementById('copy-expenses-btn').disabled = !hasSelection;

  // Update select all checkbox state
  selectAllCheckbox.checked = state.selectedExpenseIds.length === checkboxes.length && checkboxes.length > 0;
}

// ─── DELETE EXPENSES (BULK) ────────────────────────────────────────────────────
window.showDeleteExpensesConfirmation = function() {
  const count = getSelectedExpenseCount();
  if (count === 0) {
    showToast('Select at least one expense to delete');
    return;
  }
  document.getElementById('delete-expenses-confirm-msg').textContent =
    `Are you sure you want to delete ${count} selected expense(s)? This cannot be undone.`;
  document.getElementById('delete-expenses-confirm-modal').classList.add('open');
}

window.closeDeleteExpensesConfirmModal = function() {
  document.getElementById('delete-expenses-confirm-modal').classList.remove('open');
}

window.confirmDeleteExpensesAction = function() {
  closeDeleteExpensesConfirmModal();
  deleteSelectedExpenses();
}

window.deleteSelectedExpenses = async function() {
  const count = state.selectedExpenseIds.length;
  for (const id of state.selectedExpenseIds) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    if (isFirebase) await fbDeleteExpense(id);
  }
  state.selectedExpenseIds = [];
  saveLocal();
  renderSidebar();
  renderContent();
  showToast(`${count} expense(s) deleted`);
}

// ─── COPY EXPENSES TO CATEGORY (BULK) ──────────────────────────────────────────
window.openCopyExpensesToCategoryModal = function() {
  const count = getSelectedExpenseCount();
  if (count === 0) {
    showToast('Select at least one expense to copy');
    return;
  }

  // Populate preview list
  const previewList = document.getElementById('copy-preview-list');
  previewList.innerHTML = '';
  state.selectedExpenseIds.forEach(id => {
    const exp = state.expenses.find(e => e.id === id);
    if (exp) {
      const item = document.createElement('div');
      item.className = 'category-copy-item';
      const tab = state.tabs.find(t => t.id === exp.tabId);
      item.innerHTML = `
        <span class="expense-date">${formatDate(exp.date)}</span>
        <span class="cat-name">${exp.desc}</span>
        <span class="expense-amount">$${exp.amount.toFixed(2)}</span>
      `;
      previewList.appendChild(item);
    }
  });

  // Populate category dropdown
  const categorySelect = document.getElementById('copy-target-category');
  categorySelect.innerHTML = '';
  state.tabs.forEach(tab => {
    const option = document.createElement('option');
    option.value = tab.id;
    option.textContent = tab.name;
    categorySelect.appendChild(option);
  });

  document.getElementById('copy-target-date').value = getTodayDateString();
  const firstExp = state.expenses.find(e => e.id === state.selectedExpenseIds[0]);
  document.getElementById('copy-exp-amount').value = firstExp ? firstExp.amount : '';
  document.getElementById('copy-expenses-to-category-modal').classList.add('open');
}

window.closeCopyExpensesToCategoryModal = function() {
  document.getElementById('copy-expenses-to-category-modal').classList.remove('open');
}

window.confirmCopyExpensesToCategory = async function() {
  const targetCategoryId = document.getElementById('copy-target-category').value;
  if (!targetCategoryId) {
    showToast('Select a target category');
    return;
  }
  const copyDate = document.getElementById('copy-target-date').value || getTodayDateString();
  const copyAmountRaw = document.getElementById('copy-exp-amount').value;
  const copyAmount = copyAmountRaw !== '' ? parseFloat(copyAmountRaw) : null;

  const targetTab = state.tabs.find(t => t.id === targetCategoryId);
  let copiedCount = 0;

  const idsToCopy = [...state.selectedExpenseIds];
  for (const id of idsToCopy) {
    const original = state.expenses.find(e => e.id === id);
    if (original) {
      const duplicate = {
        id: crypto.randomUUID(),
        desc: original.desc,
        amount: (copyAmount !== null && !isNaN(copyAmount)) ? copyAmount : original.amount,
        tabId: targetCategoryId,
        date: copyDate,
        note: original.note || ''
      };
      if (isFirebase) {
        await fbSaveExpense(duplicate);
      }
      state.expenses.push(duplicate);
      copiedCount++;
    }
  }

  state.selectedExpenseIds = [];
  saveLocal();
  closeCopyExpensesToCategoryModal();
  renderSidebar();
  renderContent();
  showToast(`${copiedCount} expense(s) copied to ${targetTab.name}`);
}

// ─── EDIT EXPENSE ──────────────────────────────────────────────────────────────
window.openEditExpenseModal = function(expenseId) {
  const expense = state.expenses.find(e => e.id === expenseId);
  if (!expense) return;

  state.editingExpenseId = expenseId;
  populateEditExpenseForm(expense);

  // Populate category dropdown
  const categorySelect = document.getElementById('edit-exp-category');
  categorySelect.innerHTML = '';
  state.tabs.forEach(tab => {
    const option = document.createElement('option');
    option.value = tab.id;
    option.textContent = tab.name;
    if (tab.id === expense.tabId) option.selected = true;
    categorySelect.appendChild(option);
  });

  document.getElementById('edit-expense-modal').classList.add('open');
}

window.closeEditExpenseModal = function() {
  document.getElementById('edit-expense-modal').classList.remove('open');
  state.editingExpenseId = null;
  document.getElementById('edit-exp-desc').value = '';
  document.getElementById('edit-exp-amount').value = '';
  document.getElementById('edit-exp-date').value = '';
  document.getElementById('edit-exp-note').value = '';
}

window.populateEditExpenseForm = function(expense) {
  document.getElementById('edit-exp-desc').value = expense.desc;
  document.getElementById('edit-exp-amount').value = expense.amount;
  document.getElementById('edit-exp-date').value = expense.date;
  document.getElementById('edit-exp-note').value = expense.note || '';
  document.getElementById('edit-exp-desc').focus();
}

window.saveEditedExpense = async function() {
  const desc = document.getElementById('edit-exp-desc').value.trim();
  const amount = parseFloat(document.getElementById('edit-exp-amount').value);
  const categoryId = document.getElementById('edit-exp-category').value;
  const date = document.getElementById('edit-exp-date').value;
  const note = document.getElementById('edit-exp-note').value.trim();

  if (!desc || isNaN(amount) || amount <= 0 || !date) {
    showToast('Please fill in all required fields');
    return;
  }

  const expense = state.expenses.find(e => e.id === state.editingExpenseId);
  if (!expense) return;

  expense.desc = desc;
  expense.amount = amount;
  expense.tabId = categoryId;
  expense.date = date;
  expense.note = note;

  saveLocal();
  if (isFirebase) await fbUpdateExpense(expense);
  closeEditExpenseModal();
  renderSidebar();
  renderContent();
  showToast('Expense updated');
}

// ─── COPY/DUPLICATE EXPENSES MODAL ────────────────────────────────────────
window.openCopyExpensesModal = function(tabId) {
  const tab = state.tabs.find(t => t.id === tabId);
  const expenses = state.expenses.filter(e => e.tabId === tabId);
  if (expenses.length === 0) {
    showToast('No expenses to duplicate');
    return;
  }
  const list = document.getElementById('copy-expenses-list');
  list.innerHTML = '';
  expenses.forEach(exp => {
    const item = document.createElement('div');
    item.className = 'category-copy-item';
    item.innerHTML = `
      <input type="checkbox" value="${exp.id}" class="cat-copy-checkbox">
      <span class="expense-date">${formatDate(exp.date)}</span>
      <span class="cat-name">${exp.desc}</span>
      <span class="expense-amount">$${exp.amount.toFixed(2)}</span>
    `;
    list.appendChild(item);
  });
  // Update modal title
  document.querySelector('#copy-expenses-modal h3').textContent = `Duplicate Expenses from ${tab.name}`;
  document.getElementById('copy-expenses-modal').classList.add('open');
}
window.closeCopyExpensesModal = function() {
  document.getElementById('copy-expenses-modal').classList.remove('open');
}
window.toggleSelectAllExpenses = function() {
  const checkboxes = document.querySelectorAll('.cat-copy-checkbox');
  checkboxes.forEach(cb => cb.checked = true);
}
window.toggleDeselectAllExpenses = function() {
  const checkboxes = document.querySelectorAll('.cat-copy-checkbox');
  checkboxes.forEach(cb => cb.checked = false);
}
window.confirmCopyExpenses = async function() {
  const checkboxes = document.querySelectorAll('.cat-copy-checkbox:checked');
  if (checkboxes.length === 0) {
    showToast('Select at least one expense to duplicate');
    return;
  }
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);
  // Find which category we're duplicating from
  const firstExpense = state.expenses.find(e => e.id === selectedIds[0]);
  const sourceCategoryId = firstExpense.tabId;
  // Create duplicates
  for (const id of selectedIds) {
    const original = state.expenses.find(e => e.id === id);
    const duplicate = {
      id: crypto.randomUUID(),
      desc: original.desc,
      amount: original.amount,
      tabId: original.tabId,
      date: original.date,
      note: original.note
    };
    state.expenses.push(duplicate);
    if (isFirebase) {
      await fbSaveExpense(duplicate);
    }
  }
  saveLocal();
  closeCopyExpensesModal();
  renderSidebar();
  renderContent();
  showToast(`${selectedIds.length} expenses duplicated`);
}
