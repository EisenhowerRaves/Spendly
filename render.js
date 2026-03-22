import { state, filterByMonth, getMonthDisplayName, getMonthFirstDay, formatDate } from './state.js';

// ─── RENDER ──────────────────────────────────────────────────────────────────
export function renderSidebar() {
  const container = document.getElementById('sidebar-tabs');
  container.innerHTML = '';
  state.tabs.forEach(tab => {
    const total = filterByMonth(state.expenses, state.selectedMonth, state.selectedYear)
      .filter(e => e.tabId === tab.id)
      .reduce((s,e) => s + e.amount, 0);
    const el = document.createElement('div');
    el.className = 'sidebar-item' + (state.activeTab === tab.id ? ' active' : '');
    el.onclick = () => switchTab(tab.id);
    el.innerHTML = `<div class="dot" style="background:${tab.color}"></div><span>${tab.name}</span><span class="tab-total">$${total.toFixed(0)}</span>`;
    container.appendChild(el);
  });
  // update overview, income, taxes, super nav (independent)
  document.getElementById('nav-overview').className = 'sidebar-item' + (state.activeTab === 'overview' ? ' active' : '');
  const navIncome = document.getElementById('nav-income');
  if (navIncome) navIncome.className = 'sidebar-item' + (state.activeTab === 'income' ? ' active' : '');
  const navTaxes = document.getElementById('nav-taxes');
  if (navTaxes) navTaxes.className = 'sidebar-item' + (state.activeTab === 'taxes' ? ' active' : '');
  const navSuper = document.getElementById('nav-super');
  if (navSuper) navSuper.className = 'sidebar-item' + (state.activeTab === 'super' ? ' active' : '');
}

export function renderContent() {
  const main = document.getElementById('main-content');
  if (state.activeTab === 'overview') {
    renderOverview(main);
  } else if (state.activeTab === 'income') {
    renderIncome(main);
  } else if (state.activeTab === 'taxes') {
    renderTaxes(main);
  } else if (state.activeTab === 'super') {
    renderSuper(main);
  } else {
    renderTabView(main, state.activeTab);
  }
  lucide.createIcons();
}

function renderIncome(main) {
  const monthLabel = getMonthDisplayName(state.selectedMonth, state.selectedYear);
  const selectedMonthIncome = filterByMonth(state.income, state.selectedMonth, state.selectedYear);
  const incomeColor = '#368a1c';
  let tableHtml = `
    <div class="expense-table-wrap"><table class="expense-table">
      <thead><tr><th style="width:30px"><input type="checkbox" id="select-all-income" onchange="toggleSelectAllIncomeInTable()"></th><th>Description</th><th>Date</th><th>Note</th><th>Amount</th><th style="width:50px"></th></tr></thead>
      <tbody>`;
  if (selectedMonthIncome.length === 0) {
    tableHtml += `<tr><td colspan="6"><div class="empty-state"><span><i data-lucide="folder-open"></i></span>No income for ${monthLabel}.</div></td></tr>`;
  } else {
    selectedMonthIncome.forEach(inc => {
      tableHtml += `<tr id="income-row-${inc.id}" class="expense-row-${state.selectedIncomeIds.includes(inc.id) ? 'selected' : 'unselected'}">
        <td><input type="checkbox" class="income-checkbox" value="${inc.id}" onchange="updateIncomeCheckboxState()"></td>
        <td>${inc.desc}</td>
        <td class="expense-date">${formatDate(inc.date)}</td>
        <td class="expense-note">${inc.note || ''}</td>
        <td class="expense-amount" style="color:${incomeColor}">$${inc.amount.toFixed(2)}</td>
        <td><button class="edit-expense-btn" onclick="openEditIncomeModal('${inc.id}')" title="Edit income"><i data-lucide="pencil"></i></button></td>
      </tr>`;
    });
  }
  tableHtml += '</tbody></table></div>';
  main.innerHTML = `
    <div class="tab-header">
      <div class="tab-title">
        <div class="tab-dot" style="background:${incomeColor}"></div>
        <h2 style="font-family:DM Serif Display,serif;font-size:1.8rem;margin:0">Income - ${monthLabel}</h2>
      </div>
      <div class="tab-actions">
        <button class="btn-ghost" onclick="openAddIncomeModal()" title="Add income"><i data-lucide="plus"></i></button>
        <button class="btn-ghost" id="delete-income-btn" onclick="showDeleteIncomeConfirmation()" title="Delete selected income" disabled><i data-lucide="trash-2"></i></button>
        <button class="btn-ghost" id="copy-income-btn" onclick="duplicateSelectedIncome()" title="Duplicate selected income" disabled><i data-lucide="copy"></i></button>
      </div>
    </div>
    ${tableHtml}`;
}

