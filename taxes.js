import { state, saveLocal, showToast, getMonthFirstDay, formatDate, filterByMonth } from './state.js';
import { renderContent } from './render.js';

// ─── INCOME: ADD / MODAL ──────────────────────────────────────────────────────
window.openAddIncomeModal = function() {
  document.getElementById('income-desc').value = '';
  document.getElementById('income-amount').value = '';
  document.getElementById('income-date').value = getMonthFirstDay(state.selectedMonth, state.selectedYear);
  document.getElementById('income-note').value = '';
  document.getElementById('add-income-modal').classList.add('open');
}
window.closeAddIncomeModal = function() {
  document.getElementById('add-income-modal').classList.remove('open');
  document.getElementById('add-income-modal').removeAttribute('data-editing-id');
  const h3 = document.querySelector('#add-income-modal .modal h3');
  const btn = document.querySelector('#add-income-modal .modal-actions .btn-accent');
  if (h3) h3.textContent = 'Add Income';
  if (btn) { btn.textContent = 'Add Income'; btn.onclick = saveIncome; }
}
window.saveIncome = function() {
  const desc = document.getElementById('income-desc').value.trim();
  const amount = parseFloat(document.getElementById('income-amount').value);
  const date = document.getElementById('income-date').value;
  const note = document.getElementById('income-note').value.trim();
  if (!desc || isNaN(amount) || amount <= 0 || !date) { showToast('Please fill in description, amount and date'); return; }
  const inc = { id: crypto.randomUUID(), desc, amount, date, note };
  state.income.push(inc);
  saveLocal();
  closeAddIncomeModal();
  renderContent();
  showToast('Income added ✓');
}

// ─── INCOME TABLE CHECKBOX & SELECTION ─────────────────────────────────────────
window.toggleSelectAllIncomeInTable = function() {
  const selectAllCheckbox = document.getElementById('select-all-income');
  const individualCheckboxes = document.querySelectorAll('.income-checkbox');
  if (selectAllCheckbox && selectAllCheckbox.checked) {
    state.selectedIncomeIds = Array.from(individualCheckboxes).map(cb => cb.value);
    individualCheckboxes.forEach(cb => cb.checked = true);
  } else {
    state.selectedIncomeIds = [];
    if (individualCheckboxes.length) individualCheckboxes.forEach(cb => cb.checked = false);
  }
  updateIncomeCheckboxState();
}
window.updateIncomeCheckboxState = function() {
  const checkboxes = document.querySelectorAll('.income-checkbox');
  const selectAllCheckbox = document.getElementById('select-all-income');
  if (!selectAllCheckbox) return;
  state.selectedIncomeIds = Array.from(document.querySelectorAll('.income-checkbox:checked')).map(cb => cb.value);
  document.querySelectorAll('[id^="income-row-"]').forEach(row => {
    const id = row.id.replace('income-row-', '');
    if (state.selectedIncomeIds.includes(id)) row.classList.add('expense-row-selected');
    else row.classList.remove('expense-row-selected');
  });
  const hasSelection = state.selectedIncomeIds.length > 0;
  const delBtn = document.getElementById('delete-income-btn');
  const copyBtn = document.getElementById('copy-income-btn');
  if (delBtn) delBtn.disabled = !hasSelection;
  if (copyBtn) copyBtn.disabled = !hasSelection;
  selectAllCheckbox.checked = checkboxes.length > 0 && state.selectedIncomeIds.length === checkboxes.length;
}

