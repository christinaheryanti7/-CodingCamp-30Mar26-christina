# Design Document: Expense Tracker

## Overview

A single-page expense tracker running entirely in the browser. No build tools, no frameworks, no backend. Three files: `index.html`, `css/styles.css`, and `js/app.js`. Chart.js is loaded via CDN. All data lives in `localStorage`.

The app lets users log named expenses with a category (Food, Transport, Fun), see a running total balance, browse a scrollable transaction list, and view a pie chart of spending by category.

---

## Architecture

All logic lives in a single `js/app.js` module. The file is structured as a set of pure-ish functions that operate on a shared in-memory `transactions` array, with `localStorage` as the persistence layer and the DOM as the view layer.

```
index.html          ← markup + CDN script tags
css/styles.css      ← all styles
js/app.js           ← all application logic
```

Data flow on every mutation (add or delete):

```
User action
  → mutate transactions[]
  → saveToStorage()
  → updateUI()
      ├── renderList()
      ├── updateBalance()
      └── updateChart()
```

On page load:

```
DOMContentLoaded
  → loadFromStorage()   ← populates transactions[]
  → updateUI()          ← renders everything from current state
  → initChart()         ← creates Chart.js instance
```

---

## Components and Interfaces

### File Structure

```
index.html
css/
  styles.css
js/
  app.js
```

### index.html Layout

```
<body>
  <header>
    <h1>Expense Tracker</h1>
    <div id="balance">Total: $0.00</div>
  </header>

  <main>
    <section id="form-section">
      <form id="transaction-form">
        <input  id="item-name"   type="text"   placeholder="Item name" />
        <input  id="item-amount" type="number" placeholder="Amount"    />
        <select id="item-category">
          <option value="">Select category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Fun">Fun</option>
        </select>
        <button type="submit">Add</button>
        <p id="error-msg" aria-live="polite"></p>
      </form>
    </section>

    <section id="list-section">
      <ul id="transaction-list"></ul>
      <p id="empty-list-msg">No transactions yet.</p>
    </section>

    <section id="chart-section">
      <canvas id="pie-chart"></canvas>
      <p id="empty-chart-msg">Add a transaction to see the chart.</p>
    </section>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="js/app.js"></script>
</body>
```

### JS Function Breakdown (`js/app.js`)

| Function | Signature | Responsibility |
|---|---|---|
| `loadFromStorage` | `() → void` | Reads `localStorage`, parses JSON, populates `transactions[]`. Falls back to `[]` if nothing stored. |
| `saveToStorage` | `() → void` | Serialises `transactions[]` to JSON and writes to `localStorage`. |
| `addTransaction` | `(name, amount, category) → void` | Validates inputs, pushes a new transaction object, calls `saveToStorage` + `updateUI`. |
| `deleteTransaction` | `(id) → void` | Shows `window.confirm`, filters `transactions[]` by id, calls `saveToStorage` + `updateUI`. |
| `updateUI` | `() → void` | Orchestrator — calls `renderList`, `updateBalance`, `updateChart`. |
| `renderList` | `() → void` | Clears and re-renders `#transaction-list`. Shows/hides empty-state message. |
| `updateBalance` | `() → void` | Sums all amounts, writes formatted value to `#balance`. |
| `updateChart` | `() → void` | Aggregates amounts by category, updates the Chart.js instance data. Shows/hides empty-state. |
| `initChart` | `() → void` | Creates the Chart.js `Pie` instance on `#pie-chart` canvas. Called once on load. |

---

## Data Models

### Transaction Object

```js
{
  id:       string,   // crypto.randomUUID() or Date.now().toString()
  name:     string,   // item name, non-empty
  amount:   number,   // positive float
  category: string    // "Food" | "Transport" | "Fun"
}
```

### LocalStorage Schema

Single key: `"expense-tracker-transactions"`

Value: JSON-serialised array of Transaction objects.

```js
// Example stored value
'[{"id":"1","name":"Coffee","amount":4.5,"category":"Food"}]'
```

Read: `JSON.parse(localStorage.getItem("expense-tracker-transactions") ?? "[]")`
Write: `localStorage.setItem("expense-tracker-transactions", JSON.stringify(transactions))`

---

## Chart.js Integration