function renderTaxes(main) {
  const monthLabel = getMonthDisplayName(state.selectedMonth, state.selectedYear);
  const selectedMonthTaxes = filterByMonth(state.taxes, state.selectedMonth, state.selectedYear);
  const taxesColor = '#a51f07';
  let tableHtml = `
    <div class="expense-table-wrap"><table class="expense-table">
      <thead><tr><th style="width:30px"><input type="checkbox" id="select-all-taxes" onchange="toggleSelectAllTaxesInTable()"></th><th>Description</th><th>Date</th><th>Note</th><th>Amount</th><th style="width:50px"></th></tr></thead>
      <tbody>`;
  if (selectedMonthTaxes.length === 0) {
    tableHtml += `<tr><td colspan="6"><div class="empty-state"><span><i data-lucide="folder-open"></i></span>No taxes for ${monthLabel}.</div></td></tr>`;
  } else {
    selectedMonthTaxes.forEach(entry => {
      tableHtml += `<tr id="taxes-row-${entry.id}" class="expense-row-${state.selectedTaxIds.includes(entry.id) ? 'selected' : 'unselected'}">
        <td><input type="checkbox" class="taxes-checkbox" value="${entry.id}" onchange="updateTaxesCheckboxState()"></td>
        <td>${entry.desc}</td>
        <td class="expense-date">${formatDate(entry.date)}</td>
        <td class="expense-note">${entry.note || ''}</td>
        <td class="expense-amount" style="color:${taxesColor}">$${entry.amount.toFixed(2)}</td>
        <td><button class="edit-expense-btn" onclick="openEditTaxesModal('${entry.id}')" title="Edit"><i data-lucide="pencil"></i></button></td>
      </tr>`;
    });
  }
  tableHtml += '</tbody></table></div>';
  main.innerHTML = `
    <div class="tab-header">
      <div class="tab-title">
        <div class="tab-dot" style="background:${taxesColor}"></div>
        <h2 style="font-family:DM Serif Display,serif;font-size:1.8rem;margin:0">Taxes - ${monthLabel}</h2>
      </div>
      <div class="tab-actions">
        <button class="btn-ghost" onclick="openAddTaxesModal()" title="Add"><i data-lucide="plus"></i></button>
        <button class="btn-ghost" id="delete-taxes-btn" onclick="showDeleteTaxesConfirmation()" title="Delete selected" disabled><i data-lucide="trash-2"></i></button>
        <button class="btn-ghost" id="copy-taxes-btn" onclick="duplicateSelectedTaxes()" title="Duplicate selected" disabled><i data-lucide="copy"></i></button>
      </div>
    </div>
    ${tableHtml}`;
}

function renderSuper(main) {
  const monthLabel = getMonthDisplayName(state.selectedMonth, state.selectedYear);
  const selectedMonthSuper = filterByMonth(state.super, state.selectedMonth, state.selectedYear);
  const superColor = '#2563eb';
  let tableHtml = `
    <div class="expense-table-wrap"><table class="expense-table">
      <thead><tr><th style="width:30px"><input type="checkbox" id="select-all-super" onchange="toggleSelectAllSuperInTable()"></th><th>Description</th><th>Date</th><th>Note</th><th>Amount</th><th style="width:50px"></th></tr></thead>
      <tbody>`;
  if (selectedMonthSuper.length === 0) {
    tableHtml += `<tr><td colspan="6"><div class="empty-state"><span><i data-lucide="folder-open"></i></span>No super for ${monthLabel}.</div></td></tr>`;
  } else {
    selectedMonthSuper.forEach(entry => {
      tableHtml += `<tr id="super-row-${entry.id}" class="expense-row-${state.selectedSuperIds.includes(entry.id) ? 'selected' : 'unselected'}">
        <td><input type="checkbox" class="super-checkbox" value="${entry.id}" onchange="updateSuperCheckboxState()"></td>
        <td>${entry.desc}</td>
        <td class="expense-date">${formatDate(entry.date)}</td>
        <td class="expense-note">${entry.note || ''}</td>
        <td class="expense-amount" style="color:${superColor}">$${entry.amount.toFixed(2)}</td>
        <td><button class="edit-expense-btn" onclick="openEditSuperModal('${entry.id}')" title="Edit"><i data-lucide="pencil"></i></button></td>
      </tr>`;
    });
  }
  tableHtml += '</tbody></table></div>';
  main.innerHTML = `
    <div class="tab-header">
      <div class="tab-title">
        <div class="tab-dot" style="background:${superColor}"></div>
        <h2 style="font-family:DM Serif Display,serif;font-size:1.8rem;margin:0">Super - ${monthLabel}</h2>
      </div>
      <div class="tab-actions">
        <button class="btn-ghost" onclick="openAddSuperModal()" title="Add"><i data-lucide="plus"></i></button>
        <button class="btn-ghost" id="delete-super-btn" onclick="showDeleteSuperConfirmation()" title="Delete selected" disabled><i data-lucide="trash-2"></i></button>
        <button class="btn-ghost" id="copy-super-btn" onclick="duplicateSelectedSuper()" title="Duplicate selected" disabled><i data-lucide="copy"></i></button>
      </div>
    </div>
    ${tableHtml}`;
}