// ─── DELETE INCOME (BULK) ─────────────────────────────────────────────────────
window.showDeleteIncomeConfirmation = function() {
  const count = state.selectedIncomeIds.length;
  if (count === 0) { showToast('Select at least one income to delete'); return; }
  document.getElementById('delete-income-confirm-msg').textContent =
    `Are you sure you want to delete ${count} selected income entry(ies)? This cannot be undone.`;
  document.getElementById('delete-income-confirm-modal').classList.add('open');
}
window.closeDeleteIncomeConfirmModal = function() {
  document.getElementById('delete-income-confirm-modal').classList.remove('open');
}
window.confirmDeleteIncomeAction = function() {
  closeDeleteIncomeConfirmModal();
  const count = state.selectedIncomeIds.length;
  state.income = state.income.filter(inc => !state.selectedIncomeIds.includes(inc.id));
  state.selectedIncomeIds = [];
  saveLocal();
  renderContent();
  showToast(`${count} income entry(ies) deleted`);
}
window.duplicateSelectedIncome = function() {
  if (state.selectedIncomeIds.length === 0) { showToast('Select at least one income to duplicate'); return; }
  state.selectedIncomeIds.forEach(id => {
    const inc = state.income.find(i => i.id === id);
    if (inc) state.income.push({ id: crypto.randomUUID(), desc: inc.desc, amount: inc.amount, date: inc.date, note: inc.note || '' });
  });
  state.selectedIncomeIds = [];
  saveLocal();
  renderContent();
  showToast('Income duplicated');
}

// ─── EDIT INCOME ────────────────────────────────────────────────────────────────
window.openEditIncomeModal = function(id) {
  const inc = state.income.find(i => i.id === id);
  if (!inc) return;
  document.getElementById('income-desc').value = inc.desc;
  document.getElementById('income-amount').value = inc.amount;
  document.getElementById('income-date').value = inc.date;
  document.getElementById('income-note').value = inc.note || '';
  document.getElementById('add-income-modal').classList.add('open');
  document.getElementById('add-income-modal').setAttribute('data-editing-id', id);
  const h3 = document.querySelector('#add-income-modal .modal h3');
  const btn = document.querySelector('#add-income-modal .modal-actions .btn-accent');
  if (h3) h3.textContent = 'Edit Income';
  if (btn) { btn.textContent = 'Update'; btn.onclick = () => updateIncomeAndClose(id); }
}
function updateIncomeAndClose(id) {
  const desc = document.getElementById('income-desc').value.trim();
  const amount = parseFloat(document.getElementById('income-amount').value);
  const date = document.getElementById('income-date').value;
  const note = document.getElementById('income-note').value.trim();
  if (!desc || isNaN(amount) || amount <= 0 || !date) { showToast('Please fill in description, amount and date'); return; }
  const inc = state.income.find(i => i.id === id);
  if (inc) { inc.desc = desc; inc.amount = amount; inc.date = date; inc.note = note; }
  saveLocal();
  document.getElementById('add-income-modal').removeAttribute('data-editing-id');
  document.querySelector('#add-income-modal .modal h3').textContent = 'Add Income';
  const btn = document.querySelector('#add-income-modal .modal-actions .btn-accent');
  if (btn) { btn.textContent = 'Add Income'; btn.onclick = saveIncome; }
  closeAddIncomeModal();
  renderContent();
  showToast('Income updated');
}

