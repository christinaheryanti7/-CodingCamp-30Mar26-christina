const STORAGE_KEY    = 'expense-tracker-transactions';
const BUDGET_KEY     = 'expense-tracker-budget';
const CATEGORIES_KEY = 'expense-tracker-categories';

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

let budgetLimit = 0;
let limitReachedAlerted = false;
let transactions = [];
let customCategories = []; // user-added categories
let chartInstance = null;
let sortedDesc = false;
let activeFilter = '';      // category filter
let activeMonthFilter = -1; // -1 = all months; 0–11 = Jan–Dec

// ── Storage ──────────────────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    transactions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    transactions = [];
    saveToStorage();
  }

  const savedBudget = localStorage.getItem(BUDGET_KEY);
  if (savedBudget !== null) budgetLimit = parseFloat(savedBudget) || 0;

  try {
    const rawCats = localStorage.getItem(CATEGORIES_KEY);
    customCategories = rawCats ? JSON.parse(rawCats) : [];
  } catch (e) {
    customCategories = [];
  }
}

function saveToStorage() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); } catch (e) {}
}

function saveCategories() {
  try { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(customCategories)); } catch (e) {}
}

// ── All categories (default + custom) ────────────────────

function allCategories() {
  return [...DEFAULT_CATEGORIES, ...customCategories];
}

// ── Populate all category dropdowns & filter ─────────────

function populateCategorySelects() {
  const cats = allCategories();

  // Form dropdown
  const formSelect = document.getElementById('item-category');
  const currentFormVal = formSelect.value;
  formSelect.innerHTML = '<option value="">Select category</option>';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    formSelect.appendChild(opt);
  });
  formSelect.value = currentFormVal;

  // Filter dropdown
  const filterSelect = document.getElementById('filter-category');
  const currentFilterVal = filterSelect.value;
  filterSelect.innerHTML = '<option value="">All Categories</option>';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    filterSelect.appendChild(opt);
  });
  filterSelect.value = currentFilterVal;
}

// ── Custom category tags UI ───────────────────────────────

function renderCategoryTags() {
  const container = document.getElementById('custom-category-tags');
  container.innerHTML = '';
  customCategories.forEach(function(cat) {
    const tag = document.createElement('span');
    tag.className = 'category-tag';
    tag.textContent = cat;

    const removeBtn = document.createElement('button');
    removeBtn.setAttribute('aria-label', 'Remove ' + cat);
    removeBtn.textContent = '\u2715';
    removeBtn.addEventListener('click', function() { removeCustomCategory(cat); });

    tag.appendChild(removeBtn);
    container.appendChild(tag);
  });
}

function addCustomCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (allCategories().map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
    alert('Category "' + trimmed + '" already exists.');
    return;
  }
  customCategories.push(trimmed);
  saveCategories();
  populateCategorySelects();
  renderCategoryTags();
  updateChart(); // chart labels may need updating
}

function removeCustomCategory(name) {
  customCategories = customCategories.filter(c => c !== name);
  saveCategories();
  populateCategorySelects();
  renderCategoryTags();
  updateChart();
}

// ── Month-scoped transaction helper ──────────────────────

// Returns transactions filtered to the active month (or all if -1).
function visibleTransactions() {
  if (activeMonthFilter === -1) return transactions;
  return transactions.filter(function(t) {
    if (!t.date) return false;
    return new Date(t.date).getMonth() === activeMonthFilter;
  });
}

// ── Core Logic ───────────────────────────────────────────

function addTransaction(name, amount, category) {
  const errorEl = document.getElementById('error-msg');

  if (!name || !name.trim()) { errorEl.textContent = 'Item name is required.'; return; }
  if (!amount || isNaN(Number(amount)) || parseFloat(amount) <= 0) { errorEl.textContent = 'Amount must be a positive number.'; return; }
  if (!category) { errorEl.textContent = 'Please select a category.'; return; }

  transactions.push({
    id: crypto.randomUUID(),
    name: name.trim(),
    amount: parseFloat(amount),
    category,
    date: new Date().toISOString()
  });

  saveToStorage();
  updateUI();

  document.getElementById('item-name').value = '';
  document.getElementById('item-amount').value = '';
  document.getElementById('item-category').value = '';
  errorEl.textContent = '';
}