function renderOverview(main) {
  const total = state.expenses.reduce((s,e) => s + e.amount, 0);

  // Selected month expenses
  const selectedMonthExpenses = filterByMonth(state.expenses, state.selectedMonth, state.selectedYear);
  const thisMonth = selectedMonthExpenses.reduce((s,e) => s + e.amount, 0);

  // Selected month income & taxes (for net income)
  const selectedMonthIncome = filterByMonth(state.income, state.selectedMonth, state.selectedYear);
  const incomeThisMonth = selectedMonthIncome.reduce((s, e) => s + e.amount, 0);
  const selectedMonthTaxes = filterByMonth(state.taxes, state.selectedMonth, state.selectedYear);
  const taxesThisMonth = selectedMonthTaxes.reduce((s, e) => s + e.amount, 0);
  const netIncomeThisMonth = incomeThisMonth - taxesThisMonth;

  // Top category in selected month
  const topCat = state.tabs.map(t => ({
    ...t, total: selectedMonthExpenses.filter(e => e.tabId === t.id).reduce((s,e) => s+e.amount,0)
  })).sort((a,b) => b.total - a.total)[0];

  const monthLabel = getMonthDisplayName(state.selectedMonth, state.selectedYear);
  const year = state.selectedYear;

  // Yearly overview (current selected year)
  const yearExpenses = state.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year;
  });
  const totalYearExpenses = yearExpenses.reduce((s, e) => s + e.amount, 0);
  const yearIncome = state.income.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year;
  }).reduce((s, e) => s + e.amount, 0);
  const yearTaxes = state.taxes.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === year;
  }).reduce((s, e) => s + e.amount, 0);
  const totalNetIncomeYear = yearIncome - yearTaxes;

  const monthlyExpensesForYear = Array.from({ length: 12 }, (_, m) =>
    yearExpenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === m;
      })
      .reduce((s, e) => s + e.amount, 0)
  );
  const maxMonthly = Math.max(1, ...monthlyExpensesForYear);

  const shortMonthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const maxMonthIdx = monthlyExpensesForYear.reduce((best, v, i) => (v > monthlyExpensesForYear[best] ? i : best), 0);
  const monthlyBars = monthlyExpensesForYear.map((val, idx) => {
    const pct = Math.max(3, (val / maxMonthly) * 100);
    const hasValue = val > 0;
    const isMax = hasValue && idx === maxMonthIdx;
    const barColor = isMax ? '#dc2626' : (hasValue ? 'var(--accent)' : 'rgba(143,179,0,0.25)');
    return `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:0.15rem;font-size:0.7rem">
        <div style="height:120px;display:flex;align-items:flex-end;justify-content:center;width:100%">
          <div style="width:8px;border-radius:999px;background:${barColor};height:${pct}%;transition:height 0.3s;"></div>
        </div>
        <span>${shortMonthLabels[idx]}</span>
        <span style="color:var(--muted);font-size:0.7rem">$${val.toFixed(0)}</span>
      </div>`;
  }).join('');

  const yearOverview = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.5rem 1.75rem;margin-bottom:1.75rem">
      <div style="display:flex;flex-wrap:wrap;gap:1.75rem;align-items:flex-start;justify-content:space-between">
        <div style="min-width:220px;flex:1">
          <h2 style="font-family:DM Serif Display,serif;font-size:1.4rem;margin:0 0 0.75rem">Financial Overview – ${year}</h2>
          <div style="display:flex;flex-direction:column;gap:0.35rem;font-size:0.9rem">
            <div><strong>Total Net Income:</strong> $${totalNetIncomeYear.toFixed(2)}</div>
            <div><strong>Total Expenses:</strong> $${totalYearExpenses.toFixed(2)}</div>
          </div>
        </div>
        <div style="flex:2;min-width:260px">
          <div style="border-radius:12px;background:var(--surface3);padding:1rem 1.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;font-size:0.85rem">
              <span style="font-weight:600">Expenses for each month</span>
              <span style="color:var(--muted);font-size:0.8rem">Current year ${year}</span>
            </div>
            <div style="display:flex;gap:0.5rem;align-items:flex-end">${monthlyBars}</div>
          </div>
        </div>
      </div>
    </div>`;

  let cards = `
    <div class="overview-grid">
      <div class="stat-card" style="--c:#368a1c"><div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--c)"></div>
        <div class="stat-label">Income this Month</div>
        <div class="stat-value">$${netIncomeThisMonth.toFixed(0)}</div>
        <div class="stat-sub">Income $${incomeThisMonth.toFixed(0)} · Taxes $${taxesThisMonth.toFixed(0)}</div>
      </div>
      <div class="stat-card" style="--c:${topCat?.color||'#e8ff47'}"><div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--c)"></div>
        <div class="stat-label">This Month (Expenses)</div>
        <div class="stat-value">$${thisMonth.toFixed(0)}</div>
        <div class="stat-sub">${selectedMonthExpenses.length} transactions this month</div>
      </div>
      <div class="stat-card" style="--c:${topCat?.color||'#888'}"><div style="position:absolute;top:0;left:0;right:0;height:3px;background:${topCat?.color||'#888'}"></div>
        <div class="stat-label">Top Category</div>
        <div class="stat-value" style="font-size:1.1rem;margin-top:0.25rem">${topCat?.name || 'None'}</div>
        <div class="stat-sub">$${topCat?.total.toFixed(0)||0}</div>
      </div>
    </div>`;

  // Category breakdown bars - filtered to selected month
  let bars = '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem"><h3 style="font-family:DM Serif Display,serif;margin-bottom:1.25rem;font-size:1.2rem">Category Breakdown</h3>';
  const totalForBar = Math.max(1, thisMonth);
  state.tabs.forEach(tab => {
    const t = selectedMonthExpenses.filter(e => e.tabId === tab.id).reduce((s,e) => s+e.amount, 0);
    const pct = Math.min(100, (t / totalForBar) * 100);
    bars += `<div style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;font-size:0.85rem">
        <span style="color:var(--text)">${tab.name}</span>
        <span style="color:var(--muted)">$${t.toFixed(2)}</span>
      </div>
      <div style="background:var(--surface3);border-radius:4px;height:6px">
        <div style="background:${tab.color};height:6px;border-radius:4px;width:${pct}%;transition:width 0.5s"></div>
      </div>
    </div>`;
  });
  bars += '</div>';

  // Recent transactions - filtered to selected month
  const recent = [...selectedMonthExpenses].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,8);
  let recHtml = '<div class="expense-table-wrap"><table class="expense-table"><thead><tr><th>Description</th><th>Category</th><th>Date</th><th>Amount</th></tr></thead><tbody>';
  if (recent.length === 0) recHtml += '<tr><td colspan="4"><div class="empty-state"><span><i data-lucide="banknote-arrow-up"></i></span>No expenses this month. Add your first one!</div></td></tr>';
  recent.forEach(e => {
    const tab = state.tabs.find(t => t.id === e.tabId);
    recHtml += `<tr>
      <td>${e.desc}${e.note ? `<div class="expense-note">${e.note}</div>` : ''}</td>
      <td><span style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.8rem;color:var(--text)"><span style="width:6px;height:6px;border-radius:50%;background:${tab?.color||'#888'};display:inline-block"></span>${tab?.name||'Unknown'}</span></td>
      <td class="expense-date">${formatDate(e.date)}</td>
      <td class="expense-amount" style="color:var(--accent)">$${e.amount.toFixed(2)}</td>
    </tr>`;
  });
  recHtml += '</tbody></table></div>';

  main.innerHTML = `
    ${yearOverview}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
      <h2 style="font-family:DM Serif Display,serif;font-size:1.8rem;margin:0">${monthLabel}</h2>
    </div>
    ${cards}${bars}<h3 style="font-family:DM Serif Display,serif;font-size:1.2rem;margin-bottom:1rem">Recent Transactions</h3>${recHtml}`;
}

function renderTabView(main, tabId) {
  const tab = state.tabs.find(t => t.id === tabId);
  if (!tab) return;

  // Expenses in this category, selected month only
  const allExpenses = state.expenses.filter(e => e.tabId === tabId).sort((a,b) => new Date(b.date)-new Date(a.date));
  const selectedMonthExpenses = filterByMonth(allExpenses, state.selectedMonth, state.selectedYear);
  const thisMonth = selectedMonthExpenses.reduce((s,e) => s+e.amount, 0);
  const monthLabel = getMonthDisplayName(state.selectedMonth, state.selectedYear);

  let html = `
    <div class="tab-header">
      <div class="tab-title">
        <div class="tab-dot" style="background:${tab.color}"></div>
        <h2 id="cat-name-display" onclick="startEditCategoryName('${tab.id}')" title="Click to rename">
          <span id="cat-name-text">${tab.name}</span><span> - ${monthLabel}</span>
          <span class="cat-edit-hint"><i data-lucide="pencil"></i></span>
        </h2>
      </div>
      <div class="tab-actions">
        <button class="btn-ghost" id="delete-expenses-btn" onclick="showDeleteExpensesConfirmation()" title="Delete selected expenses" disabled><i data-lucide="trash-2"></i></button>
        <button class="btn-ghost" id="copy-expenses-btn" onclick="openCopyExpensesToCategoryModal()" title="Copy selected expenses" disabled><i data-lucide="copy"></i></button>
      </div>
    </div>
    <div class="overview-grid" style="margin-bottom:1.5rem">
      <div class="stat-card"><div style="position:absolute;top:0;left:0;right:0;height:3px;background:${tab.color}"></div>
        <div class="stat-label">Total</div><div class="stat-value">$${thisMonth.toFixed(2)}</div><div class="stat-sub">${selectedMonthExpenses.length} transactions</div>
      </div>
    </div>
    <div class="expense-table-wrap"><table class="expense-table">
      <thead><tr><th style="width:30px"><input type="checkbox" id="select-all-expenses" onchange="toggleSelectAllExpensesInTable()"></th><th>Description</th><th>Date</th><th>Note</th><th>Amount</th><th style="width:50px"></th></tr></thead>
      <tbody>`;

  if (selectedMonthExpenses.length === 0) {
    html += `<tr><td colspan="6"><div class="empty-state"><span><i data-lucide="folder-open"></i></span>No expenses in this category for ${getMonthDisplayName(state.selectedMonth, state.selectedYear)}.</div></td></tr>`;
  }
  selectedMonthExpenses.forEach(e => {
    html += `<tr id="expense-row-${e.id}" class="expense-row-${state.selectedExpenseIds.includes(e.id) ? 'selected' : 'unselected'}">
      <td><input type="checkbox" class="expense-checkbox" value="${e.id}" onchange="updateExpenseCheckboxState()"></td>
      <td>${e.desc}</td>
      <td class="expense-date">${formatDate(e.date)}</td>
      <td class="expense-note">${e.note||''}</td>
      <td class="expense-amount" style="color:${tab.color}">$${e.amount.toFixed(2)}</td>
      <td><button class="edit-expense-btn" onclick="openEditExpenseModal('${e.id}')" title="Edit expense"><i data-lucide="pencil"></i></button></td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  main.innerHTML = html;
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function switchTab(id) {
  state.activeTab = id;
  renderSidebar();
  renderContent();
  updateBottomNav();
}
window.switchTab = switchTab;

export function updateBottomNav() {
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
  if (state.activeTab === 'overview') {
    document.getElementById('bn-overview')?.classList.add('active');
  } else if (state.activeTab === 'income' || state.activeTab === 'taxes' || state.activeTab === 'super') {
    // Income, Taxes, Super have their own views; no dedicated bottom nav item
  } else {
    document.getElementById('bn-cats')?.classList.add('active');
  }
}