// ─── TAXES: ADD / EDIT / DELETE / DUPLICATE ────────────────────────────────────
window.openAddTaxesModal = function() {
  document.getElementById('taxes-desc').value = '';
  document.getElementById('taxes-amount').value = '';
  document.getElementById('taxes-date').value = getMonthFirstDay(state.selectedMonth, state.selectedYear);
  document.getElementById('taxes-note').value = '';
  document.getElementById('add-taxes-modal').classList.add('open');
}
window.closeAddTaxesModal = function() {
  document.getElementById('add-taxes-modal').classList.remove('open');
  document.getElementById('add-taxes-modal').removeAttribute('data-editing-id');
  const h3 = document.querySelector('#add-taxes-modal .modal h3');
  const btn = document.querySelector('#add-taxes-modal .modal-actions .btn-accent');
  if (h3) h3.textContent = 'Add Taxes';
  if (btn) { btn.textContent = 'Add'; btn.onclick = saveTaxes; }
}
window.saveTaxes = function() {
  const desc = document.getElementById('taxes-desc').value.trim();
  const amount = parseFloat(document.getElementById('taxes-amount').value);
  const date = document.getElementById('taxes-date').value;
  const note = document.getElementById('taxes-note').value.trim();
  if (!desc || isNaN(amount) || amount <= 0 || !date) { showToast('Please fill in description, amount and date'); return; }
  const entry = { id: crypto.randomUUID(), desc, amount, date, note };
  state.taxes.push(entry);
  saveLocal();
  closeAddTaxesModal();
  renderContent();
  showToast('Taxes entry added ✓');
}
window.toggleSelectAllTaxesInTable = function() {
  const selectAllCheckbox = document.getElementById('select-all-taxes');
  const individualCheckboxes = document.querySelectorAll('.taxes-checkbox');
  if (selectAllCheckbox && selectAllCheckbox.checked) {
    state.selectedTaxIds = Array.from(individualCheckboxes).map(cb => cb.value);
    individualCheckboxes.forEach(cb => cb.checked = true);
  } else {
    state.selectedTaxIds = [];
    if (individualCheckboxes.length) individualCheckboxes.forEach(cb => cb.checked = false);
  }
  updateTaxesCheckboxState();
}
window.updateTaxesCheckboxState = function() {
  const checkboxes = document.querySelectorAll('.taxes-checkbox');
  const selectAllCheckbox = document.getElementById('select-all-taxes');
  if (!selectAllCheckbox) return;
  state.selectedTaxIds = Array.from(document.querySelectorAll('.taxes-checkbox:checked')).map(cb => cb.value);
  document.querySelectorAll('[id^="taxes-row-"]').forEach(row => {
    const id = row.id.replace('taxes-row-', '');
    if (state.selectedTaxIds.includes(id)) row.classList.add('expense-row-selected');
    else row.classList.remove('expense-row-selected');
  });
  const hasSelection = state.selectedTaxIds.length > 0;
  const delBtn = document.getElementById('delete-taxes-btn');
  const copyBtn = document.getElementById('copy-taxes-btn');
  if (delBtn) delBtn.disabled = !hasSelection;
  if (copyBtn) copyBtn.disabled = !hasSelection;
  selectAllCheckbox.checked = checkboxes.length > 0 && state.selectedTaxIds.length === checkboxes.length;
}
window.showDeleteTaxesConfirmation = function() {
  const count = state.selectedTaxIds.length;
  if (count === 0) { showToast('Select at least one entry to delete'); return; }
  document.getElementById('delete-taxes-confirm-msg').textContent =
    `Are you sure you want to delete ${count} selected tax entry(ies)? This cannot be undone.`;
  document.getElementById('delete-taxes-confirm-modal').classList.add('open');
}
window.closeDeleteTaxesConfirmModal = function() {
  document.getElementById('delete-taxes-confirm-modal').classList.remove('open');
}
window.confirmDeleteTaxesAction = function() {
  closeDeleteTaxesConfirmModal();
  const count = state.selectedTaxIds.length;
  state.taxes = state.taxes.filter(entry => !state.selectedTaxIds.includes(entry.id));
  state.selectedTaxIds = [];
  saveLocal();
  renderContent();
  showToast(`${count} tax entry(ies) deleted`);
}
window.duplicateSelectedTaxes = function() {
  if (state.selectedTaxIds.length === 0) { showToast('Select at least one entry to duplicate'); return; }
  state.selectedTaxIds.forEach(id => {
    const entry = state.taxes.find(i => i.id === id);
    if (entry) state.taxes.push({ id: crypto.randomUUID(), desc: entry.desc, amount: entry.amount, date: entry.date, note: entry.note || '' });
  });
  state.selectedTaxIds = [];
  saveLocal();
  renderContent();
  showToast('Taxes duplicated');
}
window.openEditTaxesModal = function(id) {
  const entry = state.taxes.find(i => i.id === id);
  if (!entry) return;
  document.getElementById('taxes-desc').value = entry.desc;
  document.getElementById('taxes-amount').value = entry.amount;
  document.getElementById('taxes-date').value = entry.date;
  document.getElementById('taxes-note').value = entry.note || '';
  document.getElementById('add-taxes-modal').classList.add('open');
  document.getElementById('add-taxes-modal').setAttribute('data-editing-id', id);
  const h3 = document.querySelector('#add-taxes-modal .modal h3');
  const btn = document.querySelector('#add-taxes-modal .modal-actions .btn-accent');
  if (h3) h3.textContent = 'Edit Taxes';
  if (btn) { btn.textContent = 'Update'; btn.onclick = () => updateTaxesAndClose(id); }
}
function updateTaxesAndClose(id) {
  const desc = document.getElementById('taxes-desc').value.trim();
  const amount = parseFloat(document.getElementById('taxes-amount').value);
  const date = document.getElementById('taxes-date').value;
  const note = document.getElementById('taxes-note').value.trim();
  if (!desc || isNaN(amount) || amount <= 0 || !date) { showToast('Please fill in description, amount and date'); return; }
  const entry = state.taxes.find(i => i.id === id);
  if (entry) { entry.desc = desc; entry.amount = amount; entry.date = date; entry.note = note; }
  saveLocal();
  document.getElementById('add-taxes-modal').removeAttribute('data-editing-id');
  document.querySelector('#add-taxes-modal .modal h3').textContent = 'Add Taxes';
  const btn = document.querySelector('#add-taxes-modal .modal-actions .btn-accent');
  if (btn) { btn.textContent = 'Add'; btn.onclick = saveTaxes; }
  closeAddTaxesModal();
  renderContent();
  showToast('Taxes updated');
}

