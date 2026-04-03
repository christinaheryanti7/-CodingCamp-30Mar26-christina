const STORAGE_KEY = 'expense-tracker-transactions';
const BUDGET_LIMIT = 2000000; // Rp 2,000,000

let limitReachedAlerted = false;
let transactions = [];
let chartInstance = null;
let sortedDesc = false; // sort toggle state

// ── Storage ──────────────────────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    transactions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    transactions = [];
    saveToStorage();
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    // continue in-memory if storage unavailable
  }
}

// ── Core Logic ───────────────────────────────────────────

function addTransaction(name, amount, category) {
  const errorEl = document.getElementById('error-msg');

  if (!name || !name.trim()) {
    errorEl.textContent = 'Item name is required.';
    return;
  }
  if (!amount || isNaN(Number(amount)) || parseFloat(amount) <= 0) {
    errorEl.textContent = 'Amount must be a positive number.';
    return;
  }
  if (!category) {
    errorEl.textContent = 'Please select a category.';
    return;
  }

  transactions.push({
    id: crypto.randomUUID(),
    name: name.trim(),
    amount: parseFloat(amount),
    category
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

// ── UI Rendering ─────────────────────────────────────────

function renderList() {
  const list = document.getElementById('transaction-list');
  const emptyMsg = document.getElementById('empty-list-msg');

  // Apply sort if active
  let display = [...transactions];
  if (sortedDesc) {
    display.sort((a, b) => b.amount - a.amount);
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

  emptyMsg.style.display = transactions.length === 0 ? 'block' : 'none';
}

function updateBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const balanceEl = document.getElementById('balance');
  balanceEl.textContent = 'Total: Rp ' + total.toLocaleString('id-ID');

  // 1. Cek apakah sudah melewati limit
  if (total >= BUDGET_LIMIT) {
    balanceEl.classList.add('over-budget');

    // 2. Munculkan pop-up HANYA JIKA belum pernah muncul sebelumnya
    if (!limitReachedAlerted) {
      alert("⚠️ Warning: You have reached or exceeded your budget limit of Rp " + BUDGET_LIMIT.toLocaleString('id-ID') + "!");
      limitReachedAlerted = true; // Kunci agar tidak muncul terus-menerus
    }
  } else {
    // 3. Jika total di bawah limit, hapus warna merah dan reset status alert
    balanceEl.classList.remove('over-budget');
    limitReachedAlerted = false; 
  }
}

function updateChart() {
  const hasData = transactions.length > 0;
  document.getElementById('pie-chart').style.display = hasData ? 'block' : 'none';
  document.getElementById('empty-chart-msg').style.display = hasData ? 'none' : 'block';

  if (!chartInstance) return;

  const totals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach(t => { totals[t.category] += t.amount; });
  chartInstance.data.datasets[0].data = [totals.Food, totals.Transport, totals.Fun];
  chartInstance.update();
}

function updateUI() {
  renderList();
  updateBalance();
  updateChart();
}

// ── Chart.js Init ─────────────────────────────────────────

function initChart() {
  if (typeof Chart === 'undefined') return;
  chartInstance = new Chart(document.getElementById('pie-chart'), {
    type: 'pie',
    data: {
      labels: ['Food', 'Transport', 'Fun'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#f87171', '#60a5fa', '#34d399']
      }]
    },
    options: { responsive: true }
  });
}

// ── Theme Toggle ──────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('expense-tracker-theme');
  if (saved === 'dark') applyDark();
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
  if (isDark) {
    applyLight();
    localStorage.setItem('expense-tracker-theme', 'light');
  } else {
    applyDark();
    localStorage.setItem('expense-tracker-theme', 'dark');
  }
});

// ── Sort Toggle ───────────────────────────────────────────

document.getElementById('sort-btn').addEventListener('click', function() {
  sortedDesc = !sortedDesc;
  this.textContent = sortedDesc ? 'Sort by Amount ↑ (Reset)' : 'Sort by Amount ↓';
  renderList();
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
  initChart();
  updateUI();
});