function deleteTransaction(id) {
  if (!window.confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();
  updateUI();
}

// ── Monthly Insights ──────────────────────────────────────

function updateMonthlyInsights() {
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  const scoped = visibleTransactions();
  const total  = scoped.reduce((sum, t) => sum + t.amount, 0);
  const label  = activeMonthFilter === -1
    ? '📅 All time:'
    : '📅 ' + MONTHS[activeMonthFilter] + ':';

  document.getElementById('insights-label').textContent = label;
  document.getElementById('insights-total').textContent  = 'Rp ' + total.toLocaleString('id-ID');
  document.getElementById('insights-count').textContent  =
    scoped.length + ' transaction' + (scoped.length !== 1 ? 's' : '');
}

// ── UI Rendering ─────────────────────────────────────────

function renderList() {
  const list = document.getElementById('transaction-list');
  const emptyMsg = document.getElementById('empty-list-msg');

  // Start from month-scoped set, then apply category filter
  let display = visibleTransactions();

  if (activeFilter) {
    display = display.filter(t => t.category === activeFilter);
  }

  if (sortedDesc) {
    display = [...display].sort((a, b) => b.amount - a.amount);
  }

  list.innerHTML = '';

  display.forEach(function(t) {
    const li = document.createElement('li');
    li.dataset.category = t.category;

    const info = document.createElement('div');
    info.className = 'tx-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'tx-name';
    nameEl.textContent = t.name;

    const metaEl = document.createElement('div');
    metaEl.className = 'tx-meta';
    metaEl.textContent = t.category;

    info.appendChild(nameEl);
    info.appendChild(metaEl);

    const amountEl = document.createElement('span');
    amountEl.className = 'tx-amount';
    amountEl.textContent = 'Rp ' + t.amount.toLocaleString('id-ID');

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tx-delete';
    deleteBtn.setAttribute('aria-label', 'Delete ' + t.name);
    deleteBtn.textContent = '\u2715';
    deleteBtn.addEventListener('click', function() { deleteTransaction(t.id); });

    li.appendChild(info);
    li.appendChild(amountEl);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  const isEmpty = display.length === 0;
  emptyMsg.style.display = isEmpty ? 'block' : 'none';
  emptyMsg.textContent = activeFilter && isEmpty
    ? 'No transactions in "' + activeFilter + '".'
    : 'No transactions yet.';
}

function updateBalance() {
  // Balance reflects the active month scope
  const scoped = visibleTransactions();
  const total  = scoped.reduce((sum, t) => sum + t.amount, 0);
  const balanceEl = document.getElementById('balance');
  balanceEl.textContent = 'Total: Rp ' + total.toLocaleString('id-ID');

  if (budgetLimit > 0 && total >= budgetLimit) {
    balanceEl.classList.add('over-budget');
    if (!limitReachedAlerted) {
      alert('⚠️ Warning: You have reached or exceeded your budget limit of Rp ' + budgetLimit.toLocaleString('id-ID') + '!');
      limitReachedAlerted = true;
    }
  } else {
    balanceEl.classList.remove('over-budget');
    limitReachedAlerted = false;
  }
}

function updateChart() {
  const scoped  = visibleTransactions();
  const hasData = scoped.length > 0;
  document.getElementById('pie-chart').style.display      = hasData ? 'block' : 'none';
  document.getElementById('empty-chart-msg').style.display = hasData ? 'none'  : 'block';

  if (!chartInstance) return;

  const cats   = allCategories();
  const totals = {};
  cats.forEach(c => { totals[c] = 0; });
  scoped.forEach(t => {
    if (totals[t.category] !== undefined) totals[t.category] += t.amount;
    else totals[t.category] = t.amount;
  });

  // Palette — cycles for custom categories
  const palette = ['#f87171','#60a5fa','#34d399','#fbbf24','#a78bfa','#f472b6','#38bdf8','#4ade80'];
  chartInstance.data.labels = cats;
  chartInstance.data.datasets[0].data = cats.map(c => totals[c] || 0);
  chartInstance.data.datasets[0].backgroundColor = cats.map((_, i) => palette[i % palette.length]);
  chartInstance.update();
}

function updateUI() {
  renderList();
  updateBalance();
  updateChart();
  updateMonthlyInsights();
}

// ── Chart.js Init ─────────────────────────────────────────

function initChart() {
  if (typeof Chart === 'undefined') return;
  const palette = ['#f87171','#60a5fa','#34d399','#fbbf24','#a78bfa','#f472b6'];
  const cats = allCategories();
  chartInstance = new Chart(document.getElementById('pie-chart'), {
    type: 'pie',
    data: {
      labels: cats,
      datasets: [{ data: cats.map(() => 0), backgroundColor: cats.map((_, i) => palette[i % palette.length]) }]
    },
    options: { responsive: true }
  });
}

// ── Budget Limit ──────────────────────────────────────────

document.getElementById('budget-save-btn').addEventListener('click', function() {
  const val = parseFloat(document.getElementById('budget-input').value);
  if (!val || val <= 0) { alert('Please enter a valid positive budget limit.'); return; }
  budgetLimit = val;
  limitReachedAlerted = false;
  try { localStorage.setItem(BUDGET_KEY, String(budgetLimit)); } catch (e) {}
  updateBalance();
});

// ── Theme Toggle ──────────────────────────────────────────

function initTheme() {
  if (localStorage.getItem('expense-tracker-theme') === 'dark') applyDark();
}

function applyDark() {
  document.body.classList.add('dark');
  document.getElementById('theme-toggle').textContent = '☀️ Light Mode';
}

function applyLight() {
  document.body.classList.remove('dark');
  document.getElementById('theme-toggle').textContent = '🌙 Dark Mode';
}

document.getElementById('theme-toggle').addEventListener('click', function() {
  const isDark = document.body.classList.contains('dark');
  if (isDark) { applyLight(); localStorage.setItem('expense-tracker-theme', 'light'); }
  else         { applyDark();  localStorage.setItem('expense-tracker-theme', 'dark'); }
});

// ── Sort Toggle ───────────────────────────────────────────

document.getElementById('sort-btn').addEventListener('click', function() {
  sortedDesc = !sortedDesc;
  this.textContent = sortedDesc ? 'Sort by Amount ↑ (Reset)' : 'Sort by Amount ↓';
  renderList();
});

// ── Month Filter ──────────────────────────────────────────

document.getElementById('month-filter').addEventListener('change', function() {
  activeMonthFilter = this.value === '' ? -1 : parseInt(this.value, 10);
  limitReachedAlerted = false; // reset alert when scope changes
  updateUI();
});

// ── Category Filter ───────────────────────────────────────

document.getElementById('filter-category').addEventListener('change', function() {
  activeFilter = this.value;
  renderList();
});

// ── Custom Category ───────────────────────────────────────

document.getElementById('add-category-btn').addEventListener('click', function() {
  const input = document.getElementById('new-category-input');
  addCustomCategory(input.value);
  input.value = '';
});

document.getElementById('new-category-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    addCustomCategory(this.value);
    this.value = '';
  }
});

// ── Form Submit ───────────────────────────────────────────

document.getElementById('transaction-form').addEventListener('submit', function(e) {
  e.preventDefault();
  addTransaction(
    document.getElementById('item-name').value,
    document.getElementById('item-amount').value,
    document.getElementById('item-category').value
  );
});

// ── Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  loadFromStorage();
  if (budgetLimit > 0) document.getElementById('budget-input').value = budgetLimit;

  // Default month filter to current month
  const currentMonth = new Date().getMonth(); // 0–11
  activeMonthFilter = currentMonth;
  document.getElementById('month-filter').value = String(currentMonth);

  populateCategorySelects();
  renderCategoryTags();
  initChart();
  updateUI();
});