// ─── SUPER: ADD / EDIT / DELETE / DUPLICATE ────────────────────────────────────
window.openAddSuperModal = function() {
  document.getElementById('super-desc').value = '';
  document.getElementById('super-amount').value = '';
  document.getElementById('super-date').value = getMonthFirstDay(state.selectedMonth, state.selectedYear);
  document.getElementById('super-note').value = '';
  document.getElementById('add-super-modal').classList.add('open');
}
window.closeAddSuperModal = function() {
  document.getElementById('add-super-modal').classList.remove('open');
  document.getElementById('add-super-modal').removeAttribute('data-editing-id');
  const h3 = document.querySelector('#add-super-modal .modal h3');
  const btn = document.querySelector('#add-super-modal .modal-actions .btn-accent');
  if (h3) h3.textContent = 'Add Super';
  if (btn) { btn.textContent = 'Add'; btn.onclick = saveSuper; }
}
window.saveSuper = function() {
  const desc = document.getElementById('super-desc').value.trim();
  const amount = parseFloat(document.getElementById('super-amount').value);
  const date = document.getElementById('super-date').value;
  const note = document.getElementById('super-note').value.trim();
  if (!desc || isNaN(amount) || amount <= 0 || !date) { showToast('Please fill in description, amount and date'); return; }
  const entry = { id: crypto.randomUUID(), desc, amount, date, note };
  state.super.push(entry);
  saveLocal();
  closeAddSuperModal();
  renderContent();
  showToast('Super entry added ✓');
}
window.toggleSelectAllSuperInTable = function() {
  const selectAllCheckbox = document.getElementById('select-all-super');
  const individualCheckboxes = document.querySelectorAll('.super-checkbox');
  if (selectAllCheckbox && selectAllCheckbox.checked) {
    state.selectedSuperIds = Array.from(individualCheckboxes).map(cb => cb.value);
    individualCheckboxes.forEach(cb => cb.checked = true);
  } else {
    state.selectedSuperIds = [];
    if (individualCheckboxes.length) individualCheckboxes.forEach(cb => cb.checked = false);
  }
  updateSuperCheckboxState();
}
window.updateSuperCheckboxState = function() {
  const checkboxes = document.querySelectorAll('.super-checkbox');
  const selectAllCheckbox = document.getElementById('select-all-super');
  if (!selectAllCheckbox) return;
  state.selectedSuperIds = Array.from(document.querySelectorAll('.super-checkbox:checked')).map(cb => cb.value);
  document.querySelectorAll('[id^="super-row-"]').forEach(row => {
    const id = row.id.replace('super-row-', '');
    if (state.selectedSuperIds.includes(id)) row.classList.add('expense-row-selected');
    else row.classList.remove('expense-row-selected');
  });
  const hasSelection = state.selectedSuperIds.length > 0;
  const delBtn = document.getElementById('delete-super-btn');
  const copyBtn = document.getElementById('copy-super-btn');
  if (delBtn) delBtn.disabled = !hasSelection;
  if (copyBtn) copyBtn.disabled = !hasSelection;
  selectAllCheckbox.checked = checkboxes.length > 0 && state.selectedSuperIds.length === checkboxes.length;
}
window.showDeleteSuperConfirmation = function() {
  const count = state.selectedSuperIds.length;
  if (count === 0) { showToast('Select at least one entry to delete'); return; }
  document.getElementById('delete-super-confirm-msg').textContent =
    `Are you sure you want to delete ${count} selected super entry(ies)? This cannot be undone.`;
  document.getElementById('delete-super-confirm-modal').classList.add('open');
}
window.closeDeleteSuperConfirmModal = function() {
  document.getElementById('delete-super-confirm-modal').classList.remove('open');
}
window.confirmDeleteSuperAction = function() {
  closeDeleteSuperConfirmModal();
  const count = state.selectedSuperIds.length;
  state.super = state.super.filter(entry => !state.selectedSuperIds.includes(entry.id));
  state.selectedSuperIds = [];
  saveLocal();
  renderContent();
  showToast(`${count} super entry(ies) deleted`);
}
window.duplicateSelectedSuper = function() {
  if (state.selectedSuperIds.length === 0) { showToast('Select at least one entry to duplicate'); return; }
  state.selectedSuperIds.forEach(id => {
    const entry = state.super.find(i => i.id === id);
    if (entry) state.super.push({ id: crypto.randomUUID(), desc: entry.desc, amount: entry.amount, date: entry.date, note: entry.note || '' });
  });
  state.selectedSuperIds = [];
  saveLocal();
  renderContent();
  showToast('Super duplicated');
}
window.openEditSuperModal = function(id) {
  const entry = state.super.find(i => i.id === id);
  if (!entry) return;
  document.getElementById('super-desc').value = entry.desc;
  document.getElementById('super-amount').value = entry.amount;
  document.getElementById('super-date').value = entry.date;
  document.getElementById('super-note').value = entry.note || '';
  document.getElementById('add-super-modal').classList.add('open');
  document.getElementById('add-super-modal').setAttribute('data-editing-id', id);
  const h3 = document.querySelector('#add-super-modal .modal h3');
  const btn = document.querySelector('#add-super-modal .modal-actions .btn-accent');
  if (h3) h3.textContent = 'Edit Super';
  if (btn) { btn.textContent = 'Update'; btn.onclick = () => updateSuperAndClose(id); }
}
function updateSuperAndClose(id) {
  const desc = document.getElementById('super-desc').value.trim();
  const amount = parseFloat(document.getElementById('super-amount').value);
  const date = document.getElementById('super-date').value;
  const note = document.getElementById('super-note').value.trim();
  if (!desc || isNaN(amount) || amount <= 0 || !date) { showToast('Please fill in description, amount and date'); return; }
  const entry = state.super.find(i => i.id === id);
  if (entry) { entry.desc = desc; entry.amount = amount; entry.date = date; entry.note = note; }
  saveLocal();
  document.getElementById('add-super-modal').removeAttribute('data-editing-id');
  document.querySelector('#add-super-modal .modal h3').textContent = 'Add Super';
  const btn = document.querySelector('#add-super-modal .modal-actions .btn-accent');
  if (btn) { btn.textContent = 'Add'; btn.onclick = saveSuper; }
  closeAddSuperModal();
  renderContent();
  showToast('Super updated');
}
