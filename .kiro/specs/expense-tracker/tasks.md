# Implementation Plan: Expense Tracker

## Overview

Three-file vanilla JS app: `index.html`, `css/styles.css`, and `js/app.js`. No build tools or frameworks. Chart.js loaded via CDN. Data persisted in `localStorage`.

## Tasks

- [x] 1. Create `index.html` with full page structure
  - Add `<header>` with `#balance` display
  - Add `<form id="transaction-form">` with `#item-name`, `#item-amount`, `#item-category` (Food/Transport/Fun options), submit button, and `#error-msg` with `aria-live="polite"`
  - Add `<ul id="transaction-list">` and `#empty-list-msg` paragraph
  - Add `<canvas id="pie-chart">` and `#empty-chart-msg` paragraph
  - Add CDN `<script src="https://cdn.jsdelivr.net/npm/chart.js">` before `js/app.js` script tag
  - _Requirements: 1.1, 1.2, 2.1, 2.7, 4.1, 4.2, 4.5_

- [x] 2. Create `css/styles.css` with all styles
  - [x] 2.1 Layout and header styles
    - Style `body`, `header`, `#balance` display at top of page
    - _Requirements: 3.1_
  - [x] 2.2 Form section styles
    - Style `#form-section`, form inputs, select, button, and `#error-msg`
    - _Requirements: 1.1_
  - [x] 2.3 Transaction list styles
    - Style `#list-section`, `#transaction-list` as scrollable list, individual list items with name/amount/category and delete button
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.4 Chart section and responsive styles
    - Style `#chart-section` and `#pie-chart` canvas
    - Add responsive media query for smaller screens
    - _Requirements: 4.1_

- [x] 3. Create `js/app.js` — storage and data layer
  - [x] 3.1 Implement `loadFromStorage` and `saveToStorage`
    - Declare module-level `transactions = []` array
    - `loadFromStorage`: read from `localStorage` key `"expense-tracker-transactions"` using `JSON.parse`; wrap in try/catch to handle corrupt data (reset to `[]` and overwrite); fall back to `[]` if key absent
    - `saveToStorage`: wrap `localStorage.setItem` with `JSON.stringify` in try/catch so app continues in-memory if storage is unavailable
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Implement core transaction logic in `js/app.js`
  - [x] 4.1 Implement `addTransaction(name, amount, category)`
    - Validate: name non-empty, amount positive numeric, category non-empty — write error to `#error-msg` and return early on failure
    - On success: push `{ id: crypto.randomUUID(), name, amount: parseFloat(amount), category }` onto `transactions[]`, call `saveToStorage()`, call `updateUI()`, clear all three form fields and `#error-msg`
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x] 4.2 Implement `deleteTransaction(id)`
    - Call `window.confirm` to ask user to confirm deletion
    - If confirmed: filter `transactions[]` to remove matching id, call `saveToStorage()`, call `updateUI()`
    - If cancelled: do nothing
    - _Requirements: 2.4, 2.5, 2.6, 5.3_

- [x] 5. Implement UI rendering functions in `js/app.js`
  - [x] 5.1 Implement `renderList()`
    - Clear `#transaction-list` innerHTML
    - For each transaction render an `<li>` showing name, amount, category, and a delete `<button>` wired to `deleteTransaction(t.id)`
    - Toggle visibility of `#empty-list-msg` based on `transactions.length === 0`
    - _Requirements: 2.1, 2.2, 2.3, 2.7_
  - [x] 5.2 Implement `updateBalance()`
    - Sum all `transaction.amount` values and write formatted result to `#balance`
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 5.3 Implement `updateUI()`
    - Call `renderList()`, `updateBalance()`, `updateChart()` in sequence
    - _Requirements: 1.3, 2.5, 3.2, 3.3_

- [x] 6. Implement Chart.js integration in `js/app.js`
  - [x] 6.1 Implement `initChart()`
    - Guard with `typeof Chart !== 'undefined'`; if Chart.js failed to load, leave `#empty-chart-msg` visible and return
    - Create a `Pie` Chart instance on `#pie-chart` canvas with labels `['Food','Transport','Fun']`, dataset colors `['#f87171','#0049a2ff','#3dedadff']`, and `responsive: true`
    - Store instance in module-level `chartInstance`
    - _Requirements: 4.1, 4.2_
  - [x] 6.2 Implement `updateChart()`
    - Aggregate `transactions[]` amounts by category into `{ Food, Transport, Fun }` totals
    - Mutate `chartInstance.data.datasets[0].data` and call `chartInstance.update()`
    - Toggle `#pie-chart` and `#empty-chart-msg` visibility based on `transactions.length > 0`
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 7. Wire everything together in `js/app.js`
  - [x] 7.1 Add form submit event listener
    - Listen for `submit` on `#transaction-form`, call `e.preventDefault()`, read values from the three fields, call `addTransaction(name, amount, category)`
    - _Requirements: 1.3_
  - [x] 7.2 Add `DOMContentLoaded` initialisation
    - Call `loadFromStorage()`, then `initChart()`, then `updateUI()` so the page restores saved state on every load
    - _Requirements: 5.1, 5.4_

- [x] 8. Final checkpoint
  - Open `index.html` in a browser and verify: form adds transactions, list renders with delete buttons, balance updates, pie chart updates, data survives a page refresh, and empty-state messages show when no transactions exist.
  - Ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional — none here since NFR-1 specifies no test setup required
- Each task references specific requirements for traceability
- `updateChart` mutates the existing Chart instance rather than destroying and recreating it on every change