Chart.js is loaded via CDN before `app.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

`initChart()` creates a single `Chart` instance stored in a module-level variable `chartInstance`. `updateChart()` mutates `chartInstance.data.datasets[0].data` and calls `chartInstance.update()` — avoiding destroy/recreate on every mutation.

```js
// Initialisation (once)
chartInstance = new Chart(document.getElementById('pie-chart'), {
  type: 'pie',
  data: {
    labels: ['Food', 'Transport', 'Fun'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#f87171','#60a5fa','#34d399'] }]
  },
  options: { responsive: true }
});

// Update (on every mutation)
function updateChart() {
  const totals = { Food: 0, Transport: 0, Fun: 0 };
  transactions.forEach(t => { totals[t.category] += t.amount; });
  chartInstance.data.datasets[0].data = [totals.Food, totals.Transport, totals.Fun];
  chartInstance.update();
  // toggle empty-state visibility
  const hasData = transactions.length > 0;
  document.getElementById('pie-chart').style.display      = hasData ? 'block' : 'none';
  document.getElementById('empty-chart-msg').style.display = hasData ? 'none'  : 'block';
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Valid submission adds a transaction

*For any* valid triple of (non-empty name, positive numeric amount, non-empty category), calling `addTransaction` should increase the length of `transactions[]` by exactly 1 and the new entry should contain the supplied values.

**Validates: Requirements 1.3**

### Property 2: Form fields clear after valid submission

*For any* valid transaction submission, all three form fields (`#item-name`, `#item-amount`, `#item-category`) should be empty/reset immediately after the transaction is added.

**Validates: Requirements 1.4**

### Property 3: Invalid inputs are rejected and leave state unchanged

*For any* submission where the name is empty/whitespace-only, the amount is non-positive or non-numeric, or the category is unselected, the `transactions[]` array should remain unchanged (same length and same contents as before the submission attempt).

**Validates: Requirements 1.5, 1.6, 1.7**

### Property 4: Rendered list mirrors the transactions array

*For any* `transactions[]` array, the rendered `#transaction-list` should contain exactly `transactions.length` items, and each rendered item should include the transaction's name, amount, and category, plus a delete control.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 5: Deletion correctness

*For any* transaction in `transactions[]`, when `deleteTransaction(id)` is called with `window.confirm` returning `true`, that transaction should no longer appear in `transactions[]` or the rendered list. When `window.confirm` returns `false`, `transactions[]` should be identical to its state before the call.

**Validates: Requirements 2.5, 2.6**

### Property 6: Balance invariant

*For any* `transactions[]` array (including after any sequence of adds and deletes), the value displayed in `#balance` should equal the arithmetic sum of all `transaction.amount` values in the array.

**Validates: Requirements 3.2, 3.3**

### Property 7: Chart data invariant

*For any* `transactions[]` array, the data values in the Chart.js instance for each category (Food, Transport, Fun) should equal the sum of `amount` for all transactions in that category.

**Validates: Requirements 4.3, 4.4**

### Property 8: LocalStorage round-trip

*For any* `transactions[]` array, calling `saveToStorage()` followed by `loadFromStorage()` should produce a `transactions[]` array that is deeply equal to the original (same ids, names, amounts, and categories in the same order).

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Empty item name | Show error in `#error-msg`, do not add transaction |
| Non-positive or non-numeric amount | Show error in `#error-msg`, do not add transaction |
| No category selected | Show error in `#error-msg`, do not add transaction |
| `localStorage` unavailable (private browsing, quota exceeded) | Wrap `setItem`/`getItem` in try/catch; app continues in-memory, no crash |
| Chart.js CDN fails to load | Guard `initChart` with `typeof Chart !== 'undefined'`; chart section shows fallback message |
| `JSON.parse` fails on corrupt storage data | Catch parse error, reset to `[]`, overwrite corrupt data |

Error messages are written to `#error-msg` (which has `aria-live="polite"`) and cleared on the next successful submission.

---

## Testing Strategy

### Dual Approach

Both unit tests and property-based tests are required. They are complementary:
- Unit tests catch concrete bugs at specific inputs and integration points.
- Property tests verify universal correctness across randomised inputs.

### Unit Tests (specific examples and edge cases)

- Form renders with correct fields and three category options (Req 1.1, 1.2)
- Submitting with each invalid input type shows an error and does not add (Req 1.5–1.7)
- Empty transaction list shows empty-state message (Req 2.7)
- Empty transaction list shows chart empty-state placeholder (Req 4.5)
- `loadFromStorage` with no key returns empty array (Req 5.5)
- `window.confirm` is called when delete control is activated (Req 2.4)
- Chart.js CDN script tag is present in the document (Req 4.2)

### Property-Based Tests

Use a property-based testing library appropriate for vanilla JS (e.g., **fast-check**).
Each property test must run a minimum of **100 iterations**.
Each test must include a comment tag in the format:

```
// Feature: expense-tracker, Property N: <property text>
```

| Property | Test description |
|---|---|
| P1 | Generate random valid (name, amount, category) — adding always grows list by 1 |
| P2 | Generate random valid submission — form fields are empty after add |
| P3 | Generate random invalid inputs — list length is unchanged after rejected submission |
| P4 | Generate random transaction arrays — rendered list item count and content matches array |
| P5 | Generate random transaction + confirm/cancel boolean — deletion removes or preserves correctly |
| P6 | Generate random transaction arrays — displayed balance equals sum of amounts |
| P7 | Generate random transaction arrays — chart category totals equal per-category sums |
| P8 | Generate random transaction arrays — saveToStorage then loadFromStorage produces identical array |

### Coverage Goals

- All 8 correctness properties covered by property tests
- All edge cases (empty state, invalid input, no localStorage data) covered by unit tests
- No duplication: property tests handle broad input coverage; unit tests handle specific scenarios
